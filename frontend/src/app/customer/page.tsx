"use client";

import { useState, useEffect } from "react";
import { ShoppingCart, Send } from "lucide-react";
import { getActiveProducts } from "@/lib/api";

export default function CustomerPage() {
    const [cart, setCart] = useState<{ product: any; qty: number }[]>([]);
    const [products, setProducts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [sent, setSent] = useState(false);

    const [storeSettings, setStoreSettings] = useState<any>(null);

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                const data = await getActiveProducts();
                setProducts(data);
            } catch (err) {
                console.error("Failed to fetch products:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchProducts();

        const loadSettings = async () => {
            const local = localStorage.getItem("nexpos_store_settings");
            if (local) setStoreSettings(JSON.parse(local));
            
            try {
                // Must import supabase at the top if it's not imported!
                // Ah, I'll use fetch since I might not have supabase imported here.
                const res = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/store_settings?select=*&limit=1`, {
                    headers: {
                        'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string,
                        'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`
                    }
                });
                const data = await res.json();
                if (data && data.length > 0) {
                    setStoreSettings(data[0]);
                    localStorage.setItem("nexpos_store_settings", JSON.stringify(data[0]));
                }
            } catch(e) {}
        };
        loadSettings();
    }, []);

    const addToCart = (product: any) => {
        setCart((prev) => {
            const existing = prev.find((p) => p.product.id === product.id);
            if (existing) {
                return prev.map((p) =>
                    p.product.id === product.id ? { ...p, qty: p.qty + 1 } : p
                );
            }
            return [...prev, { product, qty: 1 }];
        });
    };

    const totalAmount = cart.reduce((sum, item) => sum + item.product.price * item.qty, 0);

    const [queueNumber, setQueueNumber] = useState<string | null>(null);

    const sendOrderToCashier = () => {
        if (cart.length === 0) return;
        
        const qNumber = Math.floor(100 + Math.random() * 900).toString(); // Generate 3 digit queue
        const orderId = `CUST-${Date.now()}`;
        const newOrder = { 
            id: orderId, 
            queue_number: qNumber,
            items: cart, 
            total: totalAmount, 
            time: new Date().toISOString() 
        };
        
        const existingOrders = JSON.parse(localStorage.getItem("nexpos_pending_orders") || "[]");
        localStorage.setItem("nexpos_pending_orders", JSON.stringify([...existingOrders, newOrder]));
        
        setCart([]);
        setQueueNumber(qNumber);
        setSent(true);
        setTimeout(() => {
            setSent(false);
            setQueueNumber(null);
        }, 8000);
    };

    return (
        <div className="flex flex-col md:flex-row h-screen bg-[#121214] text-gray-100 font-['Funnel_Display'] overflow-hidden">
            {/* LEFT: PRODUCTS LIST */}
            <div className="flex-1 p-6 md:p-8 overflow-y-auto">
                <div className="mb-8 flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl md:text-4xl font-black mb-2 text-white">Menu {storeSettings?.cafe_name || 'Kami'}</h1>
                        <p className="text-gray-400 text-sm md:text-base">Silakan pilih pesanan Anda, sentuh produk untuk menambah.</p>
                    </div>
                    {storeSettings?.logo_base64 ? (
                        <img src={storeSettings.logo_base64} alt="Brand Logo" className="hidden md:block w-16 h-16 object-contain rounded-xl bg-white p-1" />
                    ) : (
                        <div className="hidden md:flex w-12 h-12 rounded-xl bg-blue-600 items-center justify-center text-white text-2xl font-black shadow-lg shadow-blue-900/20">N</div>
                    )}
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                    {products.map((prod) => (
                        <div
                            key={prod.id}
                            onClick={() => addToCart(prod)}
                            className="bg-[#1a1a1c] p-5 md:p-6 rounded-3xl border border-gray-800 cursor-pointer hover:border-blue-500/50 hover:bg-gray-800/30 transition-all text-center flex flex-col h-full justify-between shadow-lg relative overflow-hidden group"
                        >
                            <div className="relative z-10">
                                <div className="text-5xl md:text-6xl mb-4 transform group-hover:scale-110 transition-transform">{prod.image_icon || '📦'}</div>
                                <h3 className="font-bold text-lg md:text-xl text-white leading-tight mb-2">{prod.name}</h3>
                            </div>
                            <p className="text-blue-400 font-bold text-base md:text-lg mt-auto relative z-10">Rp {prod.price.toLocaleString('id-ID')}</p>
                            
                            {/* Decorative Background Icon */}
                            <div className="absolute -bottom-4 -right-4 text-7xl opacity-5 group-hover:opacity-10 transition-opacity z-0">{prod.image_icon || '📦'}</div>
                        </div>
                    ))}
                </div>
            </div>

            {/* RIGHT: CART */}
            <div className="w-full md:w-[320px] lg:w-[400px] h-[45vh] md:h-screen bg-[#1a1a1c] shadow-2xl flex flex-col border-t-2 md:border-t-0 md:border-l border-gray-800 shrink-0 z-10">
                <div className="p-5 md:p-6 border-b border-gray-800 bg-[#1a1a1c]">
                    <h2 className="text-lg md:text-xl font-bold flex items-center gap-3 text-white">
                        <ShoppingCart className="w-6 h-6 text-blue-500" /> Pesanan Anda
                    </h2>
                </div>

                <div className="flex-1 overflow-y-auto p-5 md:p-6">
                    {cart.length === 0 ? (
                        <div className="text-center text-gray-500 mt-10 md:mt-20 flex flex-col items-center">
                            <ShoppingCart className="w-16 h-16 mb-4 opacity-10" />
                            <p className="font-bold">Belum ada pesanan</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {cart.map((item, idx) => (
                                <div key={idx} className="flex justify-between pb-4 border-b border-gray-800/50">
                                    <div className="flex-1 pr-3">
                                        <p className="font-bold text-base md:text-lg leading-tight text-white mb-1">{item.product.name}</p>
                                        <p className="text-gray-500 text-sm md:text-base">
                                            {item.qty} x <span className="mx-1">•</span> Rp {item.product.price.toLocaleString("id-ID")}
                                        </p>
                                    </div>
                                    <p className="font-bold text-base md:text-lg whitespace-nowrap text-white">
                                        Rp {(item.product.price * item.qty).toLocaleString("id-ID")}
                                    </p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="p-5 md:p-8 bg-[#121214] border-t border-gray-800 relative overflow-hidden">
                    <div className="flex justify-between mb-6">
                        <span className="text-gray-400 text-base md:text-lg font-bold">Total Tagihan</span>
                        <span className="font-black text-2xl md:text-3xl text-blue-400">Rp {totalAmount.toLocaleString("id-ID")}</span>
                    </div>
                    
                    {sent ? (
                        <div className="w-full bg-blue-600 text-white p-6 rounded-2xl font-bold text-center flex flex-col items-center justify-center gap-2 shadow-lg shadow-blue-900/20 animate-in fade-in zoom-in duration-300">
                            <span className="text-sm text-blue-200 uppercase tracking-widest mb-1">Nomor Antrean Anda</span>
                            <span className="text-6xl font-black">{queueNumber}</span>
                            <span className="text-sm mt-2 text-blue-100">Silakan menuju kasir untuk pembayaran</span>
                        </div>
                    ) : (
                        <button 
                            onClick={sendOrderToCashier}
                            disabled={cart.length === 0}
                            className="w-full bg-white hover:bg-gray-100 text-[#121214] py-4 md:py-5 rounded-2xl font-black text-lg md:text-xl flex items-center justify-center gap-3 disabled:opacity-50 transition-all shadow-lg hover:scale-[1.02] active:scale-[0.98]"
                        >
                            <Send className="w-6 h-6" /> Pesan Sekarang
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
