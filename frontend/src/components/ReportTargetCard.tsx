"use client";

import React, { useState, useEffect } from "react";
import { Target, TrendingUp, AlertCircle, CheckCircle2, Edit3, X, Sparkles, ArrowUpRight, Calculator } from "lucide-react";

interface ReportTargetCardProps {
    period: 'daily' | 'weekly' | 'monthly' | 'yearly' | 'custom';
    currentRevenue: number;
    storeId?: string;
    targetDaily?: number;
    targetWeekly?: number;
    targetMonthly?: number;
    daysCount?: number;
    referenceDate?: Date;
    onSaveTargets: (daily: number, weekly: number, monthly: number) => Promise<void>;
}

export default function ReportTargetCard({
    period,
    currentRevenue,
    storeId,
    targetDaily = 0,
    targetWeekly = 0,
    targetMonthly = 0,
    daysCount = 1,
    referenceDate = new Date(),
    onSaveTargets
}: ReportTargetCardProps) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [inputDaily, setInputDaily] = useState<string>(targetDaily > 0 ? targetDaily.toString() : "");
    const [inputWeekly, setInputWeekly] = useState<string>(targetWeekly > 0 ? targetWeekly.toString() : "");
    const [inputMonthly, setInputMonthly] = useState<string>(targetMonthly > 0 ? targetMonthly.toString() : "");
    const [isSaving, setIsSaving] = useState(false);

    // Sync input states when props update
    useEffect(() => {
        setInputDaily(targetDaily > 0 ? targetDaily.toString() : "");
        setInputWeekly(targetWeekly > 0 ? targetWeekly.toString() : "");
        setInputMonthly(targetMonthly > 0 ? targetMonthly.toString() : "");
    }, [targetDaily, targetWeekly, targetMonthly]);

    // Calculate active target based on period
    let activeTarget = 0;
    let periodLabel = "Harian";

    if (period === 'daily') {
        activeTarget = targetDaily;
        periodLabel = "Harian";
    } else if (period === 'weekly') {
        activeTarget = targetWeekly > 0 ? targetWeekly : (targetDaily * 7);
        periodLabel = "Mingguan";
    } else if (period === 'monthly') {
        activeTarget = targetMonthly > 0 ? targetMonthly : (targetDaily * 30);
        periodLabel = "Bulanan";
    } else if (period === 'yearly') {
        activeTarget = targetMonthly > 0 ? (targetMonthly * 12) : (targetDaily * 365);
        periodLabel = "Tahunan";
    } else if (period === 'custom') {
        const days = Math.max(1, daysCount || 1);
        activeTarget = targetDaily > 0 
            ? (targetDaily * days) 
            : (targetWeekly > 0 ? Math.round((targetWeekly / 7) * days) : (targetMonthly > 0 ? Math.round((targetMonthly / 30) * days) : 0));
        periodLabel = `Kustom (${days} Hari)`;
    }

    // Calculations
    const percentage = activeTarget > 0 ? Math.min(999, (currentRevenue / activeTarget) * 100) : 0;
    const progressWidth = Math.min(100, Math.max(0, percentage));
    const difference = currentRevenue - activeTarget;
    const isTargetMet = activeTarget > 0 && currentRevenue >= activeTarget;

    // Projected Monthly Run-Rate (if monthly period)
    const now = new Date();
    const daysInMonth = new Date(referenceDate.getFullYear(), referenceDate.getMonth() + 1, 0).getDate();
    const currentDayOfMonth = Math.min(daysInMonth, referenceDate.getMonth() === now.getMonth() && referenceDate.getFullYear() === now.getFullYear() ? now.getDate() : daysInMonth);
    const dailyAverageSoFar = currentDayOfMonth > 0 ? currentRevenue / currentDayOfMonth : 0;
    const projectedMonthly = dailyAverageSoFar * daysInMonth;

    // Helper functions for auto-calculating in modal
    const handleAutoFillFromDaily = () => {
        const dailyVal = Number(inputDaily) || 0;
        if (dailyVal > 0) {
            setInputWeekly((dailyVal * 7).toString());
            setInputMonthly((dailyVal * 30).toString());
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            await onSaveTargets(
                Number(inputDaily) || 0,
                Number(inputWeekly) || 0,
                Number(inputMonthly) || 0
            );
            setIsModalOpen(false);
        } catch (error) {
            console.error("Gagal menyimpan target:", error);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <>
            <div className="bg-surface border border-border rounded-2xl p-4 md:p-6 shadow-xl relative overflow-hidden">
                {/* Header Section */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/80 pb-4 mb-5">
                    <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                            isTargetMet 
                                ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" 
                                : activeTarget > 0 
                                    ? "bg-accent/20 text-accent border border-accent/30" 
                                    : "bg-surface-hover text-text-muted border border-border"
                        }`}>
                            <Target className="w-5 h-5" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2 flex-wrap">
                                <h3 className="font-bold text-base md:text-lg text-text-primary">
                                    Target Penjualan {periodLabel}
                                </h3>
                                {activeTarget > 0 && (
                                    <span className={`text-[10px] uppercase font-extrabold px-2.5 py-0.5 rounded-full border ${
                                        isTargetMet 
                                            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30 animate-pulse" 
                                            : percentage >= 75 
                                                ? "bg-accent/10 text-accent border-accent/30" 
                                                : percentage >= 50 
                                                    ? "bg-amber-500/10 text-amber-400 border-amber-500/30" 
                                                    : "bg-orange-500/10 text-orange-400 border-orange-500/30"
                                    }`}>
                                        {isTargetMet ? "🎉 Target Tercapai!" : `${percentage.toFixed(1)}% Tercapai`}
                                    </span>
                                )}
                            </div>
                            <p className="text-xs text-text-muted mt-0.5">
                                Pantau pencapaian omset toko Anda terhadap target penjualan {periodLabel.toLowerCase()}
                            </p>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={() => setIsModalOpen(true)}
                        className="self-start sm:self-center px-3.5 py-2 bg-surface-hover hover:bg-border text-text-primary rounded-xl text-xs font-bold transition-colors flex items-center gap-2 border border-border shrink-0 shadow-sm"
                    >
                        <Edit3 className="w-3.5 h-3.5 text-accent" />
                        {activeTarget > 0 ? "Ubah Target" : "Set Target Toko"}
                    </button>
                </div>

                {activeTarget > 0 ? (
                    <div className="space-y-5">
                        {/* Metrics Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            {/* Target Box */}
                            <div className="bg-background/60 border border-border p-4 rounded-xl">
                                <span className="text-text-muted text-xs font-semibold uppercase tracking-wider block mb-1">
                                    Target {periodLabel}
                                </span>
                                <div className="text-xl font-bold text-text-primary">
                                    Rp {activeTarget.toLocaleString('id-ID')}
                                </div>
                                <span className="text-[10px] text-text-muted mt-1 block">
                                    Sasaran omset periode ini
                                </span>
                            </div>

                            {/* Realisasi Box */}
                            <div className="bg-background/60 border border-border p-4 rounded-xl">
                                <span className="text-text-muted text-xs font-semibold uppercase tracking-wider block mb-1">
                                    Realisasi Omset
                                </span>
                                <div className={`text-xl font-bold ${isTargetMet ? 'text-emerald-400' : 'text-accent'}`}>
                                    Rp {currentRevenue.toLocaleString('id-ID')}
                                </div>
                                <span className="text-[10px] text-text-muted mt-1 block">
                                    Total penjualan tercatat
                                </span>
                            </div>

                            {/* Difference Box */}
                            <div className={`p-4 rounded-xl border ${
                                isTargetMet 
                                    ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" 
                                    : "bg-amber-500/10 border-amber-500/20 text-amber-400"
                            }`}>
                                <span className="text-xs font-semibold uppercase tracking-wider block mb-1">
                                    {isTargetMet ? "Surplus Penjualan" : "Sisa Kekurangan"}
                                </span>
                                <div className="text-xl font-bold">
                                    {isTargetMet ? `+Rp ${difference.toLocaleString('id-ID')}` : `Rp ${Math.abs(difference).toLocaleString('id-ID')}`}
                                </div>
                                <span className="text-[10px] opacity-80 mt-1 block">
                                    {isTargetMet ? `Melampaui target sebesar ${(percentage - 100).toFixed(1)}%` : `Kurang ${(100 - percentage).toFixed(1)}% untuk mencapai target`}
                                </span>
                            </div>
                        </div>

                        {/* Progress Bar */}
                        <div>
                            <div className="flex justify-between items-center text-xs font-bold mb-2">
                                <span className="text-text-secondary flex items-center gap-1.5">
                                    <TrendingUp className="w-3.5 h-3.5 text-accent" />
                                    Progress Pencapaian
                                </span>
                                <span className={`text-sm ${isTargetMet ? 'text-emerald-400 font-extrabold' : 'text-text-primary'}`}>
                                    {percentage.toFixed(1)}%
                                </span>
                            </div>
                            <div className="w-full bg-surface-hover h-3.5 rounded-full overflow-hidden p-0.5 border border-border">
                                <div
                                    className={`h-full rounded-full transition-all duration-500 ${
                                        isTargetMet
                                            ? "bg-gradient-to-r from-emerald-500 to-teal-400 shadow-sm"
                                            : percentage >= 75
                                                ? "bg-gradient-to-r from-blue-600 to-accent"
                                                : percentage >= 50
                                                    ? "bg-gradient-to-r from-amber-500 to-yellow-400"
                                                    : "bg-gradient-to-r from-orange-500 to-red-400"
                                    }`}
                                    style={{ width: `${progressWidth}%` }}
                                />
                            </div>
                        </div>

                        {/* Extra Breakdown & Projection */}
                        {period === 'monthly' && currentRevenue > 0 && (
                            <div className="bg-surface-hover/50 border border-border p-3.5 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                                <div className="flex items-center gap-2">
                                    <Sparkles className="w-4 h-4 text-accent shrink-0" />
                                    <div>
                                        <span className="font-bold text-text-primary">Estimasi Proyeksi Akhir Bulan: </span>
                                        <span className="text-text-secondary">
                                            Rp {Math.round(projectedMonthly).toLocaleString('id-ID')}
                                        </span>
                                    </div>
                                </div>
                                <div className="text-[11px] text-text-muted">
                                    Rata-rata saat ini: <span className="font-bold text-text-primary">Rp {Math.round(dailyAverageSoFar).toLocaleString('id-ID')}</span>/hari (Hari ke-{currentDayOfMonth} dari {daysInMonth})
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    /* Empty State: Target belum diatur */
                    <div className="py-6 px-4 bg-background/50 border border-dashed border-border rounded-xl text-center">
                        <div className="w-12 h-12 bg-accent/10 text-accent rounded-full flex items-center justify-center mx-auto mb-3">
                            <Target className="w-6 h-6" />
                        </div>
                        <h4 className="font-bold text-sm md:text-base text-text-primary mb-1">
                            Target Penjualan Belum Ditentukan
                        </h4>
                        <p className="text-xs text-text-muted max-w-md mx-auto mb-4">
                            Tentukan target omset harian, mingguan, atau bulanan Anda untuk memantau grafik performa dan persentase pencapaian kasir secara akurat.
                        </p>
                        <button
                            type="button"
                            onClick={() => setIsModalOpen(true)}
                            className="px-4 py-2.5 bg-accent hover:bg-accent-hover text-white text-xs font-bold rounded-xl transition-colors shadow-soft inline-flex items-center gap-2"
                        >
                            <Sparkles className="w-4 h-4" />
                            Atur Target Sekarang
                        </button>
                    </div>
                )}
            </div>

            {/* Modal Set Target */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/75 flex items-center justify-center z-50 p-4 backdrop-blur-sm animate-in fade-in duration-150">
                    <div className="bg-surface border border-border rounded-3xl p-6 w-full max-w-lg shadow-2xl relative">
                        {/* Modal Header */}
                        <div className="flex items-center justify-between pb-4 border-b border-border mb-5">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-2xl bg-accent/10 text-accent flex items-center justify-center">
                                    <Target className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-lg text-text-primary">Atur Target Penjualan Toko</h3>
                                    <p className="text-xs text-text-muted">Masukkan sasaran omset harian, mingguan, dan bulanan</p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setIsModalOpen(false)}
                                className="p-2 hover:bg-surface-hover rounded-full text-text-muted hover:text-text-primary transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Modal Form */}
                        <form onSubmit={handleSave} className="space-y-4">
                            {/* Target Harian */}
                            <div>
                                <label className="block text-xs font-bold text-text-secondary mb-1.5">
                                    Target Penjualan Harian (Rp) *
                                </label>
                                <div className="relative">
                                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-text-muted">Rp</span>
                                    <input
                                        type="number"
                                        min="0"
                                        step="1000"
                                        value={inputDaily}
                                        onChange={(e) => setInputDaily(e.target.value)}
                                        placeholder="Contoh: 1500000"
                                        className="w-full pl-10 pr-4 py-3 bg-background border border-border rounded-xl text-sm font-bold text-text-primary outline-none focus:border-accent transition-colors"
                                    />
                                </div>
                                <span className="text-[10px] text-text-muted mt-1 block">
                                    Target omset yang ingin dicapai setiap harinya.
                                </span>
                            </div>

                            {/* Auto Calculate Button */}
                            {Number(inputDaily) > 0 && (
                                <button
                                    type="button"
                                    onClick={handleAutoFillFromDaily}
                                    className="w-full py-2 px-3 bg-accent/10 hover:bg-accent/20 text-accent rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5 border border-accent/20"
                                >
                                    <Calculator className="w-3.5 h-3.5" />
                                    Hitung Otomatis Mingguan (x7) & Bulanan (x30) dari Harian
                                </button>
                            )}

                            {/* Target Mingguan */}
                            <div>
                                <label className="block text-xs font-bold text-text-secondary mb-1.5">
                                    Target Penjualan Mingguan (Rp)
                                </label>
                                <div className="relative">
                                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-text-muted">Rp</span>
                                    <input
                                        type="number"
                                        min="0"
                                        step="1000"
                                        value={inputWeekly}
                                        onChange={(e) => setInputWeekly(e.target.value)}
                                        placeholder="Contoh: 10500000"
                                        className="w-full pl-10 pr-4 py-3 bg-background border border-border rounded-xl text-sm font-bold text-text-primary outline-none focus:border-accent transition-colors"
                                    />
                                </div>
                                <span className="text-[10px] text-text-muted mt-1 block">
                                    Kosongkan untuk otomatis menggunakan 7 x Target Harian.
                                </span>
                            </div>

                            {/* Target Bulanan */}
                            <div>
                                <label className="block text-xs font-bold text-text-secondary mb-1.5">
                                    Target Penjualan Bulanan (Rp)
                                </label>
                                <div className="relative">
                                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-text-muted">Rp</span>
                                    <input
                                        type="number"
                                        min="0"
                                        step="1000"
                                        value={inputMonthly}
                                        onChange={(e) => setInputMonthly(e.target.value)}
                                        placeholder="Contoh: 45000000"
                                        className="w-full pl-10 pr-4 py-3 bg-background border border-border rounded-xl text-sm font-bold text-text-primary outline-none focus:border-accent transition-colors"
                                    />
                                </div>
                                <span className="text-[10px] text-text-muted mt-1 block">
                                    Kosongkan untuk otomatis menggunakan 30 x Target Harian.
                                </span>
                            </div>

                            {/* Actions */}
                            <div className="flex gap-3 pt-3 border-t border-border mt-5">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    disabled={isSaving}
                                    className="flex-1 py-3 bg-surface-hover hover:bg-border text-text-secondary rounded-xl text-xs font-bold transition-colors"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSaving}
                                    className="flex-1 py-3 bg-accent hover:bg-accent-hover text-white rounded-xl text-xs font-bold transition-colors shadow-soft flex items-center justify-center gap-2 disabled:opacity-50"
                                >
                                    {isSaving ? "Menyimpan..." : "Simpan Target"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}
