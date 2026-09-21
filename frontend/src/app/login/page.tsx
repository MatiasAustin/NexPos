"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { Lock, User, Eye, EyeOff } from "lucide-react";
import { useToast } from "@/components/Toast";
import { useSaasSettings } from "@/contexts/SaasSettingsContext";

export default function LoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const saasSettings = useSaasSettings();
    const router = useRouter();
    const toast = useToast();

    useEffect(() => {
        const checkExistingSession = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (session) {
                const { data: superAdmin } = await supabase.from('super_admins').select('user_id').eq('user_id', session.user.id).maybeSingle();
                if (superAdmin) {
                    router.push('/superadmin');
                    return;
                }

                const { data: profile } = await supabase.from('staff_profiles').select('role').eq('id', session.user.id).maybeSingle();
                if (profile?.role === 'owner') router.push('/admin');
                else if (profile) router.push('/pos');
            }
        };
        checkExistingSession();
    }, [router]);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const { data, error: authError } = await supabase.auth.signInWithPassword({
                email,
                password
            });

            if (authError) throw authError;

            // Check if super_admin first
            const { data: superAdmin } = await supabase
                .from('super_admins')
                .select('user_id')
                .eq('user_id', data.user.id)
                .maybeSingle();

            if (superAdmin) {
                router.push('/superadmin');
                return;
            }

            // Fetch role for normal staff
            const { data: profile, error: profileError } = await supabase
                .from('staff_profiles')
                .select('role')
                .eq('id', data.user.id)
                .maybeSingle();

            if (profileError) throw profileError;
            
            if (!profile) {
                throw new Error("Akun Anda belum memiliki akses ke aplikasi Kasir. Silakan hubungi Owner/Admin.");
            }

            if (profile.role === 'owner') {
                router.push('/admin');
            } else {
                router.push('/pos');
            }
        } catch (err: any) {
            toast.error(err.message || "Gagal login. Periksa kembali email dan password Anda.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
            <div className="bg-surface p-8 sm:p-10 rounded-3xl shadow-soft border border-border w-full max-w-md relative overflow-hidden">
                {/* Subtle glass accent inside card */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-accent/5 rounded-full blur-[80px] pointer-events-none -translate-y-1/2 translate-x-1/2"></div>
                
                <div className="text-center mb-10 relative z-10">
                    {saasSettings.app_logo ? (
                        <div className="w-16 h-16 rounded-3xl mx-auto mb-6 p-2 bg-surface border border-border shadow-soft flex items-center justify-center">
                            <img src={saasSettings.app_logo} alt="Logo" className="max-w-full max-h-full object-contain" />
                        </div>
                    ) : (
                        <div className="w-16 h-16 rounded-3xl bg-accent flex items-center justify-center text-accent-fg text-3xl font-bold mx-auto mb-6 shadow-soft">
                            {saasSettings.app_name.charAt(0).toUpperCase()}
                        </div>
                    )}
                    <h1 className="text-3xl font-bold text-text-primary tracking-tight">{saasSettings.app_name}</h1>
                    <p className="text-text-muted mt-3 text-sm">Masuk dengan akun Staff atau Admin Anda.</p>
                </div>

                <form onSubmit={handleLogin} className="space-y-6 relative z-10">
                    <div>
                        <label className="block text-sm font-medium text-text-secondary mb-2">Username / Email</label>
                        <div className="relative group">
                            <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted group-focus-within:text-accent transition-colors" />
                            <input 
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full bg-background pl-12 pr-4 py-4 border border-border rounded-2xl focus:border-accent focus:ring-1 focus:ring-accent focus:outline-none text-text-primary transition-all font-medium"
                                placeholder="budi@nexpos.local"
                                required
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-text-secondary mb-2">Password</label>
                        <div className="relative group">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted group-focus-within:text-accent transition-colors" />
                            <input 
                                type={showPassword ? "text" : "password"}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full bg-background pl-12 pr-12 py-4 border border-border rounded-2xl focus:border-accent focus:ring-1 focus:ring-accent focus:outline-none text-text-primary transition-all font-medium"
                                placeholder="••••••••"
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary transition-colors"
                            >
                                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                            </button>
                        </div>
                    </div>

                    <button 
                        type="submit"
                        disabled={loading}
                        className="w-full bg-accent text-accent-fg font-semibold py-4 rounded-2xl hover:bg-accent-hover disabled:opacity-50 transition-all shadow-soft mt-8"
                    >
                        {loading ? "Memverifikasi..." : "Login ke Sistem"}
                    </button>
                </form>
                <p className="text-center text-xs text-text-muted mt-8 relative z-10">
                    © {new Date().getFullYear()} <strong className="text-text-secondary">NexPos</strong> · Developed by <strong className="text-text-primary">Matias Austin</strong>
                </p>
            </div>
        </div>
    );
}
