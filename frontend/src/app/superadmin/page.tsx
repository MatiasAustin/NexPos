"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";
import ThemeToggle from "@/components/ThemeToggle";
import AppLogo from "@/components/AppLogo";
import LogoDropzone from "@/components/LogoDropzone";
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
    const [saasSettings, setSaasSettings] = useState({ 
        id: '', app_name: 'NexPos App', app_logo: '', logo_show_background: false,
        support_email: 'support@nexpos.local', support_phone: '',
        maintenance_mode: false, plan_starter_price: 0, plan_pro_price: 149000, plan_enterprise_price: 499000
    });
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
            if (data) setSaasSettings(prev => ({ ...prev, ...data }));
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
            const payload = {
                app_name: saasSettings.app_name,
                app_logo: saasSettings.app_logo,
                logo_show_background: saasSettings.logo_show_background,
                support_email: saasSettings.support_email,
                support_phone: saasSettings.support_phone,
                maintenance_mode: saasSettings.maintenance_mode,
                plan_starter_price: Number(saasSettings.plan_starter_price),
                plan_pro_price: Number(saasSettings.plan_pro_price),
                plan_enterprise_price: Number(saasSettings.plan_enterprise_price)
            };

            if (saasSettings.id) {
                await supabase.from('saas_settings').update(payload).eq('id', saasSettings.id);
            } else {
                const { data } = await supabase.from('saas_settings').insert([payload]).select().single();
                if (data) setSaasSettings(prev => ({ ...prev, ...data }));
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
        
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target?.result as string;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const MAX = 500;
                let w = img.width, h = img.height;
                if (w > h && w > MAX) { h *= MAX / w; w = MAX; }
                else if (h > MAX) { w *= MAX / h; h = MAX; }
                canvas.width = w; canvas.height = h;
                const ctx = canvas.getContext('2d');
                ctx?.drawImage(img, 0, 0, w, h);
                const compressed = canvas.toDataURL('image/webp', 0.8);
                setSaasSettings(prev => ({ ...prev, app_logo: compressed }));
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
            .update({ subscription_plan: editForm.plan, status: editForm.status })
            .eq('id', selectedStore.id);

        if (error) {
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
            <div className="min-h-screen bg-background flex items-center justify-center text-text-primary flex-col gap-4">
                <LoadingSpinner size="lg" />
                <p className="text-text-muted">Verifikasi Akses Super Admin...</p>
            </div>
        );
    }

    if (!isSuperAdmin) return null;

    return (
        <div className="min-h-screen bg-background text-text-primary p-6 md:p-10 font-sans">
            <div className="max-w-7xl mx-auto">
                
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4 bg-surface p-6 rounded-3xl border border-border">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-gradient-to-br from-red-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-red-900/20">
                            <ShieldAlert className="w-7 h-7 text-white" />
                        </div>
                        <div>
                            <h1 className="text-lg font-semibold text-text-primary">SaaS Backoffice</h1>
                            <p className="text-sm text-text-muted">Manajemen Tenant & Subscription NexPos</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <ThemeToggle />
                        <Link href="/dashboard" className="px-4 py-2 bg-surface-hover hover:bg-border rounded-xl text-sm font-medium text-text-primary transition-colors">
                            Ke Dashboard
                        </Link>
                        <button onClick={handleLogout} className="px-4 py-2 bg-red-600/10 hover:bg-red-600/20 border border-red-600/20 rounded-xl text-sm font-medium text-red-500 transition-colors flex items-center gap-2">
                            <Power className="w-4 h-4" /> Keluar
                        </button>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex gap-3 mb-8">
                    <button 
                        onClick={() => setActiveTab('dashboard')}
                        className={`px-5 py-2 rounded-xl font-medium text-sm transition-all ${activeTab === 'dashboard' ? 'bg-accent text-accent-fg' : 'bg-surface text-text-muted hover:text-text-primary border border-border'}`}
                    >
                        Dashboard
                    </button>
                    <button 
                        onClick={() => setActiveTab('settings')}
                        className={`px-5 py-2 rounded-xl font-medium text-sm transition-all ${activeTab === 'settings' ? 'bg-accent text-accent-fg' : 'bg-surface text-text-muted hover:text-text-primary border border-border'}`}
                    >
                        Pengaturan Aplikasi
                    </button>
                </div>

                {activeTab === 'dashboard' && (
                    <>
                        {/* Metrics */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                            <div className="bg-surface border border-border rounded-3xl p-6">
                                <div className="flex items-center justify-between mb-3">
                                    <p className="text-sm text-text-muted font-medium">Total Tenant</p>
                                    <Store className="w-4 h-4 text-blue-500" />
                                </div>
                                <p className="text-3xl font-bold text-text-primary">{stores.length}</p>
                            </div>
                            <div className="bg-surface border border-border rounded-3xl p-6">
                                <div className="flex items-center justify-between mb-3">
                                    <p className="text-sm text-text-muted font-medium">Tenant Aktif</p>
                                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                                </div>
                                <p className="text-3xl font-bold text-text-primary">
                                    {stores.filter(s => s.status === 'active').length}
                                </p>
                            </div>
                            <div className="bg-surface border border-border rounded-3xl p-6">
                                <div className="flex items-center justify-between mb-3">
                                    <p className="text-sm text-text-muted font-medium">Est. MRR</p>
                                    <Activity className="w-4 h-4 text-purple-500" />
                                </div>
                                <p className="text-3xl font-bold text-text-primary">
                                    Rp {(stores.filter(s => s.status === 'active').length * 249000).toLocaleString('id-ID')}
                                </p>
                                <p className="text-xs text-text-muted mt-1">*Asumsi rata-rata paket Pro</p>
                            </div>
                        </div>

                        {/* Store List */}
                        <div className="bg-surface border border-border rounded-3xl overflow-hidden">
                            <div className="p-5 border-b border-border flex justify-between items-center">
                                <h2 className="text-base font-semibold text-text-primary flex items-center gap-2">
                                    <Users className="w-4 h-4 text-accent" /> Database Pelanggan SaaS
                                </h2>
                                <button 
                                    onClick={() => toast.info("Gunakan halaman /signup untuk registrasi tenant baru.")}
                                    className="px-3 py-1.5 bg-accent hover:bg-accent-hover text-accent-fg rounded-lg text-xs font-medium transition-all"
                                >
                                    + Tambah Tenant
                                </button>
                            </div>
                            
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-surface-hover">
                                            <th className="p-4 text-xs font-medium text-text-muted uppercase tracking-wider">Nama Toko</th>
                                            <th className="p-4 text-xs font-medium text-text-muted uppercase tracking-wider">ID Tenant</th>
                                            <th className="p-4 text-xs font-medium text-text-muted uppercase tracking-wider">Paket</th>
                                            <th className="p-4 text-xs font-medium text-text-muted uppercase tracking-wider">Status</th>
                                            <th className="p-4 text-xs font-medium text-text-muted uppercase tracking-wider">Dibuat</th>
                                            <th className="p-4 text-xs font-medium text-text-muted uppercase tracking-wider text-right">Aksi</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {stores.map((store) => (
                                            <tr key={store.id} className="border-t border-border hover:bg-surface-hover transition-colors">
                                                <td className="p-4 font-medium text-text-primary">{store.name}</td>
                                                <td className="p-4 text-xs text-text-muted font-mono">{store.id.substring(0, 8)}...</td>
                                                <td className="p-4">
                                                    <span className="px-2.5 py-0.5 bg-purple-500/10 text-purple-400 text-xs font-medium uppercase rounded-full border border-purple-500/20">
                                                        {store.subscription_plan}
                                                    </span>
                                                </td>
                                                <td className="p-4">
                                                    {store.status === 'active' ? (
                                                        <span className="px-2.5 py-0.5 bg-green-500/10 text-green-600 text-xs font-medium uppercase rounded-full border border-green-500/20">Aktif</span>
                                                    ) : (
                                                        <span className="px-2.5 py-0.5 bg-red-500/10 text-red-500 text-xs font-medium uppercase rounded-full border border-red-500/20">Suspend</span>
                                                    )}
                                                </td>
                                                <td className="p-4 text-sm text-text-muted">
                                                    {new Date(store.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                </td>
                                                <td className="p-4 text-right">
                                                    <button 
                                                        onClick={() => openModal(store)}
                                                        className="text-sm font-medium text-accent hover:underline transition-colors"
                                                    >
                                                        Kelola →
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                        {stores.length === 0 && (
                                            <tr>
                                                <td colSpan={6} className="p-8 text-center text-text-muted">Belum ada data toko.</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </>
                )}

                {activeTab === 'settings' && (
                    <div className="bg-surface border border-border rounded-3xl p-6 md:p-10 max-w-4xl">
                        <h2 className="text-base font-semibold text-text-primary mb-1">Pengaturan Aplikasi SaaS</h2>
                        <p className="text-sm text-text-muted mb-8">Ubah identitas aplikasi secara global yang dilihat seluruh tenant.</p>
                        
                        <form onSubmit={handleSaveSaasSettings} className="space-y-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                {/* Left: Text fields */}
                                <div className="space-y-5">
                                    <div>
                                        <label className="block text-sm font-medium text-text-secondary mb-1.5">Nama Aplikasi</label>
                                        <input 
                                            type="text" 
                                            value={saasSettings.app_name}
                                            onChange={e => setSaasSettings({...saasSettings, app_name: e.target.value})}
                                            className="w-full bg-background border border-border text-text-primary px-3 py-2.5 rounded-xl focus:border-accent focus:outline-none text-sm"
                                            placeholder="Contoh: NexPos App"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-text-secondary mb-1.5">Email Support</label>
                                        <input 
                                            type="email" 
                                            value={saasSettings.support_email}
                                            onChange={e => setSaasSettings({...saasSettings, support_email: e.target.value})}
                                            className="w-full bg-background border border-border text-text-primary px-3 py-2.5 rounded-xl focus:border-accent focus:outline-none text-sm"
                                            placeholder="support@domain.com"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-text-secondary mb-1.5">No. WhatsApp Support</label>
                                        <input 
                                            type="text" 
                                            value={saasSettings.support_phone}
                                            onChange={e => setSaasSettings({...saasSettings, support_phone: e.target.value})}
                                            className="w-full bg-background border border-border text-text-primary px-3 py-2.5 rounded-xl focus:border-accent focus:outline-none text-sm"
                                            placeholder="08123456789"
                                        />
                                    </div>
                                </div>

                                {/* Right: Logo upload */}
                                <div className="space-y-4">
                                    <LogoDropzone
                                        logoUrl={saasSettings.app_logo}
                                        showBackground={saasSettings.logo_show_background}
                                        fallbackLetter={saasSettings.app_name.charAt(0) || 'N'}
                                        onLogoChange={(base64) => setSaasSettings(prev => ({ ...prev, app_logo: base64 }))}
                                        onLogoClear={() => setSaasSettings(prev => ({ ...prev, app_logo: '' }))}
                                    />

                                    {/* Logo background toggle */}
                                    <div className="bg-background border border-border rounded-xl p-4 flex items-center justify-between gap-4">
                                        <div>
                                            <p className="text-sm font-medium text-text-primary">Tampilkan Background Logo</p>
                                            <p className="text-xs text-text-muted mt-0.5">Jika off, logo ditampilkan tanpa frame/background (cocok untuk logo transparan). Jika on, logo diberi kotak berwarna.</p>
                                        </div>
                                        <label className="relative inline-flex items-center cursor-pointer shrink-0">
                                            <input 
                                                type="checkbox" 
                                                className="sr-only peer" 
                                                checked={saasSettings.logo_show_background}
                                                onChange={e => setSaasSettings({...saasSettings, logo_show_background: e.target.checked})}
                                            />
                                            <div className="w-11 h-6 bg-border peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-accent"></div>
                                        </label>
                                    </div>
                                </div>
                            </div>

                            {/* Pricing */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 border-t border-border pt-8">
                                <div className="space-y-5">
                                    <h3 className="text-sm font-semibold text-text-primary">Harga Paket</h3>
                                    <div>
                                        <label className="block text-sm font-medium text-text-secondary mb-1.5">Paket Starter (Rp)</label>
                                        <input type="number" value={saasSettings.plan_starter_price} onChange={e => setSaasSettings({...saasSettings, plan_starter_price: Number(e.target.value)})} className="w-full bg-background border border-border text-text-primary px-3 py-2.5 rounded-xl focus:border-accent focus:outline-none text-sm" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-text-secondary mb-1.5">Paket Pro (Rp)</label>
                                        <input type="number" value={saasSettings.plan_pro_price} onChange={e => setSaasSettings({...saasSettings, plan_pro_price: Number(e.target.value)})} className="w-full bg-background border border-border text-text-primary px-3 py-2.5 rounded-xl focus:border-accent focus:outline-none text-sm" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-text-secondary mb-1.5">Paket Enterprise (Rp)</label>
                                        <input type="number" value={saasSettings.plan_enterprise_price} onChange={e => setSaasSettings({...saasSettings, plan_enterprise_price: Number(e.target.value)})} className="w-full bg-background border border-border text-text-primary px-3 py-2.5 rounded-xl focus:border-accent focus:outline-none text-sm" />
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <h3 className="text-sm font-semibold text-text-primary">Maintenance Mode</h3>
                                    <div className="bg-background border border-border rounded-xl p-4 flex items-center justify-between gap-4">
                                        <div>
                                            <p className="text-sm font-medium text-text-primary">Mode Perbaikan Sistem</p>
                                            <p className="text-xs text-text-muted mt-0.5">Semua kasir/admin tidak dapat login saat aktif.</p>
                                        </div>
                                        <label className="relative inline-flex items-center cursor-pointer shrink-0">
                                            <input 
                                                type="checkbox" 
                                                className="sr-only peer" 
                                                checked={saasSettings.maintenance_mode}
                                                onChange={e => setSaasSettings({...saasSettings, maintenance_mode: e.target.checked})}
                                            />
                                            <div className="w-11 h-6 bg-border peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-500"></div>
                                        </label>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="pt-4 border-t border-border flex justify-end">
                                <button type="submit" disabled={savingSettings} className="px-6 py-2.5 bg-accent hover:bg-accent-hover text-accent-fg font-medium rounded-xl transition-colors disabled:opacity-50 text-sm">
                                    {savingSettings ? "Menyimpan..." : "Simpan Pengaturan"}
                                </button>
                            </div>
                        </form>
                    </div>
                )}
            </div>

            {/* Modal Edit Tenant */}
            {selectedStore && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
                    <div className="bg-surface border border-border rounded-3xl p-6 max-w-md w-full shadow-xl">
                        <div className="flex justify-between items-center mb-5">
                            <h2 className="text-base font-semibold text-text-primary">Kelola Tenant</h2>
                            <button onClick={() => setSelectedStore(null)} className="text-text-muted hover:text-text-primary w-8 h-8 flex items-center justify-center rounded-lg hover:bg-surface-hover transition-colors">✕</button>
                        </div>
                        <p className="text-sm text-text-muted mb-5">Ubah paket dan status untuk toko <strong className="text-text-primary">{selectedStore.name}</strong></p>
                        
                        <form onSubmit={handleUpdateStore} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-text-secondary mb-1.5">Paket Berlangganan</label>
                                <select 
                                    value={editForm.plan} 
                                    onChange={(e) => setEditForm({...editForm, plan: e.target.value})}
                                    className="w-full bg-background border border-border text-text-primary px-3 py-2.5 rounded-xl focus:border-accent focus:outline-none text-sm"
                                >
                                    <option value="starter">Starter</option>
                                    <option value="pro">Pro</option>
                                    <option value="enterprise">Enterprise</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-text-secondary mb-1.5">Status Akun</label>
                                <select 
                                    value={editForm.status} 
                                    onChange={(e) => setEditForm({...editForm, status: e.target.value})}
                                    className="w-full bg-background border border-border text-text-primary px-3 py-2.5 rounded-xl focus:border-accent focus:outline-none text-sm"
                                >
                                    <option value="active">Aktif</option>
                                    <option value="suspended">Suspend (Diblokir)</option>
                                    <option value="pending_payment">Menunggu Pembayaran</option>
                                </select>
                            </div>
                            
                            <div className="flex gap-3 mt-6 pt-4 border-t border-border">
                                <button type="button" onClick={() => setSelectedStore(null)} className="flex-1 py-2.5 bg-surface-hover hover:bg-border text-text-primary font-medium rounded-xl transition-colors text-sm">Batal</button>
                                <button type="submit" disabled={saving} className="flex-1 py-2.5 bg-accent hover:bg-accent-hover text-accent-fg font-medium rounded-xl transition-colors disabled:opacity-50 text-sm">
                                    {saving ? "Menyimpan..." : "Simpan"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
