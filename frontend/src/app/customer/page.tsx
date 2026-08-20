"use client";

import { useState, useEffect } from "react";
import { ShoppingCart, Send } from "lucide-react";
import { getActiveProducts } from "@/lib/api";

export default function CustomerPage() {
    const [cart, setCart] = useState<{ product: any; qty: number }[]>([]);
    const [products, setProducts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [sent, setSent] = useState(false);

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

    const sendOrderToCashier = () => {
        if (cart.length === 0) return;
        
        // Simpan ke localStorage agar bisa ditangkap oleh tab Kasir (Event Listener)
        const orderId = `CUST-${Date.now()}`;
        const newOrder = { id: orderId, items: cart, total: totalAmount, time: new Date().toISOString() };
        
        const existingOrders = JSON.parse(localStorage.getItem("nexpos_pending_orders") || "[]");
        localStorage.setItem("nexpos_pending_orders", JSON.stringify([...existingOrders, newOrder]));
        
        setCart([]);
        setSent(true);
        setTimeout(() => setSent(false), 3000);
    };

    return (
        <div className="flex h-screen bg-white text-gray-900">
            {/* LEFT: PRODUCTS LIST */}
            <div className="flex-1 p-8 overflow-y-auto">
                <h1 className="text-3xl font-bold mb-2">Menu Kami</h1>
                <p className="text-gray-500 mb-8">Silakan pilih pesanan Anda, tekan tombol pesan di kanan.</p>

                <div className="grid grid-cols-2 lg:grid-cols-3 gap-6">
                    {products.map((prod) => (
                        <div
                            key={prod.id}
                            onClick={() => addToCart(prod)}
                            className="bg-gray-50 p-6 rounded-2xl border border-gray-100 cursor-pointer hover:border-blue-500 hover:shadow-lg transition-all text-center"
                        >
                            <div className="text-5xl mb-4">{prod.image_icon || '📦'}</div>
                            <h3 className="font-bold text-lg text-gray-900">{prod.name}</h3>
                            <p className="text-gray-500 mb-4">Rp {prod.price.toLocaleString('id-ID')}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* RIGHT: CART */}
            <div className="w-[350px] bg-gray-50 shadow-2xl flex flex-col border-l border-gray-200">
                <div className="p-6 border-b border-gray-200 bg-white">
                    <h2 className="text-xl font-bold flex items-center gap-2">
                        <ShoppingCart className="w-6 h-6 text-blue-600" /> Pesanan Anda
                    </h2>
                </div>

                <div className="flex-1 overflow-y-auto p-6">
                    {cart.length === 0 ? (
                        <div className="text-center text-gray-400 mt-20">Belum ada pesanan</div>
                    ) : (
                        cart.map((item, idx) => (
                            <div key={idx} className="flex justify-between mb-4 pb-4 border-b border-gray-200">
                                <div>
                                    <p className="font-bold text-lg">{item.product.name}</p>
                                    <p className="text-gray-500">
                                        {item.qty} x Rp {item.product.price.toLocaleString("id-ID")}
                                    </p>
                                </div>
                                <p className="font-bold text-lg">
                                    Rp {(item.product.price * item.qty).toLocaleString("id-ID")}
                                </p>
                            </div>
                        ))
                    )}
                </div>

                <div className="p-6 bg-white border-t border-gray-200">
                    <div className="flex justify-between mb-6">
                        <span className="text-gray-500 text-lg">Total Pembayaran</span>
                        <span className="font-bold text-2xl text-blue-600">Rp {totalAmount.toLocaleString("id-ID")}</span>
                    </div>
                    
                    {sent ? (
                        <div className="w-full bg-green-100 text-green-700 py-4 rounded-xl font-bold text-center">
                            ✅ Pesanan Terkirim ke Kasir!
                        </div>
                    ) : (
                        <button 
                            onClick={sendOrderToCashier}
                            disabled={cart.length === 0}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            <Send className="w-6 h-6" /> Pesan Sekarang
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
