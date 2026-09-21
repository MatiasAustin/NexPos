import Link from "next/link";
import { ArrowRight, CheckCircle2, LayoutDashboard, MonitorSmartphone, ShoppingCart, Zap, TrendingUp, Shield } from "lucide-react";
import { supabase } from "@/lib/supabase";
import ThemeToggle from "@/components/ThemeToggle";

export default async function LandingPage() {
    // Fetch saas_settings for dynamic branding and pricing
    const { data: saasSettings } = await supabase.from('saas_settings').select('*').limit(1).maybeSingle();
    const appName = saasSettings?.app_name || 'NexPos';
    const appLogo = saasSettings?.app_logo || '';
    
    return (
        <div className="min-h-screen bg-background text-text-primary font-sans selection:bg-accent/30">
            {/* Navbar */}
            <nav className="fixed w-full z-50 bg-background/80 backdrop-blur-xl border-b border-border">
                <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        {appLogo ? (
                            <img src={appLogo} alt="Logo" className="w-10 h-10 object-contain rounded-xl" />
                        ) : (
                            <div className="w-10 h-10 bg-accent rounded-xl flex items-center justify-center shadow-soft">
                                <span className="text-xl font-bold text-accent-fg">{appName.charAt(0).toUpperCase()}</span>
                            </div>
                        )}
                        <span className="text-2xl font-bold text-text-primary tracking-tight">{appName}</span>
                    </div>
                    <div className="hidden md:flex items-center gap-8 text-sm font-medium text-text-muted">
                        <a href="#features" className="hover:text-text-primary transition-colors">Fitur</a>
                        <a href="#pricing" className="hover:text-text-primary transition-colors">Harga</a>
                        <a href="#testimonials" className="hover:text-text-primary transition-colors">Testimoni</a>
                    </div>
                    <div className="flex items-center gap-4">
                        <ThemeToggle />
                        <Link href="/login" className="text-sm font-semibold text-text-secondary hover:text-text-primary transition-colors">
                            Masuk
                        </Link>
                        <Link href="/signup" className="text-sm font-semibold bg-accent hover:bg-accent-hover text-accent-fg px-5 py-2.5 rounded-full transition-all shadow-soft flex items-center gap-2">
                            Coba Gratis
                        </Link>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
                <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-accent/5 rounded-full blur-[120px] pointer-events-none"></div>
                <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-accent/5 rounded-full blur-[120px] pointer-events-none"></div>
                
                <div className="max-w-7xl mx-auto px-6 relative z-10 text-center">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 border border-accent/20 text-accent-fg text-sm font-medium mb-8 shadow-soft">
                        <Zap className="w-4 h-4 text-accent" />
                        <span className="text-text-primary">Sistem POS Generasi Baru</span>
                    </div>
                    <h1 className="text-5xl md:text-7xl font-bold text-text-primary mb-8 tracking-tight leading-tight">
                        Kelola Bisnis Lebih <br className="hidden md:block" />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent to-accent-hover">
                            Cerdas & Efisien
                        </span>
                    </h1>
                    <p className="text-lg md:text-xl text-text-muted max-w-2xl mx-auto mb-10 leading-relaxed">
                        {appName} adalah solusi All-in-One untuk kasir, manajemen inventaris, dan analisa penjualan. Tingkatkan omset bisnis Anda dengan teknologi terkini.
                    </p>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <Link href="/signup" className="w-full sm:w-auto px-8 py-4 bg-accent hover:bg-accent-hover text-accent-fg text-lg font-semibold rounded-2xl transition-all shadow-soft flex items-center justify-center gap-2">
                            Mulai Berlangganan Sekarang <ArrowRight className="w-5 h-5" />
                        </Link>
                        <Link href="/dashboard" className="w-full sm:w-auto px-8 py-4 bg-surface hover:bg-surface-hover border border-border text-text-primary text-lg font-semibold rounded-2xl transition-all flex items-center justify-center gap-2 shadow-soft">
                            Masuk ke Dashboard
                        </Link>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section id="features" className="py-24 bg-surface-hover">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-4xl font-bold text-text-primary mb-4 tracking-tight">Fitur Lengkap Sesuai Kebutuhan Anda</h2>
                        <p className="text-text-muted">Satu aplikasi untuk seluruh ekosistem bisnis Anda.</p>
                    </div>
                    <div className="grid md:grid-cols-3 gap-8">
                        {/* Feature 1 */}
                        <div className="p-10 bg-surface border border-border rounded-[2rem] hover:border-accent/50 transition-colors group shadow-soft">
                            <div className="w-14 h-14 bg-accent/10 text-accent rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                <ShoppingCart className="w-7 h-7" />
                            </div>
                            <h3 className="text-xl font-bold text-text-primary mb-3">Kasir (POS) Cepat</h3>
                            <p className="text-text-muted leading-relaxed">
                                Proses transaksi hitungan detik. Dukungan berbagai metode pembayaran, manajemen diskon, dan cetak struk instan.
                            </p>
                        </div>
                        {/* Feature 2 */}
                        <div className="p-10 bg-surface border border-border rounded-[2rem] hover:border-accent/50 transition-colors group shadow-soft">
                            <div className="w-14 h-14 bg-accent/10 text-accent rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                <LayoutDashboard className="w-7 h-7" />
                            </div>
                            <h3 className="text-xl font-bold text-text-primary mb-3">Admin Dashboard</h3>
                            <p className="text-text-muted leading-relaxed">
                                Pantau laporan real-time, kelola inventaris, atur shift staf, dan analisis performa bisnis dari mana saja.
                            </p>
                        </div>
                        {/* Feature 3 */}
                        <div className="p-10 bg-surface border border-border rounded-[2rem] hover:border-accent/50 transition-colors group shadow-soft">
                            <div className="w-14 h-14 bg-accent/10 text-accent rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                <MonitorSmartphone className="w-7 h-7" />
                            </div>
                            <h3 className="text-xl font-bold text-text-primary mb-3">Customer Kiosk</h3>
                            <p className="text-text-muted leading-relaxed">
                                Sediakan layar self-service agar pelanggan dapat memesan sendiri secara mandiri. Mengurangi antrean dan hemat biaya operasional.
                            </p>
                        </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-8 mt-8">
                         <div className="p-10 bg-surface border border-border rounded-[2rem] hover:border-accent/50 transition-colors flex items-start gap-6 shadow-soft">
                            <div className="w-12 h-12 shrink-0 bg-accent/10 text-accent rounded-2xl flex items-center justify-center">
                                <TrendingUp className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-text-primary mb-2">Analitik Penjualan</h3>
                                <p className="text-text-muted text-sm leading-relaxed">Pahami pola pembelian pelanggan dan produk terlaris dengan grafik interaktif.</p>
                            </div>
                         </div>
                         <div className="p-10 bg-surface border border-border rounded-[2rem] hover:border-accent/50 transition-colors flex items-start gap-6 shadow-soft">
                            <div className="w-12 h-12 shrink-0 bg-accent/10 text-accent rounded-2xl flex items-center justify-center">
                                <Shield className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-text-primary mb-2">Keamanan Data Tinggi</h3>
                                <p className="text-text-muted text-sm leading-relaxed">Data Anda tersimpan di cloud dengan enkripsi tinggi. Aman dari risiko perangkat rusak atau hilang.</p>
                            </div>
                         </div>
                    </div>
                </div>
            </section>

            {/* Pricing Section */}
            <section id="pricing" className="py-24 relative overflow-hidden bg-background">
                <div className="max-w-7xl mx-auto px-6 relative z-10">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-4xl font-bold text-text-primary mb-4 tracking-tight">Pilih Paket Terbaik Anda</h2>
                        <p className="text-text-muted">Skalakan bisnis Anda dengan fleksibilitas penuh.</p>
                    </div>
                    
                    <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
                        {/* Basic */}
                        <div className="bg-surface border border-border rounded-[2rem] p-10 flex flex-col shadow-soft">
                            <h3 className="text-xl font-bold text-text-primary mb-2">Starter</h3>
                            <p className="text-text-muted text-sm mb-6">Cocok untuk bisnis pemula yang baru merintis.</p>
                            <div className="mb-6">
                                <span className="text-4xl font-bold text-text-primary">Rp 99rb</span>
                                <span className="text-text-muted"> / bulan</span>
                            </div>
                            <ul className="space-y-4 mb-8 flex-1">
                                <li className="flex items-center gap-3 text-text-secondary">
                                    <CheckCircle2 className="w-5 h-5 text-accent shrink-0" />
                                    <span>1 Outlet</span>
                                </li>
                                <li className="flex items-center gap-3 text-text-secondary">
                                    <CheckCircle2 className="w-5 h-5 text-accent shrink-0" />
                                    <span>Manajemen POS Basic</span>
                                </li>
                                <li className="flex items-center gap-3 text-text-secondary">
                                    <CheckCircle2 className="w-5 h-5 text-accent shrink-0" />
                                    <span>Laporan Penjualan Standar</span>
                                </li>
                            </ul>
                            <Link href="/signup?plan=starter" className="w-full block text-center py-4 rounded-2xl border border-border hover:bg-surface-hover text-text-primary font-semibold transition-colors">
                                Pilih Starter
                            </Link>
                        </div>
                        
                        {/* Pro */}
                        <div className="bg-glass backdrop-blur-xl border border-border rounded-[2rem] p-10 flex flex-col relative transform md:-translate-y-4 shadow-soft">
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-accent text-accent-fg text-xs font-bold px-4 py-1 rounded-full uppercase tracking-wider">
                                Terpopuler
                            </div>
                            <h3 className="text-xl font-bold text-text-primary mb-2">Pro</h3>
                            <p className="text-text-muted text-sm mb-6">Fokus pada pertumbuhan omset dan operasional.</p>
                            <div className="mb-6">
                                <span className="text-4xl font-bold text-text-primary">Rp 249rb</span>
                                <span className="text-text-muted"> / bulan</span>
                            </div>
                            <ul className="space-y-4 mb-8 flex-1">
                                <li className="flex items-center gap-3 text-text-secondary">
                                    <CheckCircle2 className="w-5 h-5 text-accent shrink-0" />
                                    <span>Hingga 3 Outlet</span>
                                </li>
                                <li className="flex items-center gap-3 text-text-secondary">
                                    <CheckCircle2 className="w-5 h-5 text-accent shrink-0" />
                                    <span>Manajemen POS Lengkap</span>
                                </li>
                                <li className="flex items-center gap-3 text-text-secondary">
                                    <CheckCircle2 className="w-5 h-5 text-accent shrink-0" />
                                    <span>Customer Kiosk Mode</span>
                                </li>
                                <li className="flex items-center gap-3 text-text-secondary">
                                    <CheckCircle2 className="w-5 h-5 text-accent shrink-0" />
                                    <span>Manajemen Inventaris Lanjut</span>
                                </li>
                            </ul>
                            <Link href="/signup?plan=pro" className="w-full block text-center py-4 rounded-2xl bg-accent hover:bg-accent-hover text-accent-fg font-semibold transition-colors shadow-soft">
                                Pilih Pro
                            </Link>
                        </div>

                        {/* Enterprise */}
                        <div className="bg-surface border border-border rounded-[2rem] p-10 flex flex-col shadow-soft">
                            <h3 className="text-xl font-bold text-text-primary mb-2">Enterprise</h3>
                            <p className="text-text-muted text-sm mb-6">Solusi untuk franchise atau multi-cabang besar.</p>
                            <div className="mb-6">
                                <span className="text-4xl font-bold text-text-primary">Hubungi</span>
                                <span className="text-text-muted"> Kami</span>
                            </div>
                            <ul className="space-y-4 mb-8 flex-1">
                                <li className="flex items-center gap-3 text-text-secondary">
                                    <CheckCircle2 className="w-5 h-5 text-accent shrink-0" />
                                    <span>Outlet Tidak Terbatas</span>
                                </li>
                                <li className="flex items-center gap-3 text-text-secondary">
                                    <CheckCircle2 className="w-5 h-5 text-accent shrink-0" />
                                    <span>Prioritas Support 24/7</span>
                                </li>
                                <li className="flex items-center gap-3 text-text-secondary">
                                    <CheckCircle2 className="w-5 h-5 text-accent shrink-0" />
                                    <span>Kustomisasi Fitur (API)</span>
                                </li>
                            </ul>
                            <Link href="/contact" className="w-full block text-center py-4 rounded-2xl border border-border hover:bg-surface-hover text-text-primary font-semibold transition-colors">
                                Hubungi Sales
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-20 relative bg-surface-hover">
                <div className="max-w-5xl mx-auto px-6 relative z-10">
                    <div className="bg-surface border border-border rounded-[2.5rem] p-10 md:p-16 text-center shadow-soft overflow-hidden relative">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-accent/10 rounded-full blur-3xl translate-x-1/2 -translate-y-1/2"></div>
                        <h2 className="text-3xl md:text-5xl font-bold text-text-primary mb-6 relative z-10 tracking-tight">Siap Mengubah Bisnis Anda?</h2>
                        <p className="text-text-muted text-lg md:text-xl mb-10 max-w-2xl mx-auto relative z-10">
                            Bergabung dengan ribuan pengusaha yang sudah mempercayakan operasional bisnisnya menggunakan {appName}.
                        </p>
                        <Link href="/signup" className="inline-flex items-center gap-2 bg-accent text-accent-fg hover:bg-accent-hover px-8 py-4 rounded-2xl font-semibold text-lg transition-all shadow-soft relative z-10">
                            Daftar Sekarang <ArrowRight className="w-5 h-5" />
                        </Link>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-background py-12 border-t border-border">
                <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-4 gap-8 mb-8">
                    <div className="col-span-1 md:col-span-2">
                        <div className="flex items-center gap-2 mb-4">
                            {appLogo ? (
                                <img src={appLogo} alt="Logo" className="w-8 h-8 object-contain rounded-lg" />
                            ) : (
                                <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center">
                                    <span className="text-lg font-bold text-accent-fg">{appName.charAt(0).toUpperCase()}</span>
                                </div>
                            )}
                            <span className="text-xl font-bold text-text-primary tracking-tight">{appName}</span>
                        </div>
                        <p className="text-text-muted text-sm max-w-sm mb-4 leading-relaxed">
                            Sistem Manajemen Bisnis & Kasir modern untuk memudahkan transaksi dan memantau performa penjualan secara real-time.
                        </p>
                    </div>
                    <div>
                        <h4 className="text-text-primary font-semibold mb-4">Produk</h4>
                        <ul className="space-y-3 text-sm text-text-muted">
                            <li><a href="#features" className="hover:text-accent transition-colors">Fitur POS</a></li>
                            <li><a href="#features" className="hover:text-accent transition-colors">Admin Dashboard</a></li>
                            <li><a href="#features" className="hover:text-accent transition-colors">Customer Kiosk</a></li>
                            <li><a href="#pricing" className="hover:text-accent transition-colors">Harga</a></li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="text-text-primary font-semibold mb-4">Bantuan</h4>
                        <ul className="space-y-3 text-sm text-text-muted">
                            <li><a href="#" className="hover:text-accent transition-colors">Pusat Bantuan</a></li>
                            <li><a href="#" className="hover:text-accent transition-colors">Hubungi Kami</a></li>
                            <li><a href="#" className="hover:text-accent transition-colors">Syarat & Ketentuan</a></li>
                            <li><a href="#" className="hover:text-accent transition-colors">Kebijakan Privasi</a></li>
                        </ul>
                    </div>
                </div>
                <div className="max-w-7xl mx-auto px-6 pt-8 border-t border-border flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-text-muted">
                    <p>&copy; {new Date().getFullYear()} {appName} System. All rights reserved.</p>
                    <p>Developed by <strong className="text-text-secondary">Matias Austin</strong></p>
                </div>
            </footer>
        </div>
    );
}
