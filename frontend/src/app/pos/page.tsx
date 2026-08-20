"use client";

import { useState, useEffect } from "react";
import { ShoppingCart, CreditCard, Banknote, Trash2, Clock, Minus, Plus } from "lucide-react";
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
    const [storeSettings, setStoreSettings] = useState<any>(null);

    useEffect(() => {
        const loadSettings = async () => {
            const local = localStorage.getItem("nexpos_store_settings");
            if (local) setStoreSettings(JSON.parse(local));
            
            try {
                const { data } = await supabase.from('store_settings').select('*').limit(1).maybeSingle();
                if (data) {
                    setStoreSettings(data);
                    localStorage.setItem("nexpos_store_settings", JSON.stringify(data));
                }
            } catch(e) {}
        };
        loadSettings();

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

    const [allStaff, setAllStaff] = useState<any[]>([]);
    const [selectedStaffId, setSelectedStaffId] = useState<string>("");

    useEffect(() => {
        // Fetch staff list for the dropdown
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/staff`)
            .then(res => res.json())
            .then(data => {
                if(data && Array.isArray(data)) {
                    setAllStaff(data);
                }
            })
            .catch(console.error);
    }, []);

    const handleOpenSession = async () => {
        if (!openingCash) return;
        const activeStaffId = selectedStaffId || staff?.id;

        setLoading(true);
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/cash-sessions/open`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    staffId: activeStaffId,
                    terminalId: "TERM-01",
                    openingCash: Number(openingCash)
                })
            });
            if (res.ok) {
                const sess = await res.json();
                setSessionId(sess.id);
                // Also update the local 'staff' state so the header shows the selected person
                const selectedProfile = allStaff.find(s => s.id === activeStaffId);
                if (selectedProfile) setStaff(selectedProfile);
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

    const [activeQueueNumber, setActiveQueueNumber] = useState<string | null>(null);

    const loadCustomerOrder = (order: any, idx: number) => {
        setCart(order.items);
        setActiveQueueNumber(order.queue_number || null);
        
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

    const clearCart = () => {
        setCart([]);
        setActiveQueueNumber(null);
    };

    const updateCartQty = (productId: string, newQty: number) => {
        if (newQty < 1) return;
        setCart(prev => prev.map(p => p.product.id === productId ? { ...p, qty: newQty } : p));
    };

    const removeFromCart = (productId: string) => {
        setCart(prev => prev.filter(p => p.product.id !== productId));
    };

    const totalAmount = cart.reduce((sum, item) => sum + item.product.price * item.qty, 0);

    const handlePayment = async () => {
        if (!selectedMethod) {
            alert("Belum ada Metode Pembayaran di Database. Silakan tambahkan via database/admin terlebih dahulu.");
            return;
        }
        
        setLoading(true);
        try {
            const orderRef = activeQueueNumber ? `Q${activeQueueNumber}-${Date.now()}` : `ORD-${Date.now()}`;
            const payload = {
                order_reference: orderRef,
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
        return <div className="flex min-h-screen bg-[#121214] text-gray-400 items-center justify-center p-4">Memuat data shift kasir...</div>;
    }

    if (!hasSession) {
        return (
            <div className="flex min-h-screen bg-[#121214] items-center justify-center p-4">
                <div className="bg-[#1a1a1c] p-8 rounded-2xl w-full max-w-[400px] shadow-2xl border border-gray-800 text-center">
                    <Banknote className="w-12 h-12 text-blue-500 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold mb-2 text-white">Buka Shift Kasir</h2>
                    <p className="text-gray-400 mb-6 text-sm">Pilih nama kasir dan masukkan modal uang fisik awal (Opening Cash).</p>
                    
                    <div className="text-left mb-4">
                        <label className="block text-sm font-bold text-gray-300 mb-2">Kasir Bertugas</label>
                        <select 
                            value={selectedStaffId || staff?.id || ""} 
                            onChange={(e) => setSelectedStaffId(e.target.value)}
                            className="w-full bg-[#121214] border border-gray-800 rounded-xl p-3 text-white focus:border-blue-500 outline-none font-bold"
                        >
                            {allStaff.length === 0 && <option value={staff?.id}>{staff?.full_name}</option>}
                            {allStaff.map(s => (
                                <option key={s.id} value={s.id}>{s.full_name} ({s.role})</option>
                            ))}
                        </select>
                    </div>

                    <div className="text-left mb-6">
                        <label className="block text-sm font-bold text-gray-300 mb-2">Modal Awal (Cash)</label>
                        <input 
                            type="number"
                            value={openingCash}
                            onChange={(e) => setOpeningCash(e.target.value)}
                            className="w-full bg-[#121214] border border-gray-800 rounded-xl p-4 text-xl text-white focus:border-blue-500 outline-none transition-colors font-bold"
                            placeholder="Rp 0"
                        />
                    </div>
                    
                    <button 
                        onClick={handleOpenSession}
                        disabled={loading}
                        className="w-full bg-blue-600 text-white font-bold py-4 rounded-xl hover:bg-blue-500 transition-colors disabled:opacity-50"
                    >
                        {loading ? 'Membuka...' : 'Buka Shift Sekarang'}
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col md:flex-row h-screen bg-[#121214] text-gray-100 overflow-hidden">
            {/* LEFT: PRODUCTS LIST */}
            <div className="flex-1 flex flex-col overflow-y-auto">
                <div className="p-6 border-b border-gray-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-[#1a1a1c]">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white text-xl font-black">N</div>
                        <div>
                            <h1 className="text-xl font-bold text-white leading-tight">NexPos Terminal</h1>
                            <span className="text-gray-500 text-xs flex items-center gap-1"><Clock className="w-3 h-3" /> {new Date().toLocaleTimeString()}</span>
                        </div>
                    </div>
                    
                    {/* Staff Profile in POS Header */}
                    <div className="bg-[#121214] border border-gray-800 p-2 pr-4 rounded-full font-semibold flex items-center gap-3 text-sm shadow-sm">
                        <div className="w-8 h-8 bg-gray-800 rounded-full flex items-center justify-center text-blue-400">
                            <Banknote className="w-4 h-4" />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-white text-xs leading-tight">Kasir</span>
                            <span className="text-gray-400 text-xs">{staff?.full_name}</span>
                        </div>
                        <button onClick={handleCloseSession} className="ml-3 px-3 py-1 bg-red-500/10 text-red-400 rounded-full hover:bg-red-500/20 font-bold text-[10px] uppercase tracking-wider border border-red-500/20 transition-colors">
                            Tutup Shift
                        </button>
                    </div>
                </div>

                <div className="p-6 flex-1 overflow-y-auto">
                    {/* INCOMING ORDERS NOTIFICATION */}
                    {pendingOrders.length > 0 && (
                        <div className="mb-6 p-4 bg-orange-500/10 border border-orange-500/20 rounded-2xl shadow-lg">
                            <h3 className="font-bold text-orange-400 mb-3 flex items-center gap-2">🔔 Pesanan Baru dari Customer</h3>
                            <div className="flex gap-3 overflow-x-auto pb-2 hide-scrollbar">
                                {pendingOrders.map((order: any, idx: number) => (
                                    <button 
                                        key={order.id}
                                        onClick={() => loadCustomerOrder(order, idx)}
                                        className="bg-[#1a1a1c] px-4 py-3 rounded-xl border border-orange-500/20 text-white font-bold hover:bg-gray-800 flex-shrink-0 shadow-sm transition-colors text-left flex flex-col min-w-[150px]"
                                    >
                                        <span className="text-orange-400 text-xs mb-1">{order.queue_number || order.id}</span>
                                        <span>Rp {order.total.toLocaleString('id-ID')}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-5">
                        {products.length === 0 ? (
                            <div className="col-span-full text-center text-gray-500 py-10 bg-[#1a1a1c] rounded-2xl border border-gray-800">Belum ada produk aktif.</div>
                        ) : (
                            products.map((p) => (
                                <div
                                    key={p.id}
                                    onClick={() => addToCart(p)}
                                    className="bg-[#1a1a1c] p-4 rounded-2xl border border-gray-800 cursor-pointer hover:border-blue-500/50 hover:bg-gray-800/50 transition-all relative overflow-hidden group flex flex-col h-full shadow-lg"
                                >
                                    <div className="flex-1">
                                        <h3 className="font-bold text-base md:text-lg leading-tight mb-1 text-white">{p.name}</h3>
                                        <p className="text-gray-500 text-xs md:text-sm">{p.category}</p>
                                    </div>
                                    <p className="text-blue-400 font-bold mt-4 text-lg">Rp {p.price.toLocaleString("id-ID")}</p>
                                    <div className="absolute -bottom-2 -right-2 text-6xl opacity-5 group-hover:opacity-10 group-hover:scale-110 transition-all">{p.image_icon}</div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* RIGHT: CART */}
            <div className="w-full md:w-[320px] lg:w-[400px] h-[45vh] md:h-screen bg-[#1a1a1c] shadow-2xl flex flex-col border-t-2 md:border-t-0 md:border-l border-gray-800 z-10 shrink-0">
                <div className="p-5 border-b border-gray-800 flex justify-between items-center bg-[#1a1a1c]">
                    <h2 className="text-lg font-bold flex items-center gap-2 text-white">
                        <ShoppingCart className="w-5 h-5 text-blue-500" /> Current Order
                    </h2>
                    <button onClick={clearCart} className="text-red-400 hover:bg-red-500/10 p-2 rounded-lg transition-colors border border-transparent hover:border-red-500/20">
                        <Trash2 className="w-5 h-5" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-5">
                    {cart.length === 0 ? (
                        <div className="text-center text-gray-500 mt-20 flex flex-col items-center justify-center">
                            <ShoppingCart className="w-12 h-12 mb-4 opacity-20" />
                            <p>Keranjang kosong</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {cart.map((item, idx) => (
                                <div key={idx} className="flex flex-col gap-3 pb-4 border-b border-gray-800/50">
                                    <div className="flex justify-between items-start">
                                        <div className="flex-1 pr-3">
                                            <p className="font-bold text-sm md:text-base leading-tight text-white mb-1">{item.product.name}</p>
                                            <p className="text-blue-400 font-bold text-xs md:text-sm">
                                                Rp {item.product.price.toLocaleString("id-ID")}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-bold text-sm md:text-base whitespace-nowrap text-white mb-2">
                                                Rp {(item.product.price * item.qty).toLocaleString("id-ID")}
                                            </p>
                                            <button onClick={() => removeFromCart(item.product.id)} className="text-red-400 hover:text-red-300 p-1.5 bg-red-500/10 hover:bg-red-500/20 rounded-lg transition-colors inline-flex">
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button 
                                            onClick={() => updateCartQty(item.product.id, item.qty - 1)}
                                            disabled={item.qty <= 1}
                                            className="w-8 h-8 flex items-center justify-center bg-gray-800 hover:bg-gray-700 disabled:opacity-50 text-white rounded-lg transition-colors border border-gray-700"
                                        >
                                            <Minus className="w-4 h-4" />
                                        </button>
                                        <input 
                                            type="number" 
                                            value={item.qty}
                                            onChange={(e) => updateCartQty(item.product.id, parseInt(e.target.value) || 1)}
                                            className="w-12 h-8 bg-[#121214] text-center font-bold text-sm text-white border border-gray-800 rounded-lg outline-none focus:border-blue-500"
                                        />
                                        <button 
                                            onClick={() => updateCartQty(item.product.id, item.qty + 1)}
                                            className="w-8 h-8 flex items-center justify-center bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors border border-gray-700"
                                        >
                                            <Plus className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="p-6 bg-[#121214] border-t border-gray-800">
                    <div className="flex justify-between mb-4">
                        <span className="text-gray-400 text-sm md:text-base">Subtotal</span>
                        <span className="font-bold text-xl md:text-2xl text-blue-400">Rp {totalAmount.toLocaleString("id-ID")}</span>
                    </div>
                    
                    <button 
                        onClick={() => setShowPayment(true)}
                        disabled={cart.length === 0}
                        className="w-full bg-blue-600 hover:bg-blue-500 text-white py-4 rounded-xl font-bold text-base md:text-lg flex items-center justify-center gap-2 disabled:opacity-50 transition-colors shadow-lg shadow-blue-900/20"
                    >
                        <CreditCard className="w-5 h-5" /> Lanjut Pembayaran
                    </button>
                </div>
            </div>

            {/* PAYMENT MODAL */}
            {showPayment && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 backdrop-blur-md">
                    <div className="bg-[#1a1a1c] border border-gray-800 p-6 md:p-8 rounded-3xl w-full max-w-[500px] shadow-2xl overflow-y-auto max-h-[90vh]">
                        {!paymentResult ? (
                            <>
                                <h2 className="text-2xl font-bold mb-6 border-b border-gray-800 pb-4 text-white">Pilih Pembayaran</h2>
                                <div className="text-center mb-8 p-6 bg-[#121214] rounded-2xl border border-gray-800">
                                    <p className="text-gray-400 mb-2">Total Tagihan</p>
                                    <p className="text-5xl font-black text-blue-400">Rp {totalAmount.toLocaleString("id-ID")}</p>
                                </div>
                                
                                {paymentMethods.length > 0 ? (
                                    <div className="mb-6">
                                        <label className="block text-sm font-bold mb-3 text-gray-300">Metode Pembayaran</label>
                                        <div className="grid grid-cols-2 gap-3">
                                            {paymentMethods.map(m => (
                                                <button
                                                    key={m.id}
                                                    onClick={() => setSelectedMethod(m)}
                                                    className={`py-3 px-4 rounded-xl border-2 font-bold transition-all ${selectedMethod?.id === m.id ? 'border-blue-500 bg-blue-500/10 text-blue-400 shadow-lg shadow-blue-900/20' : 'border-gray-800 text-gray-400 hover:border-gray-700 hover:bg-gray-800/50'}`}
                                                >
                                                    {m.name}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl mb-6 text-sm">
                                        ⚠️ Tidak ada Metode Pembayaran. Silakan tambahkan di Admin.
                                    </div>
                                )}

                                {selectedMethod?.type?.toLowerCase() === 'cash' ? (
                                    <div className="mb-8">
                                        <label className="block text-sm font-bold mb-3 text-gray-300">Uang Diterima (Cash)</label>
                                        <input 
                                            type="number"
                                            value={amountReceived}
                                            onChange={(e) => setAmountReceived(e.target.value)}
                                            className="w-full bg-[#121214] border border-gray-800 rounded-xl p-4 text-xl text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none font-bold"
                                            placeholder="Masukkan jumlah..."
                                        />
                                        {Number(amountReceived) >= totalAmount && (
                                            <div className="mt-3 p-3 bg-green-500/10 border border-green-500/20 rounded-lg text-green-400 font-bold text-center">
                                                Kembalian: Rp {(Number(amountReceived) - totalAmount).toLocaleString("id-ID")}
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="mb-8 p-6 bg-gray-800/30 border border-gray-800 rounded-xl text-center text-gray-400">
                                        Sistem akan membuka jendela pembayaran pihak ketiga untuk {selectedMethod?.name}...
                                    </div>
                                )}

                                <div className="flex gap-4">
                                    <button 
                                        onClick={() => setShowPayment(false)}
                                        className="flex-1 py-4 bg-gray-800 text-gray-300 rounded-xl font-bold hover:bg-gray-700 transition-colors"
                                    >
                                        Batal
                                    </button>
                                    <button 
                                        onClick={handlePayment}
                                        disabled={loading || !selectedMethod || (selectedMethod?.type?.toLowerCase() === 'cash' && Number(amountReceived) < totalAmount)}
                                        className="flex-1 py-4 bg-blue-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 disabled:opacity-50 hover:bg-blue-500 transition-colors"
                                    >
                                        {loading ? "Memproses..." : <><CreditCard className="w-5 h-5"/> Proses</>}
                                    </button>
                                </div>
                            </>
                        ) : (
                            <div className="text-center py-8">
                                <div className="w-20 h-20 bg-green-500/10 border border-green-500/20 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
                                    <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
                                </div>
                                <h2 className="text-3xl font-black mb-3 text-white">Pembayaran Sukses!</h2>
                                <div className="flex gap-4">
                                    <button 
                                        onClick={() => {
                                            setTimeout(() => window.print(), 100);
                                        }}
                                        className="w-full bg-gray-800 hover:bg-gray-700 text-white py-4 rounded-xl font-bold text-lg transition-colors flex items-center justify-center gap-2"
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"></path></svg>
                                        Cetak Struk
                                    </button>
                                    <button 
                                        onClick={() => {
                                            setPaymentResult(null);
                                            setShowPayment(false);
                                        }}
                                        className="w-full bg-blue-600 hover:bg-blue-500 text-white py-4 rounded-xl font-bold text-lg transition-colors"
                                    >
                                        Selesai & Lanjut
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* HIDDEN RECEIPT FOR PRINTING */}
            {paymentResult && (
                <div className="hidden print:block fixed inset-0 bg-white text-black z-[9999] p-4 text-sm font-mono leading-tight">
                    <div className="max-w-[80mm] mx-auto text-center border-b border-dashed border-black pb-4 mb-4">
                        {storeSettings?.logo_base64 && (
                            <img src={storeSettings.logo_base64} alt="Logo" className="w-20 h-20 object-contain mx-auto mb-2 grayscale" />
                        )}
                        <h1 className="text-xl font-bold uppercase">{storeSettings?.cafe_name || 'NexPos Cafe'}</h1>
                        <p className="mt-1">Kasir: {staff?.full_name || 'Staff'}</p>
                        <p>{new Date().toLocaleString('id-ID')}</p>
                    </div>

                    <div className="max-w-[80mm] mx-auto">
                        <table className="w-full text-left mb-4">
                            <tbody>
                                {paymentResult.transaction?.items?.map((item: any, idx: number) => (
                                    <tr key={idx}>
                                        <td className="py-1">{item.product_name}<br/><span className="text-xs">{item.quantity} x Rp {item.price.toLocaleString('id-ID')}</span></td>
                                        <td className="text-right align-bottom py-1">Rp {(item.quantity * item.price).toLocaleString('id-ID')}</td>
                                    </tr>
                                )) || paymentResult.items?.map((item: any, idx: number) => (
                                    // Fallback if structure varies
                                    <tr key={idx}>
                                        <td className="py-1">{item.product_name}<br/><span className="text-xs">{item.quantity} x Rp {item.price.toLocaleString('id-ID')}</span></td>
                                        <td className="text-right align-bottom py-1">Rp {(item.quantity * item.price).toLocaleString('id-ID')}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="max-w-[80mm] mx-auto border-t border-dashed border-black pt-2 mb-4">
                        <div className="flex justify-between font-bold text-base mb-1">
                            <span>TOTAL</span>
                            <span>Rp {paymentResult.transaction?.amount_due?.toLocaleString('id-ID') || paymentResult.amount_due?.toLocaleString('id-ID')}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span>TUNAI</span>
                            <span>Rp {paymentResult.transaction?.amount_received?.toLocaleString('id-ID') || paymentResult.amount_received?.toLocaleString('id-ID')}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span>KEMBALI</span>
                            <span>Rp {paymentResult.change_given?.toLocaleString('id-ID') || 0}</span>
                        </div>
                    </div>

                    <div className="max-w-[80mm] mx-auto text-center border-t border-dashed border-black pt-4">
                        <p className="mb-2 font-bold whitespace-pre-wrap">{storeSettings?.receipt_footer || 'Terima kasih atas kunjungan Anda!'}</p>
                        {storeSettings?.wifi_password && (
                            <p className="border border-black p-2 mt-2 font-bold">WiFi: {storeSettings.wifi_password}</p>
                        )}
                        <p className="mt-4 text-xs">Powered by NexPos</p>
                    </div>
                </div>
            )}
        </div>
    );
}
