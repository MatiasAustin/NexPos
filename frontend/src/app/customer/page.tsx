"use client";

import { useState, useEffect } from "react";
import { ShoppingBag, ShoppingCart, Plus, Minus, Trash2, Maximize, Send, LayoutGrid, List, Clock } from "lucide-react";
import { SkeletonCard } from "@/components/Loading";
import { supabase } from "@/lib/supabase";

export default function CustomerPage() {
    const [cart, setCart] = useState<{ product: any; qty: number }[]>([]);
    const [products, setProducts] = useState<any[]>([]);
    const [activeCategory, setActiveCategory] = useState("Semua");
    const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
    const [loading, setLoading] = useState(true);
    const [orderStatus, setOrderStatus] = useState<'idle' | 'waiting_payment' | 'paid' | 'draft'>('idle');
    const [queueNumber, setQueueNumber] = useState<string | null>(null);
    const [customerName, setCustomerName] = useState<string>("");
    const [showMobileCart, setShowMobileCart] = useState(false);

    const [storeSettings, setStoreSettings] = useState<any>(null);

    const toggleFullscreen = () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(() => {});
        } else {
            if (document.exitFullscreen) document.exitFullscreen();
        }
    };

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                const { data, error } = await supabase.from('products').select('*').eq('is_active', true).order('name');
                if (data) setProducts(data);
                if (error) throw error;
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
                const { data } = await supabase.from('store_settings').select('*').limit(1);
                if (data && data.length > 0) {
                    setStoreSettings(data[0]);
                    localStorage.setItem("nexpos_store_settings", JSON.stringify(data[0]));
                }
            } catch(e) {
                console.error("Failed to load settings:", e);
            }
        };
        loadSettings();
    }, []);

    // Polling for payment status
    useEffect(() => {
        if (orderStatus !== 'waiting_payment' || !queueNumber) return;
        
        const checkPayment = async () => {
            try {
                const { data, error } = await supabase.from('kiosk_orders').select('status').eq('queue_number', queueNumber).maybeSingle();
                
                if (data) {
                    if (data.status === 'paid') {
                        setOrderStatus('paid');
                        setTimeout(() => {
                            setOrderStatus('idle');
                            setQueueNumber(null);
                            setCart([]);
                            setCustomerName("");
                        }, 5000);
                    } else if (data.status === 'draft') {
                        setOrderStatus('draft');
                        setTimeout(() => {
                            setOrderStatus('idle');
                            setQueueNumber(null);
                            setCart([]);
                            setCustomerName("");
                        }, 5000);
                    }
                }
            } catch (err) {
                console.error(err);
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
        if (orderStatus !== 'idle') return;
        if (newQty < 1) {
            removeFromCart(productId);
            return;
        }
        setCart(prev => prev.map(p => p.product.id === productId ? { ...p, qty: newQty } : p));
    };

    const removeFromCart = (productId: string) => {
        if (orderStatus !== 'idle') return;
        setCart(prev => prev.filter(p => p.product.id !== productId));
    };

    const subTotal = cart.reduce((sum, item) => sum + item.product.price * item.qty, 0);
    const taxAmount = storeSettings?.tax_enabled ? (subTotal * storeSettings.tax_rate) / 100 : 0;
    const grandTotal = subTotal + taxAmount;

    const sendOrderToCashier = async () => {
        if (cart.length === 0) return;
        
        try {
            // Generate Queue Number (1-999 daily) by checking DB
            const todayStart = new Date();
            todayStart.setHours(0,0,0,0);
            
            const { count } = await supabase
                .from('kiosk_orders')
                .select('*', { count: 'exact', head: true })
                .gte('created_at', todayStart.toISOString());
                
            const nextNumber = (count || 0) + 1;
            const generatedQueueNumber = nextNumber.toString().padStart(3, '0');
        
            const newOrder = {
                queue_number: generatedQueueNumber,
                customer_name: customerName,
                items: cart,
                total: grandTotal,
                status: 'pending'
            };

            const { error: insertError } = await supabase.from('kiosk_orders').insert([newOrder]);
            if (insertError) {
                console.error("Supabase Insert Error:", insertError);
                alert("Gagal: " + (insertError.message || JSON.stringify(insertError)));
                return;
            }
            
            setQueueNumber(generatedQueueNumber);
            setOrderStatus('waiting_payment');
            setShowMobileCart(false);
        } catch (error: any) {
            console.error("Gagal mengirim pesanan:", error);
            alert("Error jaringan/sistem: " + (error.message || "Silahkan coba lagi."));
        }
    };

    const categories = ["Semua", ...(storeSettings?.categories || [])];

    return (
        <div className="flex h-screen bg-[#0B0F19] text-white overflow-hidden font-sans selection:bg-blue-500/30 text-sm md:text-base">
            {/* LEFT: Menu Area */}
            <div className="flex-[3] flex flex-col h-full bg-[#0B0F19] border-r border-gray-800">
                <div className="bg-[#131B2C] border-b border-gray-800 p-6 md:p-8 flex items-center justify-between shadow-sm z-10">
                    <div className="flex items-center gap-4">
                        {storeSettings?.logo_base64 && (
                            <img src={storeSettings.logo_base64} alt="Logo" className="h-12 w-12 md:h-14 md:w-14 object-contain rounded-full bg-white p-1.5" />
                        )}
                        <div>
                            <h1 className="text-2xl md:text-3xl font-black text-white">{storeSettings?.cafe_name || 'Kalana'}</h1>
                            <p className="text-gray-400 text-sm md:text-base">Silakan pilih menu Anda</p>
                        </div>
                    </div>
                    <button onClick={toggleFullscreen} className="p-3 bg-gray-800 hover:bg-gray-700 rounded-xl transition-colors text-white" title="Toggle Fullscreen">
                        <Maximize className="w-5 h-5" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 md:p-6 no-scrollbar">
                    <div className="flex gap-2 overflow-x-auto pb-4 mb-2 no-scrollbar">
                        {categories.map((category) => (
                            <button
                                key={category}
                                onClick={() => setActiveCategory(category)}
                                className={`px-5 py-2.5 rounded-full whitespace-nowrap text-sm font-bold transition-all ${
                                    activeCategory === category
                                        ? "bg-white text-black shadow-md scale-105"
                                        : "bg-[#131B2C] text-gray-400 hover:text-white hover:bg-gray-800 border border-gray-800"
                                }`}
                            >
                                {category}
                            </button>
                        ))}
                    </div>

                    {loading ? (
                        <div className="flex items-center justify-center h-full">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-4">
                            {products
                                .filter(p => activeCategory === "Semua" || p.category === activeCategory)
                                .map((product) => (
                                    <div 
                                        key={product.id} 
                                        onClick={() => addToCart(product)}
                                        className="bg-[#131B2C] border border-gray-800/80 rounded-2xl overflow-hidden cursor-pointer hover:border-blue-500/50 hover:shadow-[0_0_20px_rgba(59,130,246,0.15)] transition-all group active:scale-95 flex flex-col"
                                    >
                                        <div className="aspect-square relative bg-gray-900/50 overflow-hidden p-3 md:p-4 flex items-center justify-center">
                                            {product.image_url ? (
                                                <img 
                                                    src={product.image_url} 
                                                    alt={product.name} 
                                                    className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-500 drop-shadow-xl"
                                                />
                                            ) : (
                                                <span className="text-4xl md:text-6xl group-hover:scale-110 transition-transform duration-500 drop-shadow-xl">{product.image_icon}</span>
                                            )}
                                        </div>
                                        <div className="p-3 md:p-4 bg-gradient-to-t from-[#131B2C] to-[#131B2C]/90 flex-1 flex flex-col justify-end">
                                            <h3 className="font-bold text-white text-xs md:text-sm mb-1 line-clamp-2 leading-tight">{product.name}</h3>
                                            <p className="text-blue-400 font-black text-xs md:text-sm">Rp {product.price.toLocaleString("id-ID")}</p>
                                        </div>
                                    </div>
                                ))}
                        </div>
                    )}
                </div>
                    {/* Spacer for mobile bottom bar */}
                <div className="h-24 sm:hidden"></div>
            </div>

            {/* SIDEBAR CART */}
            <div className={`${showMobileCart ? 'fixed inset-0 z-50 flex' : 'hidden sm:flex'} sm:relative sm:inset-auto sm:z-10 w-full sm:w-[35%] lg:w-[30%] bg-[#0B0F19] sm:border-l border-gray-800 flex-col shadow-2xl transition-all`}>
                {showMobileCart && (
                    <button onClick={() => setShowMobileCart(false)} className="sm:hidden absolute top-4 right-4 p-2 bg-gray-800 rounded-full text-white z-50">
                        X
                    </button>
                )}
                <div className="p-4 sm:p-6 md:p-8 bg-[#121214] border-b border-gray-800 flex items-center gap-3">
                    <div className="p-2 bg-blue-600/20 text-blue-400 rounded-lg">
                        <ShoppingBag className="w-5 h-5 sm:w-6 sm:h-6" />
                    </div>
                    <h2 className="text-lg sm:text-xl md:text-2xl font-black text-white">Pesanan Anda</h2>
                </div>

                <div className="flex-1 overflow-y-auto p-3 sm:p-4 md:p-6 no-scrollbar">
                    {cart.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-gray-500 gap-4 opacity-50">
                            <div className="w-20 h-20 rounded-full border-2 border-dashed border-gray-600 flex items-center justify-center mb-2">
                                <ShoppingBag className="w-8 h-8" />
                            </div>
                            <p className="font-medium text-lg">Belum ada pesanan</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {cart.map((item, idx) => (
                                <div key={idx} className="flex gap-4 items-center bg-[#131B2C] p-3 rounded-2xl border border-gray-800">
                                    <div className="w-16 h-16 bg-[#0B0F19] rounded-xl flex items-center justify-center overflow-hidden shrink-0">
                                        {item.product.image_url ? (
                                            <img src={item.product.image_url} className="w-12 h-12 object-contain" alt={item.product.name} />
                                        ) : (
                                            <span className="text-3xl">{item.product.image_icon}</span>
                                        )}
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="font-bold text-white text-sm line-clamp-1">{item.product.name}</h4>
                                        <p className="text-blue-400 font-bold text-xs mt-1">Rp {item.product.price.toLocaleString("id-ID")}</p>
                                    </div>
                                    <div className="flex flex-col items-end gap-2 shrink-0">
                                        <button onClick={() => removeFromCart(item.product.id)} className="text-red-400 hover:text-red-300">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                        <div className="flex items-center gap-2 bg-[#0B0F19] rounded-lg p-1 border border-gray-800">
                                            <button onClick={() => updateCartQty(item.product.id, item.qty - 1)} className="w-6 h-6 flex items-center justify-center bg-gray-800 text-white rounded-md hover:bg-gray-700">
                                                <Minus className="w-3 h-3" />
                                            </button>
                                            <span className="text-xs font-bold w-4 text-center text-white">{item.qty}</span>
                                            <button onClick={() => updateCartQty(item.product.id, item.qty + 1)} className="w-6 h-6 flex items-center justify-center bg-gray-800 text-white rounded-md hover:bg-gray-700">
                                                <Plus className="w-3 h-3" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="p-6 bg-[#121214] border-t border-gray-800 shadow-[0_-10px_30px_rgba(0,0,0,0.5)]">
                    <input 
                        type="text" 
                        placeholder="Ketik nama Anda (opsional)..."
                        value={customerName}
                        onChange={e => setCustomerName(e.target.value)}
                        className="w-full bg-[#0B0F19] border border-gray-800 rounded-xl p-4 text-white focus:border-blue-500 outline-none text-sm mb-4 font-medium"
                    />
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-gray-400 text-sm">Subtotal</span>
                        <span className="text-white font-bold text-sm">Rp {subTotal.toLocaleString("id-ID")}</span>
                    </div>
                    {storeSettings?.tax_enabled && (
                        <div className="flex justify-between items-center mb-4 pb-4 border-b border-gray-800/50">
                            <span className="text-gray-400 text-sm">Pajak ({storeSettings.tax_rate}%)</span>
                            <span className="text-white font-bold text-sm">Rp {taxAmount.toLocaleString("id-ID")}</span>
                        </div>
                    )}
                    <div className="flex justify-between items-end mb-6">
                        <span className="text-gray-400 font-bold">Total Tagihan</span>
                        <span className="text-2xl font-black text-blue-500">Rp {grandTotal.toLocaleString("id-ID")}</span>
                    </div>
                    <button 
                        onClick={sendOrderToCashier}
                        disabled={cart.length === 0}
                        className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white py-4 rounded-2xl font-black tracking-wide transition-all active:scale-95 shadow-lg shadow-blue-600/20"
                    >
                        Pesan Sekarang
                    </button>
                </div>
            </div>
            {/* MOBILE BOTTOM BAR */}
            {!showMobileCart && cart.length > 0 && orderStatus === 'idle' && (
                <div className="sm:hidden fixed bottom-0 left-0 right-0 p-4 bg-blue-600 text-white flex justify-between items-center rounded-t-3xl shadow-[0_-10px_40px_rgba(37,99,235,0.3)] z-40 animate-in slide-in-from-bottom-full cursor-pointer" onClick={() => setShowMobileCart(true)}>
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <ShoppingBag className="w-6 h-6" />
                            <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full">{cart.reduce((s, i) => s + i.qty, 0)}</span>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-xs text-blue-200">Total Pesanan</span>
                            <span className="font-bold">Rp {grandTotal.toLocaleString("id-ID")}</span>
                        </div>
                    </div>
                    <button className="bg-white text-blue-600 px-6 py-2 rounded-xl font-black text-sm hover:bg-gray-100 transition-colors">
                        Lihat
                    </button>
                </div>
            )}

            {/* FULLSCREEN POPUP OVERLAY */}
            {(orderStatus === 'waiting_payment' || orderStatus === 'paid' || orderStatus === 'draft') && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-start justify-center p-4 overflow-y-auto">
                    {orderStatus === 'waiting_payment' ? (
                        <div className="w-full max-w-md bg-blue-600 text-white p-10 rounded-3xl font-bold text-center flex flex-col items-center justify-center gap-4 shadow-2xl shadow-blue-900/50 my-auto flex-shrink-0 animate-in zoom-in duration-300">
                            <span className="text-lg text-blue-200 uppercase tracking-widest font-semibold">Nomor Antrean Anda</span>
                            <span className="text-8xl font-black my-4">{queueNumber}</span>
                            <div className="w-16 h-1 bg-blue-400/50 rounded-full mb-2"></div>
                            <span className="text-lg text-blue-100">Silakan menuju kasir untuk pembayaran</span>
                            <div className="mt-4 flex items-center gap-2 text-sm text-blue-300">
                                <Clock className="w-4 h-4 animate-spin-slow" /> Menunggu pembayaran...
                            </div>
                        </div>
                    ) : orderStatus === 'paid' ? (
                        <div className="w-full max-w-md bg-green-600 text-white p-10 rounded-3xl font-bold text-center flex flex-col items-center justify-center gap-4 shadow-2xl shadow-green-900/50 my-auto flex-shrink-0 animate-in zoom-in duration-300">
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
