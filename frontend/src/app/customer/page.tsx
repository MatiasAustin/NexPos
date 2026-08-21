"use client";

import { useState, useEffect } from "react";
import { ShoppingCart, Send, Trash2, Minus, Plus, LayoutGrid, List, Clock, ShoppingBag } from "lucide-react";
import { getActiveProducts } from "@/lib/api";
import { SkeletonCard } from "@/components/Loading";

export default function CustomerPage() {
    const [cart, setCart] = useState<{ product: any; qty: number }[]>([]);
    const [products, setProducts] = useState<any[]>([]);
    const [activeCategory, setActiveCategory] = useState("Semua");
    const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
    const [loading, setLoading] = useState(true);
    const [orderStatus, setOrderStatus] = useState<'idle' | 'waiting_payment' | 'paid' | 'draft'>('idle');
    const [queueNumber, setQueueNumber] = useState<string | null>(null);

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

    // Polling for payment status
    useEffect(() => {
        if (orderStatus !== 'waiting_payment' || !queueNumber) return;
        
        const checkPayment = () => {
            const paidOrders = JSON.parse(localStorage.getItem('nexpos_paid_orders') || "[]");
            if (paidOrders.includes(queueNumber)) {
                setOrderStatus('paid');
                // Auto reset after 5 seconds
                setTimeout(() => {
                    setOrderStatus('idle');
                    setQueueNumber(null);
                    setCart([]);
                    
                    const updated = JSON.parse(localStorage.getItem('nexpos_paid_orders') || "[]").filter((id: string) => id !== queueNumber);
                    localStorage.setItem('nexpos_paid_orders', JSON.stringify(updated));
                }, 5000);
                return;
            }

            const draftOrders = JSON.parse(localStorage.getItem('nexpos_draft_notified') || "[]");
            if (draftOrders.includes(queueNumber)) {
                setOrderStatus('draft');
                setTimeout(() => {
                    setOrderStatus('idle');
                    setQueueNumber(null);
                    setCart([]);
                    
                    const updated = JSON.parse(localStorage.getItem('nexpos_draft_notified') || "[]").filter((id: string) => id !== queueNumber);
                    localStorage.setItem('nexpos_draft_notified', JSON.stringify(updated));
                }, 5000);
            }
        };

        const interval = setInterval(checkPayment, 1500); // Poll every 1.5s
        return () => clearInterval(interval);
    }, [orderStatus, queueNumber]);

    const addToCart = (product: any) => {
        if (orderStatus !== 'idle') return;
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

    const updateCartQty = (productId: string, newQty: number) => {
        if (orderStatus !== 'idle' || newQty < 1) return;
        setCart(prev => prev.map(p => p.product.id === productId ? { ...p, qty: newQty } : p));
    };

    const removeFromCart = (productId: string) => {
        if (orderStatus !== 'idle') return;
        setCart(prev => prev.filter(p => p.product.id !== productId));
    };

    const subTotal = cart.reduce((sum, item) => sum + item.product.price * item.qty, 0);
    const taxAmount = storeSettings?.tax_enabled ? (subTotal * storeSettings.tax_rate) / 100 : 0;
    const grandTotal = subTotal + taxAmount;

    const sendOrderToCashier = () => {
        if (cart.length === 0) return;
        
        // Generate Queue Number (1-999 daily)
        const today = new Date().toISOString().split('T')[0];
        const counterData = JSON.parse(localStorage.getItem("nexpos_queue_counter") || "{}");
        
        let nextNumber = 1;
        if (counterData.date === today) {
            nextNumber = (counterData.count || 0) + 1;
        }
        
        localStorage.setItem("nexpos_queue_counter", JSON.stringify({
            date: today,
            count: nextNumber
        }));
        
        const generatedQueueNumber = nextNumber.toString().padStart(3, '0');
        
        const newOrder = {
            id: Date.now().toString(),
            queue_number: generatedQueueNumber,
            items: cart,
            time: new Date().toISOString(),
            is_draft: false
        };

        const pendingOrders = JSON.parse(localStorage.getItem("nexpos_pending_orders") || "[]");
        pendingOrders.push(newOrder);
        localStorage.setItem("nexpos_pending_orders", JSON.stringify(pendingOrders));

        setQueueNumber(generatedQueueNumber);
        setOrderStatus('waiting_payment');
    };

    const categories = ["Semua", ...(storeSettings?.categories || [])];

    return (
        <div className="flex h-screen bg-[#0B0F19] text-white overflow-hidden font-sans selection:bg-blue-500/30">
            {/* LEFT: Menu Area */}
            <div className="flex-[3] flex flex-col h-full bg-[#0B0F19] border-r border-gray-800">
                <div className="bg-[#131B2C] border-b border-gray-800 p-6 md:p-8 flex items-center justify-between shadow-sm z-10">
                    <div className="flex items-center gap-4">
                        {storeSettings?.logo_base64 && (
                            <img src={storeSettings.logo_base64} alt="Logo" className="h-10 md:h-12 w-auto object-contain rounded-lg" />
                        )}
                        <div>
                            <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">{storeSettings?.cafe_name || 'NexPos Cafe'}</h1>
                            <p className="text-gray-400 text-sm font-medium mt-1">Silakan pilih menu Anda</p>
                        </div>
                    </div>
                </div>

                <div className="bg-[#0B0F19] p-4 md:p-6 overflow-x-auto border-b border-gray-800">
                    <div className="flex gap-3 md:gap-4 min-w-max pb-2 px-2">
                        {categories.map((category) => (
                            <button
                                key={category}
                                onClick={() => setActiveCategory(category)}
                                className={`px-5 py-2.5 md:px-7 md:py-3 rounded-full font-bold text-sm md:text-base transition-all duration-300 shadow-sm ${
                                    activeCategory === category
                                        ? "bg-white text-[#121214] scale-105"
                                        : "bg-[#131B2C] text-gray-400 hover:bg-gray-800 border border-gray-800"
                                }`}
                            >
                                {category}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 md:p-8">
                    {loading ? (
                        <div className="flex items-center justify-center h-full">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                            {products
                                .filter(p => activeCategory === "Semua" || p.category === activeCategory)
                                .map((product) => (
                                    <div 
                                        key={product.id} 
                                        onClick={() => addToCart(product)}
                                        className="bg-[#131B2C] border border-gray-800 rounded-3xl overflow-hidden cursor-pointer group hover:-translate-y-1 transition-all duration-300 hover:border-gray-600 hover:shadow-xl hover:shadow-gray-900/50 flex flex-col"
                                    >
                                        <div className="aspect-square relative bg-gray-900/50 overflow-hidden p-4 flex items-center justify-center">
                                            {product.image_url ? (
                                                <img 
                                                    src={product.image_url} 
                                                    alt={product.name} 
                                                    className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-500 drop-shadow-2xl"
                                                />
                                            ) : (
                                                <span className="text-6xl filter drop-shadow-xl group-hover:scale-110 transition-transform duration-300">{product.image_icon}</span>
                                            )}
                                        </div>
                                        <div className="p-4 md:p-5 flex-1 flex flex-col justify-between">
                                            <h3 className="font-bold text-sm md:text-base text-gray-200 leading-tight mb-2 group-hover:text-white transition-colors">{product.name}</h3>
                                            <p className="text-blue-400 font-black tracking-wide text-base md:text-lg">Rp {product.price.toLocaleString("id-ID")}</p>
                                        </div>
                                    </div>
                                ))}
                        </div>
                    )}
                </div>
            </div>

            {/* RIGHT: Cart Area */}
            <div className="flex-[1.2] min-w-[320px] max-w-[480px] bg-[#131B2C] flex flex-col relative shadow-[-10px_0_30px_-15px_rgba(0,0,0,0.5)] z-20">
                <div className="p-6 md:p-8 bg-gray-900/40 border-b border-gray-800 backdrop-blur-md">
                    <h2 className="text-xl md:text-2xl font-black text-white flex items-center gap-3">
                        <ShoppingBag className="w-6 h-6 text-blue-500" />
                        Pesanan Anda
                    </h2>
                </div>

                <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-[#131B2C]">
                    {cart.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-gray-500 space-y-4">
                            <div className="w-24 h-24 bg-gray-900/50 rounded-full flex items-center justify-center border border-gray-800">
                                <ShoppingBag className="w-10 h-10 text-gray-600" />
                            </div>
                            <p className="font-medium text-lg">Keranjang masih kosong</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {cart.map((item) => (
                                <div key={item.product.id} className="flex flex-col p-4 bg-gray-900/50 rounded-2xl border border-gray-800">
                                    <div className="flex justify-between items-start mb-3">
                                        <div className="flex items-center gap-3">
                                            <div className="w-12 h-12 bg-[#131B2C] rounded-xl flex items-center justify-center border border-gray-800 shadow-inner">
                                                {item.product.image_url ? (
                                                    <img src={item.product.image_url} alt="" className="w-8 h-8 object-contain drop-shadow-md" />
                                                ) : (
                                                    <span className="text-xl drop-shadow-md">{item.product.image_icon}</span>
                                                )}
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-gray-200 text-sm leading-tight">{item.product.name}</h4>
                                                <p className="text-blue-400 font-bold text-sm mt-0.5">Rp {(item.product.price * item.qty).toLocaleString("id-ID")}</p>
                                            </div>
                                        </div>
                                        <button 
                                            onClick={() => removeFromCart(item.product.id)}
                                            className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                    <div className="flex items-center gap-4 bg-[#131B2C] rounded-xl p-1 border border-gray-800 w-fit self-end shadow-sm">
                                        <button 
                                            onClick={() => updateCartQty(item.product.id, item.qty - 1)}
                                            className="w-8 h-8 flex items-center justify-center bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors active:scale-95"
                                        ><Minus className="w-4 h-4" /></button>
                                        <span className="font-bold w-6 text-center text-sm">{item.qty}</span>
                                        <button 
                                            onClick={() => updateCartQty(item.product.id, item.qty + 1)}
                                            className="w-8 h-8 flex items-center justify-center bg-white text-black rounded-lg hover:bg-gray-200 transition-colors active:scale-95"
                                        ><Plus className="w-4 h-4" /></button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="p-6 md:p-8 bg-[#121214] border-t border-gray-800">
                    {storeSettings?.tax_enabled && (
                        <div className="flex justify-between mb-2">
                            <span className="text-gray-400 text-sm md:text-base">Pajak ({storeSettings.tax_rate}%)</span>
                            <span className="font-bold text-lg md:text-xl text-gray-200">Rp {taxAmount.toLocaleString("id-ID")}</span>
                        </div>
                    )}
                    <div className="flex justify-between mb-6 pt-4 border-t border-gray-800">
                        <span className="text-xl font-black">Total</span>
                        <span className="text-2xl font-black text-blue-400">Rp {grandTotal.toLocaleString("id-ID")}</span>
                    </div>
                    <button 
                        onClick={sendOrderToCashier}
                        disabled={cart.length === 0}
                        className="w-full py-4 rounded-2xl bg-blue-600 text-white font-black hover:bg-blue-500 transition-colors disabled:opacity-50"
                    >
                        Pesan Sekarang
                    </button>
                </div>
            </div>

            {/* FULLSCREEN POPUP OVERLAY */}
            {(orderStatus === 'waiting_payment' || orderStatus === 'paid' || orderStatus === 'draft') && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    {orderStatus === 'waiting_payment' ? (
                        <div className="w-full max-w-md bg-blue-600 text-white p-10 rounded-3xl font-bold text-center flex flex-col items-center justify-center gap-4 shadow-2xl shadow-blue-900/50 animate-in zoom-in duration-300">
                            <span className="text-lg text-blue-200 uppercase tracking-widest font-semibold">Nomor Antrean Anda</span>
                            <span className="text-8xl font-black my-4">{queueNumber}</span>
                            <div className="w-16 h-1 bg-blue-400/50 rounded-full mb-2"></div>
                            <span className="text-lg text-blue-100">Silakan menuju kasir untuk pembayaran</span>
                            <div className="mt-4 flex items-center gap-2 text-sm text-blue-300">
                                <Clock className="w-4 h-4 animate-spin-slow" /> Menunggu pembayaran...
                            </div>
                        </div>
                    ) : orderStatus === 'paid' ? (
                        <div className="w-full max-w-md bg-green-600 text-white p-10 rounded-3xl font-bold text-center flex flex-col items-center justify-center gap-4 shadow-2xl shadow-green-900/50 animate-in zoom-in duration-300">
                            <div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center mb-4">
                                <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M5 13l4 4L19 7"></path>
                                </svg>
                            </div>
                            <span className="text-3xl font-black mb-2">Pembayaran Berhasil!</span>
                            <span className="text-lg text-green-100 font-medium">Terima kasih, pesanan Anda sedang disiapkan</span>
                            <span className="text-sm text-green-200 mt-2">Nomor Antrean: {queueNumber}</span>
                        </div>
                    ) : (
                        <div className="w-full max-w-md bg-orange-600 text-white p-10 rounded-3xl font-bold text-center flex flex-col items-center justify-center gap-4 shadow-2xl shadow-orange-900/50 animate-in zoom-in duration-300">
                            <div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center mb-4">
                                <Clock className="w-12 h-12 text-white" />
                            </div>
                            <span className="text-3xl font-black mb-2">Pesanan Diproses!</span>
                            <span className="text-lg text-orange-100 font-medium">Anda memilih pembayaran nanti. Silakan menunggu pesanan Anda disiapkan.</span>
                            <span className="text-sm text-orange-200 mt-2">Nomor Antrean: {queueNumber}</span>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
