"use client";

import { useState, useEffect } from "react";
import { ShoppingCart, Send, Trash2, Minus, Plus, LayoutGrid, List } from "lucide-react";
import { getActiveProducts } from "@/lib/api";
import { SkeletonCard } from "@/components/Loading";

export default function CustomerPage() {
    const [cart, setCart] = useState<{ product: any; qty: number }[]>([]);
    const [products, setProducts] = useState<any[]>([]);
    const [activeCategory, setActiveCategory] = useState("Semua");
    const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
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

    const updateCartQty = (productId: string, newQty: number) => {
        if (newQty < 1) return;
        setCart(prev => prev.map(p => p.product.id === productId ? { ...p, qty: newQty } : p));
    };

    const removeFromCart = (productId: string) => {
        setCart(prev => prev.filter(p => p.product.id !== productId));
    };

    const subTotal = cart.reduce((sum, item) => sum + item.product.price * item.qty, 0);
    const taxRate = storeSettings?.tax_enabled ? Number(storeSettings?.tax_rate || 0) : 0;
    const taxAmount = (subTotal * taxRate) / 100;
    const grandTotal = subTotal + taxAmount;

    const [queueNumber, setQueueNumber] = useState<string | null>(null);

    const sendOrderToCashier = () => {
        if (cart.length === 0) return;
        
        const qNumber = Math.floor(100 + Math.random() * 900).toString(); // Generate 3 digit queue
        const newOrder = { 
            id: Date.now().toString(), 
            queue_number: qNumber,
            items: cart, 
            total: grandTotal, 
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

    // Sync categories from storeSettings or fallback to derived ones
    const dynamicCategories = storeSettings?.categories && storeSettings.categories.length > 0
        ? storeSettings.categories
        : Array.from(new Set(products.map(p => p.category || "Uncategorized")));
    const categories = ["Semua", ...dynamicCategories];
    const filteredProducts = activeCategory === "Semua" ? products : products.filter(p => (p.category || "Uncategorized") === activeCategory);

    return (
        <div className="flex flex-col md:flex-row h-screen bg-[#0B0F19] text-gray-100 font-['Funnel_Display'] overflow-hidden selection:bg-blue-500/30">
            {/* LEFT: PRODUCTS LIST */}
            <div className="flex-1 p-6 md:p-8 overflow-y-auto no-scrollbar">
                <div className="mb-6 flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl md:text-4xl font-black mb-2 text-white tracking-tight">Menu {storeSettings?.cafe_name || 'Kami'}</h1>
                        <p className="text-gray-400 text-sm md:text-base">Silakan pilih pesanan Anda, sentuh produk untuk menambah.</p>
                    </div>
                    {storeSettings?.logo_base64 ? (
                        <img src={storeSettings.logo_base64} alt="Brand Logo" className="hidden md:block w-16 h-16 object-contain rounded-2xl bg-white p-1 shadow-lg shadow-white/5" />
                    ) : (
                        <div className="hidden md:flex w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-purple-600 items-center justify-center text-white text-3xl font-black shadow-lg shadow-blue-900/20">N</div>
                    )}
                </div>

                {/* Categories & View Mode Toggle */}
                <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center mb-8">
                    <div className="flex overflow-x-auto gap-2 pb-2 w-full sm:w-auto no-scrollbar">
                        {categories.map(cat => (
                            <button
                                key={cat}
                                onClick={() => setActiveCategory(cat)}
                                className={`px-5 py-2.5 rounded-full font-bold text-sm whitespace-nowrap transition-all ${
                                    activeCategory === cat 
                                    ? "bg-blue-600 text-white shadow-lg shadow-blue-900/20 border-blue-500" 
                                    : "bg-[#131B2C] text-gray-400 hover:text-white border border-gray-800/60"
                                }`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                    <div className="flex bg-[#131B2C] rounded-xl border border-gray-800/60 p-1 shrink-0">
                        <button onClick={() => setViewMode('grid')} className={`p-2 rounded-lg transition-colors ${viewMode === 'grid' ? 'bg-gray-800 text-white' : 'text-gray-500 hover:text-gray-300'}`}>
                            <LayoutGrid className="w-5 h-5" />
                        </button>
                        <button onClick={() => setViewMode('list')} className={`p-2 rounded-lg transition-colors ${viewMode === 'list' ? 'bg-gray-800 text-white' : 'text-gray-500 hover:text-gray-300'}`}>
                            <List className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                <div className={viewMode === 'grid' ? "grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6" : "flex flex-col gap-4"}>
                    {loading ? (
                        Array.from({ length: 8 }).map((_, idx) => <SkeletonCard key={idx} />)
                    ) : filteredProducts.length === 0 ? (
                        <div className="col-span-full text-center text-gray-500 py-10 bg-[#131B2C] rounded-2xl border border-gray-800">Belum ada produk di kategori ini.</div>
                    ) : (
                        filteredProducts.map((prod) => (
                        <div
                            key={prod.id}
                            onClick={() => addToCart(prod)}
                            className={`bg-[#131B2C] rounded-3xl border border-gray-800/60 cursor-pointer hover:border-blue-500/50 hover:bg-gray-800/30 transition-all shadow-lg relative overflow-hidden group ${
                                viewMode === 'grid' 
                                ? "p-5 md:p-6 text-center flex flex-col h-full justify-between"
                                : "p-4 md:p-5 flex items-center justify-between gap-4"
                            }`}
                        >
                            <div className={viewMode === 'grid' ? "relative z-10" : "flex items-center gap-4 relative z-10"}>
                                <div className={`${viewMode === 'grid' ? "text-5xl md:text-6xl mb-4" : "text-4xl bg-gray-800/50 w-16 h-16 rounded-2xl flex items-center justify-center"} transform group-hover:scale-110 transition-transform`}>
                                    {prod.image_icon || '☕'}
                                </div>
                                <div className={viewMode === 'list' ? "text-left" : ""}>
                                    <h3 className="font-bold text-lg md:text-xl text-white leading-tight mb-1">{prod.name}</h3>
                                    {viewMode === 'list' && <p className="text-gray-500 text-sm">{prod.category || 'Uncategorized'}</p>}
                                </div>
                            </div>
                            <p className={`text-blue-400 font-bold ${viewMode === 'grid' ? "text-base md:text-lg mt-auto" : "text-lg md:text-xl shrink-0"} relative z-10`}>
                                Rp {prod.price.toLocaleString('id-ID')}
                            </p>
                            
                            {/* Decorative Background Icon (Grid Only) */}
                            {viewMode === 'grid' && (
                                <div className="absolute -bottom-4 -right-4 text-7xl opacity-5 group-hover:opacity-10 transition-opacity z-0">{prod.image_icon || '☕'}</div>
                            )}
                        </div>
                    )))}
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
                                <div key={idx} className="flex flex-col gap-3 pb-4 border-b border-gray-800/50">
                                    <div className="flex justify-between items-start">
                                        <div className="flex-1 pr-3">
                                            <p className="font-bold text-base md:text-lg leading-tight text-white mb-1">{item.product.name}</p>
                                            <p className="text-blue-400 font-bold text-sm md:text-base">
                                                Rp {item.product.price.toLocaleString("id-ID")}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-bold text-base md:text-lg whitespace-nowrap text-white mb-2">
                                                Rp {(item.product.price * item.qty).toLocaleString("id-ID")}
                                            </p>
                                            <button onClick={() => removeFromCart(item.product.id)} className="text-red-400 hover:text-red-300 p-1.5 bg-red-500/10 hover:bg-red-500/20 rounded-lg transition-colors inline-flex">
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <button 
                                            onClick={() => updateCartQty(item.product.id, item.qty - 1)}
                                            disabled={item.qty <= 1}
                                            className="w-10 h-10 flex items-center justify-center bg-gray-800 hover:bg-gray-700 disabled:opacity-50 text-white rounded-xl transition-colors border border-gray-700"
                                        >
                                            <Minus className="w-5 h-5" />
                                        </button>
                                        <input 
                                            type="number" 
                                            value={item.qty}
                                            onChange={(e) => updateCartQty(item.product.id, parseInt(e.target.value) || 1)}
                                            className="w-16 h-10 bg-[#121214] text-center font-bold text-white border border-gray-800 rounded-xl outline-none focus:border-blue-500"
                                        />
                                        <button 
                                            onClick={() => updateCartQty(item.product.id, item.qty + 1)}
                                            className="w-10 h-10 flex items-center justify-center bg-gray-800 hover:bg-gray-700 text-white rounded-xl transition-colors border border-gray-700"
                                        >
                                            <Plus className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="p-5 md:p-8 bg-[#121214] border-t border-gray-800 relative overflow-hidden">
                    <div className="flex justify-between mb-2">
                        <span className="text-gray-400 text-sm md:text-base">Subtotal</span>
                        <span className="font-bold text-lg md:text-xl text-gray-200">Rp {subTotal.toLocaleString("id-ID")}</span>
                    </div>
                    {storeSettings?.tax_enabled && (
                        <div className="flex justify-between mb-2">
                            <span className="text-gray-400 text-sm md:text-base">Pajak ({storeSettings.tax_rate}%)</span>
                            <span className="font-bold text-lg md:text-xl text-gray-200">Rp {taxAmount.toLocaleString("id-ID")}</span>
                        </div>
                    )}
                    <div className="flex justify-between mb-6 border-t border-gray-800 pt-4">
                        <span className="text-gray-300 text-base md:text-lg font-bold">Total Tagihan</span>
                        <span className="font-black text-2xl md:text-3xl text-blue-400">Rp {grandTotal.toLocaleString("id-ID")}</span>
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
