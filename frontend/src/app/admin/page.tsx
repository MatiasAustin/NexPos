"use client";

import { useState, useEffect } from "react";
import { getReconciliationReport, getAuditLogs } from "@/lib/api";
import Link from "next/link";
import { ArrowLeft, RefreshCw, AlertTriangle, ShieldCheck, Users, Package, FileText, Settings, Upload } from "lucide-react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function AdminDashboard() {
    const [activeTab, setActiveTab] = useState<"reconciliation" | "audit" | "staff" | "inventory" | "history" | "settings">("reconciliation");
    const [reconciliation, setReconciliation] = useState<any[]>([]);
    const [auditLogs, setAuditLogs] = useState<any[]>([]);
    const [transactions, setTransactions] = useState<any[]>([]);
    
    // Staff states
    const [staffList, setStaffList] = useState<any[]>([]);
    const [newStaff, setNewStaff] = useState({ full_name: '', email: '', password: '', role: 'staff' });
    
    // Store Settings
    const [storeSettings, setStoreSettings] = useState({
        logo_base64: "",
        cafe_name: "NexPos Cafe",
        receipt_footer: "Terima kasih atas kunjungan Anda!",
        wifi_password: ""
    });

    // Inventory states
    const [products, setProducts] = useState<any[]>([]);
    const [newProduct, setNewProduct] = useState<{name: string, category: string, price: number, cogs: number, stock: number, image_icon: string, ingredients: {name: string, cost: number}[]}>({ 
        name: '', category: '', price: 0, cogs: 0, stock: 0, image_icon: '📦', ingredients: [] 
    });
    
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    useEffect(() => {
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
                
            if (!profile || profile.role !== 'owner') {
                alert("Akses ditolak. Anda bukan Admin/Owner.");
                router.push('/pos');
            }
        };
        checkAuth();
    }, [router]);

    const fetchData = async () => {
        setLoading(true);
        try {
            if (activeTab === "reconciliation") {
                const report = await getReconciliationReport();
                setReconciliation(report.sessions || []);
            } else if (activeTab === "audit") {
                const logs = await getAuditLogs();
                setAuditLogs(logs);
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
                            cafe_name: data.cafe_name || "NexPos Cafe",
                            receipt_footer: data.receipt_footer || "Terima kasih atas kunjungan Anda!",
                            wifi_password: data.wifi_password || ""
                        });
                    }
                } catch(e) {
                    console.error("Store settings table might not exist yet", e);
                }
            }
        } catch (error) {
            console.error("Error fetching data", error);
        }
        setLoading(false);
    };

    const handleSaveSettings = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase.from('store_settings').select('id').maybeSingle();
            if (data?.id) {
                await supabase.from('store_settings').update(storeSettings).eq('id', data.id);
            } else {
                await supabase.from('store_settings').insert([storeSettings]);
            }
            alert("Pengaturan Toko berhasil disimpan!");
            // Sync locally to avoid waiting for db if used locally
            localStorage.setItem("nexpos_store_settings", JSON.stringify(storeSettings));
        } catch(e: any) {
            alert("Gagal menyimpan. Pastikan tabel store_settings sudah dibuat di Supabase: " + e.message);
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

    useEffect(() => {
        fetchData();
    }, [activeTab]);

    const addIngredient = () => {
        setNewProduct(prev => ({
            ...prev,
            ingredients: [...prev.ingredients, { name: '', cost: 0 }]
        }));
    };

    const updateIngredient = (index: number, field: 'name' | 'cost', value: any) => {
        const updated = [...newProduct.ingredients];
        updated[index] = { ...updated[index], [field]: value };
        setNewProduct({ ...newProduct, ingredients: updated });
    };

    const removeIngredient = (index: number) => {
        const updated = [...newProduct.ingredients];
        updated.splice(index, 1);
        setNewProduct({ ...newProduct, ingredients: updated });
    };

    return (
        <div className="min-h-screen bg-[#121214] text-gray-100 flex flex-col md:flex-row">
            {/* Sidebar */}
            <div className="w-full md:w-[280px] bg-[#1a1a1c] border-r border-gray-800 flex flex-col shrink-0">
                <div className="p-6 border-b border-gray-800 flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
                            <span className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white text-lg">N</span>
                            NexPos
                        </h1>
                        <p className="text-gray-500 text-sm mt-1">Control Center</p>
                    </div>
                    <Link href="/" className="md:hidden p-2 text-gray-500 hover:text-white bg-gray-800 rounded-lg">
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                </div>
                
                <div className="flex-1 overflow-y-auto p-4 space-y-2">
                    {[
                        { id: "reconciliation", label: "Laporan Rekonsiliasi", icon: AlertTriangle },
                        { id: "history", label: "Riwayat Transaksi", icon: FileText },
                        { id: "inventory", label: "Produk & Stok", icon: Package },
                        { id: "staff", label: "Manajemen Staf", icon: Users },
                        { id: "audit", label: "Security Log", icon: ShieldCheck },
                        { id: "settings", label: "Pengaturan Toko", icon: Settings },
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-semibold transition-all ${activeTab === tab.id ? "bg-blue-600/10 text-blue-500 border border-blue-500/20" : "text-gray-400 hover:text-gray-200 hover:bg-gray-800/50"}`}
                        >
                            <tab.icon className="w-5 h-5" /> {tab.label}
                        </button>
                    ))}
                </div>
                
                <div className="p-4 border-t border-gray-800">
                    <Link href="/" className="hidden md:flex items-center gap-2 text-gray-500 hover:text-gray-300 transition-colors w-full px-4 py-2 font-medium">
                        <ArrowLeft className="w-4 h-4" /> Kembali ke Home
                    </Link>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col h-screen overflow-hidden">
                {/* Top Header */}
                <div className="h-20 border-b border-gray-800 px-8 flex items-center justify-between shrink-0 bg-[#121214]">
                    <div className="flex items-center gap-4">
                        <h2 className="text-xl font-bold text-white capitalize">
                            {activeTab.replace('reconciliation', 'Rekonsiliasi').replace('history', 'Riwayat Transaksi')}
                        </h2>
                        <button 
                            onClick={fetchData}
                            className="flex items-center gap-2 px-3 py-1.5 bg-gray-800 text-gray-300 rounded-lg text-sm hover:bg-gray-700 transition-colors"
                        >
                            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-blue-400" : ""}`} /> Refresh
                        </button>
                    </div>

                    {/* Staff / Admin Profile Badge */}
                    <div className="flex items-center gap-3 bg-[#1a1a1c] border border-gray-800 px-4 py-2 rounded-full">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-purple-600 flex items-center justify-center text-sm font-bold text-white">
                            A
                        </div>
                        <div className="flex flex-col">
                            <span className="text-sm font-bold leading-tight">Admin System</span>
                            <span className="text-[10px] text-blue-400 font-bold uppercase tracking-wider">Owner Access</span>
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
                                <div className="bg-[#1a1a1c] border border-gray-800 rounded-2xl overflow-hidden shadow-xl">
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
                            )}

                            {/* HISTORY & REFUND TAB */}
                            {activeTab === "history" && (
                                <div className="space-y-4">
                                    {transactions.length === 0 ? (
                                        <p className="p-8 text-gray-500 text-center bg-[#1a1a1c] rounded-2xl border border-gray-800">Belum ada transaksi.</p>
                                    ) : (
                                        transactions.map((trx: any) => (
                                            <div key={trx.id} className="p-5 bg-[#1a1a1c] rounded-2xl border border-gray-800 shadow-lg flex flex-col md:flex-row gap-4 justify-between">
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
                                                    
                                                    {trx.status === 'Paid' && (
                                                        <button 
                                                            onClick={() => handleRefund(trx)}
                                                            className="mt-4 px-4 py-2 bg-red-500/10 text-red-400 border border-red-500/20 rounded-xl text-sm font-bold hover:bg-red-500/20 transition-colors"
                                                        >
                                                            Refund
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            )}

                            {/* INVENTORY TAB */}
                            {activeTab === "inventory" && (
                                <div className="space-y-6">
                                    <form onSubmit={handleCreateProduct} className="p-6 md:p-8 bg-[#1a1a1c] rounded-2xl border border-gray-800 shadow-xl">
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
                                                    <input type="text" placeholder="Bahan" value={ing.name} onChange={(e) => updateIngredient(i, 'name', e.target.value)} className="flex-1 p-2 bg-[#121214] border border-gray-800 rounded-lg text-white outline-none" required />
                                                    <input type="number" placeholder="Biaya" value={ing.cost} onChange={(e) => updateIngredient(i, 'cost', Number(e.target.value))} className="w-32 p-2 bg-[#121214] border border-gray-800 rounded-lg text-white outline-none" required />
                                                    <button type="button" onClick={() => removeIngredient(i)} className="text-red-400 p-2 hover:bg-red-500/10 rounded-lg">Hapus</button>
                                                </div>
                                            ))}
                                            {newProduct.ingredients.length > 0 && <div className="mt-4 pt-4 border-t border-gray-800 text-right font-bold text-blue-400">Total HPP Otomatis: Rp {newProduct.ingredients.reduce((sum, item) => sum + item.cost, 0).toLocaleString('id-ID')}</div>}
                                        </div>
                                        <button type="submit" disabled={loading} className="w-full md:w-auto px-8 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-500 transition-colors">
                                            {loading ? 'Menyimpan...' : 'Simpan Produk'}
                                        </button>
                                    </form>

                                    <div className="bg-[#1a1a1c] border border-gray-800 rounded-2xl overflow-hidden shadow-xl">
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-left border-collapse">
                                                <thead>
                                                    <tr className="bg-gray-800/50 border-b border-gray-800">
                                                        <th className="p-4 font-semibold text-gray-400">Produk</th>
                                                        <th className="p-4 font-semibold text-gray-400 text-right">Harga Jual</th>
                                                        <th className="p-4 font-semibold text-gray-400 text-right">Profit</th>
                                                        <th className="p-4 font-semibold text-gray-400 text-center">Stok</th>
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
                                                                <p className="text-xs text-gray-500">HPP: Rp {p.cogs.toLocaleString('id-ID')}</p>
                                                            </td>
                                                            <td className="p-4 text-right font-bold text-green-400">Rp {(p.price - p.cogs).toLocaleString('id-ID')}</td>
                                                            <td className="p-4 text-center">
                                                                <span className={`px-3 py-1 rounded-full text-xs font-bold ${p.stock <= 5 ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-gray-800 text-gray-300'}`}>{p.stock}</span>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* STAFF TAB */}
                            {activeTab === "staff" && (
                                <div className="space-y-6">
                                    <form onSubmit={handleCreateStaff} className="p-6 md:p-8 bg-[#1a1a1c] rounded-2xl border border-gray-800 shadow-xl">
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

                                    <div className="bg-[#1a1a1c] border border-gray-800 rounded-2xl overflow-hidden shadow-xl">
                                        <table className="w-full text-left border-collapse">
                                            <thead>
                                                <tr className="bg-gray-800/50 border-b border-gray-800"><th className="p-4 text-gray-400">Nama</th><th className="p-4 text-gray-400">Role</th><th className="p-4 text-gray-400">Status</th></tr>
                                            </thead>
                                            <tbody>
                                                {staffList.map((st: any) => (
                                                    <tr key={st.id} className="border-b border-gray-800 hover:bg-gray-800/30">
                                                        <td className="p-4 font-bold text-white">{st.full_name}<p className="text-xs text-gray-500 font-normal">{st.email}</p></td>
                                                        <td className="p-4"><span className={`px-3 py-1 text-xs font-bold rounded-lg ${st.role === 'owner' ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' : 'bg-gray-800 text-gray-300'}`}>{st.role.toUpperCase()}</span></td>
                                                        <td className="p-4"><span className="text-green-400 font-bold text-sm">Aktif</span></td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}
                            
                            {/* AUDIT TAB */}
                            {activeTab === "audit" && (
                                <div className="space-y-4">
                                    {auditLogs.map((log) => (
                                        <div key={log.id} className="p-5 rounded-2xl bg-[#1a1a1c] border border-gray-800 flex justify-between items-center shadow-lg">
                                            <div>
                                                <p className="font-bold text-white capitalize text-lg">{log.action.replace('_', ' ')}</p>
                                                <p className="text-sm text-gray-500 mt-1">Entity: <span className="text-gray-300">{log.entity_type}</span> | Staff: <span className="text-gray-300">{log.staff_id}</span></p>
                                            </div>
                                            <div className="text-right text-sm text-gray-500 bg-gray-900 px-3 py-1.5 rounded-lg border border-gray-800">
                                                {new Date(log.created_at).toLocaleString('id-ID')}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                            {/* SETTINGS TAB */}
                            {activeTab === "settings" && (
                                <div className="space-y-6">
                                    <div className="p-6 md:p-8 bg-[#1a1a1c] rounded-2xl border border-gray-800 shadow-xl">
                                        <h3 className="font-bold text-xl mb-6 text-white border-b border-gray-800 pb-4">Pengaturan Struk & Toko</h3>
                                        
                                        <div className="space-y-6">
                                            <div>
                                                <label className="block text-sm font-bold text-gray-300 mb-2">Nama Toko (Cafe Name)</label>
                                                <input 
                                                    type="text" 
                                                    value={storeSettings.cafe_name}
                                                    onChange={e => setStoreSettings({...storeSettings, cafe_name: e.target.value})}
                                                    className="w-full bg-[#121214] border border-gray-800 rounded-xl p-4 text-white focus:border-blue-500 outline-none font-bold"
                                                    placeholder="Contoh: NexPos Cafe"
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-sm font-bold text-gray-300 mb-2">Logo Struk & Kiosk (Max 1MB)</label>
                                                <div className="flex items-center gap-6">
                                                    {storeSettings.logo_base64 ? (
                                                        <img src={storeSettings.logo_base64} alt="Logo" className="w-24 h-24 object-contain bg-white rounded-xl p-2 border border-gray-800" />
                                                    ) : (
                                                        <div className="w-24 h-24 bg-gray-900 border border-gray-800 rounded-xl flex items-center justify-center text-gray-500">No Logo</div>
                                                    )}
                                                    <div>
                                                        <label className="cursor-pointer bg-blue-600/10 text-blue-500 border border-blue-500/20 px-4 py-2 rounded-lg font-bold hover:bg-blue-600 hover:text-white transition-colors flex items-center gap-2">
                                                            <Upload className="w-4 h-4" /> Upload Logo Baru
                                                            <input type="file" accept="image/png, image/jpeg" className="hidden" onChange={handleLogoUpload} />
                                                        </label>
                                                        <p className="text-xs text-gray-500 mt-2">Disarankan gambar PNG/JPG transparan (Hitam/Putih untuk Struk thermal)</p>
                                                    </div>
                                                </div>
                                            </div>

                                            <div>
                                                <label className="block text-sm font-bold text-gray-300 mb-2">Password WiFi (Opsional)</label>
                                                <input 
                                                    type="text" 
                                                    value={storeSettings.wifi_password}
                                                    onChange={e => setStoreSettings({...storeSettings, wifi_password: e.target.value})}
                                                    className="w-full bg-[#121214] border border-gray-800 rounded-xl p-4 text-white focus:border-blue-500 outline-none"
                                                    placeholder="Contoh: KopiEnak123"
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-sm font-bold text-gray-300 mb-2">Pesan Footer Struk (Spesial Message)</label>
                                                <textarea 
                                                    value={storeSettings.receipt_footer}
                                                    onChange={e => setStoreSettings({...storeSettings, receipt_footer: e.target.value})}
                                                    className="w-full bg-[#121214] border border-gray-800 rounded-xl p-4 text-white focus:border-blue-500 outline-none h-24 resize-none"
                                                    placeholder="Terima kasih atas kunjungan Anda..."
                                                ></textarea>
                                            </div>

                                            <button 
                                                onClick={handleSaveSettings}
                                                disabled={loading}
                                                className="px-8 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-500 transition-colors disabled:opacity-50 mt-4"
                                            >
                                                {loading ? "Menyimpan..." : "Simpan Pengaturan"}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
