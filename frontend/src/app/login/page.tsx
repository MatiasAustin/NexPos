"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { Lock, User } from "lucide-react";

export default function LoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const router = useRouter();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

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
                throw new Error("Profil Staf tidak ditemukan di database. Pastikan SQL INSERT berhasil dijalankan dengan UID yang benar.");
            }

            if (profile.role === 'owner') {
                router.push('/admin');
            } else {
                router.push('/pos');
            }
        } catch (err: any) {
            setError(err.message || "Gagal login. Periksa kembali email dan password Anda.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
            <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">NexPos Login</h1>
                    <p className="text-gray-500 mt-2">Silakan masuk menggunakan akun Staff/Owner Anda.</p>
                </div>

                {error && (
                    <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-lg text-sm font-semibold text-center border border-red-200">
                        {error}
                    </div>
                )}

                <form onSubmit={handleLogin} className="space-y-6">
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Username / Email</label>
                        <div className="relative">
                            <User className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                            <input 
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none text-gray-900 font-medium"
                                placeholder="budi@nexpos.local"
                                required
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Password</label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                            <input 
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none text-gray-900 font-medium"
                                placeholder="••••••••"
                                required
                            />
                        </div>
                    </div>

                    <button 
                        type="submit"
                        disabled={loading}
                        className="w-full bg-blue-600 text-white font-bold py-3 rounded-xl hover:bg-blue-700 disabled:opacity-70 transition-colors"
                    >
                        {loading ? "Memverifikasi..." : "Masuk ke Sistem"}
                    </button>
                </form>
            </div>
        </div>
    );
}
