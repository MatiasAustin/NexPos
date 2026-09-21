"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Store, ShieldAlert, CheckCircle2, AlertTriangle, Users, Power, Activity } from "lucide-react";
import { useToast } from "@/components/Toast";
import { LoadingSpinner } from "@/components/Loading";

export default function SuperAdminPage() {
    const router = useRouter();
    const toast = useToast();
    
    const [loading, setLoading] = useState(true);
    const [isSuperAdmin, setIsSuperAdmin] = useState(false);
    const [stores, setStores] = useState<any[]>([]);
    const [selectedStore, setSelectedStore] = useState<any | null>(null);
    const [editForm, setEditForm] = useState({ plan: 'pro', status: 'active' });
    const [saving, setSaving] = useState(false);
    
    // SaaS Settings State
    const [activeTab, setActiveTab] = useState<'dashboard' | 'settings'>('dashboard');
    const [saasSettings, setSaasSettings] = useState({ id: '', app_name: 'NexPos App', app_logo: '', support_email: 'support@nexpos.local', support_phone: '' });
    const [savingSettings, setSavingSettings] = useState(false);

    useEffect(() => {
        checkSuperAdmin();
    }, []);

    const checkSuperAdmin = async () => {
        setLoading(true);
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
            router.push('/login');
            return;
        }

        // Check if user is in super_admins table
        const { data: superAdmin } = await supabase
            .from('super_admins')
            .select('user_id')
            .eq('user_id', session.user.id)
            .maybeSingle();

        if (superAdmin) {
            setIsSuperAdmin(true);
            fetchStores();
            fetchSaasSettings();
        } else {
            toast.error("Akses Ditolak: Halaman ini khusus Super Admin.");
            router.push('/dashboard');
        }
    };

    const fetchSaasSettings = async () => {
        try {
            const { data } = await supabase.from('saas_settings').select('*').limit(1).maybeSingle();
            if (data) setSaasSettings(data);
        } catch (e) {
            console.log('saas_settings table might not exist yet');
        }
    };

    const fetchStores = async () => {
        const { data, error } = await supabase
            .from('stores')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error("Error fetching stores:", error);
            toast.error("Gagal mengambil data toko");
        } else {
            setStores(data || []);
        }
        setLoading(false);
    };

    const handleSaveSaasSettings = async (e: React.FormEvent) => {
        e.preventDefault();
        setSavingSettings(true);
        try {
            if (saasSettings.id) {
                await supabase.from('saas_settings').update({
                    app_name: saasSettings.app_name,
                    app_logo: saasSettings.app_logo,
                    support_email: saasSettings.support_email,
                    support_phone: saasSettings.support_phone
                }).eq('id', saasSettings.id);
            } else {
                const { data } = await supabase.from('saas_settings').insert([{
                    app_name: saasSettings.app_name,
                    app_logo: saasSettings.app_logo,
                    support_email: saasSettings.support_email,
                    support_phone: saasSettings.support_phone
                }]).select().single();
                if (data) setSaasSettings(data);
            }
            toast.success("Pengaturan aplikasi berhasil disimpan!");
        } catch (e: any) {
            toast.error("Gagal menyimpan pengaturan.");
        }
        setSavingSettings(false);
    };

    const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        
        // Auto compress logic
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target?.result as string;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const MAX_WIDTH = 500; // max width 500px
                const MAX_HEIGHT = 500;
                let width = img.width;
                let height = img.height;

                if (width > height && width > MAX_WIDTH) {
                    height *= MAX_WIDTH / width;
                    width = MAX_WIDTH;
                } else if (height > MAX_HEIGHT) {
                    width *= MAX_HEIGHT / height;
                    height = MAX_HEIGHT;
                }

                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx?.drawImage(img, 0, 0, width, height);
                // Convert to compressed WebP
                const compressedBase64 = canvas.toDataURL('image/webp', 0.8);
                setSaasSettings({ ...saasSettings, app_logo: compressedBase64 });
            };
        };
    };

    const openModal = (store: any) => {
        setSelectedStore(store);
        setEditForm({ plan: store.subscription_plan || 'pro', status: store.status || 'active' });
    };

    const handleUpdateStore = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedStore) return;
        
        setSaving(true);
        const { error } = await supabase
            .from('stores')
            .update({ 
                subscription_plan: editForm.plan, 
                status: editForm.status 
            })
            .eq('id', selectedStore.id);

        if (error) {
            console.error(error);
            toast.error("Gagal memperbarui toko");
        } else {
            toast.success("Berhasil memperbarui langganan tenant!");
            setSelectedStore(null);
            fetchStores();
        }
        setSaving(false);
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.push('/login');
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#0B0F19] flex items-center justify-center text-white flex-col gap-4">
                <LoadingSpinner size="lg" />
                <p className="text-gray-400">Verifikasi Akses Super Admin...</p>
            </div>
        );
    }

    if (!isSuperAdmin) return null; // Let router redirect

    return (
        <div className="min-h-screen bg-[#080B12] text-gray-200 p-6 md:p-10 font-sans">
            <div className="max-w-7xl mx-auto">
                
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4 bg-[#131B2C] p-6 rounded-3xl border border-gray-800">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-gradient-to-br from-red-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-red-900/20">
                            <ShieldAlert className="w-7 h-7 text-white" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-black text-white">SaaS Backoffice</h1>
                            <p className="text-sm text-gray-400">Manajemen Tenant & Subscription NexPos</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <Link href="/dashboard" className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-xl text-sm font-bold text-white transition-colors">
                            Ke Dashboard
                        </Link>
                        <button onClick={handleLogout} className="px-4 py-2 bg-red-600/10 hover:bg-red-600/20 border border-red-600/20 rounded-xl text-sm font-bold text-red-500 transition-colors flex items-center gap-2">
                            <Power className="w-4 h-4" /> Keluar
                        </button>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex gap-4 mb-8">
                    <button 
                        onClick={() => setActiveTab('dashboard')}
                        className={`px-6 py-3 rounded-xl font-bold transition-all ${activeTab === 'dashboard' ? 'bg-blue-600 text-white' : 'bg-[#131B2C] text-gray-400 hover:text-white border border-gray-800'}`}
                    >
                        Dashboard
                    </button>
                    <button 
                        onClick={() => setActiveTab('settings')}
                        className={`px-6 py-3 rounded-xl font-bold transition-all ${activeTab === 'settings' ? 'bg-blue-600 text-white' : 'bg-[#131B2C] text-gray-400 hover:text-white border border-gray-800'}`}
                    >
                        Pengaturan Aplikasi
                    </button>
                </div>

                {activeTab === 'dashboard' && (
                    <>
                        {/* Metrics */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                            <div className="bg-[#131B2C] border border-gray-800 rounded-3xl p-6 flex flex-col justify-between">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-gray-400 font-bold">Total Tenant (Toko)</h3>
                                    <Store className="w-5 h-5 text-blue-500" />
                                </div>
                                <p className="text-4xl font-black text-white">{stores.length}</p>
                            </div>
                            <div className="bg-[#131B2C] border border-gray-800 rounded-3xl p-6 flex flex-col justify-between">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-gray-400 font-bold">Tenant Aktif</h3>
                                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                                </div>
                                <p className="text-4xl font-black text-white">
                                    {stores.filter(s => s.status === 'active').length}
                                </p>
                            </div>
                            <div className="bg-[#131B2C] border border-gray-800 rounded-3xl p-6 flex flex-col justify-between">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-gray-400 font-bold">Total Revenue (MRR)</h3>
                                    <Activity className="w-5 h-5 text-purple-500" />
                                </div>
                                <p className="text-4xl font-black text-white">
                                    Rp {(stores.filter(s => s.status === 'active').length * 249000).toLocaleString('id-ID')}
                                </p>
                                <p className="text-xs text-gray-500 mt-2">*Asumsi rata-rata paket Pro</p>
                            </div>
                        </div>

                        {/* Store List */}
                        <div className="bg-[#131B2C] border border-gray-800 rounded-3xl overflow-hidden">
                            <div className="p-6 border-b border-gray-800 flex justify-between items-center">
                                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                                    <Users className="w-5 h-5 text-blue-400" /> Database Pelanggan SaaS
                                </h2>
                                <button 
                                    onClick={() => toast.info("Gunakan halaman /signup untuk registrasi tenant baru. Fitur input manual akan segera datang.")}
                                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-bold transition-all shadow-lg shadow-blue-900/20"
                                >
                                    + Tambah Tenant Manual
                                </button>
                            </div>
                            
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-gray-900/50">
                                            <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Nama Toko</th>
                                            <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">ID Tenant</th>
                                            <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Paket</th>
                                            <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                                            <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Dibuat Pada</th>
                                            <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Aksi</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {stores.map((store) => (
                                            <tr key={store.id} className="border-t border-gray-800 hover:bg-gray-800/30 transition-colors">
                                                <td className="p-4 font-bold text-white">{store.name}</td>
                                                <td className="p-4 text-xs text-gray-500 font-mono">{store.id.substring(0, 8)}...</td>
                                                <td className="p-4">
                                                    <span className="px-3 py-1 bg-purple-500/10 text-purple-400 text-xs font-bold uppercase rounded-full border border-purple-500/20">
                                                        {store.subscription_plan}
                                                    </span>
                                                </td>
                                                <td className="p-4">
                                                    {store.status === 'active' ? (
                                                        <span className="px-3 py-1 bg-green-500/10 text-green-400 text-xs font-bold uppercase rounded-full border border-green-500/20">
                                                            Aktif
                                                        </span>
                                                    ) : (
                                                        <span className="px-3 py-1 bg-red-500/10 text-red-400 text-xs font-bold uppercase rounded-full border border-red-500/20">
                                                            Suspend
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="p-4 text-sm text-gray-400">
                                                    {new Date(store.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                                                </td>
                                                <td className="p-4 text-right">
                                                    <button 
                                                        onClick={() => openModal(store)}
                                                        className="text-sm font-bold text-blue-500 hover:text-blue-400 transition-colors"
                                                    >
                                                        Kelola
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}

                                        {stores.length === 0 && (
                                            <tr>
                                                <td colSpan={6} className="p-8 text-center text-gray-500">
                                                    Belum ada data toko.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </>
                )}

                {activeTab === 'settings' && (
                    <div className="bg-[#131B2C] border border-gray-800 rounded-3xl p-6 md:p-10 shadow-xl max-w-4xl">
                        <h2 className="text-2xl font-bold text-white mb-2">Pengaturan Aplikasi SaaS</h2>
                        <p className="text-gray-400 mb-8">Ubah identitas aplikasi secara global yang akan dilihat oleh seluruh tenant.</p>
                        
                        <form onSubmit={handleSaveSaasSettings} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-6">
                                    <div>
                                        <label className="block text-sm font-bold text-gray-300 mb-2">Nama Aplikasi</label>
                                        <input 
                                            type="text" 
                                            value={saasSettings.app_name}
                                            onChange={e => setSaasSettings({...saasSettings, app_name: e.target.value})}
                                            className="w-full bg-[#0B0F19] border border-gray-800 text-white p-3 rounded-xl focus:border-blue-500 focus:outline-none"
                                            placeholder="Contoh: NexPos App"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-gray-300 mb-2">Email Bantuan / Support</label>
                                        <input 
                                            type="email" 
                                            value={saasSettings.support_email}
                                            onChange={e => setSaasSettings({...saasSettings, support_email: e.target.value})}
                                            className="w-full bg-[#0B0F19] border border-gray-800 text-white p-3 rounded-xl focus:border-blue-500 focus:outline-none"
                                            placeholder="support@domain.com"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-gray-300 mb-2">No. WhatsApp Bantuan</label>
                                        <input 
                                            type="text" 
                                            value={saasSettings.support_phone}
                                            onChange={e => setSaasSettings({...saasSettings, support_phone: e.target.value})}
                                            className="w-full bg-[#0B0F19] border border-gray-800 text-white p-3 rounded-xl focus:border-blue-500 focus:outline-none"
                                            placeholder="Contoh: 08123456789"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-gray-300 mb-2">Logo Aplikasi</label>
                                    <div className="border-2 border-dashed border-gray-700 bg-[#0B0F19] rounded-2xl p-6 flex flex-col items-center justify-center relative overflow-hidden group hover:border-blue-500 transition-colors">
                                        {saasSettings.app_logo ? (
                                            <div className="relative z-10 w-32 h-32 flex items-center justify-center bg-white/5 rounded-2xl p-2">
                                                <img src={saasSettings.app_logo} alt="Logo" className="max-w-full max-h-full object-contain" />
                                            </div>
                                        ) : (
                                            <div className="w-16 h-16 bg-gray-800 rounded-2xl flex items-center justify-center mb-4">
                                                <span className="text-gray-500 text-2xl font-black">N</span>
                                            </div>
                                        )}
                                        <p className="text-gray-400 text-sm mt-4 text-center">
                                            Klik untuk upload logo.<br/>
                                            <span className="text-xs text-gray-500">(Auto-compress ke WebP maks 500x500, format direkomendasikan PNG/JPG transparan)</span>
                                        </p>
                                        <input 
                                            type="file" 
                                            accept="image/*"
                                            onChange={handleLogoUpload}
                                            className="absolute inset-0 opacity-0 cursor-pointer z-20"
                                        />
                                    </div>
                                </div>
                            </div>
                            
                            <div className="pt-8 border-t border-gray-800 flex justify-end">
                                <button type="submit" disabled={savingSettings} className="px-8 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-colors disabled:opacity-50">
                                    {savingSettings ? "Menyimpan..." : "Simpan Pengaturan"}
                                </button>
                            </div>
                        </form>
                    </div>
                )}
                
            </div>

            {/* Modal Edit */}
            {selectedStore && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
                    <div className="bg-[#131B2C] border border-gray-800 rounded-3xl p-6 max-w-md w-full shadow-2xl">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-white">Kelola Tenant</h2>
                            <button onClick={() => setSelectedStore(null)} className="text-gray-500 hover:text-white">✕</button>
                        </div>
                        <p className="text-sm text-gray-400 mb-6">Ubah paket dan status untuk toko <strong className="text-white">{selectedStore.name}</strong></p>
                        
                        <form onSubmit={handleUpdateStore} className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-gray-400 mb-2">Paket Berlangganan</label>
                                <select 
                                    value={editForm.plan} 
                                    onChange={(e) => setEditForm({...editForm, plan: e.target.value})}
                                    className="w-full bg-[#080B12] border border-gray-800 text-white p-3 rounded-xl focus:border-blue-500 focus:outline-none"
                                >
                                    <option value="starter">Starter</option>
                                    <option value="pro">Pro</option>
                                    <option value="enterprise">Enterprise</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-400 mb-2">Status Akun</label>
                                <select 
                                    value={editForm.status} 
                                    onChange={(e) => setEditForm({...editForm, status: e.target.value})}
                                    className="w-full bg-[#080B12] border border-gray-800 text-white p-3 rounded-xl focus:border-blue-500 focus:outline-none"
                                >
                                    <option value="active">Aktif</option>
                                    <option value="suspended">Suspend (Diblokir)</option>
                                    <option value="pending_payment">Menunggu Pembayaran</option>
                                </select>
                            </div>
                            
                            <div className="flex gap-4 mt-8 pt-4 border-t border-gray-800">
                                <button type="button" onClick={() => setSelectedStore(null)} className="flex-1 py-3 bg-gray-800 hover:bg-gray-700 text-white font-bold rounded-xl transition-colors">Batal</button>
                                <button type="submit" disabled={saving} className="flex-1 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-colors disabled:opacity-50">
                                    {saving ? "Menyimpan..." : "Simpan Perubahan"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
