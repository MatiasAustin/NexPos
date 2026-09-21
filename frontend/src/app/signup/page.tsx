"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Store, Mail, User, Phone, CheckCircle2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/components/Toast";

function SignupContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const plan = searchParams?.get("plan") || "pro";
    const toast = useToast();

    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [formData, setFormData] = useState({
        ownerName: "",
        storeName: "",
        email: "",
        phone: "",
        password: ""
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        
        try {
            // 1. Register to Supabase Auth
            const { data: authData, error: authError } = await supabase.auth.signUp({
                email: formData.email,
                password: formData.password
            });

            if (authError) throw authError;
            if (!authData.user) throw new Error("Gagal membuat akun.");

            // 2. Call RPC to create store & staff_profile
            const { error: rpcError } = await supabase.rpc('register_new_tenant', {
                p_owner_name: formData.ownerName,
                p_store_name: formData.storeName,
                p_email: formData.email,
                p_phone: formData.phone,
                p_plan: plan,
                p_user_id: authData.user.id
            });

            if (rpcError) throw rpcError;

            setSuccess(true);
        } catch (err: any) {
            console.error(err);
            toast.error(err.message || "Terjadi kesalahan saat pendaftaran");
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center p-4">
                <div className="bg-surface border border-border p-10 rounded-3xl text-center max-w-md w-full shadow-soft relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-green-500/5 rounded-full blur-[80px] pointer-events-none -translate-y-1/2 translate-x-1/2"></div>
                    <div className="w-20 h-20 bg-green-500/10 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6 relative z-10">
                        <CheckCircle2 className="w-10 h-10" />
                    </div>
                    <h2 className="text-2xl font-bold text-text-primary mb-4 relative z-10">Pendaftaran Berhasil!</h2>
                    <p className="text-text-muted mb-8 relative z-10">
                        Terima kasih telah mendaftar. Tim kami akan segera mengirimkan email konfirmasi dan panduan setup akun Anda.
                    </p>
                    <Link href="/" className="inline-block w-full bg-surface-hover border border-border text-text-primary font-semibold py-4 rounded-2xl hover:bg-border transition-colors relative z-10">
                        Kembali ke Beranda
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background flex">
            {/* Left Side - Form */}
            <div className="w-full lg:w-1/2 flex flex-col justify-center p-8 sm:p-12 lg:p-24 overflow-y-auto">
                <Link href="/" className="inline-flex items-center gap-2 text-text-muted hover:text-text-primary transition-colors mb-12 font-medium">
                    <ArrowLeft className="w-4 h-4" /> Kembali ke Beranda
                </Link>

                <div className="max-w-md w-full mx-auto relative z-10">
                    <h1 className="text-3xl font-bold text-text-primary mb-2 tracking-tight">Mulai Berlangganan</h1>
                    <p className="text-text-muted mb-8 text-sm">
                        Lengkapi data diri dan bisnis Anda untuk memulai dengan paket 
                        <span className="font-semibold text-accent uppercase"> {plan}</span>.
                    </p>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label className="block text-sm font-medium text-text-secondary mb-2">Nama Pemilik</label>
                            <div className="relative group">
                                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted group-focus-within:text-accent transition-colors" />
                                <input 
                                    type="text"
                                    name="ownerName"
                                    value={formData.ownerName}
                                    onChange={handleChange}
                                    className="w-full bg-surface-hover pl-12 pr-4 py-4 border border-border rounded-2xl focus:border-accent focus:ring-1 focus:ring-accent focus:outline-none text-text-primary transition-all font-medium"
                                    placeholder="Budi Santoso"
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-text-secondary mb-2">Nama Toko / Bisnis</label>
                            <div className="relative group">
                                <Store className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted group-focus-within:text-accent transition-colors" />
                                <input 
                                    type="text"
                                    name="storeName"
                                    value={formData.storeName}
                                    onChange={handleChange}
                                    className="w-full bg-surface-hover pl-12 pr-4 py-4 border border-border rounded-2xl focus:border-accent focus:ring-1 focus:ring-accent focus:outline-none text-text-primary transition-all font-medium"
                                    placeholder="Kopi Kenangan"
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-text-secondary mb-2">Email Bisnis</label>
                            <div className="relative group">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted group-focus-within:text-accent transition-colors" />
                                <input 
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    className="w-full bg-surface-hover pl-12 pr-4 py-4 border border-border rounded-2xl focus:border-accent focus:ring-1 focus:ring-accent focus:outline-none text-text-primary transition-all font-medium"
                                    placeholder="admin@kopikenangan.com"
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-text-secondary mb-2">Nomor WhatsApp</label>
                            <div className="relative group">
                                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted group-focus-within:text-accent transition-colors" />
                                <input 
                                    type="tel"
                                    name="phone"
                                    value={formData.phone}
                                    onChange={handleChange}
                                    className="w-full bg-surface-hover pl-12 pr-4 py-4 border border-border rounded-2xl focus:border-accent focus:ring-1 focus:ring-accent focus:outline-none text-text-primary transition-all font-medium"
                                    placeholder="081234567890"
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-text-secondary mb-2">Password</label>
                            <div className="relative group">
                                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted group-focus-within:text-accent transition-colors" />
                                <input 
                                    type="password"
                                    name="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    className="w-full bg-surface-hover pl-12 pr-4 py-4 border border-border rounded-2xl focus:border-accent focus:ring-1 focus:ring-accent focus:outline-none text-text-primary transition-all font-medium"
                                    placeholder="Min. 6 karakter"
                                    required
                                    minLength={6}
                                />
                            </div>
                        </div>

                        <button 
                            type="submit"
                            disabled={loading}
                            className="w-full bg-accent hover:bg-accent-hover text-accent-fg font-semibold py-4 rounded-2xl disabled:opacity-50 transition-all shadow-soft mt-8"
                        >
                            {loading ? "Memproses..." : "Daftar & Buat Akun"}
                        </button>
                        
                        <p className="text-center text-sm text-text-muted mt-6">
                            Sudah punya akun? <Link href="/login" className="text-accent hover:opacity-80 font-bold">Masuk di sini</Link>
                        </p>
                    </form>
                </div>
            </div>

            {/* Right Side - Info */}
            <div className="hidden lg:flex w-1/2 bg-surface border-l border-border flex-col justify-center items-center p-12 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-96 h-96 bg-accent/5 rounded-full blur-[100px]"></div>
                <div className="absolute bottom-0 left-0 w-96 h-96 bg-accent/5 rounded-full blur-[100px]"></div>
                
                <div className="relative z-10 max-w-lg">
                    <div className="w-16 h-16 bg-accent rounded-3xl flex items-center justify-center shadow-soft mb-8">
                        <span className="text-3xl font-bold text-accent-fg">N</span>
                    </div>
                    <h2 className="text-4xl font-bold text-text-primary mb-6 leading-tight">Transformasi Bisnis Anda Dimulai Hari Ini</h2>
                    <ul className="space-y-6">
                        <li className="flex gap-4">
                            <div className="w-12 h-12 shrink-0 bg-accent/10 text-accent rounded-2xl flex items-center justify-center">
                                <CheckCircle2 className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="text-text-primary font-semibold mb-1">Setup Cepat & Mudah</h3>
                                <p className="text-text-muted text-sm">Tidak perlu teknisi khusus. Antarmuka kami dirancang agar dapat digunakan oleh siapapun.</p>
                            </div>
                        </li>
                        <li className="flex gap-4">
                            <div className="w-12 h-12 shrink-0 bg-accent/10 text-accent rounded-2xl flex items-center justify-center">
                                <CheckCircle2 className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="text-text-primary font-semibold mb-1">Data Aman di Cloud</h3>
                                <p className="text-text-muted text-sm">Semua data transaksi dan pelanggan Anda di-backup otomatis secara real-time.</p>
                            </div>
                        </li>
                    </ul>
                </div>
            </div>
        </div>
    );
}

export default function SignupPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-background flex items-center justify-center text-text-muted">Memuat formulir...</div>}>
            <SignupContent />
        </Suspense>
    );
}
