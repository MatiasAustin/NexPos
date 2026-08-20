"use client";

import { useState, useEffect } from "react";
import { ShoppingCart, CreditCard, Banknote, Trash2, Clock } from "lucide-react";
import { processPayment, getPaymentMethods, getActiveProducts } from "@/lib/api";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function PosPage() {
    const [hasSession, setHasSession] = useState(false);
    const [openingCash, setOpeningCash] = useState<string>("");
    const [products, setProducts] = useState<any[]>([]);
    
    const [cart, setCart] = useState<{ product: any; qty: number }[]>([]);
    const [showPayment, setShowPayment] = useState(false);
    const [amountReceived, setAmountReceived] = useState<string>("");
    const [paymentResult, setPaymentResult] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    
    // New States
    const [paymentMethods, setPaymentMethods] = useState<any[]>([]);
    const [selectedMethod, setSelectedMethod] = useState<any>(null);
    const [pendingOrders, setPendingOrders] = useState<any[]>([]);
    
    // Auth State
    const [staff, setStaff] = useState<any>(null);
    const router = useRouter();

    // Merged Auth & Session check below

    const [sessionId, setSessionId] = useState<string | null>(null);
    const [isCheckingSession, setIsCheckingSession] = useState(true);

    useEffect(() => {
        // Check Auth & Session
        const checkAuth = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                router.push('/login');
                return;
            }
            
            const { data: profile } = await supabase
                .from('staff_profiles')
                .select('*')
                .eq('id', session.user.id)
                .single();
                
            if (profile) {
                setStaff(profile);
                await checkActiveSession(profile.id);
            } else {
                router.push('/login');
            }
            setIsCheckingSession(false);
        };
        checkAuth();
    }, [router]);

    const checkActiveSession = async (staffId: string) => {
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/cash-sessions/active?staffId=${staffId}&terminalId=TERM-01`);
            if (res.ok) {
                const sess = await res.json();
                if (sess && sess.id) {
                    setSessionId(sess.id);
                    setHasSession(true);
                }
            }
        } catch (error) {
            console.error("Error checking session:", error);
        }
    };

    const handleOpenSession = async () => {
        if (!openingCash) return;
        setLoading(true);
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/cash-sessions/open`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    staffId: staff.id,
                    terminalId: "TERM-01",
                    openingCash: Number(openingCash)
                })
            });
            if (res.ok) {
                const sess = await res.json();
                setSessionId(sess.id);
                setHasSession(true);
            } else {
                alert("Gagal membuka shift kasir.");
            }
        } catch (error) {
            console.error("Error opening session:", error);
        }
        setLoading(false);
    };

    const handleCloseSession = async () => {
        const confirm = window.confirm("Yakin ingin menutup shift sekarang? Uang laci harus dihitung.");
        if (!confirm) return;

        const actualCash = window.prompt("Masukkan jumlah uang tunai fisik yang ada di laci saat ini:");
        if (actualCash === null) return; // Cancel

        setLoading(true);
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/cash-sessions/close`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    sessionId: sessionId,
                    actualCash: Number(actualCash),
                    discrepancyReason: "Ditutup manual oleh kasir" // Default reason for demo
                })
            });
            if (res.ok) {
                alert("Shift berhasil ditutup.");
                setHasSession(false);
                setSessionId(null);
                setOpeningCash("");
            } else {
                const err = await res.json();
                alert(`Gagal menutup shift: ${err.error}`);
            }
        } catch (error) {
            console.error(error);
        }
        setLoading(false);
    };

    useEffect(() => {
        if (hasSession && staff) {
            getPaymentMethods().then(methods => {
                setPaymentMethods(methods);
                if (methods && methods.length > 0) {
                    setSelectedMethod(methods[0].id);
                }
            });
            getActiveProducts().then(prods => setProducts(prods));
            
            // Listen for localStorage changes for incoming customer orders
            const checkOrders = () => {
                const orders = JSON.parse(localStorage.getItem("nexpos_pending_orders") || "[]");
                setPendingOrders(orders);
            };
            checkOrders();
            window.addEventListener('storage', checkOrders);
            // Polling fallback just in case
            const interval = setInterval(checkOrders, 2000);
            return () => {
                window.removeEventListener('storage', checkOrders);
                clearInterval(interval);
            };
        }
    }, [hasSession]);

    const loadCustomerOrder = (order: any, idx: number) => {
        setCart(order.items);
        
        // Remove from pending
        const newPending = [...pendingOrders];
        newPending.splice(idx, 1);
        setPendingOrders(newPending);
        localStorage.setItem("nexpos_pending_orders", JSON.stringify(newPending));
    };

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

    const clearCart = () => setCart([]);

    const totalAmount = cart.reduce((sum, item) => sum + item.product.price * item.qty, 0);

    const handlePayment = async () => {
        if (!selectedMethod) {
            alert("Belum ada Metode Pembayaran di Database. Silakan tambahkan via database/admin terlebih dahulu.");
            return;
        }
        
        setLoading(true);
        try {
            const payload = {
                order_reference: `ORD-${Date.now()}`,
                amount_due: totalAmount,
                amount_received: Number(amountReceived) || totalAmount, // For non-cash, amount received = amount due
                payment_method_id: selectedMethod.id,
                items: cart.map(item => ({
                    product_id: item.product.id,
                    product_name: item.product.name,
                    quantity: item.qty,
                    price: item.product.price,
                    cogs: item.product.cogs || 0
                }))
            };
            
            const result = await processPayment(payload);
            setPaymentResult(result);
            if (result.status === "Paid" || result.status === "Pending") {
                clearCart();
                // Clear any pending order from local storage so it clears the list
                localStorage.removeItem("nexpos_pending_orders");
                setPendingOrders([]);

                // Update Session Expected Cash if payment is CASH
                if (selectedMethod?.type?.toLowerCase() === 'cash' && sessionId && staff) {
                    try {
                        await fetch(`${process.env.NEXT_PUBLIC_API_URL}/cash-movements`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                session_id: sessionId,
                                staff_id: staff.id,
                                type: 'sale',
                                amount: totalAmount
                            })
                        });
                    } catch(err) {
                        console.error("Gagal mencatat mutasi kasir:", err);
                    }
                }
            }
        } catch (error: any) {
            alert(error.response?.data?.error || "Payment Failed");
        }
        setLoading(false);
    };

    if (isCheckingSession) {
        return <div className="flex min-h-screen bg-gray-50 items-center justify-center p-4">Memuat data shift kasir...</div>;
    }

    if (!hasSession) {
        return (
            <div className="flex min-h-screen bg-gray-50 items-center justify-center p-4">
                <div className="bg-white p-8 rounded-2xl w-full max-w-[400px] shadow-xl text-center">
                    <Banknote className="w-12 h-12 text-blue-600 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold mb-2">Buka Shift Kasir</h2>
                    <p className="text-gray-500 mb-6">Masukkan modal uang fisik awal (Opening Cash) untuk sesi ini.</p>
                    <input 
                        type="number"
                        value={openingCash}
                        onChange={(e) => setOpeningCash(e.target.value)}
                        className="w-full border-2 border-gray-200 rounded-lg p-3 text-lg mb-6 text-center focus:border-blue-500 outline-none"
                        placeholder="Rp 0"
                    />
                    <button 
                        onClick={handleOpenSession}
                        disabled={loading}
                        className="w-full bg-blue-600 text-white font-bold py-3 rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50"
                    >
                        {loading ? 'Membuka...' : 'Buka Shift'}
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col md:flex-row h-screen bg-gray-50 text-gray-900">
            {/* LEFT: PRODUCTS LIST */}
            <div className="flex-1 p-4 md:p-6 flex flex-col overflow-y-auto">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                    <h1 className="text-2xl font-bold text-gray-800">NexPos Terminal</h1>
                    <div className="bg-white p-2 rounded-lg shadow-sm font-semibold flex items-center gap-4 text-sm w-full sm:w-auto overflow-x-auto justify-between sm:justify-start">
                        <div>
                            <span className="text-gray-500 whitespace-nowrap"><Clock className="w-4 h-4 inline" /> {new Date().toLocaleTimeString()}</span>
                            <span className="border-l pl-4 ml-4 whitespace-nowrap">Kasir: {staff?.full_name}</span>
                        </div>
                        <button onClick={handleCloseSession} className="ml-4 px-3 py-1 bg-red-100 text-red-600 rounded hover:bg-red-200 font-bold text-xs whitespace-nowrap">
                            Tutup Shift
                        </button>
                    </div>
                </div>

                {/* INCOMING ORDERS NOTIFICATION */}
                {pendingOrders.length > 0 && (
                    <div className="mb-6 p-4 bg-orange-50 border border-orange-200 rounded-xl">
                        <h3 className="font-bold text-orange-800 mb-2">🔔 Pesanan Baru dari Customer</h3>
                        <div className="flex gap-2 overflow-x-auto pb-2">
                            {pendingOrders.map((order: any, idx: number) => (
                                <button 
                                    key={order.id}
                                    onClick={() => loadCustomerOrder(order, idx)}
                                    className="bg-white px-4 py-2 rounded-lg border border-orange-300 text-orange-700 font-bold hover:bg-orange-100 flex-shrink-0 shadow-sm"
                                >
                                    {order.id} - Rp {order.total.toLocaleString('id-ID')}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4">
                    {products.length === 0 ? (
                        <div className="col-span-full text-center text-gray-400 py-10">Belum ada produk aktif.</div>
                    ) : (
                        products.map((p) => (
                            <div
                                key={p.id}
                                onClick={() => addToCart(p)}
                                className="bg-white p-3 md:p-4 rounded-xl shadow-sm border border-gray-100 cursor-pointer hover:shadow-md hover:border-blue-300 transition-all relative overflow-hidden group flex flex-col h-full"
                            >
                                <div className="flex-1">
                                    <h3 className="font-semibold text-base md:text-lg leading-tight mb-1">{p.name}</h3>
                                    <p className="text-gray-400 text-xs md:text-sm">{p.category}</p>
                                </div>
                                <p className="text-blue-600 font-bold mt-3">Rp {p.price.toLocaleString("id-ID")}</p>
                                <div className="absolute top-2 right-2 text-2xl md:text-3xl opacity-10 group-hover:opacity-20 transition-opacity">{p.image_icon}</div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* RIGHT: CART */}
            <div className="w-full md:w-[320px] lg:w-[400px] h-[45vh] md:h-screen bg-white shadow-xl flex flex-col border-t-2 md:border-t-0 md:border-l border-gray-200 z-10 shrink-0">
                <div className="p-3 md:p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                    <h2 className="text-base md:text-lg font-bold flex items-center gap-2">
                        <ShoppingCart className="w-5 h-5" /> Current Order
                    </h2>
                    <button onClick={clearCart} className="text-red-500 hover:bg-red-50 p-2 rounded-full transition-colors">
                        <Trash2 className="w-5 h-5" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-3 md:p-4">
                    {cart.length === 0 ? (
                        <div className="text-center text-gray-400 mt-10 md:mt-20">Keranjang kosong</div>
                    ) : (
                        cart.map((item, idx) => (
                            <div key={idx} className="flex justify-between mb-3 md:mb-4 pb-2 border-b border-gray-50">
                                <div className="flex-1 pr-2">
                                    <p className="font-semibold text-sm md:text-base leading-tight">{item.product.name}</p>
                                    <p className="text-xs md:text-sm text-gray-500 mt-1">
                                        Rp {item.product.price.toLocaleString("id-ID")} x {item.qty}
                                    </p>
                                </div>
                                <p className="font-bold text-sm md:text-base whitespace-nowrap">
                                    Rp {(item.product.price * item.qty).toLocaleString("id-ID")}
                                </p>
                            </div>
                        ))
                    )}
                </div>

                <div className="p-4 md:p-6 bg-gray-50 border-t border-gray-200">
                    <div className="flex justify-between mb-3 md:mb-4">
                        <span className="text-gray-600 text-sm md:text-base">Subtotal</span>
                        <span className="font-bold text-lg md:text-xl text-blue-700">Rp {totalAmount.toLocaleString("id-ID")}</span>
                    </div>
                    
                    <button 
                        onClick={() => setShowPayment(true)}
                        disabled={cart.length === 0}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 md:py-4 rounded-xl font-bold text-base md:text-lg flex items-center justify-center gap-2 disabled:opacity-50 transition-colors shadow-sm"
                    >
                        <CreditCard className="w-5 h-5 md:w-6 md:h-6" /> Bayar
                    </button>
                </div>
            </div>

            {/* PAYMENT MODAL (Responsive) */}
            {showPayment && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
                    <div className="bg-white p-6 md:p-8 rounded-2xl w-full max-w-[500px] shadow-2xl overflow-y-auto max-h-[90vh]">
                        {!paymentResult ? (
                            <>
                                <h2 className="text-2xl font-bold mb-6 border-b pb-2">Pilih Pembayaran</h2>
                                <div className="text-center mb-6">
                                    <p className="text-gray-500">Total Tagihan</p>
                                    <p className="text-4xl font-bold text-blue-600">Rp {totalAmount.toLocaleString("id-ID")}</p>
                                </div>
                                
                                {paymentMethods.length > 0 ? (
                                    <div className="mb-6">
                                        <label className="block text-sm font-semibold mb-2">Metode Pembayaran</label>
                                        <div className="flex gap-2">
                                            {paymentMethods.map(m => (
                                                <button
                                                    key={m.id}
                                                    onClick={() => setSelectedMethod(m)}
                                                    className={`flex-1 py-2 rounded-lg border-2 font-bold ${selectedMethod?.id === m.id ? 'border-blue-600 bg-blue-50 text-blue-600' : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}
                                                >
                                                    {m.name}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="p-4 bg-red-50 text-red-600 rounded-lg mb-6 text-sm">
                                        ⚠️ Tidak ada Metode Pembayaran. Silakan tambahkan di Supabase.
                                    </div>
                                )}

                                {selectedMethod?.type?.toLowerCase() === 'cash' ? (
                                    <div className="mb-6">
                                        <label className="block text-sm font-semibold mb-2">Uang Diterima (Cash)</label>
                                        <input 
                                            type="number"
                                            value={amountReceived}
                                            onChange={(e) => setAmountReceived(e.target.value)}
                                            className="w-full border-2 border-gray-200 rounded-lg p-3 text-lg focus:border-blue-500 focus:outline-none"
                                            placeholder="Masukkan jumlah..."
                                        />
                                        {Number(amountReceived) >= totalAmount && (
                                            <div className="mt-2 text-green-600 font-bold">
                                                Kembalian: Rp {(Number(amountReceived) - totalAmount).toLocaleString("id-ID")}
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="mb-6 p-4 bg-gray-50 rounded-lg text-center text-sm text-gray-500">
                                        Akan membuka jendela pembayaran {selectedMethod?.name}...
                                    </div>
                                )}

                                <div className="flex gap-4">
                                    <button 
                                        onClick={() => setShowPayment(false)}
                                        className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200"
                                    >
                                        Batal
                                    </button>
                                    <button 
                                        onClick={handlePayment}
                                        disabled={loading || !selectedMethod || (selectedMethod?.type?.toLowerCase() === 'cash' && Number(amountReceived) < totalAmount)}
                                        className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 disabled:opacity-50"
                                    >
                                        {loading ? "Memproses..." : <><CreditCard className="w-5 h-5"/> Proses Pembayaran</>}
                                    </button>
                                </div>
                            </>
                        ) : (
                            <div className="text-center py-6">
                                <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                                </div>
                                <h2 className="text-2xl font-bold mb-2">Pembayaran Berhasil!</h2>
                                <p className="text-gray-500 mb-6">Status: {paymentResult.status} | Kembalian: Rp {paymentResult.change_given?.toLocaleString('id-ID')}</p>
                                <button 
                                    onClick={() => {
                                        setPaymentResult(null);
                                        setShowPayment(false);
                                    }}
                                    className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold"
                                >
                                    Tutup & Lanjut Kasir
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
