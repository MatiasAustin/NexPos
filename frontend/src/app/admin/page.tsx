"use client";

import { useState, useEffect } from "react";
import { getReconciliationReport, getAuditLogs } from "@/lib/api";
import Link from "next/link";
import { ArrowLeft, RefreshCw, AlertTriangle, ShieldCheck, Users, Package, FileText, Settings, Upload } from "lucide-react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import ReportChart from "@/components/ReportChart";

export default function AdminDashboard() {
    const [activeTab, setActiveTab] = useState<"reconciliation" | "audit" | "staff" | "inventory" | "history" | "settings" | "expenses">("reconciliation");
    const [reconciliation, setReconciliation] = useState<any[]>([]);
    const [reconciliationMode, setReconciliationMode] = useState<"daily" | "weekly" | "monthly" | "yearly">("daily");
    const [reconciliationDate, setReconciliationDate] = useState(new Date().toISOString().split('T')[0]);
    const [auditLogs, setAuditLogs] = useState<any[]>([]);
    const [transactions, setTransactions] = useState<any[]>([]);
    const [historyFilterType, setHistoryFilterType] = useState<"date" | "month" | "year">("date");
    const [historyFilterDate, setHistoryFilterDate] = useState(new Date().toISOString().split('T')[0]);
    const [historyFilterMonth, setHistoryFilterMonth] = useState(`${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`);
    const [historyFilterYear, setHistoryFilterYear] = useState(String(new Date().getFullYear()));
    const [staffList, setStaffList] = useState<any[]>([]);
    
    // Edit & Expenses States
    const [editingProduct, setEditingProduct] = useState<any>(null);
    const [editingStaff, setEditingStaff] = useState<any>(null);
    const [editingMaterial, setEditingMaterial] = useState<any>(null);
    const [editingExpense, setEditingExpense] = useState<any>(null);
    const [expenses, setExpenses] = useState<any[]>([]);
    const [rawMaterials, setRawMaterials] = useState<any[]>([]);
    const [newExpense, setNewExpense] = useState({ description: '', amount: 0 });
    const [newMaterial, setNewMaterial] = useState({ name: '', unit: '', current_stock: 0, last_price_per_unit: 0 });
    const [newStaff, setNewStaff] = useState({ full_name: '', email: '', password: '', role: 'staff' });
    
    // Store Settings
    const [storeSettings, setStoreSettings] = useState({
        logo_base64: "",
        qris_image_base64: "",
        cafe_name: "NexPos Cafe",
        receipt_footer: "Terima kasih atas kunjungan Anda!",
        wifi_name: "",
        wifi_password: "",
        tax_enabled: false,
        tax_rate: 0,
        logo_size: 60,
        qris_size: 120
    });

    // Inventory states
    const [products, setProducts] = useState<any[]>([]);
    const [newProduct, setNewProduct] = useState<{name: string, category: string, price: number, cogs: number, stock: number, image_icon: string, ingredients: {name: string, cost: number}[]}>({ 
        name: '', category: '', price: 0, cogs: 0, stock: 0, image_icon: '📦', ingredients: [] 
    });
    
    const [loading, setLoading] = useState(false);
    const [profile, setProfile] = useState<any>(null);
    const router = useRouter();

    useEffect(() => {
        fetchData();
    }, [activeTab]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                router.push('/login');
                return;
            }

            const { data: prof } = await supabase.from('staff_profiles').select('*').eq('id', session.user.id).single();
            if (!prof || prof.role !== 'owner') {
                alert("Akses ditolak. Anda bukan Admin/Owner.");
                router.push('/pos');
                return;
            }
            setProfile(prof);

            if (activeTab === "reconciliation") {
                const today = new Date().toISOString().split('T')[0];
                const res = await getReconciliationReport(today, today);
                // Ensure it's an array
                setReconciliation(Array.isArray(res) ? res : (res?.sessions || []));
            } else if (activeTab === "audit") {
                await fetchAuditLogs();
            } else if (activeTab === "staff") {
                // Fetch staff list from backend (requires API endpoint)
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/staff`);
                if(res.ok) setStaffList(await res.json());
            } else if (activeTab === "inventory") {
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/products`);
                if(res.ok) setProducts(await res.json());
            } else if (activeTab === "history") {
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/transactions`);
                if(res.ok) setTransactions(await res.json());
            } else if (activeTab === "settings") {
                try {
                    const { data, error } = await supabase.from('store_settings').select('*').limit(1).maybeSingle();
                    if (data) {
                        setStoreSettings({
                            logo_base64: data.logo_base64 || "",
                            qris_image_base64: data.qris_image_base64 || "",
                            cafe_name: data.cafe_name || "NexPos Cafe",
                            receipt_footer: data.receipt_footer || "Terima kasih atas kunjungan Anda!",
                            wifi_name: data.wifi_name || "",
                            wifi_password: data.wifi_password || "",
                            tax_enabled: !!data.tax_enabled,
                            tax_rate: Number(data.tax_rate) || 0,
                            logo_size: Number(data.logo_size) || 60,
                            qris_size: Number(data.qris_size) || 120
                        });
                    }
                } catch(e) {
                    console.error("Store settings table might not exist yet", e);
                }
            } else if (activeTab === "expenses") {
                const { data: exp } = await supabase.from('expenses').select('*').order('created_at', { ascending: false });
                setExpenses(exp || []);
                const { data: mat } = await supabase.from('raw_materials').select('*').order('name', { ascending: true });
                setRawMaterials(mat || []);
            }
        } catch (error) {
            console.error("Error fetching data", error);
        }
        setLoading(false);
    };

    const handleSaveSettings = async () => {
        setLoading(true);
        try {
            const { data, error: selectErr } = await supabase.from('store_settings').select('id').maybeSingle();
            
            if (data?.id) {
                const { error } = await supabase.from('store_settings').update(storeSettings).eq('id', data.id);
                if (error) throw error;
            } else {
                const { error } = await supabase.from('store_settings').insert([storeSettings]);
                if (error) throw error;
            }
            alert("Pengaturan Toko berhasil disimpan!");
            // Sync locally to avoid waiting for db if used locally
            localStorage.setItem("nexpos_store_settings", JSON.stringify(storeSettings));
        } catch(e: any) {
            alert("Gagal menyimpan. Error: " + (e.message || "Pastikan script SQL dijalankan."));
        }
        setLoading(false);
    };

    const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                if (event.target?.result) {
                    setStoreSettings({ ...storeSettings, logo_base64: event.target.result.toString() });
                }
            };
            reader.readAsDataURL(file);
        }
    };

    const handleQrisUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                if (event.target?.result) {
                    setStoreSettings({ ...storeSettings, qris_image_base64: event.target.result.toString() });
                }
            };
            reader.readAsDataURL(file);
        }
    };

    const handleTestPrint = () => {
        window.print();
    };

    const fetchReconciliation = async (date: string) => {
        setLoading(true);
        try {
            const res = await getReconciliationReport(date, date);
            setReconciliation(Array.isArray(res) ? res : []);
        } catch (e) {
            console.error(e);
        }
        setLoading(false);
    };

    const getFilteredTransactions = () => {
        return transactions.filter(trx => {
            const trxDate = new Date(trx.created_at);
            if (historyFilterType === 'date') {
                return trx.created_at?.startsWith(historyFilterDate);
            } else if (historyFilterType === 'month') {
                const ym = `${trxDate.getFullYear()}-${String(trxDate.getMonth() + 1).padStart(2, '0')}`;
                return ym === historyFilterMonth;
            } else {
                return String(trxDate.getFullYear()) === historyFilterYear;
            }
        });
    };

    const handleCreateStaff = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/staff`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newStaff)
            });
            if(res.ok) {
                alert("Staf berhasil ditambahkan!");
                setNewStaff({ full_name: '', email: '', password: '', role: 'staff' });
                fetchData();
            } else {
                const err = await res.json();
                alert(err.error);
            }
        } catch(error) {
            alert("Terjadi kesalahan.");
        }
        setLoading(false);
    };

    const handleCreateProduct = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        
        // Hitung total HPP otomatis dari bahan baku (jika ada)
        const computedCogs = newProduct.ingredients.length > 0 
            ? newProduct.ingredients.reduce((sum, item) => sum + item.cost, 0)
            : Number(newProduct.cogs);

        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/products`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...newProduct,
                    price: Number(newProduct.price),
                    cogs: computedCogs,
                    stock: Number(newProduct.stock),
                    ingredients: newProduct.ingredients
                })
            });
            if(res.ok) {
                alert("Produk berhasil ditambahkan!");
                setNewProduct({ name: '', category: '', price: 0, cogs: 0, stock: 0, image_icon: '📦', ingredients: [] });
                fetchData();
            } else {
                const err = await res.json();
                alert(err.error);
            }
        } catch(error) {
            alert("Terjadi kesalahan.");
        }
        setLoading(false);
    };

    const handleRefund = async (trx: any) => {
        const reason = prompt(`Masukkan alasan refund untuk transaksi ${trx.order_reference}:`);
        if (!reason) return; // Cancelled
        
        const confirm = window.confirm(`Anda yakin ingin melakukan refund senilai Rp ${trx.amount_received.toLocaleString('id-ID')}?`);
        if (!confirm) return;

        setLoading(true);
        try {
            // Kita butuh staff/owner id yang saat ini login
            const { data: { session } } = await supabase.auth.getSession();
            
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/refunds`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    transaction_id: trx.id,
                    refund_amount: trx.amount_received, // Full refund
                    reason: reason,
                    requested_by: session?.user?.id
                })
            });
            if(res.ok) {
                alert("Refund berhasil diproses!");
                fetchData(); // reload history
            } else {
                const err = await res.json();
                alert(err.error);
            }
        } catch(error) {
            alert("Terjadi kesalahan sistem saat memproses refund.");
        }
        setLoading(false);
    };

    const handleUpdateProduct = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        const computedCogs = editingProduct.ingredients.length > 0 
            ? editingProduct.ingredients.reduce((sum: number, item: any) => sum + item.cost, 0)
            : Number(editingProduct.cogs);

        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/products/${editingProduct.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: editingProduct.name,
                    category: editingProduct.category,
                    price: Number(editingProduct.price),
                    cogs: computedCogs,
                    stock: Number(editingProduct.stock),
                    image_icon: editingProduct.image_icon,
                    ingredients: editingProduct.ingredients
                })
            });
            if(res.ok) {
                alert("Produk berhasil diperbarui!");
                setEditingProduct(null);
                fetchData();
            } else {
                const err = await res.json();
                alert(err.error);
            }
        } catch(error) {
            alert("Terjadi kesalahan.");
        }
        setLoading(false);
    };

    const handleDeleteTransaction = async (trx: any) => {
        if (!window.confirm(`Hapus transaksi ${trx.order_reference} secara permanen? Laporan akan ikut terhapus.`)) return;
        setLoading(true);
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/transactions/${trx.id}`, {
                method: 'DELETE'
            });
            if(res.ok || res.status === 204) {
                alert("Transaksi berhasil dihapus.");
                fetchData();
            } else {
                const err = await res.json();
                alert(err.error);
            }
        } catch(error) {
            alert("Terjadi kesalahan sistem saat menghapus.");
        }
        setLoading(false);
    };

    const handleCreateExpense = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const { error } = await supabase.from('expenses').insert([{
                description: newExpense.description,
                amount: Number(newExpense.amount),
                recorded_by: profile?.id
            }]);
            if (error) throw error;
            alert("Pengeluaran dicatat.");
            setNewExpense({ description: '', amount: 0 });
            fetchData();
        } catch (e: any) { alert(e.message); }
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
            alert("Pengeluaran diperbarui.");
            setEditingExpense(null);
            fetchData();
        } catch (e: any) { alert(e.message); }
        setLoading(false);
    };

    const handleDeleteExpense = async (id: string) => {
        if (!window.confirm("Hapus pengeluaran ini secara permanen?")) return;
        setLoading(true);
        const { error } = await supabase.from('expenses').delete().eq('id', id);
        if (error) alert(error.message);
        else { fetchData(); }
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
                last_price_per_unit: Number(newMaterial.last_price_per_unit)
            }]);
            if (error) throw error;
            alert("Bahan Baku ditambahkan.");
            setNewMaterial({ name: '', unit: '', current_stock: 0, last_price_per_unit: 0 });
            fetchData();
        } catch (e: any) { alert(e.message); }
        setLoading(false);
    };

    const handleUpdateMaterial = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const { error } = await supabase.from('raw_materials')
                .update({
                    name: editingMaterial.name,
                    unit: editingMaterial.unit,
                    current_stock: Number(editingMaterial.current_stock),
                    last_price_per_unit: Number(editingMaterial.last_price_per_unit)
                })
                .eq('id', editingMaterial.id);
            if (error) throw error;
            alert("Bahan Baku diperbarui.");
            setEditingMaterial(null);
            fetchData();
        } catch (e: any) { alert(e.message); }
        setLoading(false);
    };

    const handleDeleteMaterial = async (id: string) => {
        if (!window.confirm("Hapus bahan baku ini secara permanen?")) return;
        setLoading(true);
        const { error } = await supabase.from('raw_materials').delete().eq('id', id);
        if (error) alert(error.message);
        else { fetchData(); }
        setLoading(false);
    };

    const fetchAuditLogs = async () => {
        // Fetch directly from Supabase to bypass any backend RLS issues
        const { data, error } = await supabase
            .from('audit_logs')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(100);
        if (!error && data) {
            setAuditLogs(data);
        } else {
            // Fallback: also try via backend
            try {
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/audit-logs?limit=100`);
                if (res.ok) setAuditLogs(await res.json());
            } catch(e) {}
        }
    };

    const handleUpdateStaff = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/staff/${editingStaff.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    full_name: editingStaff.full_name,
                    role: editingStaff.role,
                    password: editingStaff.password // optional
                })
            });
            if(res.ok) {
                alert("Data staf berhasil diperbarui!");
                setEditingStaff(null);
                fetchData();
            } else {
                const err = await res.json();
                alert(err.error);
            }
        } catch(error) {
            alert("Terjadi kesalahan.");
        }
        setLoading(false);
    };

    const handleDeleteStaff = async (id: string) => {
        if(!confirm("Yakin ingin menghapus staf ini?")) return;
        setLoading(true);
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/staff/${id}`, {
                method: 'DELETE'
            });
            if(res.ok) {
                alert("Staf berhasil dihapus!");
                fetchData();
            } else {
                const err = await res.json();
                alert(err.error);
            }
        } catch(error) {
            alert("Terjadi kesalahan.");
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchData();
    }, [activeTab]);

    const addIngredient = () => {
        setNewProduct(prev => ({
            ...prev,
            ingredients: [...prev.ingredients, { name: '', cost: 0 }]
        }));
    };

    const updateIngredient = (index: number, field: string, value: any) => {
        setNewProduct(prev => {
            const newIngs = [...prev.ingredients];
            newIngs[index] = { ...newIngs[index], [field]: value };
            return { ...prev, ingredients: newIngs };
        });
    };

    const removeIngredient = (index: number) => {
        setNewProduct(prev => {
            const newIngs = [...prev.ingredients];
            newIngs.splice(index, 1);
            return { ...prev, ingredients: newIngs };
        });
    };

    const addIngredientEdit = () => {
        setEditingProduct((prev: any) => ({
            ...prev,
            ingredients: [...(prev.ingredients || []), { name: '', cost: 0 }]
        }));
    };

    const updateIngredientEdit = (index: number, field: string, value: any) => {
        setEditingProduct((prev: any) => {
            const newIngs = [...(prev.ingredients || [])];
            newIngs[index] = { ...newIngs[index], [field]: value };
            return { ...prev, ingredients: newIngs };
        });
    };

    const removeIngredientEdit = (index: number) => {
        setEditingProduct((prev: any) => {
            const newIngs = [...(prev.ingredients || [])];
            newIngs.splice(index, 1);
            return { ...prev, ingredients: newIngs };
        });
    };

    return (
        <>
        <style dangerouslySetInnerHTML={{__html: `
            @media print {
                body * { visibility: hidden; }
                .print-receipt, .print-receipt * { visibility: visible; }
                .print-receipt { position: absolute; left: 0; top: 0; width: 100%; max-width: 80mm; padding: 10px; font-family: monospace; color: #000; background: #fff; }
            }
        `}} />
        <div className="min-h-screen bg-[#0B0F19] text-gray-100 flex flex-col md:flex-row font-sans selection:bg-blue-500/30 print:hidden">
            {/* Sidebar */}
            <div className="w-full md:w-[280px] bg-[#131B2C] border-b md:border-b-0 md:border-r border-gray-800/60 flex flex-col shrink-0 z-20">
                <div className="p-6 border-b border-gray-800/60 flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-3">
                            <span className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center text-white text-lg shadow-lg shadow-blue-900/20">N</span>
                            Dashbrd X
                        </h1>
                        <p className="text-gray-500 text-xs font-semibold uppercase tracking-wider mt-2">NexPos Control Center</p>
                    </div>
                    <Link href="/" className="md:hidden p-2 text-gray-400 hover:text-white bg-gray-800/50 rounded-xl">
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                </div>
                
                {/* Horizontal Scroll on Mobile, Vertical on Desktop */}
                <div className="flex-1 overflow-y-auto overflow-x-auto md:overflow-x-hidden p-4 flex flex-row md:flex-col gap-2 no-scrollbar">
                    {[
                        { id: "reconciliation", label: "Laporan Rekonsiliasi", icon: AlertTriangle },
                        { id: "history", label: "Riwayat Transaksi", icon: FileText },
                        { id: "inventory", label: "Produk & Stok", icon: Package },
                        { id: "expenses", label: "Bahan & Pengeluaran", icon: FileText },
                        { id: "staff", label: "Manajemen Staf", icon: Users },
                        { id: "audit", label: "Security Log", icon: ShieldCheck },
                        { id: "settings", label: "Pengaturan Toko", icon: Settings },
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`flex-shrink-0 md:w-full flex items-center gap-3 px-4 py-3 rounded-2xl font-semibold transition-all ${activeTab === tab.id ? "bg-blue-600 text-white shadow-lg shadow-blue-900/20" : "text-gray-400 hover:text-white hover:bg-gray-800/40"}`}
                        >
                            <tab.icon className={`w-5 h-5 ${activeTab === tab.id ? "text-white" : "text-gray-500"}`} /> 
                            <span className="whitespace-nowrap">{tab.label}</span>
                        </button>
                    ))}
                </div>
                
                <div className="p-4 border-t border-gray-800/60 hidden md:block">
                    <Link href="/" className="hidden md:flex items-center gap-2 text-gray-500 hover:text-gray-300 transition-colors w-full px-4 py-2 font-medium">
                        <ArrowLeft className="w-4 h-4" /> Kembali ke Home
                    </Link>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col h-screen overflow-hidden">
                {/* Top Header */}
                <div className="h-20 border-b border-gray-800/60 px-6 md:px-8 flex items-center justify-between shrink-0 bg-[#0B0F19]">
                    <div className="flex items-center gap-4">
                        <h2 className="text-xl md:text-2xl font-bold text-white capitalize">
                            {activeTab.replace('reconciliation', 'Rekonsiliasi').replace('history', 'Riwayat Transaksi')}
                        </h2>
                        <button 
                            onClick={fetchData}
                            className="flex items-center gap-2 px-4 py-2 bg-gray-800/40 text-gray-300 rounded-full text-sm font-semibold hover:bg-gray-700/50 transition-colors border border-gray-800"
                        >
                            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-blue-400" : ""}`} /> 
                            <span className="hidden md:inline">Refresh</span>
                        </button>
                    </div>

                    {/* Staff / Admin Profile Badge */}
                    <div className="flex items-center gap-3 bg-[#131B2C] border border-gray-800/60 px-4 py-2 rounded-full">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-purple-600 flex items-center justify-center text-sm font-bold text-white shadow-sm">
                            {profile?.full_name ? profile.full_name.charAt(0).toUpperCase() : 'A'}
                        </div>
                        <div className="flex flex-col hidden sm:flex">
                            <span className="text-sm font-bold leading-tight text-white">{profile?.full_name || 'Admin System'}</span>
                            <span className="text-[10px] text-blue-400 font-bold uppercase tracking-wider">{profile?.role || 'Owner Access'}</span>
                        </div>
                    </div>
                </div>

                {/* Content Scrollable Area */}
                <div className="flex-1 overflow-y-auto p-4 md:p-8">
                    {loading ? (
                        <div className="flex items-center justify-center h-full text-gray-500">Memuat data dari server...</div>
                    ) : (
                        <div className="space-y-6">
                            {/* RECONCILIATION TAB */}
                            {activeTab === "reconciliation" && (
                                <div className="space-y-6">
                                    <ReportChart />

                                    <div className="bg-[#131B2C] border border-gray-800 rounded-2xl overflow-hidden shadow-xl">
                                        <div className="p-6 border-b border-gray-800 flex flex-col sm:flex-row gap-3 justify-between items-start sm:items-center">
                                            <h3 className="font-bold text-xl text-white">Data Rekonsiliasi Berdasarkan Tanggal</h3>
                                            <div className="flex gap-2 items-center">
                                                <input
                                                    type="date"
                                                    value={reconciliationDate}
                                                    onChange={e => setReconciliationDate(e.target.value)}
                                                    className="bg-gray-900 border border-gray-700 text-white rounded-xl px-3 py-2 text-sm outline-none focus:border-blue-500"
                                                />
                                                <button
                                                    onClick={() => fetchReconciliation(reconciliationDate)}
                                                    className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-500"
                                                >
                                                    Tampilkan
                                                </button>
                                            </div>
                                        </div>
                                        {reconciliation.length === 0 ? (
                                            <p className="p-8 text-gray-500 text-center">Belum ada transaksi hari ini.</p>
                                        ) : (
                                            <div className="overflow-x-auto">
                                            <table className="w-full text-left border-collapse">
                                                <thead>
                                                    <tr className="bg-gray-800/50 border-b border-gray-800">
                                                        <th className="p-4 font-semibold text-gray-400">Metode</th>
                                                        <th className="p-4 font-semibold text-gray-400">Trx</th>
                                                        <th className="p-4 font-semibold text-gray-400 text-right">POS Total</th>
                                                        <th className="p-4 font-semibold text-gray-400 text-right">Provider Total</th>
                                                        <th className="p-4 font-semibold text-gray-400 text-right">Selisih</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {reconciliation.map((row, idx) => (
                                                        <tr key={idx} className="border-b border-gray-800 hover:bg-gray-800/30">
                                                            <td className="p-4 font-medium text-gray-200">{row.method_name}</td>
                                                            <td className="p-4 text-gray-400">{row.transaction_count}</td>
                                                            <td className="p-4 text-right font-bold text-blue-400">{row.pos_total.toLocaleString('id-ID')}</td>
                                                            <td className="p-4 text-right text-gray-400">{row.pos_total.toLocaleString('id-ID')}</td>
                                                            <td className="p-4 text-right font-bold text-green-400">0</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </div>
                                </div>
                            )}

                            {/* HISTORY & REFUND TAB */}
                            {activeTab === "history" && (() => {
                                const filteredTransactions = getFilteredTransactions();

                                return (
                                    <div className="space-y-6">
                                        <div className="bg-[#131B2C] p-5 rounded-2xl border border-gray-800/60 shadow-lg">
                                            <h3 className="font-bold text-white mb-4">Filter Riwayat Transaksi</h3>
                                            <div className="flex flex-wrap gap-3 items-end">
                                                <div className="flex bg-gray-900 rounded-xl p-1 border border-gray-800">
                                                    {[{k:'date',l:'Per Tanggal'},{k:'month',l:'Per Bulan'},{k:'year',l:'Per Tahun'}].map(f => (
                                                        <button key={f.k} onClick={() => setHistoryFilterType(f.k as any)}
                                                            className={`px-3 py-1.5 rounded-lg text-sm font-bold transition-all ${historyFilterType === f.k ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`}>
                                                            {f.l}
                                                        </button>
                                                    ))}
                                                </div>
                                                {historyFilterType === 'date' && (
                                                    <input type="date" value={historyFilterDate}
                                                        onChange={e => setHistoryFilterDate(e.target.value)}
                                                        className="bg-gray-900 border border-gray-700 text-white rounded-xl px-3 py-2 text-sm outline-none focus:border-blue-500" />
                                                )}
                                                {historyFilterType === 'month' && (
                                                    <input type="month" value={historyFilterMonth}
                                                        onChange={e => setHistoryFilterMonth(e.target.value)}
                                                        className="bg-gray-900 border border-gray-700 text-white rounded-xl px-3 py-2 text-sm outline-none focus:border-blue-500" />
                                                )}
                                                {historyFilterType === 'year' && (
                                                    <select value={historyFilterYear} onChange={e => setHistoryFilterYear(e.target.value)}
                                                        className="bg-gray-900 border border-gray-700 text-white rounded-xl px-3 py-2 text-sm outline-none focus:border-blue-500">
                                                        {Array.from({length: 5}, (_, i) => new Date().getFullYear() - i).map(y => (
                                                            <option key={y} value={y}>{y}</option>
                                                        ))}
                                                    </select>
                                                )}
                                                <span className="text-gray-500 text-sm">{filteredTransactions.length} transaksi ditemukan</span>
                                            </div>
                                        </div>

                                        <div className="space-y-4">
                                            {filteredTransactions.length === 0 ? (
                                                <p className="p-8 text-gray-500 text-center bg-[#131B2C] rounded-2xl border border-gray-800/60 shadow-lg">Belum ada transaksi pada periode ini.</p>
                                            ) : (
                                                filteredTransactions.map((trx: any) => (
                                                    <div key={trx.id} className="p-5 bg-[#131B2C] rounded-2xl border border-gray-800/60 shadow-lg flex flex-col md:flex-row gap-4 justify-between transition-colors hover:border-blue-500/30">
                                                        <div>
                                                            <div className="flex items-center gap-3 mb-2">
                                                                <span className="font-bold text-white text-lg">{trx.order_reference}</span>
                                                                <span className={`px-2.5 py-1 text-xs font-bold rounded-lg ${trx.status === 'Paid' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : trx.status === 'Refunded' ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-gray-800 text-gray-300'}`}>
                                                                    {trx.status}
                                                                </span>
                                                            </div>
                                                            <p className="text-sm text-gray-400 mb-3">Metode: <span className="text-gray-200">{trx.payment_methods?.name || 'Unknown'}</span> | {new Date(trx.created_at).toLocaleString('id-ID')}</p>
                                                    
                                                    {trx.order_items && trx.order_items.length > 0 && (
                                                        <div className="bg-gray-800/30 p-3 rounded-xl border border-gray-800">
                                                            <ul className="text-sm space-y-1.5">
                                                                {trx.order_items.map((item: any, idx: number) => (
                                                                    <li key={idx} className="flex justify-between text-gray-300">
                                                                        <span><span className="text-gray-500 mr-2">{item.quantity}x</span> {item.product_name}</span>
                                                                        <span className="text-gray-400">Rp {(item.quantity * item.price_at_time).toLocaleString('id-ID')}</span>
                                                                    </li>
                                                                ))}
                                                            </ul>
                                                        </div>
                                                    )}
                                                </div>
                                                
                                                <div className="text-right min-w-[150px] flex flex-col justify-between">
                                                    <div>
                                                        <p className="text-sm text-gray-500 mb-1">Total</p>
                                                        <p className="font-bold text-2xl text-white">Rp {trx.amount_received.toLocaleString('id-ID')}</p>
                                                    </div>
                                                    
                                                    <div className="flex flex-col gap-2 mt-4">
                                                        {trx.status === 'Paid' && (
                                                            <button 
                                                                onClick={() => handleRefund(trx)}
                                                                className="px-4 py-2 bg-red-500/10 text-red-400 border border-red-500/20 rounded-xl text-sm font-bold hover:bg-red-500/20 transition-colors"
                                                            >
                                                                Refund
                                                            </button>
                                                        )}
                                                        {profile?.role === 'owner' && (
                                                            <button 
                                                                onClick={() => handleDeleteTransaction(trx)}
                                                                className="px-4 py-2 bg-red-900/40 text-red-300 border border-red-500/30 rounded-xl text-sm font-bold hover:bg-red-800 transition-colors"
                                                            >
                                                                Hapus Permanen
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                        </div>
                                    </div>
                                );
                            })()}

                            {/* INVENTORY TAB */}
                            {activeTab === "inventory" && (
                                <div className="space-y-6">
                                    <form onSubmit={handleCreateProduct} className="p-6 md:p-8 bg-[#131B2C] rounded-2xl border border-gray-800 shadow-xl">
                                        <h3 className="font-bold text-lg mb-6 text-white border-b border-gray-800 pb-3">Tambah Produk Baru</h3>
                                        <div className="grid grid-cols-2 md:grid-cols-3 gap-5 mb-6">
                                            <input type="text" placeholder="Nama Produk" required value={newProduct.name} onChange={e => setNewProduct({...newProduct, name: e.target.value})} className="p-3 bg-gray-900 border border-gray-800 rounded-xl focus:border-blue-500 focus:outline-none text-white" />
                                            <input type="text" placeholder="Kategori" required value={newProduct.category} onChange={e => setNewProduct({...newProduct, category: e.target.value})} className="p-3 bg-gray-900 border border-gray-800 rounded-xl focus:border-blue-500 focus:outline-none text-white" />
                                            <input type="text" placeholder="Icon (Emoji)" value={newProduct.image_icon} onChange={e => setNewProduct({...newProduct, image_icon: e.target.value})} className="p-3 bg-gray-900 border border-gray-800 rounded-xl focus:border-blue-500 focus:outline-none text-white" />
                                            <div><label className="text-xs text-gray-500 mb-2 block">Harga Jual (Rp)</label><input type="number" placeholder="0" required value={newProduct.price} onChange={e => setNewProduct({...newProduct, price: Number(e.target.value)})} className="w-full p-3 bg-gray-900 border border-gray-800 rounded-xl focus:border-blue-500 focus:outline-none text-white" /></div>
                                            <div><label className="text-xs text-gray-500 mb-2 block">HPP / Modal (Rp)</label><input type="number" placeholder="0" required value={newProduct.cogs} onChange={e => setNewProduct({...newProduct, cogs: Number(e.target.value)})} className="w-full p-3 bg-gray-900 border border-gray-800 rounded-xl focus:border-blue-500 focus:outline-none text-white" /></div>
                                            <div><label className="text-xs text-gray-500 mb-2 block">Stok Awal</label><input type="number" placeholder="0" required value={newProduct.stock} onChange={e => setNewProduct({...newProduct, stock: Number(e.target.value)})} className="w-full p-3 bg-gray-900 border border-gray-800 rounded-xl focus:border-blue-500 focus:outline-none text-white" /></div>
                                        </div>
                                        
                                        <div className="mb-6 p-5 bg-gray-900 border border-gray-800 rounded-xl">
                                            <div className="flex justify-between items-center mb-4">
                                                <h4 className="font-bold text-gray-300">Bahan Baku (Opsional)</h4>
                                                <button type="button" onClick={addIngredient} className="text-sm px-3 py-1.5 bg-blue-500/10 text-blue-400 border border-blue-500/20 font-bold rounded-lg hover:bg-blue-500/20">+ Tambah</button>
                                            </div>
                                            {newProduct.ingredients.map((ing, i) => (
                                                <div key={i} className="flex gap-3 items-center mb-3">
                                                    <input type="text" placeholder="Bahan" value={ing.name} onChange={(e) => updateIngredient(i, 'name', e.target.value)} className="flex-1 p-2 bg-[#0B0F19] border border-gray-800 rounded-lg text-white outline-none" required />
                                                    <input type="number" placeholder="Biaya" value={ing.cost} onChange={(e) => updateIngredient(i, 'cost', Number(e.target.value))} className="w-32 p-2 bg-[#0B0F19] border border-gray-800 rounded-lg text-white outline-none" required />
                                                    <button type="button" onClick={() => removeIngredient(i)} className="text-red-400 p-2 hover:bg-red-500/10 rounded-lg">Hapus</button>
                                                </div>
                                            ))}
                                            {newProduct.ingredients.length > 0 && <div className="mt-4 pt-4 border-t border-gray-800 text-right font-bold text-blue-400">Total HPP Otomatis: Rp {newProduct.ingredients.reduce((sum, item) => sum + item.cost, 0).toLocaleString('id-ID')}</div>}
                                        </div>
                                        <button type="submit" disabled={loading} className="w-full md:w-auto px-8 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-500 transition-colors">
                                            {loading ? 'Menyimpan...' : 'Simpan Produk'}
                                        </button>
                                    </form>

                                    <div className="bg-[#131B2C] border border-gray-800 rounded-2xl overflow-hidden shadow-xl">
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-left border-collapse">
                                                <thead>
                                                    <tr className="bg-gray-800/50 border-b border-gray-800">
                                                        <th className="p-4 font-semibold text-gray-400">Produk</th>
                                                        <th className="p-4 font-semibold text-gray-400 text-right">Harga Jual</th>
                                                        <th className="p-4 font-semibold text-gray-400 text-right">Profit</th>
                                                        <th className="p-4 font-semibold text-gray-400 text-center">Stok</th>
                                                        <th className="p-4 font-semibold text-gray-400 text-center">Aksi</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {products.map((p: any) => (
                                                        <tr key={p.id} className="border-b border-gray-800 hover:bg-gray-800/30">
                                                            <td className="p-4 flex items-center gap-4">
                                                                <div className="w-12 h-12 bg-gray-900 border border-gray-800 rounded-xl flex items-center justify-center text-2xl">{p.image_icon}</div>
                                                                <div>
                                                                    <p className="font-bold text-white text-base">{p.name}</p>
                                                                    <p className="text-xs text-gray-500">{p.category}</p>
                                                                </div>
                                                            </td>
                                                            <td className="p-4 text-right">
                                                                <p className="font-bold text-gray-200">Rp {p.price.toLocaleString('id-ID')}</p>
                                                                <p className="text-xs text-gray-500">
                                                                    HPP: Rp {p.cogs.toLocaleString('id-ID')}
                                                                    {p.ingredients && p.ingredients.length > 0 && ` (${p.ingredients.length} Bahan)`}
                                                                </p>
                                                            </td>
                                                            <td className="p-4 text-right font-bold text-green-400">Rp {(p.price - p.cogs).toLocaleString('id-ID')}</td>
                                                            <td className="p-4 text-center">
                                                                <span className={`px-3 py-1 rounded-full text-xs font-bold ${p.stock <= 5 ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-gray-800 text-gray-300'}`}>{p.stock}</span>
                                                            </td>
                                                            <td className="p-4 text-center">
                                                                <button onClick={() => setEditingProduct(p)} className="px-3 py-1 text-xs font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-lg hover:bg-blue-600 hover:text-white transition-colors">Edit</button>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                    
                                    {/* Edit Product Modal */}
                                    {editingProduct && (
                                        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 backdrop-blur-md">
                                            <div className="bg-[#131B2C] border border-gray-800 p-6 md:p-8 rounded-3xl w-full max-w-[500px] shadow-2xl">
                                                <h3 className="font-bold text-xl text-white mb-6">Edit Produk: {editingProduct.name}</h3>
                                                <form onSubmit={handleUpdateProduct} className="space-y-4">
                                                    <div>
                                                        <label className="text-sm font-bold text-gray-400 block mb-2">Nama Produk</label>
                                                        <input type="text" value={editingProduct.name} onChange={e => setEditingProduct({...editingProduct, name: e.target.value})} className="w-full p-3 bg-gray-900 border border-gray-800 rounded-xl text-white outline-none focus:border-blue-500" required />
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-4">
                                                        <div>
                                                            <label className="text-sm font-bold text-gray-400 block mb-2">Harga Jual</label>
                                                            <input type="number" value={editingProduct.price} onChange={e => setEditingProduct({...editingProduct, price: e.target.value})} className="w-full p-3 bg-gray-900 border border-gray-800 rounded-xl text-white outline-none focus:border-blue-500" required />
                                                        </div>
                                                        <div>
                                                            <label className="text-sm font-bold text-gray-400 block mb-2">HPP Dasar</label>
                                                            <input type="number" value={editingProduct.cogs} onChange={e => setEditingProduct({...editingProduct, cogs: e.target.value})} className="w-full p-3 bg-gray-900 border border-gray-800 rounded-xl text-white outline-none focus:border-blue-500" required />
                                                        </div>
                                                    </div>

                                                    <div className="mb-6 p-5 bg-gray-900 border border-gray-800 rounded-xl">
                                                        <div className="flex justify-between items-center mb-4">
                                                            <h4 className="font-bold text-gray-300">Bahan Baku (Opsional)</h4>
                                                            <button type="button" onClick={addIngredientEdit} className="text-sm px-3 py-1.5 bg-blue-500/10 text-blue-400 border border-blue-500/20 font-bold rounded-lg hover:bg-blue-500/20">+ Tambah</button>
                                                        </div>
                                                        {(editingProduct.ingredients || []).map((ing: any, i: number) => (
                                                            <div key={i} className="flex gap-3 items-center mb-3">
                                                                <input type="text" placeholder="Bahan" value={ing.name} onChange={(e) => updateIngredientEdit(i, 'name', e.target.value)} className="flex-1 p-2 bg-[#0B0F19] border border-gray-800 rounded-lg text-white outline-none" required />
                                                                <input type="number" placeholder="Biaya" value={ing.cost} onChange={(e) => updateIngredientEdit(i, 'cost', Number(e.target.value))} className="w-32 p-2 bg-[#0B0F19] border border-gray-800 rounded-lg text-white outline-none" required />
                                                                <button type="button" onClick={() => removeIngredientEdit(i)} className="text-red-400 p-2 hover:bg-red-500/10 rounded-lg">Hapus</button>
                                                            </div>
                                                        ))}
                                                    </div>

                                                    <div className="flex gap-4 mt-6">
                                                        <button type="button" onClick={() => setEditingProduct(null)} className="flex-1 py-3 bg-gray-800 text-gray-300 rounded-xl font-bold hover:bg-gray-700">Batal</button>
                                                        <button type="submit" disabled={loading} className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-500">Simpan Perubahan</button>
                                                    </div>
                                                </form>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* EXPENSES & RAW MATERIALS TAB */}
                            {activeTab === "expenses" && (
                                <div className="space-y-8">
                                    {/* INPUTS ROW */}
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                        {/* Bahan Baku */}
                                        <div className="p-6 md:p-8 bg-[#131B2C] rounded-2xl border border-gray-800 shadow-xl">
                                            <h3 className="font-bold text-lg mb-6 text-white border-b border-gray-800 pb-3">Tambah Bahan Baku</h3>
                                            <form onSubmit={handleCreateMaterial} className="space-y-4">
                                                <input type="text" placeholder="Nama Bahan (contoh: Susu)" required value={newMaterial.name} onChange={e => setNewMaterial({...newMaterial, name: e.target.value})} className="w-full p-3 bg-gray-900 border border-gray-800 rounded-xl focus:border-blue-500 outline-none text-white" />
                                                <div className="grid grid-cols-3 gap-4">
                                                    <input type="text" placeholder="Unit (kg/lt)" required value={newMaterial.unit} onChange={e => setNewMaterial({...newMaterial, unit: e.target.value})} className="p-3 bg-gray-900 border border-gray-800 rounded-xl focus:border-blue-500 outline-none text-white" />
                                                    <input type="number" placeholder="Stok" required value={newMaterial.current_stock || ''} onChange={e => setNewMaterial({...newMaterial, current_stock: Number(e.target.value)})} className="p-3 bg-gray-900 border border-gray-800 rounded-xl focus:border-blue-500 outline-none text-white" />
                                                    <input type="number" placeholder="Harga/Unit" required value={newMaterial.last_price_per_unit || ''} onChange={e => setNewMaterial({...newMaterial, last_price_per_unit: Number(e.target.value)})} className="p-3 bg-gray-900 border border-gray-800 rounded-xl focus:border-blue-500 outline-none text-white" />
                                                </div>
                                                <button type="submit" disabled={loading} className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-500">Simpan Bahan</button>
                                            </form>
                                        </div>

                                        {/* Pengeluaran */}
                                        <div className="p-6 md:p-8 bg-[#131B2C] rounded-2xl border border-gray-800 shadow-xl">
                                            <h3 className="font-bold text-lg mb-6 text-white border-b border-gray-800 pb-3">Catat Pengeluaran</h3>
                                            <form onSubmit={handleCreateExpense} className="space-y-4">
                                                <input type="text" placeholder="Deskripsi Pengeluaran" required value={newExpense.description} onChange={e => setNewExpense({...newExpense, description: e.target.value})} className="w-full p-3 bg-gray-900 border border-gray-800 rounded-xl focus:border-blue-500 outline-none text-white" />
                                                <input type="number" placeholder="Nominal (Rp)" required value={newExpense.amount || ''} onChange={e => setNewExpense({...newExpense, amount: Number(e.target.value)})} className="w-full p-3 bg-gray-900 border border-gray-800 rounded-xl focus:border-blue-500 outline-none text-white" />
                                                <button type="submit" disabled={loading} className="w-full py-3 bg-red-600/20 text-red-400 border border-red-500/30 rounded-xl font-bold hover:bg-red-500/30 mt-2">Catat Pengeluaran</button>
                                            </form>
                                        </div>
                                    </div>

                                    {/* TABLES ROW */}
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                        <div className="bg-[#131B2C] border border-gray-800 rounded-2xl overflow-hidden shadow-xl">
                                            <h3 className="p-4 bg-gray-800/30 font-bold text-gray-300 border-b border-gray-800">Daftar Bahan Baku</h3>
                                            {rawMaterials.length === 0 ? (
                                                <p className="p-6 text-gray-500 text-center text-sm">Belum ada bahan baku.</p>
                                            ) : (
                                                <table className="w-full text-left">
                                                    <tbody>
                                                        {rawMaterials.map((mat: any) => (
                                                            <tr key={mat.id} className="border-b border-gray-800 hover:bg-gray-800/20 group">
                                                                <td className="p-4 font-bold text-white">{mat.name}</td>
                                                                <td className="p-4 text-center"><span className="px-3 py-1 bg-gray-800 rounded-lg text-sm">{mat.current_stock} {mat.unit}</span></td>
                                                                <td className="p-4 text-right text-gray-400 text-sm">Rp {mat.last_price_per_unit.toLocaleString('id-ID')}/{mat.unit}</td>
                                                                <td className="p-3 text-right">
                                                                    <div className="flex gap-1 justify-end">
                                                                        <button onClick={() => setEditingMaterial({...mat})} className="px-2 py-1 text-xs bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-lg hover:bg-blue-600 hover:text-white font-bold transition-colors">Edit</button>
                                                                        <button onClick={() => handleDeleteMaterial(mat.id)} className="px-2 py-1 text-xs bg-red-500/10 text-red-400 border border-red-500/20 rounded-lg hover:bg-red-600 hover:text-white font-bold transition-colors">Hapus</button>
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            )}
                                        </div>
                                        <div className="bg-[#131B2C] border border-gray-800 rounded-2xl overflow-hidden shadow-xl">
                                            <h3 className="p-4 bg-gray-800/30 font-bold text-gray-300 border-b border-gray-800">Riwayat Pengeluaran</h3>
                                            {expenses.length === 0 ? (
                                                <p className="p-6 text-gray-500 text-center text-sm">Belum ada pengeluaran.</p>
                                            ) : (
                                                <table className="w-full text-left">
                                                    <tbody>
                                                        {expenses.map((exp: any) => (
                                                            <tr key={exp.id} className="border-b border-gray-800 hover:bg-gray-800/20">
                                                                <td className="p-4">
                                                                    <p className="font-bold text-white">{exp.description}</p>
                                                                    <p className="text-xs text-gray-500">{new Date(exp.expense_date || exp.created_at).toLocaleString('id-ID')}</p>
                                                                </td>
                                                                <td className="p-4 text-right font-bold text-red-400 whitespace-nowrap">- Rp {Number(exp.amount).toLocaleString('id-ID')}</td>
                                                                <td className="p-3 text-right">
                                                                    <div className="flex gap-1 justify-end">
                                                                        <button onClick={() => setEditingExpense({...exp})} className="px-2 py-1 text-xs bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-lg hover:bg-blue-600 hover:text-white font-bold transition-colors">Edit</button>
                                                                        <button onClick={() => handleDeleteExpense(exp.id)} className="px-2 py-1 text-xs bg-red-500/10 text-red-400 border border-red-500/20 rounded-lg hover:bg-red-600 hover:text-white font-bold transition-colors">Hapus</button>
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            )}
                                        </div>
                                    </div>

                                    {/* Edit Material Modal */}
                                    {editingMaterial && (
                                        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 backdrop-blur-md">
                                            <div className="bg-[#131B2C] border border-gray-800 p-6 rounded-3xl w-full max-w-md shadow-2xl">
                                                <h3 className="font-bold text-xl text-white mb-5">Edit Bahan Baku</h3>
                                                <form onSubmit={handleUpdateMaterial} className="space-y-4">
                                                    <input type="text" placeholder="Nama Bahan" value={editingMaterial.name} onChange={e => setEditingMaterial({...editingMaterial, name: e.target.value})} className="w-full p-3 bg-gray-900 border border-gray-800 rounded-xl text-white outline-none focus:border-blue-500" required />
                                                    <div className="grid grid-cols-3 gap-3">
                                                        <input type="text" placeholder="Unit" value={editingMaterial.unit} onChange={e => setEditingMaterial({...editingMaterial, unit: e.target.value})} className="p-3 bg-gray-900 border border-gray-800 rounded-xl text-white outline-none focus:border-blue-500" required />
                                                        <input type="number" placeholder="Stok" value={editingMaterial.current_stock} onChange={e => setEditingMaterial({...editingMaterial, current_stock: e.target.value})} className="p-3 bg-gray-900 border border-gray-800 rounded-xl text-white outline-none focus:border-blue-500" required />
                                                        <input type="number" placeholder="Harga/Unit" value={editingMaterial.last_price_per_unit} onChange={e => setEditingMaterial({...editingMaterial, last_price_per_unit: e.target.value})} className="p-3 bg-gray-900 border border-gray-800 rounded-xl text-white outline-none focus:border-blue-500" required />
                                                    </div>
                                                    <div className="flex gap-3 mt-4">
                                                        <button type="button" onClick={() => setEditingMaterial(null)} className="flex-1 py-3 bg-gray-800 text-gray-300 rounded-xl font-bold hover:bg-gray-700">Batal</button>
                                                        <button type="submit" disabled={loading} className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-500">Simpan</button>
                                                    </div>
                                                </form>
                                            </div>
                                        </div>
                                    )}

                                    {/* Edit Expense Modal */}
                                    {editingExpense && (
                                        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 backdrop-blur-md">
                                            <div className="bg-[#131B2C] border border-gray-800 p-6 rounded-3xl w-full max-w-md shadow-2xl">
                                                <h3 className="font-bold text-xl text-white mb-5">Edit Pengeluaran</h3>
                                                <form onSubmit={handleUpdateExpense} className="space-y-4">
                                                    <input type="text" placeholder="Deskripsi" value={editingExpense.description} onChange={e => setEditingExpense({...editingExpense, description: e.target.value})} className="w-full p-3 bg-gray-900 border border-gray-800 rounded-xl text-white outline-none focus:border-blue-500" required />
                                                    <input type="number" placeholder="Nominal (Rp)" value={editingExpense.amount} onChange={e => setEditingExpense({...editingExpense, amount: e.target.value})} className="w-full p-3 bg-gray-900 border border-gray-800 rounded-xl text-white outline-none focus:border-blue-500" required />
                                                    <div className="flex gap-3 mt-4">
                                                        <button type="button" onClick={() => setEditingExpense(null)} className="flex-1 py-3 bg-gray-800 text-gray-300 rounded-xl font-bold hover:bg-gray-700">Batal</button>
                                                        <button type="submit" disabled={loading} className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-500">Simpan</button>
                                                    </div>
                                                </form>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* STAFF TAB */}
                            {activeTab === "staff" && (
                                <div className="space-y-6">
                                    <form onSubmit={handleCreateStaff} className="p-6 md:p-8 bg-[#131B2C] rounded-2xl border border-gray-800 shadow-xl">
                                        <h3 className="font-bold text-lg mb-6 text-white border-b border-gray-800 pb-3">Tambah Akun Baru</h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                                            <input type="text" placeholder="Nama Lengkap" required value={newStaff.full_name} onChange={e => setNewStaff({...newStaff, full_name: e.target.value})} className="p-3 bg-gray-900 border border-gray-800 rounded-xl focus:border-blue-500 focus:outline-none text-white" />
                                            <input type="email" placeholder="Email" required value={newStaff.email} onChange={e => setNewStaff({...newStaff, email: e.target.value})} className="p-3 bg-gray-900 border border-gray-800 rounded-xl focus:border-blue-500 focus:outline-none text-white" />
                                            <input type="password" placeholder="Password" required minLength={6} value={newStaff.password} onChange={e => setNewStaff({...newStaff, password: e.target.value})} className="p-3 bg-gray-900 border border-gray-800 rounded-xl focus:border-blue-500 focus:outline-none text-white" />
                                            <select value={newStaff.role} onChange={e => setNewStaff({...newStaff, role: e.target.value})} className="p-3 bg-gray-900 border border-gray-800 rounded-xl focus:border-blue-500 focus:outline-none text-white">
                                                <option value="staff">Kasir (Staff)</option>
                                                <option value="owner">Admin (Owner)</option>
                                            </select>
                                        </div>
                                        <button type="submit" disabled={loading} className="w-full md:w-auto px-8 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-500 transition-colors">Buat Akun</button>
                                    </form>

                                    <div className="bg-[#131B2C] border border-gray-800 rounded-2xl overflow-hidden shadow-xl">
                                        <table className="w-full text-left border-collapse">
                                            <thead>
                                                <tr className="bg-gray-800/50 border-b border-gray-800">
                                                    <th className="p-4 text-gray-400">Nama</th>
                                                    <th className="p-4 text-gray-400">Role</th>
                                                    <th className="p-4 text-gray-400">Status</th>
                                                    <th className="p-4 text-gray-400 text-right">Aksi</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {staffList.map((st: any) => (
                                                    <tr key={st.id} className="border-b border-gray-800 hover:bg-gray-800/30">
                                                        <td className="p-4 font-bold text-white">{st.full_name}<p className="text-xs text-gray-500 font-normal">{st.email}</p></td>
                                                        <td className="p-4"><span className={`px-3 py-1 text-xs font-bold rounded-lg ${st.role === 'owner' ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' : 'bg-gray-800 text-gray-300'}`}>{st.role.toUpperCase()}</span></td>
                                                        <td className="p-4"><span className="text-green-400 font-bold text-sm">Aktif</span></td>
                                                        <td className="p-4 text-right flex justify-end gap-2">
                                                            <button onClick={() => setEditingStaff(st)} className="px-3 py-1 text-xs font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-lg hover:bg-blue-600 hover:text-white transition-colors">Edit</button>
                                                            <button onClick={() => handleDeleteStaff(st.id)} className="px-3 py-1 text-xs font-bold bg-red-500/10 text-red-400 border border-red-500/20 rounded-lg hover:bg-red-600 hover:text-white transition-colors">Hapus</button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>

                                    {/* Edit Staff Modal */}
                                    {editingStaff && (
                                        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 backdrop-blur-md">
                                            <div className="bg-[#131B2C] border border-gray-800 p-6 md:p-8 rounded-3xl w-full max-w-[500px] shadow-2xl">
                                                <h3 className="font-bold text-xl text-white mb-6">Edit Staf: {editingStaff.full_name}</h3>
                                                <form onSubmit={handleUpdateStaff} className="space-y-4">
                                                    <div>
                                                        <label className="text-sm font-bold text-gray-400 block mb-2">Nama Lengkap</label>
                                                        <input type="text" value={editingStaff.full_name} onChange={e => setEditingStaff({...editingStaff, full_name: e.target.value})} className="w-full p-3 bg-gray-900 border border-gray-800 rounded-xl text-white outline-none focus:border-blue-500" required />
                                                    </div>
                                                    <div>
                                                        <label className="text-sm font-bold text-gray-400 block mb-2">Role</label>
                                                        <select value={editingStaff.role} onChange={e => setEditingStaff({...editingStaff, role: e.target.value})} className="w-full p-3 bg-gray-900 border border-gray-800 rounded-xl text-white outline-none focus:border-blue-500">
                                                            <option value="staff">Kasir (Staff)</option>
                                                            <option value="owner">Admin (Owner)</option>
                                                        </select>
                                                    </div>
                                                    <div>
                                                        <label className="text-sm font-bold text-gray-400 block mb-2">Password Baru (Opsional)</label>
                                                        <input type="password" value={editingStaff.password || ''} onChange={e => setEditingStaff({...editingStaff, password: e.target.value})} placeholder="Biarkan kosong jika tidak diubah" className="w-full p-3 bg-gray-900 border border-gray-800 rounded-xl text-white outline-none focus:border-blue-500" minLength={6} />
                                                    </div>
                                                    <div className="flex gap-4 mt-6">
                                                        <button type="button" onClick={() => setEditingStaff(null)} className="flex-1 py-3 bg-gray-800 text-gray-300 rounded-xl font-bold hover:bg-gray-700">Batal</button>
                                                        <button type="submit" disabled={loading} className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-500">Simpan Perubahan</button>
                                                    </div>
                                                </form>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                            
                            {/* AUDIT TAB */}
                            {activeTab === "audit" && (
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center bg-[#131B2C] p-4 rounded-2xl border border-gray-800/60">
                                        <div>
                                            <h3 className="font-bold text-white">Security Log</h3>
                                            <p className="text-xs text-gray-500 mt-1">Rekam jejak aktivitas sistem</p>
                                        </div>
                                        <button onClick={fetchAuditLogs} className="px-3 py-2 bg-gray-800 text-gray-300 rounded-xl text-sm font-bold hover:bg-gray-700 flex items-center gap-2">
                                            <RefreshCw className="w-4 h-4" /> Refresh
                                        </button>
                                    </div>
                                    {auditLogs.length === 0 ? (
                                        <div className="bg-[#131B2C] border border-gray-800 rounded-2xl p-10 text-center">
                                            <ShieldCheck className="w-12 h-12 text-gray-700 mx-auto mb-3" />
                                            <p className="text-gray-400 font-semibold">Belum ada log aktivitas.</p>
                                            <p className="text-gray-600 text-sm mt-1">Log akan otomatis tercatat saat ada transaksi, refund, atau login.</p>
                                            <p className="text-yellow-500/70 text-xs mt-3">Pastikan tabel <code className="bg-gray-900 px-1 rounded">audit_logs</code> sudah dibuat di Supabase dan RLS dinonaktifkan.</p>
                                        </div>
                                    ) : (
                                        auditLogs.map((log: any) => (
                                            <div key={log.id} className="p-5 rounded-2xl bg-[#131B2C] border border-gray-800 flex justify-between items-center shadow-lg">
                                                <div>
                                                    <p className="font-bold text-white capitalize text-lg">{String(log.action || '').replace(/_/g, ' ')}</p>
                                                    <p className="text-sm text-gray-500 mt-1">Entity: <span className="text-gray-300">{log.entity_type}</span> | Staff: <span className="text-gray-300">{log.staff_id || 'System'}</span></p>
                                                </div>
                                                <div className="text-right text-sm text-gray-500 bg-gray-900 px-3 py-1.5 rounded-lg border border-gray-800">
                                                    {new Date(log.created_at).toLocaleString('id-ID')}
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            )}
                            {/* SETTINGS TAB */}
                            {activeTab === "settings" && (
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    <div className="space-y-6">
                                        {/* Brand Settings */}
                                        <div className="p-6 md:p-8 bg-[#131B2C] rounded-2xl border border-gray-800 shadow-xl">
                                            <h3 className="font-bold text-xl mb-6 text-white border-b border-gray-800 pb-4">Pengaturan Brand Toko</h3>
                                            
                                            <div className="space-y-6">
                                                <div>
                                                    <label className="block text-sm font-bold text-gray-300 mb-2">Nama Toko (Cafe Name)</label>
                                                    <input 
                                                        type="text" 
                                                        value={storeSettings.cafe_name}
                                                        onChange={e => setStoreSettings({...storeSettings, cafe_name: e.target.value})}
                                                        className="w-full bg-[#0B0F19] border border-gray-800 rounded-xl p-4 text-white focus:border-blue-500 outline-none font-bold"
                                                        placeholder="Contoh: NexPos Cafe"
                                                    />
                                                </div>

                                                <div>
                                                    <label className="block text-sm font-bold text-gray-300 mb-2">Logo Struk & Kiosk (Max 1MB)</label>
                                                    <div className="flex items-center gap-6">
                                                        {storeSettings.logo_base64 ? (
                                                            <img src={storeSettings.logo_base64} alt="Logo" className="w-24 h-24 object-contain bg-white rounded-xl p-2 border border-gray-800" />
                                                        ) : (
                                                            <div className="w-24 h-24 bg-gray-900 border border-gray-800 rounded-xl flex items-center justify-center text-gray-500 text-xs text-center p-2">No Logo</div>
                                                        )}
                                                        <div className="flex-1">
                                                            <label className="cursor-pointer bg-blue-600/10 text-blue-500 border border-blue-500/20 px-4 py-2 rounded-lg font-bold hover:bg-blue-600 hover:text-white transition-colors inline-flex items-center gap-2 mb-3">
                                                                <Upload className="w-4 h-4" /> Upload Logo
                                                                <input type="file" accept="image/png, image/jpeg" className="hidden" onChange={handleLogoUpload} />
                                                            </label>
                                                            {storeSettings.logo_base64 && (
                                                                <div>
                                                                    <label className="text-xs text-gray-500 block mb-1 font-semibold">Ukuran Logo di Struk: {storeSettings.logo_size}px</label>
                                                                    <input type="range" min="30" max="150" value={storeSettings.logo_size} onChange={e => setStoreSettings({...storeSettings, logo_size: Number(e.target.value)})} className="w-full accent-blue-500" />
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Receipt Settings */}
                                        <div className="p-6 md:p-8 bg-[#131B2C] rounded-2xl border border-gray-800 shadow-xl">
                                            <h3 className="font-bold text-xl mb-6 text-white border-b border-gray-800 pb-4">Template Struk & Biaya</h3>
                                            
                                            <div className="space-y-6">
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div>
                                                        <label className="block text-sm font-bold text-gray-300 mb-2">Nama WiFi (Tampil di struk)</label>
                                                        <input 
                                                            type="text" 
                                                            value={storeSettings.wifi_name}
                                                            onChange={e => setStoreSettings({...storeSettings, wifi_name: e.target.value})}
                                                            className="w-full bg-[#0B0F19] border border-gray-800 rounded-xl p-4 text-white focus:border-blue-500 outline-none"
                                                            placeholder="Contoh: NexPos_Guest"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-sm font-bold text-gray-300 mb-2">Password WiFi</label>
                                                        <input 
                                                            type="text" 
                                                            value={storeSettings.wifi_password}
                                                            onChange={e => setStoreSettings({...storeSettings, wifi_password: e.target.value})}
                                                            className="w-full bg-[#0B0F19] border border-gray-800 rounded-xl p-4 text-white focus:border-blue-500 outline-none"
                                                            placeholder="Contoh: KopiEnak123"
                                                        />
                                                    </div>
                                                </div>

                                                <div className="bg-[#0B0F19] border border-gray-800 rounded-xl p-4">
                                                    <div className="flex items-center justify-between mb-4">
                                                        <div>
                                                            <h4 className="font-bold text-white">Pajak (Tax / PB1)</h4>
                                                            <p className="text-xs text-gray-500 mt-1">Aktifkan untuk menambahkan pajak pada total pesanan.</p>
                                                        </div>
                                                        <label className="relative inline-flex items-center cursor-pointer">
                                                            <input type="checkbox" className="sr-only peer" checked={storeSettings.tax_enabled} onChange={e => setStoreSettings({...storeSettings, tax_enabled: e.target.checked})} />
                                                            <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                                        </label>
                                                    </div>
                                                    {storeSettings.tax_enabled && (
                                                        <div>
                                                            <label className="block text-sm font-bold text-gray-300 mb-2">Persentase Pajak (%)</label>
                                                            <input 
                                                                type="number" 
                                                                value={storeSettings.tax_rate}
                                                                onChange={e => setStoreSettings({...storeSettings, tax_rate: Number(e.target.value)})}
                                                                className="w-full bg-[#131B2C] border border-gray-800 rounded-xl p-4 text-white focus:border-blue-500 outline-none"
                                                                placeholder="Contoh: 11"
                                                            />
                                                        </div>
                                                    )}
                                                </div>

                                                <div>
                                                    <label className="block text-sm font-bold text-gray-300 mb-2">Pesan Footer Struk (Spesial Message)</label>
                                                    <textarea 
                                                        value={storeSettings.receipt_footer}
                                                        onChange={e => setStoreSettings({...storeSettings, receipt_footer: e.target.value})}
                                                        className="w-full bg-[#0B0F19] border border-gray-800 rounded-xl p-4 text-white focus:border-blue-500 outline-none h-24 resize-none"
                                                        placeholder="Terima kasih atas kunjungan Anda..."
                                                    ></textarea>
                                                </div>

                                                <div>
                                                    <label className="block text-sm font-bold text-gray-300 mb-2">QRIS Statis Toko (Opsional)</label>
                                                    <div className="flex items-center gap-6">
                                                        {storeSettings.qris_image_base64 ? (
                                                            <img src={storeSettings.qris_image_base64} alt="QRIS" className="w-24 h-24 object-contain bg-white rounded-xl p-2 border border-gray-800" />
                                                        ) : (
                                                            <div className="w-24 h-24 bg-gray-900 border border-gray-800 rounded-xl flex items-center justify-center text-gray-500 text-xs text-center p-2">Belum ada QRIS</div>
                                                        )}
                                                        <div className="flex-1">
                                                            <label className="cursor-pointer bg-blue-600/10 text-blue-500 border border-blue-500/20 px-4 py-2 rounded-lg font-bold hover:bg-blue-600 hover:text-white transition-colors inline-flex items-center gap-2 mb-3">
                                                                <Upload className="w-4 h-4" /> Upload QRIS
                                                                <input type="file" accept="image/png, image/jpeg" className="hidden" onChange={handleQrisUpload} />
                                                            </label>
                                                            {storeSettings.qris_image_base64 && (
                                                                <div>
                                                                    <label className="text-xs text-gray-500 block mb-1 font-semibold">Ukuran QRIS di Struk: {storeSettings.qris_size}px</label>
                                                                    <input type="range" min="60" max="200" value={storeSettings.qris_size} onChange={e => setStoreSettings({...storeSettings, qris_size: Number(e.target.value)})} className="w-full accent-blue-500" />
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>

                                                <button 
                                                    onClick={handleSaveSettings}
                                                    disabled={loading}
                                                    className="w-full py-4 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-500 transition-colors disabled:opacity-50 mt-4"
                                                >
                                                    {loading ? "Menyimpan..." : "Simpan Semua Pengaturan"}
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Preview Section */}
                                    <div className="p-6 md:p-8 bg-[#131B2C] rounded-2xl border border-gray-800 shadow-xl flex flex-col items-center">
                                        <h3 className="font-bold text-xl mb-6 text-white border-b border-gray-800 pb-4 w-full text-left">Live Preview Struk</h3>
                                        
                                        <div className="bg-white p-6 text-black font-mono text-sm w-[300px] shadow-2xl rounded-sm">
                                            {storeSettings.logo_base64 && (
                                                <div className="flex justify-center mb-4">
                                                    <img src={storeSettings.logo_base64} alt="Logo" style={{ width: storeSettings.logo_size, height: storeSettings.logo_size }} className="object-contain grayscale" />
                                                </div>
                                            )}
                                            <div className="text-center font-bold text-lg mb-1">{storeSettings.cafe_name || 'Nama Cafe'}</div>
                                            <div className="text-center text-xs mb-4">Struk Pembayaran (Preview)</div>
                                            
                                            <div className="border-b-2 border-dashed border-gray-400 mb-4"></div>
                                            
                                            <div className="flex justify-between mb-1">
                                                <span>Kopi Susu Aren</span>
                                                <span>Rp 25.000</span>
                                            </div>
                                            <div className="flex justify-between mb-1">
                                                <span>Oatmilk Latte</span>
                                                <span>Rp 35.000</span>
                                            </div>
                                            
                                            <div className="border-b-2 border-dashed border-gray-400 my-4"></div>
                                            
                                            {storeSettings.tax_enabled ? (
                                                <>
                                                    <div className="flex justify-between mb-1">
                                                        <span>Subtotal</span>
                                                        <span>Rp 60.000</span>
                                                    </div>
                                                    <div className="flex justify-between mb-4">
                                                        <span>Pajak ({storeSettings.tax_rate}%)</span>
                                                        <span>Rp {((60000 * storeSettings.tax_rate) / 100).toLocaleString('id-ID')}</span>
                                                    </div>
                                                    <div className="flex justify-between font-bold mb-4">
                                                        <span>TOTAL</span>
                                                        <span>Rp {(60000 + ((60000 * storeSettings.tax_rate) / 100)).toLocaleString('id-ID')}</span>
                                                    </div>
                                                </>
                                            ) : (
                                                <div className="flex justify-between font-bold mb-4">
                                                    <span>TOTAL</span>
                                                    <span>Rp 60.000</span>
                                                </div>
                                            )}

                                            {storeSettings.qris_image_base64 && (
                                                <div className="flex flex-col items-center justify-center my-6">
                                                    <p className="font-bold text-xs mb-2 text-center">SCAN QRIS UNTUK BAYAR</p>
                                                    <img src={storeSettings.qris_image_base64} alt="QRIS" style={{ width: storeSettings.qris_size, height: storeSettings.qris_size }} className="object-contain" />
                                                </div>
                                            )}

                                            <div className="border-b-2 border-dashed border-gray-400 my-4"></div>
                                            
                                            {(storeSettings.wifi_name || storeSettings.wifi_password) && (
                                                <div className="text-center mb-2">
                                                    {storeSettings.wifi_name && <div className="font-bold">WiFi: {storeSettings.wifi_name}</div>}
                                                    {storeSettings.wifi_password && <div>Pass: {storeSettings.wifi_password}</div>}
                                                </div>
                                            )}
                                            
                                            <div className="text-center text-xs whitespace-pre-wrap mt-4">
                                                {storeSettings.receipt_footer || 'Terima kasih atas kunjungan Anda'}
                                            </div>
                                        </div>

                                        <button 
                                            onClick={handleTestPrint}
                                            className="mt-8 px-6 py-3 bg-gray-800 text-white rounded-xl font-bold hover:bg-gray-700 transition-colors flex items-center gap-2"
                                        >
                                            Test Cetak (Print PDF)
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>

        {/* PRINT ONLY RECEIPT BLOCK */}
        <div className="hidden print:block print-receipt">
            {storeSettings.logo_base64 && (
                <div style={{ textAlign: 'center', marginBottom: '10px' }}>
                    <img src={storeSettings.logo_base64} alt="Logo" style={{ width: `${storeSettings.logo_size}px`, filter: 'grayscale(100%)', margin: '0 auto' }} />
                </div>
            )}
            <div style={{ textAlign: 'center', fontWeight: 'bold', fontSize: '18px' }}>
                {storeSettings.cafe_name || 'Nama Cafe'}
            </div>
            <div style={{ textAlign: 'center', fontSize: '12px', marginBottom: '10px' }}>
                Struk Pembayaran (Preview)
            </div>
            
            <div style={{ borderBottom: '1px dashed #000', margin: '10px 0' }}></div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Kopi Susu Aren</span>
                <span>Rp 25.000</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Oatmilk Latte</span>
                <span>Rp 35.000</span>
            </div>
            
            <div style={{ borderBottom: '1px dashed #000', margin: '10px 0' }}></div>
            
            {storeSettings.tax_enabled ? (
                <>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                        <span>Subtotal</span>
                        <span>Rp 60.000</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                        <span>Pajak ({storeSettings.tax_rate}%)</span>
                        <span>Rp {((60000 * storeSettings.tax_rate) / 100).toLocaleString('id-ID')}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' }}>
                        <span>TOTAL</span>
                        <span>Rp {(60000 + ((60000 * storeSettings.tax_rate) / 100)).toLocaleString('id-ID')}</span>
                    </div>
                </>
            ) : (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' }}>
                    <span>TOTAL</span>
                    <span>Rp 60.000</span>
                </div>
            )}

            {storeSettings.qris_image_base64 && (
                <div style={{ textAlign: 'center', marginTop: '20px' }}>
                    <p style={{ fontWeight: 'bold', fontSize: '12px', marginBottom: '5px' }}>SCAN QRIS UNTUK BAYAR</p>
                    <img src={storeSettings.qris_image_base64} alt="QRIS" style={{ width: '120px', margin: '0 auto' }} />
                </div>
            )}
            
            <div style={{ borderBottom: '1px dashed #000', margin: '15px 0' }}></div>

            {(storeSettings.wifi_name || storeSettings.wifi_password) && (
                <div style={{ textAlign: 'center', marginBottom: '10px' }}>
                    {storeSettings.wifi_name && <div style={{ fontWeight: 'bold' }}>WiFi: {storeSettings.wifi_name}</div>}
                    {storeSettings.wifi_password && <div>Pass: {storeSettings.wifi_password}</div>}
                </div>
            )}
            
            <div style={{ textAlign: 'center', fontSize: '12px', whiteSpace: 'pre-wrap', marginTop: '10px' }}>
                {storeSettings.receipt_footer || 'Terima kasih atas kunjungan Anda'}
            </div>
        </div>
        </>
    );
}
