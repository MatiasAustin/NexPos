"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { ShoppingCart, LayoutDashboard, MonitorSmartphone, Power } from "lucide-react";
import { useSaasSettings } from "@/contexts/SaasSettingsContext";
import ThemeToggle from "@/components/ThemeToggle";
import AppLogo from "@/components/AppLogo";

export default function Home() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const saasSettings = useSaasSettings();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push("/login");
      } else {
        setLoading(false);
      }
    };
    checkAuth();
  }, [router]);

  const handleLogout = async () => {
      await supabase.auth.signOut();
      router.push('/login');
  };

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center bg-background text-text-muted font-medium">Memuat modul...</div>;
  }

  return (
    <div className="flex flex-col min-h-screen bg-background text-text-primary">
      <div className="absolute top-6 right-6 z-50">
        <ThemeToggle />
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-6 relative">
        {/* Decorative Blurs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-accent/5 rounded-full blur-[100px] pointer-events-none"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/5 rounded-full blur-[100px] pointer-events-none"></div>

        <div className="text-center mb-16 relative z-10">
          <AppLogo
            logoUrl={saasSettings.app_logo}
            showBackground={saasSettings.logo_show_background}
            fallbackLetter={saasSettings.app_name ? saasSettings.app_name.charAt(0) : 'N'}
            size={24}
            className="mx-auto mb-8"
          />
          <h1 className="text-4xl md:text-5xl font-bold text-text-primary mb-4 tracking-tight">{saasSettings.app_name || 'NexPos'}</h1>
          <p className="text-text-muted text-lg">Pilih modul aplikasi untuk melanjutkan</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-5xl relative z-10">
          <Link 
              href="/pos"
              className="group p-10 bg-surface border border-border rounded-[2rem] hover:border-accent/50 hover:bg-surface-hover transition-all flex flex-col items-center text-center shadow-soft"
          >
              <div className="w-16 h-16 bg-accent/10 text-accent rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <ShoppingCart className="w-8 h-8" />
              </div>
              <h2 className="text-xl font-bold text-text-primary mb-3">Kasir (POS)</h2>
              <p className="text-text-muted text-sm leading-relaxed">Masuk ke mode transaksi dan kelola pesanan pelanggan.</p>
          </Link>
          <Link 
              href="/admin"
              className="group p-10 bg-surface border border-border rounded-[2rem] hover:border-accent/50 hover:bg-surface-hover transition-all flex flex-col items-center text-center shadow-soft"
          >
              <div className="w-16 h-16 bg-accent/10 text-accent rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <LayoutDashboard className="w-8 h-8" />
              </div>
              <h2 className="text-xl font-bold text-text-primary mb-3">Admin Dashboard</h2>
              <p className="text-text-muted text-sm leading-relaxed">Kelola staf, laporan penjualan, produk, dan pengaturan.</p>
          </Link>
          <Link 
              href="/customer"
              className="group p-10 bg-surface border border-border rounded-[2rem] hover:border-accent/50 hover:bg-surface-hover transition-all flex flex-col items-center text-center shadow-soft"
          >
              <div className="w-16 h-16 bg-accent/10 text-accent rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <MonitorSmartphone className="w-8 h-8" />
              </div>
              <h2 className="text-xl font-bold text-text-primary mb-3">Customer Kiosk</h2>
              <p className="text-text-muted text-sm leading-relaxed">Layar self-service untuk pelanggan memesan sendiri.</p>
          </Link>
        </div>

        <button onClick={handleLogout} className="mt-16 flex items-center gap-2 text-text-muted hover:text-red-500 font-medium transition-colors relative z-10 px-6 py-3 rounded-full hover:bg-red-500/10">
            <Power className="w-4 h-4" /> Keluar dari Akun
        </button>
      </div>

      <footer className="py-8 text-center text-text-muted text-sm border-t border-border relative z-10">
        &copy; {new Date().getFullYear()} {saasSettings.app_name || 'NexPos'} System. All rights reserved.
      </footer>
    </div>
  );
}
