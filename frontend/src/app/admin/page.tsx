"use client";

import { useState, useEffect } from "react";
import { getReconciliationReport, getAuditLogs } from "@/lib/api";
import Link from "next/link";
import { ArrowLeft, RefreshCw, AlertTriangle, ShieldCheck, Users, Package } from "lucide-react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function AdminDashboard() {
    const [activeTab, setActiveTab] = useState<"reconciliation" | "audit" | "staff" | "inventory">("reconciliation");
    const [reconciliation, setReconciliation] = useState<any[]>([]);
    const [auditLogs, setAuditLogs] = useState<any[]>([]);
    
    // Staff states
    const [staffList, setStaffList] = useState<any[]>([]);
    const [newStaff, setNewStaff] = useState({ full_name: '', email: '', password: '', role: 'staff' });
    
    // Inventory states
    const [products, setProducts] = useState<any[]>([]);
    const [newProduct, setNewProduct] = useState({ name: '', category: '', price: 0, cogs: 0, stock: 0, image_icon: '📦' });
    
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
                const today = new Date().toISOString().split('T')[0];
                const report = await getReconciliationReport(today, today + "T23:59:59Z");
                setReconciliation(report);
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
            }
        } catch (error) {
            console.error("Error fetching data", error);
        }
        setLoading(false);
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
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/products`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...newProduct,
                    price: Number(newProduct.price),
                    cogs: Number(newProduct.cogs),
                    stock: Number(newProduct.stock),
                })
            });
            if(res.ok) {
                alert("Produk berhasil ditambahkan!");
                setNewProduct({ name: '', category: '', price: 0, cogs: 0, stock: 0, image_icon: '📦' });
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

    return (
        <div className="min-h-screen bg-gray-50 text-gray-900 p-8">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <Link href="/" className="flex items-center text-gray-500 hover:text-blue-600 mb-2">
                            <ArrowLeft className="w-4 h-4 mr-1" /> Kembali ke Home
                        </Link>
                        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
                        <p className="text-gray-500">NexPos Control Center</p>
                    </div>
                    <button 
                        onClick={fetchData}
                        className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg shadow-sm hover:bg-gray-50"
                    >
                        <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} /> Refresh
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex gap-4 mb-6 border-b border-gray-200">
                    <button 
                        onClick={() => setActiveTab("reconciliation")}
                        className={`pb-4 px-2 font-semibold ${activeTab === "reconciliation" ? "border-b-2 border-blue-600 text-blue-600" : "text-gray-500 hover:text-gray-800"}`}
                    >
                        Laporan Rekonsiliasi
                    </button>
                    <button 
                        onClick={() => setActiveTab("audit")}
                        className={`pb-4 px-2 font-semibold ${activeTab === "audit" ? "border-b-2 border-blue-600 text-blue-600" : "text-gray-500 hover:text-gray-800"}`}
                    >
                        Audit & Security Log
                    </button>
                    <button 
                        onClick={() => setActiveTab("staff")}
                        className={`pb-4 px-2 font-semibold ${activeTab === "staff" ? "border-b-2 border-blue-600 text-blue-600" : "text-gray-500 hover:text-gray-800"}`}
                    >
                        Manajemen Staf
                    </button>
                    <button 
                        onClick={() => setActiveTab("inventory")}
                        className={`pb-4 px-2 font-semibold ${activeTab === "inventory" ? "border-b-2 border-blue-600 text-blue-600" : "text-gray-500 hover:text-gray-800"}`}
                    >
                        Produk & Stok
                    </button>
                </div>

                {/* Content */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 min-h-[400px]">
                    {loading ? (
                        <div className="flex items-center justify-center h-[300px] text-gray-400">Loading data...</div>
                    ) : (
                        <>
                            {/* RECONCILIATION TAB */}
                            {activeTab === "reconciliation" && (
                                <div>
                                    <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                                        <AlertTriangle className="w-5 h-5 text-orange-500" />
                                        Bandingkan POS vs Aktual
                                    </h2>
                                    {reconciliation.length === 0 ? (
                                        <p className="text-gray-500">Belum ada transaksi hari ini.</p>
                                    ) : (
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-left border-collapse">
                                                <thead>
                                                    <tr className="bg-gray-50 border-b border-gray-200">
                                                        <th className="p-4 font-semibold text-gray-600">Metode Pembayaran</th>
                                                        <th className="p-4 font-semibold text-gray-600">Jml Transaksi</th>
                                                        <th className="p-4 font-semibold text-gray-600 text-right">Total POS (Rp)</th>
                                                        <th className="p-4 font-semibold text-gray-600 text-right">Tercatat di Provider (Rp)</th>
                                                        <th className="p-4 font-semibold text-gray-600 text-right">Selisih</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {reconciliation.map((row, idx) => (
                                                        <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50">
                                                            <td className="p-4 font-medium">{row.method_name}</td>
                                                            <td className="p-4 text-gray-600">{row.transaction_count}</td>
                                                            <td className="p-4 text-right font-bold text-blue-600">
                                                                {row.pos_total.toLocaleString('id-ID')}
                                                            </td>
                                                            <td className="p-4 text-right text-gray-600">
                                                                {/* Simulasi data aktual provider, aslinya diambil dari integrasi */}
                                                                {row.pos_total.toLocaleString('id-ID')}
                                                            </td>
                                                            <td className="p-4 text-right font-bold text-green-500">0</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* AUDIT LOG TAB */}
                            {activeTab === "audit" && (
                                <div>
                                    <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                                        <ShieldCheck className="w-5 h-5 text-green-600" />
                                        Jejak Audit Sistem
                                    </h2>
                                    {auditLogs.length === 0 ? (
                                        <p className="text-gray-500">Belum ada jejak audit yang terekam.</p>
                                    ) : (
                                        <div className="space-y-4">
                                            {auditLogs.map((log) => (
                                                <div key={log.id} className="p-4 rounded-lg bg-gray-50 border border-gray-200 flex justify-between items-center">
                                                    <div>
                                                        <p className="font-bold text-gray-800 capitalize">
                                                            Aksi: {log.action.replace('_', ' ')}
                                                        </p>
                                                        <p className="text-sm text-gray-500">
                                                            Entity: {log.entity_type} | Staff ID: {log.staff_id}
                                                        </p>
                                                    </div>
                                                    <div className="text-right text-xs text-gray-400">
                                                        {new Date(log.created_at).toLocaleString('id-ID')}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* STAFF MANAGEMENT TAB */}
                            {activeTab === "staff" && (
                                <div>
                                    <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                                        <Users className="w-5 h-5 text-purple-600" />
                                        Manajemen Staf
                                    </h2>
                                    
                                    <form onSubmit={handleCreateStaff} className="mb-8 p-6 bg-gray-50 rounded-xl border border-gray-200">
                                        <h3 className="font-bold mb-4">Tambah Akun Baru</h3>
                                        <div className="grid grid-cols-2 gap-4 mb-4">
                                            <input 
                                                type="text" placeholder="Nama Lengkap" required
                                                value={newStaff.full_name} onChange={e => setNewStaff({...newStaff, full_name: e.target.value})}
                                                className="p-3 border rounded-lg focus:border-blue-500 focus:outline-none text-gray-900 font-medium"
                                            />
                                            <input 
                                                type="email" placeholder="Email (misal: budi@nexpos.local)" required
                                                value={newStaff.email} onChange={e => setNewStaff({...newStaff, email: e.target.value})}
                                                className="p-3 border rounded-lg focus:border-blue-500 focus:outline-none text-gray-900 font-medium"
                                            />
                                            <input 
                                                type="password" placeholder="Password (min 6 karakter)" required minLength={6}
                                                value={newStaff.password} onChange={e => setNewStaff({...newStaff, password: e.target.value})}
                                                className="p-3 border rounded-lg focus:border-blue-500 focus:outline-none text-gray-900 font-medium"
                                            />
                                            <select 
                                                value={newStaff.role} onChange={e => setNewStaff({...newStaff, role: e.target.value})}
                                                className="p-3 border rounded-lg focus:border-blue-500 focus:outline-none text-gray-900 font-medium"
                                            >
                                                <option value="staff">Kasir (Staff)</option>
                                                <option value="owner">Admin (Owner)</option>
                                            </select>
                                        </div>
                                        <button type="submit" disabled={loading} className="px-6 py-3 bg-blue-600 text-white rounded-lg font-bold">
                                            {loading ? 'Menyimpan...' : 'Buat Akun'}
                                        </button>
                                    </form>

                                    {staffList.length === 0 ? (
                                        <p className="text-gray-500">Belum ada data staf.</p>
                                    ) : (
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-left border-collapse">
                                                <thead>
                                                    <tr className="bg-gray-50 border-b border-gray-200">
                                                        <th className="p-4 font-semibold text-gray-600">Nama</th>
                                                        <th className="p-4 font-semibold text-gray-600">Role</th>
                                                        <th className="p-4 font-semibold text-gray-600">Status</th>
                                                        <th className="p-4 font-semibold text-gray-600 text-right">Terdaftar</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {staffList.map((st: any) => (
                                                        <tr key={st.id} className="border-b border-gray-100 hover:bg-gray-50">
                                                            <td className="p-4 font-bold">{st.full_name}</td>
                                                            <td className="p-4">
                                                                <span className={`px-2 py-1 text-xs font-bold rounded-full ${st.role === 'owner' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-700'}`}>
                                                                    {st.role.toUpperCase()}
                                                                </span>
                                                            </td>
                                                            <td className="p-4">
                                                                {st.is_active ? <span className="text-green-600 font-bold">Aktif</span> : <span className="text-red-500">Nonaktif</span>}
                                                            </td>
                                                            <td className="p-4 text-right text-gray-500 text-sm">
                                                                {new Date(st.created_at).toLocaleDateString('id-ID')}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* INVENTORY MANAGEMENT TAB */}
                            {activeTab === "inventory" && (
                                <div>
                                    <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                                        <Package className="w-5 h-5 text-orange-600" />
                                        Manajemen Produk & Stok
                                    </h2>
                                    
                                    <form onSubmit={handleCreateProduct} className="mb-8 p-6 bg-gray-50 rounded-xl border border-gray-200">
                                        <h3 className="font-bold mb-4">Tambah Produk Baru</h3>
                                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                                            <input 
                                                type="text" placeholder="Nama Produk (Cth: Kopi Hitam)" required
                                                value={newProduct.name} onChange={e => setNewProduct({...newProduct, name: e.target.value})}
                                                className="p-3 border rounded-lg focus:border-blue-500 focus:outline-none text-gray-900 font-medium"
                                            />
                                            <input 
                                                type="text" placeholder="Kategori (Cth: Coffee)" required
                                                value={newProduct.category} onChange={e => setNewProduct({...newProduct, category: e.target.value})}
                                                className="p-3 border rounded-lg focus:border-blue-500 focus:outline-none text-gray-900 font-medium"
                                            />
                                            <input 
                                                type="text" placeholder="Icon / Emoji (Cth: ☕)"
                                                value={newProduct.image_icon} onChange={e => setNewProduct({...newProduct, image_icon: e.target.value})}
                                                className="p-3 border rounded-lg focus:border-blue-500 focus:outline-none text-gray-900 font-medium"
                                            />
                                            <div className="flex flex-col">
                                                <label className="text-xs text-gray-500 mb-1">Harga Jual (Rp)</label>
                                                <input 
                                                    type="number" placeholder="Harga Jual" required min={0}
                                                    value={newProduct.price} onChange={e => setNewProduct({...newProduct, price: Number(e.target.value)})}
                                                    className="p-3 border rounded-lg focus:border-blue-500 focus:outline-none text-gray-900 font-medium"
                                                />
                                            </div>
                                            <div className="flex flex-col">
                                                <label className="text-xs text-gray-500 mb-1">HPP / Modal (Rp)</label>
                                                <input 
                                                    type="number" placeholder="HPP / Modal" required min={0}
                                                    value={newProduct.cogs} onChange={e => setNewProduct({...newProduct, cogs: Number(e.target.value)})}
                                                    className="p-3 border rounded-lg focus:border-blue-500 focus:outline-none text-gray-900 font-medium"
                                                />
                                            </div>
                                            <div className="flex flex-col">
                                                <label className="text-xs text-gray-500 mb-1">Stok Awal</label>
                                                <input 
                                                    type="number" placeholder="Stok" required min={0}
                                                    value={newProduct.stock} onChange={e => setNewProduct({...newProduct, stock: Number(e.target.value)})}
                                                    className="p-3 border rounded-lg focus:border-blue-500 focus:outline-none text-gray-900 font-medium"
                                                />
                                            </div>
                                        </div>
                                        <button type="submit" disabled={loading} className="px-6 py-3 bg-blue-600 text-white rounded-lg font-bold w-full md:w-auto">
                                            {loading ? 'Menyimpan...' : 'Tambah Produk'}
                                        </button>
                                    </form>

                                    {products.length === 0 ? (
                                        <p className="text-gray-500">Belum ada data produk.</p>
                                    ) : (
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-left border-collapse">
                                                <thead>
                                                    <tr className="bg-gray-50 border-b border-gray-200">
                                                        <th className="p-4 font-semibold text-gray-600">Produk</th>
                                                        <th className="p-4 font-semibold text-gray-600 text-right">Harga Jual</th>
                                                        <th className="p-4 font-semibold text-gray-600 text-right">HPP</th>
                                                        <th className="p-4 font-semibold text-gray-600 text-right">Profit</th>
                                                        <th className="p-4 font-semibold text-gray-600 text-center">Stok</th>
                                                        <th className="p-4 font-semibold text-gray-600 text-center">Status</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {products.map((p: any) => (
                                                        <tr key={p.id} className="border-b border-gray-100 hover:bg-gray-50">
                                                            <td className="p-4">
                                                                <div className="flex items-center gap-3">
                                                                    <div className="w-10 h-10 bg-white border border-gray-200 rounded flex items-center justify-center text-xl">
                                                                        {p.image_icon}
                                                                    </div>
                                                                    <div>
                                                                        <p className="font-bold text-gray-900">{p.name}</p>
                                                                        <p className="text-xs text-gray-500">{p.category}</p>
                                                                    </div>
                                                                </div>
                                                            </td>
                                                            <td className="p-4 text-right font-medium">Rp {p.price.toLocaleString('id-ID')}</td>
                                                            <td className="p-4 text-right text-gray-500">Rp {p.cogs.toLocaleString('id-ID')}</td>
                                                            <td className="p-4 text-right text-green-600 font-bold">Rp {(p.price - p.cogs).toLocaleString('id-ID')}</td>
                                                            <td className="p-4 text-center">
                                                                <span className={`px-3 py-1 rounded-full text-sm font-bold ${p.stock <= 5 ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-700'}`}>
                                                                    {p.stock}
                                                                </span>
                                                            </td>
                                                            <td className="p-4 text-center">
                                                                {p.is_active ? <span className="text-green-600 font-bold text-sm">Aktif</span> : <span className="text-gray-400 text-sm">Nonaktif</span>}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
