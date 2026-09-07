"use client";

import { useState, useEffect } from "react";
import { ShoppingCart, CreditCard, Banknote, Trash2, Clock, Minus, Plus, LayoutGrid, List, Maximize } from "lucide-react";
import { processPayment, getPaymentMethods, getActiveProducts } from "@/lib/api";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/components/Toast";
import { useConfirm } from "@/components/ConfirmModal";
import { LoadingSpinner } from "@/components/Loading";
import { parseExpenseQtyAndUnit, formatExpenseDescription, cleanExpenseDescription } from "@/lib/expenseHelpers";

export default function PosPage() {
    const [hasSession, setHasSession] = useState(false);
    const [openingCash, setOpeningCash] = useState<string>("");
    const [products, setProducts] = useState<any[]>([]);
    const [activeCategory, setActiveCategory] = useState("Semua");
    const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
    const [isMobileCartOpen, setIsMobileCartOpen] = useState(false);
    
    const [cart, setCart] = useState<{ product: any; qty: number }[]>([]);
    const [showPayment, setShowPayment] = useState(false);
    const [amountReceived, setAmountReceived] = useState<string>("");
    const [customerName, setCustomerName] = useState<string>("");
    const [paymentResult, setPaymentResult] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [showOptionsModal, setShowOptionsModal] = useState(false);
    const [selectedProductForOptions, setSelectedProductForOptions] = useState<any>(null);
    const [selectedOptions, setSelectedOptions] = useState<any>({});
    
    // New States
    const [paymentMethods, setPaymentMethods] = useState<any[]>([]);
    const [selectedMethod, setSelectedMethod] = useState<any>(null);
    const [pendingOrders, setPendingOrders] = useState<any[]>([]);
    
    // Expenses & Raw Materials State
    const [showExpensesModal, setShowExpensesModal] = useState(false);
    const [expenses, setExpenses] = useState<any[]>([]);
    const [rawMaterials, setRawMaterials] = useState<any[]>([]);
    const [materialStockLogs, setMaterialStockLogs] = useState<any[]>([]);
    const [newExpense, setNewExpense] = useState<{ description: string; amount: number; material_id: string; quantity: number; payment_method: string; category: string; buy_unit?: string }>({ description: '', amount: 0, material_id: '', quantity: 0, payment_method: 'CASH', category: 'operasional', buy_unit: 'kg' });
    const [posExpenseCategoryFilter, setPosExpenseCategoryFilter] = useState<'all' | 'bahan_baku' | 'operasional'>('all');
    
    // Inline add material in expense form
    const [showInlineAddMaterial, setShowInlineAddMaterial] = useState(false);
    const [inlineNewMaterial, setInlineNewMaterial] = useState({ name: '', unit: 'g', last_price_per_unit: 0 });

    const [newMaterial, setNewMaterial] = useState({ name: '', unit: 'g', current_stock: 0, last_price_per_unit: 0 });
    const [editingMaterial, setEditingMaterial] = useState<any>(null);
    
    // Auth State
    const [staff, setStaff] = useState<any>(null);
    const [showCloseShiftModal, setShowCloseShiftModal] = useState(false);
    const [actualCashInput, setActualCashInput] = useState("");

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
    const [sessionData, setSessionData] = useState<any>(null);

    const [collapseAddMat, setCollapseAddMat] = useState(false);
    const [collapseListMat, setCollapseListMat] = useState(false);
    const [collapseAddExp, setCollapseAddExp] = useState(false);
    const [collapseListExp, setCollapseListExp] = useState(false);



    const fetchSessionData = async (id: string) => {
        if (!id) return;
        try {
            if (!staff?.id) return;
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/cash-sessions/active?staffId=${staff.id}&terminalId=TERM-01&_t=${Date.now()}`, { cache: 'no-store' });
            if (res.ok) {
                const sess = await res.json();
                // Manually query movements to get total_expense and total_refund since backend on Vercel is outdated
                const { data: movements } = await supabase.from('cash_movements').select('amount, type').eq('session_id', sess.id).in('type', ['expense', 'refund']);
                sess.total_expense = movements ? movements.filter(m => m.type === 'expense').reduce((sum, m) => sum + Math.abs(m.amount), 0) : 0;
                sess.total_refund = movements ? movements.filter(m => m.type === 'refund').reduce((sum, m) => sum + Math.abs(m.amount), 0) : 0;
                setSessionData(sess);
            }
        } catch(e) {
            console.error(e);
        }
    };
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
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/cash-sessions/active?staffId=${staffId}&terminalId=TERM-01&_t=${Date.now()}`, { cache: 'no-store' });
            if (res.ok) {
                const sess = await res.json();
                if (sess && sess.id) {
                    setSessionId(sess.id);
                    setSessionData(sess);
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
                setSessionData({...sess, total_expense: 0});
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

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.push('/login');
    };

    const handleCloseSession = () => {
        setActualCashInput("");
        setShowCloseShiftModal(true);
    };

    const submitCloseSession = async () => {
        if (!actualCashInput) return;
        setLoading(true);
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/cash-sessions/close`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    sessionId: sessionId,
                    actualCash: Number(actualCashInput),
                    discrepancyReason: "Ditutup manual oleh kasir" // Default reason for demo
                })
            });
            if (res.ok) {
                toast.success("Shift berhasil ditutup.");
                setHasSession(false);
                setSessionId(null);
                setOpeningCash("");
                setShowCloseShiftModal(false);
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

    const handleDeletePendingOrder = async (id: string, queueNumber: string, e: React.MouseEvent) => {
        e.stopPropagation();
        const ok = await confirm({ title: "Batalkan Pesanan", message: "Yakin ingin membatalkan/menghapus pesanan ini?", confirmText: "Ya, Batalkan", variant: "danger" });
        if (!ok) return;

        try {
            const { error } = await supabase.from('kiosk_orders').delete().eq('id', id);
            if (error) throw error;
            toast.success("Pesanan berhasil dibatalkan.");
            setPendingOrders(prev => prev.filter((o: any) => o.id !== id));
            
            // If the active queue number matches the deleted one, clear the cart.
            if (activeQueueNumber === queueNumber) {
                clearCart();
            }
        } catch (e: any) {
            toast.error(e.message);
        }
    };

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
        
        const draftItems = cart.map(i => ({
            product_name: i.product.name,
            quantity: i.qty,
            price: i.product.price,
            subtotal: i.qty * i.product.price
        }));

        const printTx = {
            order_reference: orderRef,
            customer_name: customerName,
            total: currentSubTotal + currentTaxAmount,
            subtotal: currentSubTotal,
            tax_amount: currentTaxAmount,
            discount_amount: 0,
            amount_due: currentSubTotal + currentTaxAmount,
            status: 'BELUM LUNAS'
        };

        setPaymentResult({
            isDraft: true,
            order_reference: orderRef,
            items: draftItems,
            payment_method_name: "BELUM LUNAS",
            transaction: printTx
        });

        toast.success("Pesanan disimpan");
        clearCart();
        setShowPayment(true);
    };

    const fetchExpensesAndMaterials = async () => {
        try {
            const [expRes, matRes, logRes] = await Promise.all([
                supabase.from('expenses').select('*').order('created_at', { ascending: false }),
                supabase.from('raw_materials').select('*').order('name', { ascending: true }),
                supabase.from('material_stock_logs').select('*').order('created_at', { ascending: false }).limit(100)
            ]);
            const normalized = (expRes.data || []).map((e: any) => ({
                ...e,
                category: (e.category || (e.raw_material_id ? 'bahan_baku' : 'operasional')).toLowerCase()
            }));
            setExpenses(normalized);
            setRawMaterials(matRes.data || []);
            setMaterialStockLogs(logRes.data || []);
        } catch (e) { console.error("Error fetching data", e); }
    };

    useEffect(() => {
        if (showExpensesModal) {
            fetchExpensesAndMaterials();
        }
    }, [showExpensesModal]);

    const handleInlineAddMaterial = async () => {
        if (!inlineNewMaterial.name || !inlineNewMaterial.unit) {
            toast.error("Nama dan satuan bahan wajib diisi!");
            return;
        }
        setLoading(true);
        try {
            const { data: matData, error } = await supabase.from('raw_materials').insert([{
                name: inlineNewMaterial.name,
                unit: inlineNewMaterial.unit,
                current_stock: 0,
                last_price_per_unit: Number(inlineNewMaterial.last_price_per_unit) || 0,
                updated_by_name: staff?.full_name
            }]).select().single();
            if (error) throw error;
            toast.success(`Bahan baku "${inlineNewMaterial.name}" berhasil ditambahkan!`);
            setInlineNewMaterial({ name: '', unit: '', last_price_per_unit: 0 });
            setShowInlineAddMaterial(false);
            // Reload materials
            await fetchExpensesAndMaterials();
            // Auto-select the new material
            if (matData) setNewExpense(prev => ({ ...prev, material_id: matData.id }));
        } catch (e: any) { toast.error(e.message); }
        setLoading(false);
    };

    const handleCreateExpense = async (e: React.FormEvent) => {
        e.preventDefault();
        // Validate: if bahan_baku category, must select material
        const expCat = (newExpense.category || 'operasional').toLowerCase();
        if (expCat === 'bahan_baku' && !newExpense.material_id) {
            toast.error("Pilih bahan baku terlebih dahulu untuk kategori Bahan Baku!");
            return;
        }
        setLoading(true);
        try {
            const rawDesc = newExpense.payment_method === 'CASH' ? newExpense.description : `[${newExpense.payment_method}] ${newExpense.description}`;
            const bUnit = (newExpense as any).buy_unit || 'kg';
            const finalDesc = expCat === 'bahan_baku' && Number(newExpense.quantity) > 0
                ? formatExpenseDescription(rawDesc, newExpense.quantity, bUnit)
                : rawDesc;

            const insertPayload: any = {
                description: finalDesc,
                amount: Number(newExpense.amount),
                recorded_by: staff?.id,
                staff_name: staff?.full_name,
                category: expCat,
                raw_material_id: expCat === 'bahan_baku' ? (newExpense.material_id || null) : null,
                quantity: expCat === 'bahan_baku' && Number(newExpense.quantity) > 0 ? Number(newExpense.quantity) : null,
                buy_unit: expCat === 'bahan_baku' && Number(newExpense.quantity) > 0 ? bUnit : null
            };

            let { data: expData, error } = await supabase.from('expenses').insert([insertPayload]).select();
            if (error && (error.code === 'PGRST204' || error.message?.includes('quantity') || error.message?.includes('buy_unit'))) {
                delete insertPayload.quantity;
                delete insertPayload.buy_unit;
                const retry = await supabase.from('expenses').insert([insertPayload]).select();
                if (retry.error) throw retry.error;
                expData = retry.data;
            } else if (error) {
                throw error;
            }
            
            // Handle Material Stock Update if selected
            if (expCat === 'bahan_baku' && newExpense.material_id && Number(newExpense.quantity) > 0) {
                const material = rawMaterials.find(m => m.id === newExpense.material_id);
                if (material) {
                    // Auto convert unit if purchasing in kg or liter
                    let mult = 1;
                    if ((material.unit === 'g' || material.unit === 'gr') && bUnit === 'kg') mult = 1000;
                    else if (material.unit === 'ml' && (bUnit === 'liter' || bUnit === 'l')) mult = 1000;

                    const addedStock = Number(newExpense.quantity) * mult;
                    const newStock = Number(material.current_stock) + addedStock;
                    const unitPrice = addedStock > 0 ? (Number(newExpense.amount) / addedStock) : Number(material.last_price_per_unit || 0);

                    // Update material
                    const { error: matError } = await supabase.from('raw_materials')
                        .update({ current_stock: newStock, updated_by_name: staff?.full_name, last_price_per_unit: Number(unitPrice.toFixed(2)) })
                        .eq('id', newExpense.material_id);
                    if (matError) throw matError;
                    
                    // Log stock change
                    await supabase.from('material_stock_logs').insert([{
                        material_id: material.id,
                        material_name: material.name,
                        delta: addedStock,
                        current_stock: newStock,
                        price: Number(unitPrice.toFixed(2)),
                        staff_name: staff?.full_name,
                        note: `Dari Pengeluaran: ${finalDesc}`
                    }]);
                }
            }

            // Deduct from cash drawer if shift is open AND paid with CASH
            if (sessionId && staff && newExpense.payment_method === 'CASH') {
                try {
                    const { error: moveError } = await supabase.from('cash_movements').insert({
                        session_id: sessionId,
                        staff_id: staff.id,
                        type: 'expense',
                        amount: -Number(newExpense.amount),
                        reason: `Pengeluaran: ${finalDesc}`
                    });
                    
                    if (!moveError) {
                        const { data: session } = await supabase.from('cash_sessions').select('expected_cash').eq('id', sessionId).single();
                        if (session) {
                            await supabase.from('cash_sessions').update({ expected_cash: Number(session.expected_cash) - Number(newExpense.amount) }).eq('id', sessionId);
                        }
                    }
                } catch (err) {
                    console.error("Gagal mencatat cash movement untuk pengeluaran:", err);
                }
            }

            toast.success("Pengeluaran berhasil dicatat (Laci dikurangi).");
            setNewExpense({ description: '', amount: 0, material_id: '', quantity: 0, payment_method: 'CASH', category: 'operasional', buy_unit: 'kg' });
            fetchExpensesAndMaterials();
            if (sessionId) fetchSessionData(sessionId);
        } catch (e: any) { toast.error(e.message); }
        setLoading(false);
    };

    const handleUpdateExpense = async (e: React.FormEvent) => {
        e.preventDefault();
        const expCat = (editingExpense.category || 'operasional').toLowerCase();
        if (expCat === 'bahan_baku' && !editingExpense.material_id) {
            toast.error("Pilih bahan baku terlebih dahulu untuk kategori Bahan Baku!");
            return;
        }
        setLoading(true);
        try {
            const bUnit = editingExpense.buy_unit || 'kg';
            const finalDesc = expCat === 'bahan_baku' && Number(editingExpense.quantity) > 0
                ? formatExpenseDescription(editingExpense.description, editingExpense.quantity, bUnit)
                : editingExpense.description;

            const updatePayload: any = {
                description: finalDesc, 
                amount: Number(editingExpense.amount),
                category: expCat,
                raw_material_id: expCat === 'bahan_baku' ? (editingExpense.material_id || null) : null,
                quantity: expCat === 'bahan_baku' && Number(editingExpense.quantity) > 0 ? Number(editingExpense.quantity) : null,
                buy_unit: expCat === 'bahan_baku' && Number(editingExpense.quantity) > 0 ? bUnit : null
            };

            let { error } = await supabase.from('expenses').update(updatePayload).eq('id', editingExpense.id);
            if (error && (error.code === 'PGRST204' || error.message?.includes('quantity') || error.message?.includes('buy_unit'))) {
                delete updatePayload.quantity;
                delete updatePayload.buy_unit;
                const retry = await supabase.from('expenses').update(updatePayload).eq('id', editingExpense.id);
                if (retry.error) throw retry.error;
            } else if (error) {
                throw error;
            }

            // If material selected and quantity entered, update material price and stock
            if (expCat === 'bahan_baku' && editingExpense.material_id && Number(editingExpense.quantity) > 0) {
                const material = rawMaterials.find(m => m.id === editingExpense.material_id);
                if (material) {
                    let mult = 1;
                    if ((material.unit === 'g' || material.unit === 'gr') && bUnit === 'kg') mult = 1000;
                    else if (material.unit === 'ml' && (bUnit === 'liter' || bUnit === 'l')) mult = 1000;

                    const addedStock = Number(editingExpense.quantity) * mult;
                    const unitPrice = addedStock > 0 ? (Number(editingExpense.amount) / addedStock) : Number(material.last_price_per_unit || 0);

                    // Update material
                    await supabase.from('raw_materials')
                        .update({ 
                            last_price_per_unit: Number(unitPrice.toFixed(2)), 
                            updated_by_name: staff?.full_name 
                        })
                        .eq('id', editingExpense.material_id);

                    // Log stock change
                    await supabase.from('material_stock_logs').insert([{
                        material_id: material.id,
                        material_name: material.name,
                        delta: addedStock,
                        current_stock: Number(material.current_stock),
                        price: Number(unitPrice.toFixed(2)),
                        staff_name: staff?.full_name,
                        note: `Edit Pengeluaran: ${finalDesc}`
                    }]);
                }
            }

            toast.success("Pengeluaran diperbarui.");
            setEditingExpense(null);
            setNewExpense({ description: '', amount: 0, material_id: '', quantity: 0, payment_method: 'CASH', category: 'operasional', buy_unit: 'kg' });
            fetchExpensesAndMaterials();
            if (sessionId) fetchSessionData(sessionId);
        } catch (e: any) { toast.error(e.message); }
        setLoading(false);
    };

    const handleDeleteExpense = async (id: string) => {
        const ok = await confirm({ title: "Hapus Pengeluaran", message: "Hapus data pengeluaran ini secara permanen?", confirmText: "Hapus", variant: "danger" });
        if (!ok) return;
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/expenses/${id}${sessionId ? `?sessionId=${sessionId}` : ''}`, { method: 'DELETE' });
            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || 'Failed to delete expense');
            }
            toast.success("Pengeluaran dihapus dan uang laci disesuaikan.");
            fetchExpensesAndMaterials();
            if (sessionId) fetchSessionData(sessionId);
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
    const [stockAdjustment, setStockAdjustment] = useState<{ delta: number; note: string; price: number; unit?: string }>({ delta: 0, note: '', price: 0, unit: '' });
    const [editingExpense, setEditingExpense] = useState<any>(null);

    const handleAdjustStock = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedMaterial) return;
        setLoading(true);
        const adjUnit = stockAdjustment.unit || selectedMaterial.unit;
        let mult = 1;
        if ((selectedMaterial.unit === 'g' || selectedMaterial.unit === 'gr') && adjUnit === 'kg') mult = 1000;
        else if (selectedMaterial.unit === 'ml' && (adjUnit === 'liter' || adjUnit === 'l')) mult = 1000;

        const effectiveDelta = Number(stockAdjustment.delta) * mult;
        const newStock = selectedMaterial.current_stock + effectiveDelta;
        if (newStock < 0) { toast.error("Stok tidak boleh negatif!"); setLoading(false); return; }
        try {
            const updatePayload: any = {
                current_stock: newStock,
                updated_by_name: staff?.full_name
            };
            if (stockAdjustment.price > 0) {
                const totalUnits = Math.abs(effectiveDelta) || 1;
                const calculatedBasePrice = mult > 1 ? (Number(stockAdjustment.price) / totalUnits) : Number(stockAdjustment.price);
                updatePayload.last_price_per_unit = Number(calculatedBasePrice.toFixed(2));
            }
            
            // 1. Update raw_materials
            const { error } = await supabase.from('raw_materials').update(updatePayload).eq('id', selectedMaterial.id);
            if (error) throw error;
            
            // 2. Insert into material_stock_logs
            await supabase.from('material_stock_logs').insert([{
                material_id: selectedMaterial.id,
                material_name: selectedMaterial.name,
                delta: effectiveDelta,
                current_stock: newStock,
                price: updatePayload.last_price_per_unit || Number(stockAdjustment.price) || null,
                staff_name: staff?.full_name,
                note: stockAdjustment.note ? `${stockAdjustment.note} (${stockAdjustment.delta} ${adjUnit})` : `Update Stok (${stockAdjustment.delta} ${adjUnit})`
            }]);

            const action = effectiveDelta >= 0 ? `+${effectiveDelta}` : `${effectiveDelta}`;
            toast.success(`Stok ${selectedMaterial.name} diupdate (${action} ${selectedMaterial.unit}).`);
            setSelectedMaterial(null);
            setStockAdjustment({ delta: 0, note: '', price: 0, unit: '' });
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

    const addToCart = (product: any, options: any = null) => {
        let optionAddon = 0;
        const optionParts: string[] = [];
        const choiceKeyParts: string[] = [];

        if (options && typeof options === 'object') {
            Object.entries(options).forEach(([catName, val]: [string, any]) => {
                if (Array.isArray(val)) {
                    val.forEach((choice: any) => {
                        const adj = Number(choice.price_adjustment) || 0;
                        optionAddon += adj;
                        optionParts.push(choice.name + (adj > 0 ? ` (+Rp ${adj.toLocaleString('id-ID')})` : ''));
                        choiceKeyParts.push(choice.id || choice.name);
                    });
                } else if (val && typeof val === 'object') {
                    const adj = Number(val.price_adjustment) || 0;
                    optionAddon += adj;
                    optionParts.push(val.name + (adj > 0 ? ` (+Rp ${adj.toLocaleString('id-ID')})` : ''));
                    choiceKeyParts.push(val.id || val.name);
                }
            });
        }

        const optionsString = optionParts.join(', ');
        choiceKeyParts.sort();
        const cartKey = `${product.id}${choiceKeyParts.length > 0 ? `-${choiceKeyParts.join('_')}` : ''}`;
        
        const basePrice = Number(product.price) + optionAddon;
        const finalPrice = (product.discount_percentage || 0) > 0 
            ? basePrice * (1 - product.discount_percentage / 100) 
            : basePrice;
        
        const finalProduct = {
            ...product,
            original_id: product.id,
            cart_key: cartKey,
            variant_details: optionsString,
            original_price: product.price,
            unit_addon: optionAddon,
            price: finalPrice,
            modifiers: options
        };
        
        setCart((prev) => {
            const existing = prev.find((item) => (item.product.cart_key || item.product.id) === cartKey);
            if (existing) {
                return prev.map((item) =>
                    (item.product.cart_key || item.product.id) === cartKey ? { ...item, qty: item.qty + 1 } : item
                );
            }
            return [...prev, { product: finalProduct, qty: 1 }];
        });
    };

    const handleProductClick = (product: any) => {
        if (product.options_config && Array.isArray(product.options_config) && product.options_config.length > 0) {
            const initial: any = {};
            product.options_config.forEach((cat: any) => {
                if (cat.type === 'multiple') {
                    initial[cat.name] = [];
                } else {
                    if (cat.choices && cat.choices.length > 0) {
                        initial[cat.name] = cat.choices[0];
                    }
                }
            });
            setSelectedOptions(initial);
            setSelectedProductForOptions(product);
            setShowOptionsModal(true);
        } else {
            addToCart(product);
        }
    };

    const clearCart = () => {
        setCart([]);
        setActiveQueueNumber(null);
        setCustomerName("");
    };

    const updateCartQty = (key: string, newQty: number) => {
        if (newQty < 1) return;
        setCart(prev => prev.map(p => ((p.product.cart_key || p.product.id) === key) ? { ...p, qty: newQty } : p));
    };

    const removeFromCart = (key: string) => {
        setCart(prev => prev.filter(p => (p.product.cart_key || p.product.id) !== key));
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
                    product_id: item.product.original_id || item.product.id,
                    product_name: item.product.variant_details 
                        ? `${item.product.name} (${item.product.variant_details})` 
                        : item.product.name,
                    quantity: item.qty,
                    price: item.product.price,
                    cogs: item.product.cogs || 0,
                    modifiers: item.product.modifiers || []
                })),
                staff_name: staff?.full_name || 'System'
            };
            // Bypass slow Vercel backend and insert directly to Supabase for instant speed
            const status = payload.amount_received >= payload.amount_due ? 'Paid' : 'Pending';
            const change_given = payload.amount_received >= payload.amount_due ? payload.amount_received - payload.amount_due : 0;

            const { data: transactionData, error: txError } = await supabase
                .from('transactions')
                .insert({
                    order_reference: payload.order_reference,
                    amount_due: payload.amount_due,
                    amount_received: payload.amount_received,
                    change_given,
                    tax_amount: payload.tax_amount || 0,
                    customer_name: payload.customer_name || null,
                    status,
                    payment_method_id: payload.payment_method_id
                })
                .select('*')
                .single();

            if (txError) throw txError;

            if (payload.items && payload.items.length > 0) {
                const orderItems = payload.items.map((item: any) => ({
                    transaction_id: transactionData.id,
                    product_id: item.product_id,
                    product_name: item.product_name,
                    quantity: item.quantity,
                    price_at_time: item.price,
                    cogs_at_time: item.cogs || 0,
                    modifiers: item.modifiers || []
                }));
                await supabase.from('order_items').insert(orderItems);
            }

            const result = transactionData;
            // --- HACK FOR OUTDATED VERCEL BACKEND: DEDUCT STOCK MANUALLY ---
            const prodStockUpdates: Record<string, number> = {};
            const matStockUpdates: Record<string, { delta: number, products: string[] }> = {};

            payload.items.forEach((item: any) => {
                const prod = products.find(p => p.id === item.product_id);
                if (prod) {
                    if (prod.stock !== undefined) {
                        prodStockUpdates[prod.id] = (prodStockUpdates[prod.id] || 0) + item.quantity;
                    }
                    if (prod.ingredients && Array.isArray(prod.ingredients)) {
                        prod.ingredients.forEach((ing: any) => {
                            const matId = ing.raw_material_id || ing.id;
                            if (matId && ing.qty > 0) {
                                if (!matStockUpdates[matId]) {
                                    matStockUpdates[matId] = { delta: 0, products: [] };
                                }
                                matStockUpdates[matId].delta += (ing.qty * item.quantity);
                                matStockUpdates[matId].products.push(item.product_name);
                            }
                        });
                    }
                }
            });

            await Promise.all([
                ...Object.keys(prodStockUpdates).map(async prodId => {
                    const prod = products.find(p => p.id === prodId);
                    if (prod) {
                        const newStock = Number(prod.stock) - prodStockUpdates[prodId];
                        await supabase.from('products').update({ stock: newStock }).eq('id', prodId);
                    }
                }),
                ...Object.keys(matStockUpdates).map(async matId => {
                    const { delta, products: prodNames } = matStockUpdates[matId];
                    const { data: matData } = await supabase.from('raw_materials').select('current_stock, name').eq('id', matId).single();
                    if (matData) {
                        const newStock = Number(matData.current_stock) - delta;
                        await supabase.from('raw_materials').update({ current_stock: newStock }).eq('id', matId);
                        await supabase.from('material_stock_logs').insert([{
                            material_id: matId,
                            material_name: matData.name,
                            delta: -delta,
                            current_stock: newStock,
                            note: `Terjual: ${Array.from(new Set(prodNames)).join(', ')} (Ref: ${orderRef})`,
                            staff_name: staff?.full_name || 'System'
                        }]);
                    }
                })
            ]);
            // ----------------------------------------------------------------

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
                        const { error: moveError } = await supabase.from('cash_movements').insert({
                            session_id: sessionId,
                            staff_id: staff.id,
                            type: 'sale',
                            amount: grandTotal
                        });

                        if (!moveError) {
                            const { data: session } = await supabase.from('cash_sessions').select('expected_cash').eq('id', sessionId).single();
                            if (session) {
                                await supabase.from('cash_sessions').update({ expected_cash: Number(session.expected_cash) + grandTotal }).eq('id', sessionId);
                            }
                        }
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
                <div className="bg-[#1a1a1c] p-4 md:p-8 rounded-2xl w-full max-w-[400px] shadow-2xl border border-gray-800 text-center">
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
                                className="text-[10px] bg-gray-800 hover:bg-gray-700 text-gray-300 px-3 py-1.5 whitespace-nowrap rounded border border-gray-700"
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
                        className="w-full bg-blue-600 text-white font-bold py-3 md:py-4 rounded-xl hover:bg-blue-500 transition-colors disabled:opacity-50"
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
        <div className="flex flex-col sm:flex-row h-screen w-full max-w-full bg-[#121214] text-gray-100 overflow-hidden print:block print:h-auto print:overflow-visible print:bg-white text-sm md:text-base">
            <div className="print:hidden"><ConfirmDialog /></div>
            {/* LEFT: PRODUCTS LIST */}
            <div className="flex-1 flex flex-col overflow-y-auto print:hidden">
                <div className="p-4 md:p-6 border-b border-gray-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-[#1a1a1c]">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white text-xl font-black">N</div>
                        <div>
                            <h1 className="text-xl font-bold text-white leading-tight">NexPos Terminal</h1>
                            <span className="text-gray-500 text-xs flex items-center gap-1"><Clock className="w-3 h-3" /> {new Date().toLocaleTimeString()}</span>
                        </div>
                        <button onClick={toggleFullscreen} className="ml-2 p-2 bg-gray-800 hover:bg-gray-700 rounded-xl transition-colors text-gray-300" title="Toggle Fullscreen">
                            <Maximize className="w-5 h-5" />
                        </button>
                    </div>
                    
                    {/* Staff Profile in POS Header */}
                    <div className="bg-[#121214] border border-gray-800 p-2 pr-4 rounded-full font-semibold flex items-center gap-3 text-sm shadow-sm overflow-x-auto whitespace-nowrap hide-scrollbar max-w-full">
                        <div className="w-8 h-8 bg-gray-800 rounded-full flex items-center justify-center text-blue-400 shrink-0">
                            <Banknote className="w-5 h-5" />
                        </div>
                        <div className="flex flex-col shrink-0">
                            <span className="text-gray-400 text-[10px] leading-tight">Kasir</span>
                            <span className="text-white text-xs font-bold">{staff?.full_name}</span>
                        </div>
                        {sessionData && (
                            <div className="flex gap-4 ml-2 pl-3 border-l border-gray-800 shrink-0 items-center bg-gray-900/50 p-2 rounded-xl border border-gray-800">
                                <div className="flex flex-col">
                                    <span className="text-gray-400 text-[10px] leading-tight">Modal Awal</span>
                                    <span className="text-blue-400 text-xs font-bold">Rp {Number(sessionData.opening_cash || 0).toLocaleString('id-ID')}</span>
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-gray-400 text-[10px] leading-tight">Pengeluaran</span>
                                    <span className="text-red-400 text-xs font-bold">Rp {Number(sessionData.total_expense || 0).toLocaleString('id-ID')}</span>
                                </div>
                                <div className="flex flex-col border-l border-gray-800 pl-4">
                                    <span className="text-gray-400 text-[10px] leading-tight">Refund</span>
                                    <span className="text-yellow-400 text-xs font-bold">Rp {Number(sessionData.total_refund || 0).toLocaleString('id-ID')}</span>
                                </div>
                                <div className="flex flex-col border-l border-gray-800 pl-4">
                                    <span className="text-gray-400 text-[10px] leading-tight">Laci (Sistem)</span>
                                    <span className="text-green-400 text-xs font-bold">Rp {Number(sessionData.expected_cash || 0).toLocaleString('id-ID')}</span>
                                </div>
                                <div className="flex flex-col border-l border-gray-800 pl-4">
                                    <span className="text-gray-400 text-[10px] leading-tight">Selisih (Penjualan Bersih)</span>
                                    <span className="text-purple-400 text-xs font-bold">Rp {Number((sessionData.expected_cash || 0) - (sessionData.opening_cash || 0) + (sessionData.total_expense || 0)).toLocaleString('id-ID')}</span>
                                </div>
                            </div>
                        )}
                        <div className="flex gap-2 ml-4 shrink-0">
                            <button onClick={() => setShowExpensesModal(true)} className="px-3 py-1 bg-orange-500/10 text-orange-400 rounded-full hover:bg-orange-500/20 font-bold text-[10px] uppercase tracking-wider border border-orange-500/20 transition-colors">
                                Catat Pengeluaran
                            </button>
                            <Link href="/admin?tab=raw_materials" className="px-3 py-1 bg-purple-500/10 text-purple-400 rounded-full hover:bg-purple-500/20 font-bold text-[10px] uppercase tracking-wider border border-purple-500/20 transition-colors flex items-center gap-1">
                                📦 Bahan Baku
                            </Link>
                            <Link href="/admin?tab=inventory" className="px-3 py-1 bg-green-500/10 text-green-400 rounded-full hover:bg-green-500/20 font-bold text-[10px] uppercase tracking-wider border border-green-500/20 transition-colors flex items-center gap-1">
                                📋 Produk & Stok
                            </Link>
                            <Link href="/admin" className="px-3 py-1 bg-blue-500/10 text-blue-400 rounded-full hover:bg-blue-500/20 font-bold text-[10px] uppercase tracking-wider border border-blue-500/20 transition-colors flex items-center justify-center">
                                Dashboard
                            </Link>
                            <button onClick={handleCloseSession} className="px-4 py-2 whitespace-nowrap bg-red-500/10 text-red-400 rounded-full hover:bg-red-500/20 font-bold text-[10px] uppercase tracking-wider border border-red-500/20 transition-colors">
                                Tutup Shift
                            </button>
                            <button onClick={handleLogout} className="px-4 py-2 whitespace-nowrap bg-gray-800 text-gray-300 rounded-full hover:bg-gray-700 font-bold text-[10px] uppercase tracking-wider transition-colors">
                                Logout
                            </button>
                        </div>
                    </div>
                </div>

                <div className="p-4 md:p-6 flex-1 overflow-y-auto no-scrollbar">
                    {/* INCOMING ORDERS NOTIFICATION */}
                    {pendingOrders.filter(o => o.status === 'pending').length > 0 && (
                        <div className="mb-6 p-4 bg-orange-500/10 border border-orange-500/20 rounded-2xl shadow-lg">
                            <h3 className="font-bold text-orange-400 mb-3 flex items-center gap-2">🛒 Pesanan Baru dari Customer</h3>
                            <div className="flex gap-3 overflow-x-auto pb-2 hide-scrollbar">
                                {pendingOrders.map((order: any, idx: number) => order.status === 'pending' && (
                                    <div key={order.id} className="relative group flex-shrink-0 min-w-[150px]">
                                        <button 
                                            onClick={() => loadCustomerOrder(order, idx)}
                                            className="w-full h-full bg-gradient-to-br from-orange-500/20 to-red-500/20 px-4 py-3 rounded-xl border border-orange-500/40 text-white font-bold hover:from-orange-500/30 hover:to-red-500/30 shadow-sm transition-all text-left flex flex-col relative overflow-hidden"
                                        >
                                            <div className="absolute top-0 right-0 w-2 h-full bg-orange-500 animate-pulse"></div>
                                            <span className="text-orange-400 text-xs mb-1">{order.queue_number || order.id}</span>
                                            <span>Rp {(order.total || 0).toLocaleString('id-ID')}</span>
                                        </button>
                                        <button
                                            onClick={(e) => handleDeletePendingOrder(order.id, order.queue_number, e)}
                                            className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shadow-lg transition-opacity z-10"
                                            title="Tolak Pesanan"
                                        >
                                            &#10005;
                                        </button>
                                    </div>
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
                                    <div key={order.id} className="relative group flex-shrink-0 min-w-[150px]">
                                        <button 
                                            onClick={() => loadCustomerOrder(order, idx)}
                                            className="w-full h-full bg-[#1a1a1c] px-4 py-3 rounded-xl border border-blue-500/20 text-white font-bold hover:bg-gray-800 shadow-sm transition-colors text-left flex flex-col"
                                        >
                                            <span className="text-blue-400 text-xs mb-1">{order.queue_number || order.id}</span>
                                            <span>Rp {(order.total || 0).toLocaleString('id-ID')}</span>
                                        </button>
                                        <button
                                            onClick={(e) => handleDeletePendingOrder(order.id, order.queue_number, e)}
                                            className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shadow-lg transition-opacity z-10"
                                            title="Hapus Draft"
                                        >
                                            &#10005;
                                        </button>
                                    </div>
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
                                    onClick={() => handleProductClick(p)}
                                    className={`bg-[#1a1a1c] rounded-2xl border border-gray-800 cursor-pointer hover:border-blue-500/50 hover:bg-gray-800/50 transition-all shadow-lg group overflow-hidden ${
                                        viewMode === 'grid' 
                                        ? "p-4 flex flex-col h-full relative text-left" 
                                        : "p-3 flex items-center justify-between gap-4"
                                    }`}
                                >
                                    <div className={viewMode === 'grid' ? "flex-1 relative z-10" : "flex items-center gap-4 relative z-10"}>
                                        {viewMode === 'list' && (
                                            <div className="text-2xl md:text-2xl md:text-3xl bg-gray-800/50 w-10 h-10 md:w-12 md:h-12 rounded-xl flex items-center justify-center transform group-hover:scale-110 transition-transform">
                                                {p.image_icon || '☕'}
                                            </div>
                                        )}
                                        <div>
                                            <div className="flex items-center gap-1.5 flex-wrap">
                                                <h3 className="font-bold text-[11px] md:text-xs leading-tight mb-1 text-white">{p.name}</h3>
                                                {p.options_config && p.options_config.length > 0 && viewMode === 'list' && (
                                                    <span className="text-[10px] bg-blue-500/20 text-blue-300 px-1.5 py-0.5 rounded font-bold mb-1">
                                                        ⚙️ {p.options_config.length} Opsi
                                                    </span>
                                                )}
                                            </div>
                                            {viewMode === 'list' && <p className="text-gray-500 text-xs">{p.category || 'Uncategorized'}</p>}
                                            {p.options_config && p.options_config.length > 0 && viewMode === 'grid' && (
                                                <div className="mt-1 flex flex-wrap gap-1">
                                                    <span className="text-[10px] bg-blue-500/10 text-blue-400 border border-blue-500/20 px-1.5 py-0.5 rounded font-medium">
                                                        ⚙️ {p.options_config.length} Pilihan/Addon
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <p className={`text-blue-400 font-bold ${viewMode === 'grid' ? "mt-2 text-sm md:text-base" : "text-sm md:text-base shrink-0"} relative z-10`}>
                                        Rp {p.price.toLocaleString("id-ID")}
                                    </p>
                                    
                                    {/* Decorative Background Icon (Grid Only) */}
                                    {viewMode === 'grid' && (
                                        <div className="absolute -bottom-2 -right-2 text-2xl md:text-4xl md:text-5xl opacity-5 group-hover:opacity-10 group-hover:scale-110 transition-all z-0">
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
            <div className={`w-full sm:w-[260px] md:w-[280px] lg:w-[320px] xl:w-[400px] h-full sm:h-screen bg-[#1a1a1c] shadow-2xl flex flex-col sm:border-t-0 sm:border-l border-gray-800 shrink-0 print:hidden fixed sm:relative inset-0 z-50 sm:z-10 transition-transform duration-300 ${isMobileCartOpen ? "translate-y-0" : "translate-y-full sm:translate-y-0"}`}>
                <div className="p-3 sm:p-4 md:p-5 border-b border-gray-800 flex justify-between items-center bg-[#1a1a1c]">
                    <h2 className="text-sm sm:text-base md:text-lg font-bold flex items-center gap-2 text-white">
                        <ShoppingCart className="w-5 h-5 text-blue-500" /> Current Order
                    </h2>
                    <div className="flex gap-2">
                        <button onClick={clearCart} className="text-red-400 hover:bg-red-500/10 p-2 rounded-lg transition-colors border border-transparent hover:border-red-500/20">
                            <Trash2 className="w-5 h-5" />
                        </button>
                        <button onClick={() => setIsMobileCartOpen(false)} className="sm:hidden text-gray-400 hover:text-white p-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors">
                            &#10005;
                        </button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-5">
                    {cart.length === 0 ? (
                        <div className="text-center text-gray-500 mt-20 flex flex-col items-center justify-center">
                            <ShoppingCart className="w-12 h-12 mb-4 opacity-20" />
                            <p>Keranjang kosong</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {cart.map((item, idx) => {
                                const itemKey = item.product.cart_key || item.product.id;
                                return (
                                <div key={itemKey || idx} className="flex flex-col gap-3 pb-4 border-b border-gray-800/50">
                                    <div className="flex justify-between items-start">
                                        <div className="flex-1 pr-3">
                                            <p className="font-bold text-xs md:text-sm leading-tight text-white mb-1">{item.product.name}</p>
                                            {item.product.variant_details && (
                                                <div className="text-[11px] text-blue-400 font-medium mb-1.5 bg-blue-500/10 px-2 py-0.5 rounded-md border border-blue-500/20 inline-block leading-tight">
                                                    {item.product.variant_details}
                                                </div>
                                            )}
                                            <p className="text-blue-400 font-bold text-xs md:text-sm">
                                                Rp {item.product.price.toLocaleString("id-ID")}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-bold text-sm md:text-base whitespace-nowrap text-white mb-2">
                                                Rp {(item.product.price * item.qty).toLocaleString("id-ID")}
                                            </p>
                                            <button onClick={() => removeFromCart(itemKey)} className="text-red-400 hover:text-red-300 p-2 bg-red-500/10 hover:bg-red-500/20 rounded-lg transition-colors inline-flex">
                                                <Trash2 className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button 
                                            onClick={() => updateCartQty(itemKey, item.qty - 1)}
                                            disabled={item.qty <= 1}
                                            className="w-10 h-10 flex items-center justify-center bg-gray-800 hover:bg-gray-700 disabled:opacity-50 text-white rounded-lg transition-colors border border-gray-700"
                                        >
                                            <Minus className="w-5 h-5" />
                                        </button>
                                        <input 
                                            type="number" 
                                            value={item.qty}
                                            onChange={(e) => updateCartQty(itemKey, parseInt(e.target.value) || 1)}
                                            className="w-14 h-10 bg-[#121214] text-center font-bold text-sm text-white border border-gray-800 rounded-lg outline-none focus:border-blue-500"
                                        />
                                        <button 
                                            onClick={() => updateCartQty(itemKey, item.qty + 1)}
                                            className="w-10 h-10 flex items-center justify-center bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors border border-gray-700"
                                        >
                                            <Plus className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>
                            );
                            })}
                        </div>
                    )}
                </div>

                <div className="p-4 md:p-6 bg-[#121214] border-t border-gray-800">
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
                        <span className="font-black text-2xl md:text-2xl md:text-3xl text-blue-400">Rp {grandTotal.toLocaleString("id-ID")}</span>
                    </div>
                    
                    <div className="flex gap-2">
                        <button 
                            onClick={handleSaveDraft}
                            disabled={cart.length === 0}
                            className="flex-1 bg-gray-800 hover:bg-gray-700 text-gray-300 py-3 md:py-4 rounded-xl font-bold text-sm md:text-base flex items-center justify-center gap-2 disabled:opacity-50 transition-colors shadow-lg border border-gray-700"
                        >
                            Bayar Nanti
                        </button>
                        <button 
                            onClick={() => setShowPayment(true)}
                            disabled={cart.length === 0}
                            className="flex-[2] bg-blue-600 hover:bg-blue-500 text-white py-3 md:py-4 rounded-xl font-bold text-base md:text-lg flex items-center justify-center gap-2 disabled:opacity-50 transition-colors shadow-lg shadow-blue-900/20"
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
                    <div className="bg-[#1a1a1c] border border-gray-800 p-4 md:p-6 md:p-4 md:p-8 rounded-3xl w-full max-w-[500px] shadow-2xl mt-16 mb-16">
                        {!paymentResult ? (
                            <>
                                <h2 className="text-2xl font-bold mb-6 border-b border-gray-800 pb-4 text-white">Pilih Pembayaran</h2>
                                <div className="text-center mb-8 p-4 md:p-6 bg-[#121214] rounded-2xl border border-gray-800">
                                    <p className="text-gray-400 mb-2">Total Tagihan</p>
                                    <p className="text-5xl font-black text-blue-400">Rp {grandTotal.toLocaleString("id-ID")}</p>
                                </div>
                                
                                {paymentMethods.length > 0 ? (
                                    <div className="mb-6">
                                        <label className="block text-sm font-bold mb-3 text-gray-300">Metode Pembayaran</label>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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
                                    <div className="mb-8 p-4 md:p-6 bg-gray-800/30 border border-gray-800 rounded-xl text-center text-gray-400">
                                        Sistem akan membuka jendela pembayaran pihak ketiga untuk {selectedMethod?.name}...
                                    </div>
                                )}

                                <div className="flex gap-4">
                                    <button 
                                        onClick={() => {
                                            setShowPayment(false);
                                            setAmountReceived("");
                                        }}
                                        className="flex-1 py-3 md:py-4 bg-gray-800 text-gray-300 rounded-xl font-bold hover:bg-gray-700 transition-colors"
                                    >
                                        Batal
                                    </button>
                                    <button 
                                        onClick={handlePayment}
                                        disabled={loading || !selectedMethod || (selectedMethod?.type?.toLowerCase() === 'cash' && Number(amountReceived) < grandTotal)}
                                        className="flex-1 py-3 md:py-4 bg-blue-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 disabled:opacity-50 hover:bg-blue-500 transition-colors"
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
                                <h2 className="text-2xl md:text-3xl font-black mb-1 text-white">{paymentResult?.isDraft ? "Pesanan Tersimpan!" : "Pembayaran Sukses!"}</h2>
                                <p className="text-gray-400 mb-6 flex flex-col items-center">
                                    <span className="text-[10px] uppercase tracking-wider mb-1">Nomor Antrean / Order</span>
                                    <span className="font-bold text-2xl text-white">{paymentResult.transaction?.order_reference || paymentResult.order_reference}</span>
                                </p>
                                <div className="flex flex-col md:flex-row gap-4">

                                    <button 
                                        onClick={() => {
                                            setTimeout(() => window.print(), 100);
                                        }}
                                        className="w-full bg-blue-600 hover:bg-blue-500 text-white py-3 md:py-4 rounded-xl font-bold text-lg transition-colors flex items-center justify-center gap-2"
                                    >
                                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"></path></svg>
                                        Cetak Desain (Web)
                                    </button>

                                    <button 
                                        onClick={() => {
                                            setPaymentResult(null);
                                            setShowPayment(false);
                                            setAmountReceived("");
                                        }}
                                        className="w-full bg-blue-600 hover:bg-blue-500 text-white py-3 md:py-4 rounded-xl font-bold text-lg transition-colors"
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
                        <h2 className="font-bold text-xl">{storeSettings?.cafe_name || 'NEXPOS'}</h2>
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
                        <table className="w-full text-left text-xs md:text-sm mb-4">
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
                        {storeSettings?.qris_enabled && storeSettings?.qris_image_base64 && paymentResult?.payment_method_name?.toLowerCase().includes('qris') && (
                            <div className="flex flex-col items-center justify-center my-4 w-full">
                                <p className="font-bold text-[10px] mb-1">SCAN QRIS UNTUK BAYAR</p>
                                <img src={storeSettings.qris_image_base64} alt="QRIS" style={{ width: "100%", height: "auto" }} className="w-full object-contain" />
                            </div>
                        )}
                        <p className="mb-2 font-bold whitespace-pre-wrap">{storeSettings?.receipt_footer || 'Terima kasih atas kunjungan Anda!'}</p>
                        {storeSettings?.wifi_password && (
                            <div className="mt-2 text-center">
                                {storeSettings?.wifi_name && <p className="font-bold">WiFi: {storeSettings.wifi_name}</p>}
                                <p>Pass: {storeSettings.wifi_password}</p>
                            </div>
                        )}
                        
                    </div>
                </div>
                </>
            )}

            {/* EXPENSES & RAW MATERIALS MODAL */}
                        {showCloseShiftModal && (
                <div className="fixed inset-0 bg-black/80 flex items-start justify-center z-50 p-4 backdrop-blur-md overflow-y-auto">
                    <div className="bg-[#131B2C] border border-gray-800 p-6 md:p-8 rounded-3xl w-full max-w-md shadow-2xl mt-16 mb-16">
                        <h3 className="font-bold text-xl text-white mb-2">Tutup Shift</h3>
                        <p className="text-gray-400 text-sm mb-6">Hitung seluruh uang fisik (kertas & koin) yang ada di dalam laci kasir saat ini, lalu masukkan totalnya di bawah ini.</p>
                        <input 
                            type="number" 
                            placeholder="Total Uang Fisik Laci (Rp)" 
                            value={actualCashInput}
                            onChange={(e) => setActualCashInput(e.target.value)}
                            className="w-full p-4 text-lg bg-gray-900 border border-gray-800 rounded-xl focus:border-blue-500 outline-none text-white font-bold mb-6"
                            autoFocus
                        />
                        <div className="flex gap-3">
                            <button 
                                onClick={() => setShowCloseShiftModal(false)}
                                className="flex-1 py-3 md:py-4 bg-gray-800 text-gray-300 rounded-xl font-bold hover:bg-gray-700 transition-colors"
                            >
                                Batal
                            </button>
                            <button 
                                onClick={submitCloseSession}
                                disabled={!actualCashInput || loading}
                                className="flex-1 py-3 md:py-4 bg-red-600 text-white rounded-xl font-bold hover:bg-red-500 transition-colors disabled:opacity-50"
                            >
                                {loading ? 'Menutup...' : 'Tutup Shift'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showExpensesModal && (
                <div className="fixed inset-0 bg-black/90 flex items-start justify-center z-[100] p-2 sm:p-4 md:p-6 backdrop-blur-sm overflow-y-auto print:hidden">
                    <div className="bg-[#1a1a1c] border border-gray-800 rounded-2xl sm:rounded-3xl w-full max-w-[98vw] shadow-2xl p-4 sm:p-6 lg:p-8 my-2 sm:my-4 flex-shrink-0 relative">
                        <button 
                            onClick={() => setShowExpensesModal(false)}
                            className="absolute top-4 right-4 sm:right-6 w-9 h-9 sm:w-10 sm:h-10 bg-gray-800 hover:bg-red-500 hover:text-white rounded-full flex items-center justify-center text-gray-400 transition-colors z-10"
                        >
                            ✕
                        </button>
                        
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 sm:mb-8 pr-12">
                            <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2 sm:gap-3">
                                <Banknote className="text-orange-500 w-6 h-6 shrink-0" /> Kelola Bahan Baku & Pengeluaran 
                            </h2>
                            <span className="text-xs sm:text-sm font-normal text-gray-400 px-3 py-1 bg-gray-800/80 border border-gray-700 rounded-full w-fit">
                                Staff: {staff?.full_name || 'Kasir'}
                            </span>
                        </div>

                        <div className="flex flex-col gap-6">
                            <div className="space-y-6 sm:space-y-8">
                                <div className="p-4 sm:p-6 bg-[#131B2C] rounded-2xl border border-gray-800 transition-all">
                                    <div className="flex justify-between items-center mb-5 border-b border-gray-800 pb-3 cursor-pointer" onClick={() => setCollapseAddMat(!collapseAddMat)}>
                                        <h3 className="font-bold text-base sm:text-lg text-white">
                                            Tambah Bahan Baku Baru
                                        </h3>
                                        <button type="button" className="text-gray-400 hover:text-white transition-colors">{collapseAddMat ? '+' : '−'}</button>
                                    </div>
                                    
                                    {!collapseAddMat && (
                                    <form onSubmit={handleCreateMaterial} className="space-y-4">
                                        <div>
                                            <label className="text-xs font-bold text-gray-400 block mb-1">Nama Bahan</label>
                                            <input type="text" placeholder="Nama Bahan (contoh: Susu)" required value={newMaterial.name} onChange={e => setNewMaterial({...newMaterial, name: e.target.value})} className="w-full p-3 bg-gray-900 border border-gray-800 rounded-xl focus:border-blue-500 outline-none text-white text-sm" />
                                        </div>
                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                            <div>
                                                <label className="text-xs font-bold text-gray-400 block mb-1">Satuan</label>
                                                <select value={newMaterial.unit} onChange={e => setNewMaterial({...newMaterial, unit: e.target.value})} className="w-full p-3 bg-gray-900 border border-gray-800 rounded-xl focus:border-blue-500 outline-none text-white text-xs sm:text-sm font-semibold">
                                                    <option value="g">Gram (g)</option>
                                                    <option value="ml">Mililiter (ml)</option>
                                                    <option value="pcs">Pieces (pcs)</option>
                                                    <option value="kg">Kilogram (kg)</option>
                                                    <option value="liter">Liter (l)</option>
                                                    <option value="pack">Pack</option>
                                                    <option value="dus">Dus</option>
                                                    <option value="botol">Botol</option>
                                                    <option value="kaleng">Kaleng</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className="text-xs font-bold text-gray-400 block mb-1">Stok Awal</label>
                                                <input type="number" step="any" placeholder="0" required value={newMaterial.current_stock || ''} onChange={e => setNewMaterial({...newMaterial, current_stock: Number(e.target.value)})} className="w-full p-3 bg-gray-900 border border-gray-800 rounded-xl focus:border-blue-500 outline-none text-white text-sm" />
                                            </div>
                                            <div>
                                                <label className="text-xs font-bold text-gray-400 block mb-1">Harga / Satuan</label>
                                                <input type="number" step="any" placeholder="Rp" required value={newMaterial.last_price_per_unit || ''} onChange={e => setNewMaterial({...newMaterial, last_price_per_unit: Number(e.target.value)})} className="w-full p-3 bg-gray-900 border border-gray-800 rounded-xl focus:border-blue-500 outline-none text-white text-sm" />
                                            </div>
                                        </div>
                                        <button type="submit" disabled={loading} className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-500 transition-colors text-sm sm:text-base">Simpan Bahan</button>
                                    </form>
                                    )}
                                </div>

                                <div className="bg-[#131B2C] border border-gray-800 rounded-2xl overflow-hidden">
                                    <div className="p-4 bg-gray-800/30 border-b border-gray-800 flex justify-between items-center cursor-pointer" onClick={() => setCollapseListMat(!collapseListMat)}>
                                        <h3 className="font-bold text-gray-300">Daftar Bahan Baku</h3>
                                        <button type="button" className="text-gray-400 hover:text-white transition-colors">{collapseListMat ? '+' : '−'}</button>
                                    </div>
                                    {!collapseListMat && (
                                    <div className="max-h-[300px] overflow-y-auto">
                                        {rawMaterials.length === 0 ? (
                                            <p className="p-4 md:p-6 text-gray-500 text-center text-sm">Belum ada bahan baku.</p>
                                        ) : (
                                            <div className="overflow-x-auto w-full">
                                                <table className="w-full text-left text-xs md:text-sm whitespace-nowrap min-w-max md:min-w-0 md:whitespace-normal">
                                                    <tbody>
                                                        {rawMaterials.map((mat: any) => (
                                                            <tr key={mat.id} className="border-b border-gray-800 hover:bg-gray-800/20 group">
                                                                <td className="p-3 sm:p-4">
                                                                    <div className="font-bold text-white">{mat.name}</div>
                                                                    {mat.updated_by_name && <div className="text-[10px] text-blue-400 mt-1">Oleh: {mat.updated_by_name}</div>}
                                                                </td>
                                                                <td className="p-3 sm:p-4 text-center"><span className="px-2.5 py-1 bg-gray-800 rounded-lg text-xs sm:text-sm font-bold">{mat.current_stock} {mat.unit}</span></td>
                                                                <td className="p-3 sm:p-4 text-right">
                                                                    <div className="flex gap-1 justify-end">
                                                                        <button onClick={() => { setSelectedMaterial(mat); setStockAdjustment({ delta: 0, note: '', price: mat.last_price_per_unit }); }} className="px-2 py-1 text-xs bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-lg hover:bg-blue-600 hover:text-white font-bold transition-colors">+/- Stok</button>
                                                                        {canEditRecord(mat.updated_by_name) && (
                                                                            <button onClick={() => handleDeleteMaterial(mat.id)} className="px-2 py-1 text-xs bg-red-500/10 text-red-400 border border-red-500/20 rounded-lg hover:bg-red-600 hover:text-white font-bold transition-colors">Hapus</button>
                                                                        )}
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        )}
                                    </div>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-6 sm:space-y-8">
                                <div className="p-4 sm:p-6 bg-[#131B2C] rounded-2xl border border-gray-800 transition-all">
                                    <div className="flex justify-between items-center mb-5 border-b border-gray-800 pb-3 cursor-pointer" onClick={() => setCollapseAddExp(!collapseAddExp)}>
                                        <div className="flex items-center gap-3">
                                            <h3 className="font-bold text-base sm:text-lg text-white">
                                                {editingExpense ? 'Edit Pengeluaran' : 'Catat Pengeluaran Operasional'}
                                            </h3>
                                            {editingExpense && (
                                                <button onClick={(e) => { e.stopPropagation(); setEditingExpense(null); setNewExpense({description: '', amount: 0, material_id: '', quantity: 0, payment_method: 'CASH', category: 'operasional'}); }} className="text-xs text-blue-400 hover:text-blue-300 px-2 py-1 bg-blue-500/10 rounded-md">Batal Edit</button>
                                            )}
                                        </div>
                                        <button type="button" className="text-gray-400 hover:text-white transition-colors">{collapseAddExp ? '+' : '−'}</button>
                                    </div>
                                    {!collapseAddExp && (
                                    <form onSubmit={editingExpense ? handleUpdateExpense : handleCreateExpense} className="space-y-4">
                                        <div className="flex flex-wrap gap-4 mb-2">
                                            <label className="flex items-center gap-2 text-white cursor-pointer text-xs sm:text-sm">
                                                <input type="radio" name="payment_method_pos" value="CASH" checked={newExpense.payment_method === 'CASH'} onChange={e => setNewExpense({...newExpense, payment_method: e.target.value})} className="w-4 h-4 text-blue-500" />
                                                <span>Uang Kasir (Cash)</span>
                                            </label>
                                            <label className="flex items-center gap-2 text-white cursor-pointer text-xs sm:text-sm">
                                                <input type="radio" name="payment_method_pos" value="QRIS" checked={newExpense.payment_method === 'QRIS'} onChange={e => setNewExpense({...newExpense, payment_method: e.target.value})} className="w-4 h-4 text-blue-500" />
                                                <span>Saldo Rekening (QRIS/Trf)</span>
                                            </label>
                                        </div>
                                        {/* Kategori Pengeluaran */}
                                        {(() => {
                                            const currentCat = (editingExpense ? (editingExpense.category || 'operasional') : (newExpense.category || 'operasional')).toLowerCase();
                                            const setCat = (cat: string) => {
                                                if (editingExpense) setEditingExpense({...editingExpense, category: cat, material_id: cat === 'operasional' ? '' : editingExpense.material_id});
                                                else setNewExpense({...newExpense, category: cat, material_id: cat === 'operasional' ? '' : newExpense.material_id});
                                            };
                                            const activeMaterialId = editingExpense ? (editingExpense.material_id || '') : (newExpense.material_id || '');
                                            const activeQuantity = editingExpense ? (editingExpense.quantity || '') : (newExpense.quantity || '');
                                            const activeBuyUnit = editingExpense ? (editingExpense.buy_unit || 'kg') : (newExpense.buy_unit || 'kg');
                                            const activeAmount = editingExpense ? Number(editingExpense.amount || 0) : Number(newExpense.amount || 0);

                                            return (
                                                <>
                                                    <div className="flex gap-3 mb-2 p-1.5 sm:p-2 bg-gray-900 border border-gray-800 rounded-xl">
                                                        <label className={`flex-1 py-2 text-center rounded-lg cursor-pointer text-xs sm:text-sm font-bold transition-all ${currentCat === 'operasional' ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' : 'text-gray-400 hover:bg-gray-800'}`}>
                                                            <input type="radio" name="exp_category_pos" value="operasional" checked={currentCat === 'operasional'} onChange={() => setCat('operasional')} className="hidden" />
                                                            ⚙️ Operasional
                                                        </label>
                                                        <label className={`flex-1 py-2 text-center rounded-lg cursor-pointer text-xs sm:text-sm font-bold transition-all ${currentCat === 'bahan_baku' ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'text-gray-400 hover:bg-gray-800'}`}>
                                                            <input type="radio" name="exp_category_pos" value="bahan_baku" checked={currentCat === 'bahan_baku'} onChange={() => setCat('bahan_baku')} className="hidden" />
                                                            🧪 Bahan Baku
                                                        </label>
                                                    </div>

                                                    <div>
                                                        <label className="text-xs font-bold text-gray-400 block mb-1">Deskripsi Pengeluaran</label>
                                                        <input type="text" placeholder="Contoh: Beli Es Batu, Plastik..." required value={editingExpense ? editingExpense.description : newExpense.description} onChange={e => editingExpense ? setEditingExpense({...editingExpense, description: e.target.value}) : setNewExpense({...newExpense, description: e.target.value})} className="w-full p-3 bg-gray-900 border border-gray-800 rounded-xl focus:border-blue-500 outline-none text-white text-sm" />
                                                    </div>

                                                    <div>
                                                        <label className="text-xs font-bold text-gray-400 block mb-1">Nominal (Rp)</label>
                                                        <input type="number" placeholder="Rp" required value={editingExpense ? editingExpense.amount || '' : newExpense.amount || ''} onChange={e => editingExpense ? setEditingExpense({...editingExpense, amount: Number(e.target.value)}) : setNewExpense({...newExpense, amount: Number(e.target.value)})} className="w-full p-3 bg-gray-900 border border-gray-800 rounded-xl focus:border-blue-500 outline-none text-white text-sm" />
                                                    </div>
                                                    
                                                    {currentCat === 'bahan_baku' && (
                                                        <div className="p-3.5 bg-green-500/5 border border-green-500/20 rounded-xl space-y-3">
                                                            <div className="flex justify-between items-center">
                                                                <label className="text-xs font-bold text-green-400 block">Bahan Baku (Wajib)</label>
                                                                {!editingExpense && !showInlineAddMaterial && (
                                                                    <button type="button" onClick={() => setShowInlineAddMaterial(true)} className="text-[10px] font-bold text-blue-400 bg-blue-500/10 px-2.5 py-1 rounded hover:bg-blue-500/20 transition-colors">+ Tambah Jenis Baru</button>
                                                                )}
                                                            </div>
                                                            
                                                            {!editingExpense && showInlineAddMaterial && (
                                                                <div className="p-3 bg-blue-900/10 border border-blue-500/20 rounded-xl mb-3 space-y-2">
                                                                    <input type="text" placeholder="Nama Bahan Baru (Cth: Susu Oat)" value={inlineNewMaterial.name} onChange={e => setInlineNewMaterial({...inlineNewMaterial, name: e.target.value})} className="w-full p-2.5 text-sm bg-[#0B0F19] border border-gray-700 rounded-lg text-white outline-none" />
                                                                    <div className="flex flex-col sm:flex-row gap-2">
                                                                        <select value={inlineNewMaterial.unit} onChange={e => setInlineNewMaterial({...inlineNewMaterial, unit: e.target.value})} className="flex-1 p-2.5 text-sm bg-[#0B0F19] border border-gray-700 rounded-lg text-white outline-none font-semibold">
                                                                            <option value="g">Gram (g)</option>
                                                                            <option value="ml">Mililiter (ml)</option>
                                                                            <option value="pcs">Pieces (pcs)</option>
                                                                            <option value="kg">Kilogram (kg)</option>
                                                                            <option value="liter">Liter (l)</option>
                                                                            <option value="pack">Pack</option>
                                                                            <option value="dus">Dus</option>
                                                                            <option value="botol">Botol</option>
                                                                            <option value="kaleng">Kaleng</option>
                                                                        </select>
                                                                        <div className="flex gap-2 shrink-0">
                                                                            <button type="button" onClick={handleInlineAddMaterial} className="flex-1 sm:flex-none px-3 py-2 bg-blue-600 text-white text-xs font-bold rounded-lg hover:bg-blue-500">Simpan Bahan</button>
                                                                            <button type="button" onClick={() => setShowInlineAddMaterial(false)} className="flex-1 sm:flex-none px-3 py-2 bg-gray-800 text-gray-400 text-xs font-bold rounded-lg hover:bg-gray-700">Batal</button>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            )}

                                                            <div className="space-y-3">
                                                                <div>
                                                                    <label className="text-xs font-bold text-gray-400 block mb-1">Pilih Bahan Baku</label>
                                                                    <select 
                                                                        value={activeMaterialId} 
                                                                        onChange={e => {
                                                                            const mId = e.target.value;
                                                                            const m = rawMaterials.find(rm => rm.id === mId);
                                                                            const defUnit = m ? (m.unit === 'g' ? 'kg' : m.unit === 'ml' ? 'liter' : m.unit) : 'kg';
                                                                            if (editingExpense) setEditingExpense({...editingExpense, material_id: mId, buy_unit: defUnit});
                                                                            else setNewExpense({...newExpense, material_id: mId, buy_unit: defUnit});
                                                                        }}
                                                                        className={`w-full p-3 bg-gray-900 border rounded-xl focus:border-blue-500 outline-none text-white text-sm ${
                                                                            !activeMaterialId ? 'border-red-500/50' : 'border-gray-800'
                                                                        }`}
                                                                        required
                                                                    >
                                                                        <option value="">-- Pilih Bahan Baku --</option>
                                                                        {rawMaterials.map(m => (
                                                                            <option key={m.id} value={m.id}>{m.name} ({m.unit})</option>
                                                                        ))}
                                                                    </select>
                                                                </div>
                                                                
                                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                                    <div>
                                                                        <label className="text-xs font-bold text-gray-400 block mb-1">Kuantitas Dibeli</label>
                                                                        <input 
                                                                            type="number" 
                                                                            step="any"
                                                                            placeholder="Contoh: 1 atau 500" 
                                                                            value={activeQuantity} 
                                                                            onChange={e => {
                                                                                const val = Number(e.target.value);
                                                                                if (editingExpense) setEditingExpense({...editingExpense, quantity: val});
                                                                                else setNewExpense({...newExpense, quantity: val});
                                                                            }}
                                                                            className="w-full p-3 bg-gray-900 border border-gray-800 rounded-xl focus:border-blue-500 outline-none text-white text-sm"
                                                                        />
                                                                    </div>
                                                                    <div>
                                                                        <label className="text-xs font-bold text-gray-400 block mb-1">Satuan Beli</label>
                                                                        <select 
                                                                            value={activeBuyUnit} 
                                                                            onChange={e => {
                                                                                const val = e.target.value;
                                                                                if (editingExpense) setEditingExpense({...editingExpense, buy_unit: val});
                                                                                else setNewExpense({...newExpense, buy_unit: val});
                                                                            }}
                                                                            className="w-full p-3 bg-gray-900 border border-gray-800 rounded-xl focus:border-blue-500 outline-none text-white text-sm font-bold"
                                                                        >
                                                                            <option value="kg">kg (kilogram)</option>
                                                                            <option value="g">gram (g)</option>
                                                                            <option value="liter">liter (l)</option>
                                                                            <option value="ml">ml (mililiter)</option>
                                                                            <option value="pcs">pcs</option>
                                                                            <option value="pack">pack</option>
                                                                            <option value="dus">dus</option>
                                                                            <option value="botol">botol</option>
                                                                            <option value="kaleng">kaleng</option>
                                                                        </select>
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            {/* Real-time Calculation Helper */}
                                                            {(() => {
                                                                const mat = rawMaterials.find(m => m.id === activeMaterialId);
                                                                if (!mat || !activeQuantity || !activeAmount) return null;
                                                                let mult = 1;
                                                                if ((mat.unit === 'g' || mat.unit === 'gr') && activeBuyUnit === 'kg') mult = 1000;
                                                                else if (mat.unit === 'ml' && (activeBuyUnit === 'liter' || activeBuyUnit === 'l')) mult = 1000;
                                                                const totalUnits = Number(activeQuantity) * mult;
                                                                const unitPrice = totalUnits > 0 ? (activeAmount / totalUnits) : 0;
                                                                return (
                                                                    <div className="text-[11px] bg-green-950/40 border border-green-500/30 p-2.5 rounded-lg text-green-300">
                                                                        <span className="font-bold">Konversi:</span> {activeQuantity} {activeBuyUnit} = {totalUnits.toLocaleString('id-ID')} {mat.unit}
                                                                        <br />
                                                                        <span className="font-bold">Harga per {mat.unit}:</span> Rp {unitPrice.toLocaleString('id-ID', { maximumFractionDigits: 2 })} / {mat.unit}
                                                                    </div>
                                                                );
                                                            })()}
                                                        </div>
                                                    )}
                                                </>
                                            );
                                        })()}
                                        
                                        <button type="submit" disabled={loading} className="w-full py-3 bg-orange-600/20 text-orange-400 border border-orange-500/30 rounded-xl font-bold hover:bg-orange-500/30 mt-2">
                                            {editingExpense ? 'Simpan Perubahan' : 'Simpan Pengeluaran'}
                                        </button>
                                    </form>
                                    )}
                                </div>

                                <div className="bg-[#131B2C] border border-gray-800 rounded-2xl overflow-hidden">
                                    <div className="p-4 bg-gray-800/30 border-b border-gray-800 flex flex-col sm:flex-row gap-2 justify-between sm:items-center cursor-pointer" onClick={() => setCollapseListExp(!collapseListExp)}>
                                        <div className="flex items-center gap-2">
                                            <h3 className="font-bold text-gray-300">Riwayat Pengeluaran</h3>
                                            <button type="button" className="text-gray-400 hover:text-white transition-colors">{collapseListExp ? '+' : '−'}</button>
                                        </div>
                                        <div className="flex gap-1 bg-gray-900 rounded-lg p-1 border border-gray-700" onClick={e => e.stopPropagation()}>
                                            {[{k:'all',l:'Semua'},{k:'bahan_baku',l:'🧪 Bahan'},{k:'operasional',l:'⚙️ Ops'}].map(f => (
                                                <button key={f.k} type="button" onClick={() => setPosExpenseCategoryFilter(f.k as any)}
                                                    className={`px-2 py-0.5 rounded text-xs font-bold transition-all ${
                                                        posExpenseCategoryFilter === f.k ? 'bg-orange-500 text-white' : 'text-gray-400 hover:text-white'
                                                    }`}>{f.l}</button>
                                            ))}
                                        </div>
                                    </div>
                                    {!collapseListExp && (
                                    <div className="max-h-[300px] overflow-y-auto">
                                        {(() => {
                                            const getPosCategory = (e: any) => (e.category || (e.raw_material_id ? 'bahan_baku' : 'operasional')).toLowerCase();
                                            const filteredPosExpenses = expenses.filter(e => posExpenseCategoryFilter === 'all' || getPosCategory(e) === posExpenseCategoryFilter);
                                            return filteredPosExpenses.length === 0 ? (
                                                <p className="p-4 md:p-6 text-gray-500 text-center text-sm">Belum ada pengeluaran dicatat.</p>
                                            ) : (
                                                <div className="overflow-x-auto w-full">
                                                    <table className="w-full text-left text-xs md:text-sm whitespace-nowrap min-w-max md:min-w-0 md:whitespace-normal">
                                                        <tbody>
                                                            {filteredPosExpenses.map((exp: any) => {
                                                                const isBahan = getPosCategory(exp) === 'bahan_baku';
                                                                return (
                                                                    <tr key={exp.id} className="border-b border-gray-800 hover:bg-gray-800/20 group">
                                                                        <td className="p-4">
                                                                            <div className="font-bold text-white">{exp.description}</div>
                                                                            <div className="text-[10px] text-gray-500 mt-1">{new Date(exp.expense_date || exp.created_at).toLocaleDateString('id-ID')} {new Date(exp.expense_date || exp.created_at).toLocaleTimeString('id-ID', {hour: '2-digit', minute:'2-digit'})}</div>
                                                                        </td>
                                                                        <td className="p-4 text-center">
                                                                            <span className={`px-2 py-1 rounded-md text-[10px] font-bold border ${
                                                                                isBahan
                                                                                    ? 'bg-green-500/10 text-green-400 border-green-500/20'
                                                                                    : 'bg-orange-500/10 text-orange-400 border-orange-500/20'
                                                                            }`}>
                                                                                {isBahan ? '🧪 Bahan' : '⚙️ Ops'}
                                                                            </span>
                                                                        </td>
                                                                        <td className="p-4 text-center">
                                                                            {exp.staff_name ? (
                                                                                <span className="px-2 py-1 bg-blue-500/10 text-blue-400 rounded-md text-[10px] font-bold border border-blue-500/20">{exp.staff_name}</span>
                                                                            ) : (
                                                                                <span className="px-2 py-1 bg-gray-800 text-gray-400 rounded-md text-[10px] border border-gray-700">Owner</span>
                                                                            )}
                                                                        </td>
                                                                        <td className="p-4 text-right text-orange-400 font-bold">
                                                                            <div className="mb-2">Rp {Number(exp.amount).toLocaleString('id-ID')}</div>
                                                                            {canEditRecord(exp.staff_name) && (
                                                                                <div className="flex gap-1 justify-end">
                                                                                    <button 
                                                                                        onClick={() => {
                                                                                            const matId = exp.raw_material_id || exp.material_id || '';
                                                                                            const mat = rawMaterials.find(m => m.id === matId);
                                                                                            const parsed = parseExpenseQtyAndUnit(exp, mat, materialStockLogs);
                                                                                            setEditingExpense({
                                                                                                ...exp, 
                                                                                                category: isBahan ? 'bahan_baku' : 'operasional', 
                                                                                                material_id: matId,
                                                                                                quantity: parsed.qty,
                                                                                                buy_unit: parsed.unit,
                                                                                                description: cleanExpenseDescription(exp.description)
                                                                                            });
                                                                                        }} 
                                                                                        className="px-2 py-1 text-[10px] bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-md hover:bg-blue-600 hover:text-white font-bold transition-colors"
                                                                                    >
                                                                                        Edit
                                                                                    </button>
                                                                                    <button onClick={() => handleDeleteExpense(exp.id)} className="px-2 py-1 text-[10px] bg-red-500/10 text-red-400 border border-red-500/20 rounded-md hover:bg-red-600 hover:text-white font-bold transition-colors">Hapus</button>
                                                                                </div>
                                                                            )}
                                                                        </td>
                                                                    </tr>
                                                                );
                                                            })}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            );
                                        })()}
                                    </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Adjust Material Stock Modal */}
            {selectedMaterial && (
                <div className="fixed inset-0 bg-black/80 flex items-start justify-center z-[200] p-4 overflow-y-auto backdrop-blur-md">
                    <div className="bg-[#131B2C] border border-gray-800 p-4 md:p-8 rounded-3xl w-full max-w-lg shadow-2xl mt-16 mb-16">
                        <div className="flex justify-between items-center mb-6 border-b border-gray-800 pb-4">
                            <div>
                                <h3 className="font-bold text-lg md:text-xl text-white">Update Stok Bahan</h3>
                                <p className="text-gray-400 font-bold mt-1">{selectedMaterial.name}</p>
                            </div>
                            <span className="text-sm bg-gray-800 px-3 py-1.5 rounded-lg text-gray-300 font-bold">Stok: {selectedMaterial.current_stock} {selectedMaterial.unit}</span>
                        </div>
                        <form onSubmit={handleAdjustStock} className="space-y-4 md:space-y-5">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">
                                <div>
                                    <label className="text-xs md:text-sm font-bold text-gray-400 block mb-2">Penambahan / Pengurangan</label>
                                    <div className="flex items-center gap-2">
                                        <button type="button" onClick={() => setStockAdjustment({...stockAdjustment, delta: (Number(stockAdjustment.delta) || 0) - 1})} className="w-10 h-10 md:w-12 md:h-12 shrink-0 flex items-center justify-center bg-gray-800 hover:bg-gray-700 text-white rounded-xl text-xl md:text-2xl font-black border border-gray-700">-</button>
                                        <input type="number" step="any" className="flex-1 min-w-0 w-full text-center bg-gray-900 border border-gray-800 rounded-xl py-2 md:py-3 text-white font-bold text-base md:text-lg outline-none focus:border-blue-500" value={stockAdjustment.delta || ''} onChange={e => setStockAdjustment({...stockAdjustment, delta: Number(e.target.value) || 0})} placeholder="0" />
                                        <button type="button" onClick={() => setStockAdjustment({...stockAdjustment, delta: (Number(stockAdjustment.delta) || 0) + 1})} className="w-10 h-10 md:w-12 md:h-12 shrink-0 flex items-center justify-center bg-gray-800 hover:bg-gray-700 text-white rounded-xl text-xl md:text-2xl font-black border border-gray-700">+</button>
                                        
                                        {/* UNIT SELECTOR */}
                                        <select 
                                            value={stockAdjustment.unit || selectedMaterial.unit} 
                                            onChange={e => setStockAdjustment({...stockAdjustment, unit: e.target.value})}
                                            className="w-28 p-2 md:p-3 bg-gray-900 border border-gray-800 rounded-xl text-white font-bold text-xs md:text-sm outline-none focus:border-blue-500 h-10 md:h-12"
                                        >
                                            {(selectedMaterial.unit === 'g' || selectedMaterial.unit === 'gr') && (
                                                <>
                                                    <option value="g">Gram (g)</option>
                                                    <option value="kg">Kg (1000g)</option>
                                                </>
                                            )}
                                            {(selectedMaterial.unit === 'ml' || selectedMaterial.unit === 'liter' || selectedMaterial.unit === 'l') && (
                                                <>
                                                    <option value="ml">Mililiter (ml)</option>
                                                    <option value="liter">Liter (1000ml)</option>
                                                </>
                                            )}
                                            {selectedMaterial.unit === 'pcs' && (
                                                <>
                                                    <option value="pcs">Pieces (pcs)</option>
                                                    <option value="pack">Pack</option>
                                                    <option value="dus">Dus</option>
                                                </>
                                            )}
                                            {!['g', 'gr', 'ml', 'liter', 'l', 'pcs'].includes(selectedMaterial.unit) && (
                                                <>
                                                    <option value={selectedMaterial.unit}>{selectedMaterial.unit}</option>
                                                    <option value="kg">kg</option>
                                                    <option value="g">g</option>
                                                    <option value="liter">liter</option>
                                                    <option value="ml">ml</option>
                                                    <option value="pcs">pcs</option>
                                                    <option value="pack">pack</option>
                                                    <option value="dus">dus</option>
                                                </>
                                            )}
                                        </select>
                                    </div>
                                </div>
                                <div>
                                    <label className="text-xs md:text-sm font-bold text-gray-400 block mb-2">Harga Beli Total (Opsional)</label>
                                    <input type="number" placeholder="Bila kosong = harga lama" value={stockAdjustment.price || ''} onChange={e => setStockAdjustment({...stockAdjustment, price: Number(e.target.value)})} className="w-full p-2 md:p-3 bg-gray-900 border border-gray-800 rounded-xl focus:border-blue-500 outline-none text-white h-10 md:h-12 text-sm" />
                                </div>
                            </div>

                            {/* Smart Conversion Helper Preview */}
                            {(() => {
                                const adjUnit = stockAdjustment.unit || selectedMaterial.unit;
                                let mult = 1;
                                if ((selectedMaterial.unit === 'g' || selectedMaterial.unit === 'gr') && adjUnit === 'kg') mult = 1000;
                                else if (selectedMaterial.unit === 'ml' && (adjUnit === 'liter' || adjUnit === 'l')) mult = 1000;
                                const effDelta = (Number(stockAdjustment.delta) || 0) * mult;
                                const finalStock = Number(selectedMaterial.current_stock) + effDelta;
                                return (
                                    <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-3 text-xs text-blue-300 flex flex-col gap-1.5">
                                        <div className="flex justify-between items-center">
                                            <span>Perubahan Stok: <b className={effDelta >= 0 ? 'text-green-400' : 'text-red-400'}>{effDelta >= 0 ? `+${effDelta.toLocaleString('id-ID')}` : effDelta.toLocaleString('id-ID')} {selectedMaterial.unit}</b></span>
                                            <span>Stok Akhir: <b className="text-white">{finalStock.toLocaleString('id-ID')} {selectedMaterial.unit}</b></span>
                                        </div>
                                        {stockAdjustment.price > 0 && (
                                            <div className="text-[11px] text-green-300 border-t border-blue-500/20 pt-1">
                                                💡 Harga Baru per {selectedMaterial.unit}: <b>Rp {((mult > 1 ? (Number(stockAdjustment.price) / (Math.abs(effDelta) || 1)) : Number(stockAdjustment.price))).toLocaleString('id-ID', { maximumFractionDigits: 2 })} / {selectedMaterial.unit}</b>
                                            </div>
                                        )}
                                    </div>
                                );
                            })()}

                            <div>
                                <label className="text-xs md:text-sm font-bold text-gray-400 block mb-1 md:mb-2">Keterangan Aktivitas</label>
                                <input type="text" placeholder="Contoh: Beli bahan baru, terpakai tester..." required value={stockAdjustment.note || ''} onChange={e => setStockAdjustment({...stockAdjustment, note: e.target.value})} className="w-full p-2 md:p-3 text-sm md:text-base bg-gray-900 border border-gray-800 rounded-xl focus:border-blue-500 outline-none text-white" />
                            </div>
                            <p className="text-xs text-gray-500">💡 <b>Tip:</b> Anda bisa langsung mengetik jumlah di kotak angka. Gunakan angka minus (-) jika bahan terpakai/dibuang.</p>
                            <div className="flex gap-4 mt-6 pt-4 border-t border-gray-800">
                                <button type="button" onClick={() => setSelectedMaterial(null)} className="flex-1 py-2 md:py-3 text-sm md:text-base bg-gray-800 text-gray-300 rounded-xl font-bold hover:bg-gray-700 transition-colors">Batal</button>
                                <button type="submit" disabled={loading} className="flex-1 py-2 md:py-3 text-sm md:text-base bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-500 transition-colors">Simpan Stok</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* PRODUCT OPTIONS & ADD-ON MODAL */}
            {showOptionsModal && selectedProductForOptions && (
                <div className="fixed inset-0 bg-black/80 z-50 flex items-start justify-center p-4 backdrop-blur-sm overflow-y-auto">
                    <div className="bg-[#1a1a1c] p-6 rounded-3xl w-full max-w-lg shadow-2xl border border-gray-800 relative max-h-[90vh] flex flex-col mt-16 mb-16">
                        <div className="flex justify-between items-start mb-4 pb-3 border-b border-gray-800">
                            <div>
                                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                    <span>{selectedProductForOptions.image_icon || '☕'}</span>
                                    <span>{selectedProductForOptions.name}</span>
                                </h2>
                                <p className="text-gray-400 text-xs mt-1">
                                    Harga Dasar: <span className="text-blue-400 font-semibold">Rp {Number(selectedProductForOptions.price).toLocaleString('id-ID')}</span>
                                </p>
                            </div>
                            <button 
                                onClick={() => setShowOptionsModal(false)} 
                                className="w-8 h-8 rounded-full bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700 flex items-center justify-center font-bold text-sm transition-colors"
                            >
                                ✕
                            </button>
                        </div>
                        
                        <div className="flex-1 overflow-y-auto pr-1 space-y-4">
                            {(selectedProductForOptions.options_config || []).map((cat: any, i: number) => {
                                const isMulti = cat.type === 'multiple';
                                const currentVal = selectedOptions[cat.name];
                                return (
                                    <div key={i} className="bg-gray-900/60 p-4 rounded-2xl border border-gray-800/80">
                                        <div className="flex justify-between items-center mb-3">
                                            <h3 className="font-bold text-sm text-gray-200 flex items-center gap-2">
                                                <span>{cat.name}</span>
                                                {cat.is_required && (
                                                    <span className="text-[10px] bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full font-bold">Wajib</span>
                                                )}
                                            </h3>
                                            <span className="text-[11px] text-gray-500 font-medium">
                                                {isMulti ? 'Bisa pilih lebih dari 1' : 'Pilih salah satu'}
                                            </span>
                                        </div>
                                        
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                            {(cat.choices || []).map((choice: any, j: number) => {
                                                const isSelected = isMulti 
                                                    ? Array.isArray(currentVal) && currentVal.some((c: any) => c.name === choice.name)
                                                    : currentVal?.name === choice.name;
                                                
                                                const handleToggle = () => {
                                                    if (isMulti) {
                                                        const arr = Array.isArray(currentVal) ? [...currentVal] : [];
                                                        const existsIdx = arr.findIndex((c: any) => c.name === choice.name);
                                                        if (existsIdx >= 0) {
                                                            arr.splice(existsIdx, 1);
                                                        } else {
                                                            arr.push(choice);
                                                        }
                                                        setSelectedOptions({ ...selectedOptions, [cat.name]: arr });
                                                    } else {
                                                        setSelectedOptions({ ...selectedOptions, [cat.name]: choice });
                                                    }
                                                };

                                                return (
                                                    <div 
                                                        key={j} 
                                                        onClick={handleToggle}
                                                        className={`flex items-center justify-between p-3 rounded-xl cursor-pointer border transition-all select-none ${
                                                            isSelected 
                                                                ? 'bg-blue-600/20 border-blue-500 text-white shadow-sm ring-1 ring-blue-500/30' 
                                                                : 'bg-gray-800/60 border-gray-700/60 text-gray-300 hover:border-gray-600 hover:bg-gray-800'
                                                        }`}
                                                    >
                                                        <div className="flex items-center gap-2.5">
                                                            <div className={`w-4 h-4 rounded-${isMulti ? 'md' : 'full'} border flex items-center justify-center text-[10px] transition-colors ${
                                                                isSelected ? 'border-blue-500 bg-blue-500 text-white' : 'border-gray-600 bg-gray-900'
                                                            }`}>
                                                                {isSelected && (isMulti ? '✓' : '•')}
                                                            </div>
                                                            <span className="text-xs font-semibold">{choice.name}</span>
                                                        </div>
                                                        {Number(choice.price_adjustment) > 0 && (
                                                            <span className={`text-[11px] font-bold px-1.5 py-0.5 rounded ${
                                                                isSelected ? 'bg-blue-500/30 text-blue-300' : 'bg-gray-700/60 text-blue-400'
                                                            }`}>
                                                                +Rp {Number(choice.price_adjustment).toLocaleString('id-ID')}
                                                            </span>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                        
                        {/* Modal Footer with Dynamic Total Price */}
                        <div className="mt-5 pt-4 border-t border-gray-800 flex items-center justify-between gap-4">
                            <div>
                                <span className="text-xs text-gray-500 block">Total per Porsi</span>
                                <span className="text-xl font-black text-blue-400">
                                    Rp {(() => {
                                        let total = Number(selectedProductForOptions.price) || 0;
                                        Object.values(selectedOptions).forEach((val: any) => {
                                            if (Array.isArray(val)) {
                                                val.forEach((c: any) => total += Number(c.price_adjustment) || 0);
                                            } else if (val && typeof val === 'object') {
                                                total += Number(val.price_adjustment) || 0;
                                            }
                                        });
                                        const disc = Number(selectedProductForOptions.discount_percentage) || 0;
                                        return (disc > 0 ? total * (1 - disc / 100) : total).toLocaleString('id-ID');
                                    })()}
                                </span>
                            </div>
                            <button 
                                onClick={() => {
                                    addToCart(selectedProductForOptions, selectedOptions);
                                    setShowOptionsModal(false);
                                }}
                                className="flex-1 py-3 px-6 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow-lg transition-all text-sm flex items-center justify-center gap-2"
                            >
                                + Tambahkan ke Pesanan
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {/* MOBILE FLOATING CART BUTTON */}
            {!isMobileCartOpen && (
                <button
                    onClick={() => setIsMobileCartOpen(true)}
                    className="sm:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-blue-600 hover:bg-blue-500 text-white shadow-[0_10px_40px_rgba(37,99,235,0.5)] px-6 py-3.5 rounded-full font-bold flex items-center gap-3 transition-transform"
                >
                    <ShoppingCart className="w-5 h-5" />
                    <span>Lihat Pesanan</span>
                    {cart.reduce((sum, item) => sum + item.qty, 0) > 0 && (
                        <span className="bg-white text-blue-600 px-2.5 py-0.5 rounded-full text-xs font-black">
                            {cart.reduce((sum, item) => sum + item.qty, 0)} item
                        </span>
                    )}
                </button>
            )}

        </div>
    );
}
