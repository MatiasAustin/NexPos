import Link from "next/link";
import { ArrowRight, CheckCircle2, LayoutDashboard, MonitorSmartphone, ShoppingCart, Zap, TrendingUp, Shield } from "lucide-react";

export default function LandingPage() {
    return (
        <div className="min-h-screen bg-[#0B0F19] text-gray-200 font-sans selection:bg-blue-500/30">
            {/* Navbar */}
            <nav className="fixed w-full z-50 bg-[#0B0F19]/80 backdrop-blur-md border-b border-gray-800/50">
                <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-900/20">
                            <span className="text-xl font-black text-white">N</span>
                        </div>
                        <span className="text-2xl font-black text-white tracking-tight">NexPos</span>
                    </div>
                    <div className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-400">
                        <a href="#features" className="hover:text-white transition-colors">Fitur</a>
                        <a href="#pricing" className="hover:text-white transition-colors">Harga</a>
                        <a href="#testimonials" className="hover:text-white transition-colors">Testimoni</a>
                    </div>
                    <div className="flex items-center gap-4">
                        <Link href="/login" className="text-sm font-bold text-gray-300 hover:text-white transition-colors">
                            Masuk
                        </Link>
                        <Link href="/signup" className="text-sm font-bold bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-xl transition-all shadow-lg shadow-blue-900/20 flex items-center gap-2">
                            Coba Gratis
                        </Link>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
                <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-blue-600/20 rounded-full blur-[120px] pointer-events-none"></div>
                <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-purple-600/20 rounded-full blur-[120px] pointer-events-none"></div>
                
                <div className="max-w-7xl mx-auto px-6 relative z-10 text-center">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm font-medium mb-8">
                        <Zap className="w-4 h-4" />
                        <span>Sistem POS Generasi Baru</span>
                    </div>
                    <h1 className="text-5xl md:text-7xl font-black text-white mb-8 tracking-tight leading-tight">
                        Kelola Bisnis Lebih <br className="hidden md:block" />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">
                            Cerdas & Efisien
                        </span>
                    </h1>
                    <p className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto mb-10">
                        NexPos adalah solusi All-in-One untuk kasir, manajemen inventaris, dan analisa penjualan. Tingkatkan omset bisnis Anda dengan teknologi terkini.
                    </p>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <Link href="/signup" className="w-full sm:w-auto px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white text-lg font-bold rounded-xl transition-all shadow-lg shadow-blue-900/20 flex items-center justify-center gap-2 hover:scale-105">
                            Mulai Berlangganan Sekarang <ArrowRight className="w-5 h-5" />
                        </Link>
                        <Link href="/dashboard" className="w-full sm:w-auto px-8 py-4 bg-[#1A233A] hover:bg-[#232F4D] text-white text-lg font-bold rounded-xl transition-all flex items-center justify-center gap-2">
                            Masuk ke Dashboard
                        </Link>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section id="features" className="py-24 bg-[#080B12]">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-4xl font-black text-white mb-4">Fitur Lengkap Sesuai Kebutuhan Anda</h2>
                        <p className="text-gray-400">Satu aplikasi untuk seluruh ekosistem bisnis Anda.</p>
                    </div>
                    <div className="grid md:grid-cols-3 gap-8">
                        {/* Feature 1 */}
                        <div className="p-8 bg-[#131B2C] border border-gray-800/60 rounded-3xl hover:border-blue-500/50 transition-colors group">
                            <div className="w-14 h-14 bg-blue-500/10 text-blue-400 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                <ShoppingCart className="w-7 h-7" />
                            </div>
                            <h3 className="text-xl font-bold text-white mb-3">Kasir (POS) Cepat</h3>
                            <p className="text-gray-400 leading-relaxed">
                                Proses transaksi hitungan detik. Dukungan berbagai metode pembayaran, manajemen diskon, dan cetak struk instan.
                            </p>
                        </div>
                        {/* Feature 2 */}
                        <div className="p-8 bg-[#131B2C] border border-gray-800/60 rounded-3xl hover:border-purple-500/50 transition-colors group">
                            <div className="w-14 h-14 bg-purple-500/10 text-purple-400 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                <LayoutDashboard className="w-7 h-7" />
                            </div>
                            <h3 className="text-xl font-bold text-white mb-3">Admin Dashboard</h3>
                            <p className="text-gray-400 leading-relaxed">
                                Pantau laporan real-time, kelola inventaris, atur shift staf, dan analisis performa bisnis dari mana saja.
                            </p>
                        </div>
                        {/* Feature 3 */}
                        <div className="p-8 bg-[#131B2C] border border-gray-800/60 rounded-3xl hover:border-orange-500/50 transition-colors group">
                            <div className="w-14 h-14 bg-orange-500/10 text-orange-400 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                <MonitorSmartphone className="w-7 h-7" />
                            </div>
                            <h3 className="text-xl font-bold text-white mb-3">Customer Kiosk</h3>
                            <p className="text-gray-400 leading-relaxed">
                                Sediakan layar self-service agar pelanggan dapat memesan sendiri secara mandiri. Mengurangi antrean dan hemat biaya operasional.
                            </p>
                        </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-8 mt-8">
                         <div className="p-8 bg-[#131B2C] border border-gray-800/60 rounded-3xl hover:border-green-500/50 transition-colors flex items-start gap-6">
                            <div className="w-12 h-12 shrink-0 bg-green-500/10 text-green-400 rounded-xl flex items-center justify-center">
                                <TrendingUp className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-white mb-2">Analitik Penjualan</h3>
                                <p className="text-gray-400 text-sm">Pahami pola pembelian pelanggan dan produk terlaris dengan grafik interaktif.</p>
                            </div>
                         </div>
                         <div className="p-8 bg-[#131B2C] border border-gray-800/60 rounded-3xl hover:border-pink-500/50 transition-colors flex items-start gap-6">
                            <div className="w-12 h-12 shrink-0 bg-pink-500/10 text-pink-400 rounded-xl flex items-center justify-center">
                                <Shield className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-white mb-2">Keamanan Data Tinggi</h3>
                                <p className="text-gray-400 text-sm">Data Anda tersimpan di cloud dengan enkripsi tinggi. Aman dari risiko perangkat rusak atau hilang.</p>
                            </div>
                         </div>
                    </div>
                </div>
            </section>

            {/* Pricing Section */}
            <section id="pricing" className="py-24 relative overflow-hidden">
                <div className="max-w-7xl mx-auto px-6 relative z-10">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-4xl font-black text-white mb-4">Pilih Paket Terbaik Anda</h2>
                        <p className="text-gray-400">Skalakan bisnis Anda dengan fleksibilitas penuh.</p>
                    </div>
                    
                    <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
                        {/* Basic */}
                        <div className="bg-[#131B2C] border border-gray-800 rounded-3xl p-8 flex flex-col">
                            <h3 className="text-xl font-bold text-white mb-2">Starter</h3>
                            <p className="text-gray-400 text-sm mb-6">Cocok untuk bisnis pemula yang baru merintis.</p>
                            <div className="mb-6">
                                <span className="text-4xl font-black text-white">Rp 99rb</span>
                                <span className="text-gray-500"> / bulan</span>
                            </div>
                            <ul className="space-y-4 mb-8 flex-1">
                                <li className="flex items-center gap-3 text-gray-300">
                                    <CheckCircle2 className="w-5 h-5 text-blue-500 shrink-0" />
                                    <span>1 Outlet</span>
                                </li>
                                <li className="flex items-center gap-3 text-gray-300">
                                    <CheckCircle2 className="w-5 h-5 text-blue-500 shrink-0" />
                                    <span>Manajemen POS Basic</span>
                                </li>
                                <li className="flex items-center gap-3 text-gray-300">
                                    <CheckCircle2 className="w-5 h-5 text-blue-500 shrink-0" />
                                    <span>Laporan Penjualan Standar</span>
                                </li>
                            </ul>
                            <Link href="/signup?plan=starter" className="w-full block text-center py-3 rounded-xl border border-gray-700 hover:bg-gray-800 text-white font-bold transition-colors">
                                Pilih Starter
                            </Link>
                        </div>
                        
                        {/* Pro */}
                        <div className="bg-gradient-to-b from-blue-600/20 to-[#131B2C] border border-blue-500/50 rounded-3xl p-8 flex flex-col relative transform md:-translate-y-4 shadow-2xl shadow-blue-900/20">
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-blue-500 text-white text-xs font-black px-4 py-1 rounded-full uppercase tracking-wider">
                                Terpopuler
                            </div>
                            <h3 className="text-xl font-bold text-white mb-2">Pro</h3>
                            <p className="text-blue-200 text-sm mb-6">Fokus pada pertumbuhan omset dan operasional.</p>
                            <div className="mb-6">
                                <span className="text-4xl font-black text-white">Rp 249rb</span>
                                <span className="text-gray-400"> / bulan</span>
                            </div>
                            <ul className="space-y-4 mb-8 flex-1">
                                <li className="flex items-center gap-3 text-gray-100">
                                    <CheckCircle2 className="w-5 h-5 text-blue-400 shrink-0" />
                                    <span>Hingga 3 Outlet</span>
                                </li>
                                <li className="flex items-center gap-3 text-gray-100">
                                    <CheckCircle2 className="w-5 h-5 text-blue-400 shrink-0" />
                                    <span>Manajemen POS Lengkap</span>
                                </li>
                                <li className="flex items-center gap-3 text-gray-100">
                                    <CheckCircle2 className="w-5 h-5 text-blue-400 shrink-0" />
                                    <span>Customer Kiosk Mode</span>
                                </li>
                                <li className="flex items-center gap-3 text-gray-100">
                                    <CheckCircle2 className="w-5 h-5 text-blue-400 shrink-0" />
                                    <span>Manajemen Inventaris Lanjut</span>
                                </li>
                            </ul>
                            <Link href="/signup?plan=pro" className="w-full block text-center py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold transition-colors shadow-lg shadow-blue-900/20">
                                Pilih Pro
                            </Link>
                        </div>

                        {/* Enterprise */}
                        <div className="bg-[#131B2C] border border-gray-800 rounded-3xl p-8 flex flex-col">
                            <h3 className="text-xl font-bold text-white mb-2">Enterprise</h3>
                            <p className="text-gray-400 text-sm mb-6">Solusi untuk franchise atau multi-cabang besar.</p>
                            <div className="mb-6">
                                <span className="text-4xl font-black text-white">Hubungi</span>
                                <span className="text-gray-500"> Kami</span>
                            </div>
                            <ul className="space-y-4 mb-8 flex-1">
                                <li className="flex items-center gap-3 text-gray-300">
                                    <CheckCircle2 className="w-5 h-5 text-blue-500 shrink-0" />
                                    <span>Outlet Tidak Terbatas</span>
                                </li>
                                <li className="flex items-center gap-3 text-gray-300">
                                    <CheckCircle2 className="w-5 h-5 text-blue-500 shrink-0" />
                                    <span>Prioritas Support 24/7</span>
                                </li>
                                <li className="flex items-center gap-3 text-gray-300">
                                    <CheckCircle2 className="w-5 h-5 text-blue-500 shrink-0" />
                                    <span>Kustomisasi Fitur (API)</span>
                                </li>
                            </ul>
                            <Link href="/contact" className="w-full block text-center py-3 rounded-xl border border-gray-700 hover:bg-gray-800 text-white font-bold transition-colors">
                                Hubungi Sales
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-20 relative">
                <div className="max-w-5xl mx-auto px-6 relative z-10">
                    <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-[2rem] p-10 md:p-16 text-center shadow-2xl shadow-blue-900/20 overflow-hidden relative">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl translate-x-1/2 -translate-y-1/2"></div>
                        <h2 className="text-3xl md:text-5xl font-black text-white mb-6 relative z-10">Siap Mengubah Bisnis Anda?</h2>
                        <p className="text-blue-100 text-lg md:text-xl mb-10 max-w-2xl mx-auto relative z-10">
                            Bergabung dengan ribuan pengusaha yang sudah mempercayakan operasional bisnisnya menggunakan NexPos.
                        </p>
                        <Link href="/signup" className="inline-flex items-center gap-2 bg-white text-blue-600 hover:bg-gray-50 px-8 py-4 rounded-xl font-bold text-lg transition-all shadow-xl hover:scale-105 relative z-10">
                            Daftar Sekarang <ArrowRight className="w-5 h-5" />
                        </Link>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-[#080B12] py-12 border-t border-gray-800/50">
                <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-4 gap-8 mb-8">
                    <div className="col-span-1 md:col-span-2">
                        <div className="flex items-center gap-2 mb-4">
                            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                                <span className="text-lg font-black text-white">N</span>
                            </div>
                            <span className="text-xl font-black text-white tracking-tight">NexPos</span>
                        </div>
                        <p className="text-gray-500 text-sm max-w-sm mb-4">
                            Sistem Manajemen Bisnis & Kasir modern untuk memudahkan transaksi dan memantau performa penjualan secara real-time.
                        </p>
                    </div>
                    <div>
                        <h4 className="text-white font-bold mb-4">Produk</h4>
                        <ul className="space-y-2 text-sm text-gray-500">
                            <li><a href="#features" className="hover:text-white transition-colors">Fitur POS</a></li>
                            <li><a href="#features" className="hover:text-white transition-colors">Admin Dashboard</a></li>
                            <li><a href="#features" className="hover:text-white transition-colors">Customer Kiosk</a></li>
                            <li><a href="#pricing" className="hover:text-white transition-colors">Harga</a></li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="text-white font-bold mb-4">Bantuan</h4>
                        <ul className="space-y-2 text-sm text-gray-500">
                            <li><a href="#" className="hover:text-white transition-colors">Pusat Bantuan</a></li>
                            <li><a href="#" className="hover:text-white transition-colors">Hubungi Kami</a></li>
                            <li><a href="#" className="hover:text-white transition-colors">Syarat & Ketentuan</a></li>
                            <li><a href="#" className="hover:text-white transition-colors">Kebijakan Privasi</a></li>
                        </ul>
                    </div>
                </div>
                <div className="max-w-7xl mx-auto px-6 pt-8 border-t border-gray-800/50 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-gray-600">
                    <p>&copy; {new Date().getFullYear()} NexPos System. All rights reserved.</p>
                    <p>Developed by <strong className="text-gray-500">Matias Austin</strong></p>
                </div>
            </footer>
        </div>
    );
}
