"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { ShoppingCart, LayoutDashboard, MonitorSmartphone, Power } from "lucide-react";

export default function Home() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [appSettings, setAppSettings] = useState<any>({ app_name: 'NexPos', app_logo: '' });

  useEffect(() => {
    const checkAuthAndSettings = async () => {
      // Fetch saas settings (publicly accessible based on our RLS)
      try {
        const { data: saas } = await supabase.from('saas_settings').select('app_name, app_logo').limit(1).maybeSingle();
        if (saas) setAppSettings(saas);
      } catch (e) {}

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push("/login");
      } else {
        setLoading(false);
      }
    };
    checkAuthAndSettings();
  }, [router]);

  const handleLogout = async () => {
      await supabase.auth.signOut();
      router.push('/login');
  };

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center bg-[#0B0F19] text-gray-500">Memuat modul...</div>;
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#0B0F19] text-gray-200">
      <div className="flex-1 flex flex-col items-center justify-center p-6 relative">
        {/* Decorative Blurs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-[100px] pointer-events-none"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-[100px] pointer-events-none"></div>

        <div className="text-center mb-12 relative z-10">
          {appSettings.app_logo ? (
            <div className="inline-flex items-center justify-center w-20 h-20 bg-white/5 rounded-2xl shadow-xl shadow-blue-900/20 mb-6 p-2">
              <img src={appSettings.app_logo} alt="App Logo" className="max-w-full max-h-full object-contain" />
            </div>
          ) : (
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl shadow-xl shadow-blue-900/20 mb-6">
              <span className="text-4xl font-black text-white">{appSettings.app_name.charAt(0).toUpperCase()}</span>
            </div>
          )}
          <h1 className="text-4xl md:text-5xl font-black text-white mb-4 tracking-tight">{appSettings.app_name}</h1>
          <p className="text-gray-400 text-lg">Pilih modul aplikasi untuk melanjutkan</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-5xl relative z-10">
          <Link 
              href="/pos"
              className="group p-8 bg-[#131B2C] border border-gray-800/60 rounded-3xl hover:border-blue-500/50 hover:bg-[#1A233A] transition-all flex flex-col items-center text-center shadow-lg hover:shadow-blue-900/20"
          >
              <div className="w-16 h-16 bg-blue-500/10 text-blue-400 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <ShoppingCart className="w-8 h-8" />
              </div>
              <h2 className="text-xl font-bold text-white mb-2">Kasir (POS)</h2>
              <p className="text-gray-500 text-sm">Masuk ke mode transaksi dan kelola pesanan pelanggan.</p>
          </Link>
          <Link 
              href="/admin"
              className="group p-8 bg-[#131B2C] border border-gray-800/60 rounded-3xl hover:border-purple-500/50 hover:bg-[#1A233A] transition-all flex flex-col items-center text-center shadow-lg hover:shadow-purple-900/20"
          >
              <div className="w-16 h-16 bg-purple-500/10 text-purple-400 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <LayoutDashboard className="w-8 h-8" />
              </div>
              <h2 className="text-xl font-bold text-white mb-2">Admin Dashboard</h2>
              <p className="text-gray-500 text-sm">Kelola staf, laporan penjualan, produk, dan pengaturan.</p>
          </Link>
          <Link 
              href="/customer"
              className="group p-8 bg-[#131B2C] border border-gray-800/60 rounded-3xl hover:border-orange-500/50 hover:bg-[#1A233A] transition-all flex flex-col items-center text-center shadow-lg hover:shadow-orange-900/20"
          >
              <div className="w-16 h-16 bg-orange-500/10 text-orange-400 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <MonitorSmartphone className="w-8 h-8" />
              </div>
              <h2 className="text-xl font-bold text-white mb-2">Customer Kiosk</h2>
              <p className="text-gray-500 text-sm">Layar self-service untuk pelanggan memesan sendiri.</p>
          </Link>
        </div>

        <button onClick={handleLogout} className="mt-12 flex items-center gap-2 text-gray-500 hover:text-red-400 transition-colors relative z-10 px-4 py-2">
            <Power className="w-4 h-4" /> Keluar dari Akun
        </button>
      </div>

      <footer className="py-6 text-center text-gray-600 text-sm border-t border-gray-800/30 relative z-10">
        &copy; {new Date().getFullYear()} {appSettings.app_name} System. All rights reserved.
      </footer>
    </div>
  );
}
