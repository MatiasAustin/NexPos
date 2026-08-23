"use client";

import { useState, useEffect } from "react";
import { ShoppingCart, CreditCard, Banknote, Trash2, Clock, Minus, Plus, LayoutGrid, List, Maximize } from "lucide-react";
import { processPayment, getPaymentMethods, getActiveProducts } from "@/lib/api";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/components/Toast";
import { useConfirm } from "@/components/ConfirmModal";
import { LoadingSpinner } from "@/components/Loading";

export default function PosPage() {
    const [hasSession, setHasSession] = useState(false);
    const [openingCash, setOpeningCash] = useState<string>("");
    const [products, setProducts] = useState<any[]>([]);
    const [activeCategory, setActiveCategory] = useState("Semua");
    const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
    
    const [cart, setCart] = useState<{ product: any; qty: number }[]>([]);
    const [showPayment, setShowPayment] = useState(false);
    const [amountReceived, setAmountReceived] = useState<string>("");
    const [customerName, setCustomerName] = useState<string>("");
    const [paymentResult, setPaymentResult] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    
    // New States
    const [paymentMethods, setPaymentMethods] = useState<any[]>([]);
    const [selectedMethod, setSelectedMethod] = useState<any>(null);
    const [pendingOrders, setPendingOrders] = useState<any[]>([]);
    
    // Expenses & Raw Materials State
    const [showExpensesModal, setShowExpensesModal] = useState(false);
    const [expenses, setExpenses] = useState<any[]>([]);
    const [rawMaterials, setRawMaterials] = useState<any[]>([]);
    const [newExpense, setNewExpense] = useState({ description: '', amount: 0, material_id: '', quantity: 0 });
    const [newMaterial, setNewMaterial] = useState({ name: '', unit: '', current_stock: 0, last_price_per_unit: 0 });
    const [editingMaterial, setEditingMaterial] = useState<any>(null);
    
    // Auth State
    const [staff, setStaff] = useState<any>(null);
    const router = useRouter();
    const toast = useToast();
    const { confirm, ConfirmDialog } = useConfirm();

    const toggleFullscreen = () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(() => {});
        } else {
            if (document.exitFullscreen) document.exitFullscreen();
        }
    };

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

    const handleUsePreviousCash = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('cash_sessions')
                .select('actual_cash, expected_cash')
                .eq('status', 'closed')
                .order('closed_at', { ascending: false })
                .limit(1)
                .single();
            if (data) {
                const cashToUse = data.actual_cash !== null ? data.actual_cash : data.expected_cash;
                setOpeningCash(cashToUse.toString());
                toast.success(`Menggunakan saldo uang fisik kasir terakhir: Rp ${Number(cashToUse).toLocaleString('id-ID')}`);
            } else {
                toast.info("Tidak ada riwayat shift sebelumnya.");
            }
        } catch (e: any) {
            toast.error("Gagal mengambil riwayat shift.");
        }
        setLoading(false);
    };

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
                toast.error("Gagal membuka shift kasir.");
            }
        } catch (error) {
            console.error("Error opening session:", error);
        }
        setLoading(false);
    };

    const handleCloseSession = async () => {
        const isConfirmed = await confirm({
            title: "Tutup Shift",
            message: "Yakin ingin menutup shift sekarang? Uang laci harus dihitung.",
            variant: "warning",
            confirmText: "Tutup Shift"
        });
        if (!isConfirmed) return;

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
                toast.success("Shift berhasil ditutup.");
                setHasSession(false);
                setSessionId(null);
                setOpeningCash("");
            } else {
                const err = await res.json();
                toast.error(`Gagal menutup shift: ${err.error}`);
            }
        } catch (error) {
            console.error(error);
        }
        setLoading(false);
    };

    useEffect(() => {
        if (hasSession && staff) {
            // Fetch directly from Supabase to ensure real-time accuracy and bypass API cache
            supabase.from('payment_methods').select('*').eq('is_active', true).order('created_at', { ascending: true })
                .then(({ data }) => {
                    const methods = data || [];
                    const uniqueMethods = methods.reduce((acc: any[], current: any) => {
                        const x = acc.find(item => item.name === current.name);
                        if (!x) return acc.concat([current]);
                        return acc;
                    }, []);
                    setPaymentMethods(uniqueMethods);
                    if (uniqueMethods.length > 0) setSelectedMethod(uniqueMethods[0]);
                });
            
            getActiveProducts().then(prods => setProducts(prods));
            
            // Listen for localStorage changes for incoming customer orders
            const checkOrders = async () => {
                try {
                    const { data, error } = await supabase.from('kiosk_orders')
                        .select('*')
                        .in('status', ['pending', 'draft', 'waiting_payment'])
                        .order('created_at', { ascending: false });
                    if (data) setPendingOrders(data);
                } catch(e) {}
            };
            checkOrders();
            const interval = setInterval(checkOrders, 3000);
            return () => clearInterval(interval);
        }
    }, [hasSession]);

    const [activeQueueNumber, setActiveQueueNumber] = useState<string | null>(null);

    const loadCustomerOrder = async (order: any, idx: number) => {
        if (cart.length > 0) {
            // Save current cart as draft
            const currentSubTotal = cart.reduce((sum, item) => sum + item.product.price * item.qty, 0);
            const currentTaxRate = storeSettings?.tax_enabled ? Number(storeSettings?.tax_rate || 0) : 0;
            const currentTaxAmount = (currentSubTotal * currentTaxRate) / 100;
            
            const draftOrder = {
                queue_number: activeQueueNumber || `Draft-${Date.now().toString().slice(-4)}`,
                customer_name: customerName,
                items: cart,
                total: currentSubTotal + currentTaxAmount,
                status: 'draft'
            };
            
            // Upsert the current draft
            const existingPending = pendingOrders.find((o: any) => o.queue_number === draftOrder.queue_number);
            if (existingPending && existingPending.id) {
                await supabase.from('kiosk_orders').update(draftOrder).eq('id', existingPending.id);
            } else {
                await supabase.from('kiosk_orders').insert([draftOrder]);
            }
            toast.info("Pesanan sebelumnya disimpan sebagai Draft");
        }

        setCart(order.items);
        setActiveQueueNumber(order.queue_number || null);
        setCustomerName(order.customer_name || "");
    };

    const handleSaveDraft = async () => {
        if (cart.length === 0) return;
        
        let orderRef = activeQueueNumber;
        if (!orderRef || orderRef.startsWith('Draft')) {
            const today = new Date().toISOString().split('T')[0];
            const counterData = JSON.parse(localStorage.getItem("nexpos_queue_counter") || "{}");
            let nextNumber = 1;
            if (counterData.date === today) {
                nextNumber = (counterData.count || 0) + 1;
            }
            localStorage.setItem("nexpos_queue_counter", JSON.stringify({ date: today, count: nextNumber }));
            orderRef = nextNumber.toString().padStart(3, '0');
        }
        
        const currentSubTotal = cart.reduce((sum, item) => sum + item.product.price * item.qty, 0);
        const currentTaxRate = storeSettings?.tax_enabled ? Number(storeSettings?.tax_rate || 0) : 0;
        const currentTaxAmount = (currentSubTotal * currentTaxRate) / 100;

        const draftOrder = {
            queue_number: orderRef,
            customer_name: customerName,
            items: cart,
            total: currentSubTotal + currentTaxAmount,
            status: 'draft'
        };
        
        const existingPending = pendingOrders.find((o: any) => o.queue_number === orderRef);
        if (existingPending && existingPending.id) {
            await supabase.from('kiosk_orders').update(draftOrder).eq('id', existingPending.id);
        } else {
            await supabase.from('kiosk_orders').insert([draftOrder]);
        }
        
        toast.success("Pesanan disimpan");
        clearCart();
    };

    const fetchExpensesAndMaterials = async () => {
        try {
            const [expRes, matRes] = await Promise.all([
                supabase.from('expenses').select('*').order('created_at', { ascending: false }),
                supabase.from('raw_materials').select('*').order('name', { ascending: true })
            ]);
            setExpenses(expRes.data || []);
            setRawMaterials(matRes.data || []);
        } catch (e) { console.error("Error fetching data", e); }
    };

    useEffect(() => {
        if (showExpensesModal) {
            fetchExpensesAndMaterials();
        }
    }, [showExpensesModal]);

    const handleCreateExpense = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const { data: expData, error } = await supabase.from('expenses').insert([{
                description: newExpense.description,
                amount: Number(newExpense.amount),
                recorded_by: staff?.id,
                staff_name: staff?.full_name
            }]).select();
            if (error) throw error;
            
            // Handle Material Stock Update if selected
            if (newExpense.material_id && newExpense.quantity > 0) {
                const material = rawMaterials.find(m => m.id === newExpense.material_id);
                if (material) {
                    const newStock = material.current_stock + Number(newExpense.quantity);
                    const unitPrice = Number(newExpense.amount) / Number(newExpense.quantity);
                    // Update material
                    const { error: matError } = await supabase.from('raw_materials')
                        .update({ current_stock: newStock, updated_by_name: staff?.full_name, last_price_per_unit: unitPrice })
                        .eq('id', newExpense.material_id);
                    if (matError) throw matError;
                    
                    // Log stock change
                    await supabase.from('material_stock_logs').insert([{
                        material_id: material.id,
                        material_name: material.name,
                        delta: Number(newExpense.quantity),
                        current_stock: newStock,
                        price: Number(newExpense.amount) / Number(newExpense.quantity),
                        staff_name: staff?.full_name,
                        note: `Dari Pengeluaran: ${newExpense.description}`
                    }]);
                }
            }

            toast.success("Pengeluaran berhasil dicatat.");
            setNewExpense({ description: '', amount: 0, material_id: '', quantity: 0 });
            fetchExpensesAndMaterials();
        } catch (e: any) { toast.error(e.message); }
        setLoading(false);
    };

    const handleUpdateExpense = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const { error } = await supabase.from('expenses')
                .update({ description: editingExpense.description, amount: Number(editingExpense.amount) })
                .eq('id', editingExpense.id);
            if (error) throw error;
            toast.success("Pengeluaran diperbarui.");
            setEditingExpense(null);
            fetchExpensesAndMaterials();
        } catch (e: any) { toast.error(e.message); }
        setLoading(false);
    };

    const handleDeleteExpense = async (id: string) => {
        const ok = await confirm({ title: "Hapus Pengeluaran", message: "Hapus data pengeluaran ini secara permanen?", confirmText: "Hapus", variant: "danger" });
        if (!ok) return;
        try {
            const { error } = await supabase.from('expenses').delete().eq('id', id);
            if (error) throw error;
            toast.success("Pengeluaran dihapus.");
            fetchExpensesAndMaterials();
        } catch (e: any) { toast.error(e.message); }
    };

    // Permission: can the current staff edit/delete a record?
    const canEditRecord = (recordStaffName: string | null) => {
        if (!staff) return false;
        if (staff.role === 'owner') return true;
        if (!recordStaffName) return staff.role === 'owner'; // owner-created records, only owner can edit
        return staff.full_name === recordStaffName;
    };

    // material mode: 'add' = tambah bahan baru, 'update' = update stok bahan yg ada
    const [materialMode, setMaterialMode] = useState<'add' | 'update'>('add');
    const [selectedMaterial, setSelectedMaterial] = useState<any>(null);
    const [stockAdjustment, setStockAdjustment] = useState<{ delta: number; note: string; price: number }>({ delta: 0, note: '', price: 0 });
    const [editingExpense, setEditingExpense] = useState<any>(null);

    const handleAdjustStock = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedMaterial) return;
        setLoading(true);
        const newStock = selectedMaterial.current_stock + Number(stockAdjustment.delta);
        if (newStock < 0) { toast.error("Stok tidak boleh negatif!"); setLoading(false); return; }
        try {
            const updatePayload: any = {
                current_stock: newStock,
                updated_by_name: staff?.full_name
            };
            if (stockAdjustment.price > 0) updatePayload.last_price_per_unit = Number(stockAdjustment.price);
            
            // 1. Update raw_materials
            const { error } = await supabase.from('raw_materials').update(updatePayload).eq('id', selectedMaterial.id);
            if (error) throw error;
            
            // 2. Insert into material_stock_logs
            await supabase.from('material_stock_logs').insert([{
                material_id: selectedMaterial.id,
                material_name: selectedMaterial.name,
                delta: Number(stockAdjustment.delta),
                current_stock: newStock,
                price: Number(stockAdjustment.price) || null,
                staff_name: staff?.full_name,
                note: stockAdjustment.note
            }]);

            const action = stockAdjustment.delta >= 0 ? `+${stockAdjustment.delta}` : `${stockAdjustment.delta}`;
            toast.success(`Stok ${selectedMaterial.name} diupdate (${action} ${selectedMaterial.unit}).`);
            setSelectedMaterial(null);
            setStockAdjustment({ delta: 0, note: '', price: 0 });
            fetchExpensesAndMaterials();
        } catch (e: any) { toast.error(e.message); }
        setLoading(false);
    };

    const handleCreateMaterial = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const { error } = await supabase.from('raw_materials').insert([{
                name: newMaterial.name,
                unit: newMaterial.unit,
                current_stock: Number(newMaterial.current_stock),
                last_price_per_unit: Number(newMaterial.last_price_per_unit),
                updated_by_name: staff?.full_name
            }]);
            if (error) throw error;
            toast.success("Bahan Baku berhasil ditambahkan.");
            setNewMaterial({ name: '', unit: '', current_stock: 0, last_price_per_unit: 0 });
            fetchExpensesAndMaterials();
        } catch (e: any) { toast.error(e.message); }
        setLoading(false);
    };

    const handleDeleteMaterial = async (id: string) => {
        const ok = await confirm({ title: "Hapus Bahan", message: "Hapus bahan baku ini secara permanen?", confirmText: "Hapus", variant: "danger" });
        if (!ok) return;
        try {
            const { error } = await supabase.from('raw_materials').delete().eq('id', id);
            if (error) throw error;
            toast.success("Bahan Baku dihapus.");
            fetchExpensesAndMaterials();
        } catch (e: any) { toast.error(e.message); }
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
        setCustomerName("");
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

    const handlePayment = async () => {
        if (!selectedMethod) {
            toast.warning("Belum ada Metode Pembayaran di Database. Silakan tambahkan via database/admin terlebih dahulu.");
            return;
        }
        
        setLoading(true);
        try {
            const orderRef = activeQueueNumber ? `Q${activeQueueNumber}-${Date.now()}` : `ORD-${Date.now()}`;
            const payload = {
                order_reference: orderRef,
                amount_due: grandTotal,
                amount_received: Number(amountReceived) || grandTotal, // For non-cash, amount received = amount due
                tax_amount: taxAmount,
                customer_name: customerName,
                payment_method_id: selectedMethod.id,
                items: cart.map(item => ({
                    product_id: item.product.id,
                    product_name: item.product.name,
                    quantity: item.qty,
                    price: item.product.price,
                    cogs: item.product.cogs || 0
                })),
                staff_name: staff?.full_name || 'System'
            };
            
            const result = await processPayment(payload);
            setPaymentResult({
                ...result,
                payment_method_name: selectedMethod.name,
                transaction: {
                    ...result,
                    items: payload.items.map((i: any) => ({
                        product_name: i.product_name,
                        quantity: i.quantity,
                        price: i.price
                    }))
                }
            });
            if (result.status === "Paid" || result.status === "Pending") {
                clearCart();
                // Update Supabase kiosk_orders to paid
                if (activeQueueNumber) {
                    const existingPending = pendingOrders.find((o: any) => o.queue_number === activeQueueNumber);
                    if (existingPending && existingPending.id) {
                        await supabase.from('kiosk_orders').update({ status: 'paid' }).eq('id', existingPending.id);
                    }
                }
                
                // Update local state
                const newPending = pendingOrders.filter((o: any) => o.queue_number !== activeQueueNumber);
                setPendingOrders(newPending);

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
                                amount: grandTotal
                            })
                        });
                    } catch(err) {
                        console.error("Gagal mencatat mutasi kasir:", err);
                    }
                }
            }
        } catch (error: any) {
            toast.error(error.response?.data?.error || "Payment Failed");
        }
        setLoading(false);
    };

    if (isCheckingSession) {
        return <div className="flex min-h-screen bg-[#121214] text-gray-400 items-center justify-center p-4"><LoadingSpinner size="lg" text="Memuat data shift kasir..." /></div>;
    }

    if (!hasSession) {
        return (
            <div className="flex min-h-screen bg-[#121214] items-center justify-center p-4">
                <ConfirmDialog />
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
                        <div className="flex justify-between items-center mb-2">
                            <label className="block text-sm font-bold text-gray-300">Modal Awal (Cash)</label>
                            <button 
                                onClick={handleUsePreviousCash}
                                type="button"
                                className="text-[10px] bg-gray-800 hover:bg-gray-700 text-gray-300 px-2 py-1 rounded border border-gray-700"
                            >
                                Gunakan Saldo Kasir Terakhir
                            </button>
                        </div>
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

    // Sync categories from storeSettings or fallback to derived ones
    const dynamicCategories = storeSettings?.categories && storeSettings.categories.length > 0
        ? storeSettings.categories
        : Array.from(new Set(products.map(p => p.category || "Uncategorized")));
    const categories = ["Semua", ...dynamicCategories];
    const filteredProducts = activeCategory === "Semua" ? products : products.filter(p => (p.category || "Uncategorized") === activeCategory);

    return (
        <div className="flex flex-col sm:flex-row h-screen bg-[#121214] text-gray-100 overflow-hidden print:block print:h-auto print:overflow-visible print:bg-white text-sm md:text-base">
            <div className="print:hidden"><ConfirmDialog /></div>
            {/* LEFT: PRODUCTS LIST */}
            <div className="flex-1 flex flex-col overflow-y-auto print:hidden">
                <div className="p-6 border-b border-gray-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-[#1a1a1c]">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white text-xl font-black">N</div>
                        <div>
                            <h1 className="text-xl font-bold text-white leading-tight">NexPos Terminal</h1>
                            <span className="text-gray-500 text-xs flex items-center gap-1"><Clock className="w-3 h-3" /> {new Date().toLocaleTimeString()}</span>
                        </div>
                        <button onClick={toggleFullscreen} className="ml-2 p-2 bg-gray-800 hover:bg-gray-700 rounded-xl transition-colors text-gray-300" title="Toggle Fullscreen">
                            <Maximize className="w-4 h-4" />
                        </button>
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
                        <button onClick={() => setShowExpensesModal(true)} className="ml-3 px-3 py-1 bg-orange-500/10 text-orange-400 rounded-full hover:bg-orange-500/20 font-bold text-[10px] uppercase tracking-wider border border-orange-500/20 transition-colors">
                            Catat Pengeluaran
                        </button>
                        <button onClick={handleCloseSession} className="px-3 py-1 bg-red-500/10 text-red-400 rounded-full hover:bg-red-500/20 font-bold text-[10px] uppercase tracking-wider border border-red-500/20 transition-colors">
                            Tutup Shift
                        </button>
                    </div>
                </div>

                <div className="p-6 flex-1 overflow-y-auto no-scrollbar">
                    {/* INCOMING ORDERS NOTIFICATION */}
                    {pendingOrders.filter(o => o.status === 'pending').length > 0 && (
                        <div className="mb-6 p-4 bg-orange-500/10 border border-orange-500/20 rounded-2xl shadow-lg">
                            <h3 className="font-bold text-orange-400 mb-3 flex items-center gap-2">🛒 Pesanan Baru dari Customer</h3>
                            <div className="flex gap-3 overflow-x-auto pb-2 hide-scrollbar">
                                {pendingOrders.map((order: any, idx: number) => order.status === 'pending' && (
                                    <button 
                                        key={order.id}
                                        onClick={() => loadCustomerOrder(order, idx)}
                                        className="bg-[#1a1a1c] px-4 py-3 rounded-xl border border-orange-500/20 text-white font-bold hover:bg-gray-800 flex-shrink-0 shadow-sm transition-colors text-left flex flex-col min-w-[150px]"
                                    >
                                        <span className="text-orange-400 text-xs mb-1">{order.queue_number || order.id}</span>
                                        <span>Rp {(order.total || 0).toLocaleString('id-ID')}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* DRAFT ORDERS NOTIFICATION */}
                    {pendingOrders.filter(o => o.status === 'draft').length > 0 && (
                        <div className="mb-6 p-4 bg-blue-500/10 border border-blue-500/20 rounded-2xl shadow-lg">
                            <h3 className="font-bold text-blue-400 mb-3 flex items-center gap-2">📝 Draft Pesanan (Belum Bayar)</h3>
                            <div className="flex gap-3 overflow-x-auto pb-2 hide-scrollbar">
                                {pendingOrders.map((order: any, idx: number) => order.status === 'draft' && (
                                    <button 
                                        key={order.id}
                                        onClick={() => loadCustomerOrder(order, idx)}
                                        className="bg-[#1a1a1c] px-4 py-3 rounded-xl border border-blue-500/20 text-white font-bold hover:bg-gray-800 flex-shrink-0 shadow-sm transition-colors text-left flex flex-col min-w-[150px]"
                                    >
                                        <span className="text-blue-400 text-xs mb-1">{order.queue_number || order.id}</span>
                                        <span>Rp {(order.total || 0).toLocaleString('id-ID')}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Categories & View Mode Toggle */}
                    <div className="flex flex-col xl:flex-row gap-4 justify-between items-start xl:items-center mb-6">
                        <div className="flex overflow-x-auto gap-2 pb-2 w-full xl:w-auto no-scrollbar">
                            {categories.map(cat => (
                                <button
                                    key={cat}
                                    onClick={() => setActiveCategory(cat)}
                                    className={`px-4 py-2 rounded-full font-bold text-sm whitespace-nowrap transition-all ${
                                        activeCategory === cat 
                                        ? "bg-blue-600 text-white shadow-lg shadow-blue-900/20" 
                                        : "bg-[#1a1a1c] text-gray-400 hover:text-white border border-gray-800"
                                    }`}
                                >
                                    {cat}
                                </button>
                            ))}
                        </div>
                        <div className="flex bg-[#1a1a1c] rounded-xl border border-gray-800 p-1 shrink-0">
                            <button onClick={() => setViewMode('grid')} className={`p-2 rounded-lg transition-colors ${viewMode === 'grid' ? 'bg-gray-800 text-white' : 'text-gray-500 hover:text-gray-300'}`}>
                                <LayoutGrid className="w-5 h-5" />
                            </button>
                            <button onClick={() => setViewMode('list')} className={`p-2 rounded-lg transition-colors ${viewMode === 'list' ? 'bg-gray-800 text-white' : 'text-gray-500 hover:text-gray-300'}`}>
                                <List className="w-5 h-5" />
                            </button>
                        </div>
                    </div>

                    <div className={viewMode === 'grid' ? "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-4" : "flex flex-col gap-3"}>
                        {filteredProducts.length === 0 ? (
                            <div className="col-span-full text-center text-gray-500 py-10 bg-[#1a1a1c] rounded-2xl border border-gray-800">Belum ada produk di kategori ini.</div>
                        ) : (
                            filteredProducts.map((p) => (
                                <div
                                    key={p.id}
                                    onClick={() => addToCart(p)}
                                    className={`bg-[#1a1a1c] rounded-2xl border border-gray-800 cursor-pointer hover:border-blue-500/50 hover:bg-gray-800/50 transition-all shadow-lg group overflow-hidden ${
                                        viewMode === 'grid' 
                                        ? "p-4 flex flex-col h-full relative text-left" 
                                        : "p-3 flex items-center justify-between gap-4"
                                    }`}
                                >
                                    <div className={viewMode === 'grid' ? "flex-1 relative z-10" : "flex items-center gap-4 relative z-10"}>
                                        {viewMode === 'list' && (
                                            <div className="text-2xl md:text-3xl bg-gray-800/50 w-10 h-10 md:w-12 md:h-12 rounded-xl flex items-center justify-center transform group-hover:scale-110 transition-transform">
                                                {p.image_icon || '☕'}
                                            </div>
                                        )}
                                        <div>
                                            <h3 className="font-bold text-sm md:text-base leading-tight mb-1 text-white">{p.name}</h3>
                                            {viewMode === 'list' && <p className="text-gray-500 text-xs">{p.category || 'Uncategorized'}</p>}
                                        </div>
                                    </div>
                                    <p className={`text-blue-400 font-bold ${viewMode === 'grid' ? "mt-2 text-sm md:text-base" : "text-sm md:text-base shrink-0"} relative z-10`}>
                                        Rp {p.price.toLocaleString("id-ID")}
                                    </p>
                                    
                                    {/* Decorative Background Icon (Grid Only) */}
                                    {viewMode === 'grid' && (
                                        <div className="absolute -bottom-2 -right-2 text-4xl md:text-5xl opacity-5 group-hover:opacity-10 group-hover:scale-110 transition-all z-0">
                                            {p.image_icon || '☕'}
                                        </div>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* RIGHT: CART */}
            <div className="w-full sm:w-[260px] md:w-[280px] lg:w-[320px] xl:w-[400px] h-[45vh] sm:h-screen bg-[#1a1a1c] shadow-2xl flex flex-col border-t-2 sm:border-t-0 sm:border-l border-gray-800 z-10 shrink-0 print:hidden">
                <div className="p-3 sm:p-4 md:p-5 border-b border-gray-800 flex justify-between items-center bg-[#1a1a1c]">
                    <h2 className="text-sm sm:text-base md:text-lg font-bold flex items-center gap-2 text-white">
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
                    <div className="mb-4">
                        <label className="text-gray-400 text-xs font-bold mb-1 block uppercase tracking-wider">Nama Pelanggan (Opsional)</label>
                        <input 
                            type="text" 
                            value={customerName} 
                            onChange={(e) => setCustomerName(e.target.value)} 
                            placeholder="Ketik nama pelanggan..." 
                            className="w-full bg-[#0B0F19] text-white text-sm px-4 py-2.5 rounded-xl border border-gray-800 outline-none focus:border-blue-500 transition-colors" 
                        />
                    </div>
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
                    <div className="flex justify-between mb-4 border-t border-gray-800 pt-4">
                        <span className="text-gray-300 font-bold text-base md:text-lg">Total</span>
                        <span className="font-black text-2xl md:text-3xl text-blue-400">Rp {grandTotal.toLocaleString("id-ID")}</span>
                    </div>
                    
                    <div className="flex gap-2">
                        <button 
                            onClick={handleSaveDraft}
                            disabled={cart.length === 0}
                            className="flex-1 bg-gray-800 hover:bg-gray-700 text-gray-300 py-4 rounded-xl font-bold text-sm md:text-base flex items-center justify-center gap-2 disabled:opacity-50 transition-colors shadow-lg border border-gray-700"
                        >
                            Bayar Nanti
                        </button>
                        <button 
                            onClick={() => setShowPayment(true)}
                            disabled={cart.length === 0}
                            className="flex-[2] bg-blue-600 hover:bg-blue-500 text-white py-4 rounded-xl font-bold text-base md:text-lg flex items-center justify-center gap-2 disabled:opacity-50 transition-colors shadow-lg shadow-blue-900/20"
                        >
                            <CreditCard className="w-5 h-5" /> Lanjut Bayar
                        </button>
                    </div>
                    <p className="text-center text-[10px] text-gray-800 mt-3">
                        © {new Date().getFullYear()} NexPos · <span className="font-medium">Developed by Matias Austin</span>
                    </p>
                </div>
            </div>

            {/* PAYMENT MODAL */}
            {showPayment && (
                <div className="fixed inset-0 bg-black/80 flex items-start justify-center z-50 p-4 backdrop-blur-md overflow-y-auto print:hidden">
                    <div className="bg-[#1a1a1c] border border-gray-800 p-6 md:p-8 rounded-3xl w-full max-w-[500px] shadow-2xl my-auto flex-shrink-0">
                        {!paymentResult ? (
                            <>
                                <h2 className="text-2xl font-bold mb-6 border-b border-gray-800 pb-4 text-white">Pilih Pembayaran</h2>
                                <div className="text-center mb-8 p-6 bg-[#121214] rounded-2xl border border-gray-800">
                                    <p className="text-gray-400 mb-2">Total Tagihan</p>
                                    <p className="text-5xl font-black text-blue-400">Rp {grandTotal.toLocaleString("id-ID")}</p>
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
                                        {Number(amountReceived) >= grandTotal && (
                                            <div className="mt-3 p-3 bg-green-500/10 border border-green-500/20 rounded-lg text-green-400 font-bold text-center">
                                                Kembalian: Rp {(Number(amountReceived) - grandTotal).toLocaleString("id-ID")}
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
                                        disabled={loading || !selectedMethod || (selectedMethod?.type?.toLowerCase() === 'cash' && Number(amountReceived) < grandTotal)}
                                        className="flex-1 py-4 bg-blue-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 disabled:opacity-50 hover:bg-blue-500 transition-colors"
                                    >
                                        {loading ? "Memproses..." : <><CreditCard className="w-5 h-5"/> Proses</>}
                                    </button>
                                </div>
                            </>
                        ) : (
                            <div className="text-center py-8">
                                <div className="w-20 h-20 bg-green-500/10 border border-green-500/20 text-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
                                </div>
                                <h2 className="text-3xl font-black mb-1 text-white">Pembayaran Sukses!</h2>
                                <p className="text-gray-400 mb-6 flex flex-col items-center">
                                    <span className="text-[10px] uppercase tracking-wider mb-1">Nomor Antrean / Order</span>
                                    <span className="font-bold text-2xl text-white">{paymentResult.transaction?.order_reference || paymentResult.order_reference}</span>
                                </p>
                                <div className="flex flex-col md:flex-row gap-4">
                                    <button 
                                        onClick={async () => {
                                            const { printWithRawBT } = await import('@/lib/printUtils');
                                            const receiptEl = document.getElementById('print-receipt-section');
                                            if (receiptEl) {
                                                const htmlContent = `
                                                    <html>
                                                    <head>
                                                        <meta charset="utf-8">
                                                        <style>
                                                            body { font-family: monospace; font-size: 12px; color: black; background: white; margin: 0; padding: 0; width: 58mm; }
                                                            .text-center { text-align: center; }
                                                            .flex { display: flex; }
                                                            .justify-between { justify-content: space-between; }
                                                            .font-bold { font-weight: bold; }
                                                            .text-xl { font-size: 16px; }
                                                            .text-xs { font-size: 10px; }
                                                            .text-sm { font-size: 11px; }
                                                            .border-b { border-bottom: 1px dashed black; }
                                                            .border-t { border-top: 1px dashed black; }
                                                            .pb-4 { padding-bottom: 16px; }
                                                            .pt-4 { padding-top: 16px; }
                                                            .mb-4 { margin-bottom: 16px; }
                                                            .mt-4 { margin-top: 16px; }
                                                            .w-full { width: 100%; }
                                                            table { width: 100%; border-collapse: collapse; }
                                                            td { vertical-align: bottom; }
                                                            .text-right { text-align: right; }
                                                        </style>
                                                    </head>
                                                    <body>
                                                        ${receiptEl.innerHTML}
                                                    </body>
                                                    </html>
                                                `;
                                                printWithRawBT(htmlContent);
                                            }
                                        }}
                                        className="w-full bg-orange-600 hover:bg-orange-500 text-white py-4 rounded-xl font-bold text-lg transition-colors flex items-center justify-center gap-2"
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"></path></svg>
                                        Cetak (RawBT/Android)
                                    </button>
                                    <button 
                                        onClick={() => {
                                            setTimeout(() => window.print(), 100);
                                        }}
                                        className="w-full bg-gray-800 hover:bg-gray-700 text-white py-4 rounded-xl font-bold text-lg transition-colors flex items-center justify-center gap-2"
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"></path></svg>
                                        Cetak (Web)
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
                <>
                    <div id="print-receipt-section" className="hidden print:block w-[58mm] mx-auto bg-white text-black z-[9999] text-[12px] font-mono leading-snug print:p-0">
                        <div className="w-full text-center border-b border-dashed border-black pb-4 mb-4">
                        {storeSettings?.logo_base64 && (
                            <img src={storeSettings.logo_base64} alt="Logo" style={{ width: storeSettings.logo_size, height: storeSettings.logo_size }} className="mx-auto mb-2 object-contain grayscale" />
                        )}
                        <h2 className="font-bold text-xl">{storeSettings?.store_name || 'NEXPOS'}</h2>
                        <p className="text-xs mt-1">{storeSettings?.store_address}</p>
                        <p className="text-xs mt-1">{storeSettings?.store_phone}</p>
                    </div>
                    
                    <div className="w-full mb-4 text-xs border-b border-dashed border-black pb-4">
                        <div className="flex justify-between mb-1">
                            <span>No: {paymentResult.transaction?.order_reference || paymentResult.order_reference}</span>
                            <span>{new Date().toLocaleDateString('id-ID')}</span>
                        </div>
                        <div className="flex justify-between mb-1">
                            <span>Kasir: {staff?.full_name || 'Admin'}</span>
                            <span>{new Date().toLocaleTimeString('id-ID', {hour: '2-digit', minute:'2-digit'})}</span>
                        </div>
                        {paymentResult.transaction?.customer_name && (
                            <div className="flex justify-between mt-1 pt-1 border-t border-gray-200">
                                <span>Pelanggan:</span>
                                <span>{paymentResult.transaction.customer_name}</span>
                            </div>
                        )}
                    </div>
                    <div className="w-full">
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

                    <div className="w-full border-t border-dashed border-black pt-2 mb-4">
                        {((paymentResult.transaction?.tax_amount || 0) > 0 || (paymentResult.tax_amount || 0) > 0) && (
                            <>
                                <div className="flex justify-between text-sm mb-1">
                                    <span>Subtotal</span>
                                    <span>Rp {((paymentResult.transaction?.amount_due || paymentResult.amount_due || 0) - (paymentResult.transaction?.tax_amount || paymentResult.tax_amount || 0)).toLocaleString('id-ID')}</span>
                                </div>
                                <div className="flex justify-between text-sm mb-1">
                                    <span>Pajak</span>
                                    <span>Rp {(paymentResult.transaction?.tax_amount || paymentResult.tax_amount || 0).toLocaleString('id-ID')}</span>
                                </div>
                            </>
                        )}
                        <div className="flex justify-between font-bold text-base mb-1">
                            <span>TOTAL</span>
                            <span>Rp {(paymentResult.transaction?.amount_due || paymentResult.amount_due || 0).toLocaleString('id-ID')}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span>{(paymentResult.payment_method_name || 'TUNAI').toUpperCase()}</span>
                            <span>Rp {(paymentResult.transaction?.amount_received || paymentResult.amount_received || 0).toLocaleString('id-ID')}</span>
                        </div>
                        {(paymentResult.change_given || 0) > 0 && (
                            <div className="flex justify-between text-sm">
                                <span>KEMBALI</span>
                                <span>Rp {(paymentResult.change_given || 0).toLocaleString('id-ID')}</span>
                            </div>
                        )}
                    </div>

                    <div className="w-full text-center pt-4">
                        {storeSettings?.qris_image_base64 && (
                            <div className="flex flex-col items-center justify-center my-4">
                                <p className="font-bold text-xs mb-2">SCAN QRIS UNTUK BAYAR</p>
                                <img src={storeSettings.qris_image_base64} alt="QRIS" className="w-32 h-32 object-contain" />
                            </div>
                        )}
                        <p className="mb-2 font-bold whitespace-pre-wrap">{storeSettings?.receipt_footer || 'Terima kasih atas kunjungan Anda!'}</p>
                        {storeSettings?.wifi_password && (
                            <div className="mt-2 text-center">
                                {storeSettings?.wifi_name && <p className="font-bold">WiFi: {storeSettings.wifi_name}</p>}
                                <p>Pass: {storeSettings.wifi_password}</p>
                            </div>
                        )}
                        <p className="mt-4 text-xs">Powered by NexPos</p>
                    </div>
                </div>
                </>
            )}

            {/* EXPENSES & RAW MATERIALS MODAL */}
            {showExpensesModal && (
                <div className="fixed inset-0 bg-black/90 flex items-start justify-center z-[100] p-4 backdrop-blur-sm overflow-y-auto print:hidden">
                    <div className="bg-[#1a1a1c] border border-gray-800 rounded-3xl w-full max-w-6xl shadow-2xl p-6 md:p-8 my-auto flex-shrink-0 relative">
                        <button 
                            onClick={() => setShowExpensesModal(false)}
                            className="absolute top-6 right-6 w-10 h-10 bg-gray-800 hover:bg-red-500 hover:text-white rounded-full flex items-center justify-center text-gray-400 transition-colors"
                        >
                            ✕
                        </button>
                        
                        <h2 className="text-2xl font-bold text-white mb-8 flex items-center gap-3">
                            <Banknote className="text-orange-500" /> Kelola Bahan Baku & Pengeluaran 
                            <span className="text-sm font-normal text-gray-500 px-3 py-1 bg-gray-800 rounded-full ml-auto mr-12">Staff: {staff?.full_name}</span>
                        </h2>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            <div className="space-y-8">
                                <div className="p-6 bg-[#131B2C] rounded-2xl border border-gray-800 transition-all">
                                    <div className="flex justify-between items-center mb-6 border-b border-gray-800 pb-3">
                                        <h3 className="font-bold text-lg text-white">
                                            {materialMode === 'add' ? 'Tambah Bahan Baku Baru' : `Update Stok: ${selectedMaterial?.name}`}
                                        </h3>
                                        {materialMode === 'update' && (
                                            <button onClick={() => { setMaterialMode('add'); setSelectedMaterial(null); }} className="text-xs text-blue-400 hover:text-blue-300">Batal Update</button>
                                        )}
                                    </div>
                                    
                                    {materialMode === 'add' ? (
                                        <form onSubmit={handleCreateMaterial} className="space-y-4">
                                            <input type="text" placeholder="Nama Bahan (contoh: Susu)" required value={newMaterial.name} onChange={e => setNewMaterial({...newMaterial, name: e.target.value})} className="w-full p-3 bg-gray-900 border border-gray-800 rounded-xl focus:border-blue-500 outline-none text-white" />
                                            <div className="grid grid-cols-3 gap-4">
                                                <input type="text" placeholder="Unit (kg/lt)" required value={newMaterial.unit} onChange={e => setNewMaterial({...newMaterial, unit: e.target.value})} className="p-3 bg-gray-900 border border-gray-800 rounded-xl focus:border-blue-500 outline-none text-white" />
                                                <input type="number" placeholder="Stok" required value={newMaterial.current_stock || ''} onChange={e => setNewMaterial({...newMaterial, current_stock: Number(e.target.value)})} className="p-3 bg-gray-900 border border-gray-800 rounded-xl focus:border-blue-500 outline-none text-white" />
                                                <input type="number" placeholder="Harga/Unit" required value={newMaterial.last_price_per_unit || ''} onChange={e => setNewMaterial({...newMaterial, last_price_per_unit: Number(e.target.value)})} className="p-3 bg-gray-900 border border-gray-800 rounded-xl focus:border-blue-500 outline-none text-white" />
                                            </div>
                                            <button type="submit" disabled={loading} className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-500">Simpan Bahan</button>
                                        </form>
                                    ) : (
                                        <form onSubmit={handleAdjustStock} className="space-y-4">
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="text-xs text-gray-500 mb-1 block">Penambahan/Pengurangan Stok</label>
                                                    <div className="flex items-center gap-3">
                                                        <button type="button" onClick={() => setStockAdjustment({...stockAdjustment, delta: (stockAdjustment.delta || 0) - 1})} className="w-12 h-12 flex items-center justify-center bg-gray-800 hover:bg-gray-700 text-white rounded-xl text-2xl font-black border border-gray-700">-</button>
                                                        <div className="flex-1 text-center bg-gray-900 border border-gray-800 rounded-xl py-3 text-white font-bold text-lg">
                                                            {stockAdjustment.delta >= 0 ? `+${stockAdjustment.delta}` : stockAdjustment.delta}
                                                        </div>
                                                        <button type="button" onClick={() => setStockAdjustment({...stockAdjustment, delta: (stockAdjustment.delta || 0) + 1})} className="w-12 h-12 flex items-center justify-center bg-gray-800 hover:bg-gray-700 text-white rounded-xl text-2xl font-black border border-gray-700">+</button>
                                                    </div>
                                                </div>
                                                <div>
                                                    <label className="text-xs text-gray-500 mb-1 block">Harga Beli Baru (Opsional)</label>
                                                    <input type="number" placeholder="Biarkan kosong jika tetap" value={stockAdjustment.price || ''} onChange={e => setStockAdjustment({...stockAdjustment, price: Number(e.target.value)})} className="w-full p-3 bg-gray-900 border border-gray-800 rounded-xl focus:border-blue-500 outline-none text-white" />
                                                </div>
                                            </div>
                                            <div>
                                                <label className="text-xs text-gray-500 mb-1 block">Keterangan (Contoh: Beli baru, Rusak, Terpakai)</label>
                                                <input type="text" placeholder="Masukkan keterangan" required value={stockAdjustment.note || ''} onChange={e => setStockAdjustment({...stockAdjustment, note: e.target.value})} className="w-full p-3 bg-gray-900 border border-gray-800 rounded-xl focus:border-blue-500 outline-none text-white" />
                                            </div>
                                            <p className="text-xs text-gray-500">Gunakan angka minus (-) jika bahan terpakai/dibuang.</p>
                                            <button type="submit" disabled={loading} className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-500">Update Stok</button>
                                        </form>
                                    )}
                                </div>

                                <div className="bg-[#131B2C] border border-gray-800 rounded-2xl overflow-hidden">
                                    <h3 className="p-4 bg-gray-800/30 font-bold text-gray-300 border-b border-gray-800">Daftar Bahan Baku</h3>
                                    <div className="max-h-[300px] overflow-y-auto">
                                        {rawMaterials.length === 0 ? (
                                            <p className="p-6 text-gray-500 text-center text-sm">Belum ada bahan baku.</p>
                                        ) : (
                                            <table className="w-full text-left">
                                                <tbody>
                                                    {rawMaterials.map((mat: any) => (
                                                        <tr key={mat.id} className="border-b border-gray-800 hover:bg-gray-800/20 group">
                                                            <td className="p-4">
                                                                <div className="font-bold text-white">{mat.name}</div>
                                                                {mat.updated_by_name && <div className="text-[10px] text-blue-400 mt-1">Oleh: {mat.updated_by_name}</div>}
                                                            </td>
                                                            <td className="p-4 text-center"><span className="px-3 py-1 bg-gray-800 rounded-lg text-sm font-bold">{mat.current_stock} {mat.unit}</span></td>
                                                            <td className="p-4 text-right">
                                                                <div className="flex gap-1 justify-end">
                                                                    <button onClick={() => { setMaterialMode('update'); setSelectedMaterial(mat); setStockAdjustment({ delta: 0, note: '', price: mat.last_price_per_unit }); }} className="px-2 py-1 text-xs bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-lg hover:bg-blue-600 hover:text-white font-bold transition-colors">+/- Stok</button>
                                                                    {canEditRecord(mat.updated_by_name) && (
                                                                        <button onClick={() => handleDeleteMaterial(mat.id)} className="px-2 py-1 text-xs bg-red-500/10 text-red-400 border border-red-500/20 rounded-lg hover:bg-red-600 hover:text-white font-bold transition-colors">Hapus</button>
                                                                    )}
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-8">
                                <div className="p-6 bg-[#131B2C] rounded-2xl border border-gray-800 transition-all">
                                    <div className="flex justify-between items-center mb-6 border-b border-gray-800 pb-3">
                                        <h3 className="font-bold text-lg text-white">
                                            {editingExpense ? 'Edit Pengeluaran' : 'Catat Pengeluaran Operasional'}
                                        </h3>
                                        {editingExpense && (
                                            <button onClick={() => { setEditingExpense(null); setNewExpense({description: '', amount: 0, material_id: '', quantity: 0}); }} className="text-xs text-blue-400 hover:text-blue-300">Batal Edit</button>
                                        )}
                                    </div>
                                    <form onSubmit={editingExpense ? handleUpdateExpense : handleCreateExpense} className="space-y-4">
                                        <input type="text" placeholder="Deskripsi Pengeluaran (contoh: Beli Es Batu)" required value={editingExpense ? editingExpense.description : newExpense.description} onChange={e => editingExpense ? setEditingExpense({...editingExpense, description: e.target.value}) : setNewExpense({...newExpense, description: e.target.value})} className="w-full p-3 bg-gray-900 border border-gray-800 rounded-xl focus:border-blue-500 outline-none text-white" />
                                        <input type="number" placeholder="Nominal (Rp)" required value={editingExpense ? editingExpense.amount || '' : newExpense.amount || ''} onChange={e => editingExpense ? setEditingExpense({...editingExpense, amount: Number(e.target.value)}) : setNewExpense({...newExpense, amount: Number(e.target.value)})} className="w-full p-3 bg-gray-900 border border-gray-800 rounded-xl focus:border-blue-500 outline-none text-white" />
                                        
                                        {!editingExpense && (
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="text-xs text-gray-500 mb-1 block">Tambah Stok Bahan (Opsional)</label>
                                                    <select 
                                                        value={newExpense.material_id || ''} 
                                                        onChange={e => setNewExpense({...newExpense, material_id: e.target.value})}
                                                        className="w-full p-3 bg-gray-900 border border-gray-800 rounded-xl focus:border-blue-500 outline-none text-white"
                                                    >
                                                        <option value="">Pilih Bahan Baku...</option>
                                                        {rawMaterials.map(m => (
                                                            <option key={m.id} value={m.id}>{m.name} ({m.unit})</option>
                                                        ))}
                                                    </select>
                                                </div>
                                                {newExpense.material_id && (
                                                    <div>
                                                        <label className="text-xs text-gray-500 mb-1 block">Kuantitas Tambahan</label>
                                                        <input 
                                                            type="number" 
                                                            placeholder="Jml" 
                                                            value={newExpense.quantity || ''} 
                                                            onChange={e => setNewExpense({...newExpense, quantity: Number(e.target.value)})}
                                                            className="w-full p-3 bg-gray-900 border border-gray-800 rounded-xl focus:border-blue-500 outline-none text-white"
                                                        />
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                        
                                        <button type="submit" disabled={loading} className="w-full py-3 bg-orange-600/20 text-orange-400 border border-orange-500/30 rounded-xl font-bold hover:bg-orange-500/30 mt-2">
                                            {editingExpense ? 'Simpan Perubahan' : 'Simpan Pengeluaran'}
                                        </button>
                                    </form>
                                </div>

                                <div className="bg-[#131B2C] border border-gray-800 rounded-2xl overflow-hidden">
                                    <h3 className="p-4 bg-gray-800/30 font-bold text-gray-300 border-b border-gray-800">Riwayat Pengeluaran</h3>
                                    <div className="max-h-[300px] overflow-y-auto">
                                        {expenses.length === 0 ? (
                                            <p className="p-6 text-gray-500 text-center text-sm">Belum ada pengeluaran dicatat.</p>
                                        ) : (
                                            <table className="w-full text-left">
                                                <tbody>
                                                    {expenses.map((exp: any) => (
                                                        <tr key={exp.id} className="border-b border-gray-800 hover:bg-gray-800/20 group">
                                                            <td className="p-4">
                                                                <div className="font-bold text-white">{exp.description}</div>
                                                                <div className="text-[10px] text-gray-500 mt-1">{new Date(exp.expense_date || exp.created_at).toLocaleDateString('id-ID')} {new Date(exp.expense_date || exp.created_at).toLocaleTimeString('id-ID', {hour: '2-digit', minute:'2-digit'})}</div>
                                                            </td>
                                                            <td className="p-4 text-center">
                                                                {exp.staff_name ? (
                                                                    <span className="px-2 py-1 bg-blue-500/10 text-blue-400 rounded-md text-[10px] font-bold border border-blue-500/20">{exp.staff_name}</span>
                                                                ) : (
                                                                    <span className="px-2 py-1 bg-gray-800 text-gray-400 rounded-md text-[10px] border border-gray-700">Owner</span>
                                                                )}
                                                            </td>
                                                            <td className="p-4 text-right text-orange-400 font-bold">
                                                                <div className="mb-2">Rp {exp.amount.toLocaleString('id-ID')}</div>
                                                                {canEditRecord(exp.staff_name) && (
                                                                    <div className="flex gap-1 justify-end">
                                                                        <button onClick={() => setEditingExpense({...exp})} className="px-2 py-1 text-[10px] bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-md hover:bg-blue-600 hover:text-white font-bold transition-colors">Edit</button>
                                                                        <button onClick={() => handleDeleteExpense(exp.id)} className="px-2 py-1 text-[10px] bg-red-500/10 text-red-400 border border-red-500/20 rounded-md hover:bg-red-600 hover:text-white font-bold transition-colors">Hapus</button>
                                                                    </div>
                                                                )}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
