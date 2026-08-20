"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { Lock, User, Eye, EyeOff } from "lucide-react";
import { useToast } from "@/components/Toast";

export default function LoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const router = useRouter();
    const toast = useToast();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const { data, error: authError } = await supabase.auth.signInWithPassword({
                email,
                password
            });

            if (authError) throw authError;

            // Fetch role
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
        <div className="min-h-screen bg-[#121214] flex items-center justify-center p-4">
            <div className="bg-[#1a1a1c] p-8 rounded-3xl shadow-2xl border border-gray-800 w-full max-w-md">
                <div className="text-center mb-10">
                    <div className="w-16 h-16 rounded-2xl bg-blue-600 flex items-center justify-center text-white text-3xl font-black mx-auto mb-6 shadow-lg shadow-blue-900/20">N</div>
                    <h1 className="text-3xl font-black text-white tracking-tight">NexPos App</h1>
                    <p className="text-gray-400 mt-2 text-sm">Masuk dengan akun Staff atau Admin Anda.</p>
                </div>

                <form onSubmit={handleLogin} className="space-y-6">
                    <div>
                        <label className="block text-sm font-bold text-gray-300 mb-2">Username / Email</label>
                        <div className="relative group">
                            <User className="absolute left-4 top-4 w-5 h-5 text-gray-500 group-focus-within:text-blue-500 transition-colors" />
                            <input 
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full bg-[#121214] pl-12 pr-4 py-4 border border-gray-800 rounded-xl focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none text-white font-bold transition-all"
                                placeholder="budi@nexpos.local"
                                required
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-300 mb-2">Password</label>
                        <div className="relative group">
                            <Lock className="absolute left-4 top-4 w-5 h-5 text-gray-500 group-focus-within:text-blue-500 transition-colors" />
                            <input 
                                type={showPassword ? "text" : "password"}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full bg-[#121214] pl-12 pr-12 py-4 border border-gray-800 rounded-xl focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none text-white font-bold transition-all"
                                placeholder="••••••••"
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-4 top-4 text-gray-500 hover:text-white transition-colors"
                            >
                                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                            </button>
                        </div>
                    </div>

                    <button 
                        type="submit"
                        disabled={loading}
                        className="w-full bg-blue-600 text-white font-black py-4 rounded-xl hover:bg-blue-500 disabled:opacity-50 transition-all shadow-lg shadow-blue-900/20 mt-8 hover:scale-[1.02] active:scale-[0.98]"
                    >
                        {loading ? "Memverifikasi..." : "Login ke Sistem"}
                    </button>
                </form>
                <p className="text-center text-xs text-gray-700 mt-8">
                    © {new Date().getFullYear()} <strong className="text-gray-600">NexPos</strong> · Developed by <strong className="text-gray-500">Matias Austin</strong>
                </p>
            </div>
        </div>
    );
}
