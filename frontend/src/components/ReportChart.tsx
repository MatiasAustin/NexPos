'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ComposedChart, Line
} from 'recharts';

export type PeriodMode = 'daily' | 'weekly' | 'monthly' | 'yearly' | 'custom';

interface ChartPoint {
    label: string;
    omset: number;
    pengeluaranOp: number;
    hpp: number;
    laba: number;
}

function formatRupiah(n: number) {
    if (n < 0) return '-Rp ' + Math.abs(n).toLocaleString('id-ID');
    return 'Rp ' + Math.abs(n).toLocaleString('id-ID');
}

function getPeriodLabel(dateStr: string, mode: PeriodMode): string {
    const d = new Date(dateStr);
    if (mode === 'daily') {
        return `${d.getHours().toString().padStart(2, '0')}:00`;
    } else if (mode === 'weekly') {
        const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
        return days[d.getDay()];
    } else if (mode === 'monthly' || mode === 'custom') {
        return `${d.getDate().toString().padStart(2, '0')} ${d.toLocaleString('id-ID', { month: 'short' })}`;
    } else {
        return d.toLocaleString('id-ID', { month: 'short', year: 'numeric' });
    }
}

interface ReportChartProps {
    period: PeriodMode;
    customStartDate?: string;
    customEndDate?: string;
    referenceDate?: Date;
}

export default function ReportChart({ period, customStartDate, customEndDate, referenceDate }: ReportChartProps) {
    const [chartData, setChartData] = useState<ChartPoint[]>([]);
    const [loading, setLoading] = useState(true);
    const [totals, setTotals] = useState({ omset: 0, pengeluaranOp: 0, hpp: 0, laba: 0 });
    const [periodLabel, setPeriodLabel] = useState('');

    useEffect(() => {
        fetchChartData();
    }, [period, customStartDate, customEndDate, referenceDate]);

    const fetchChartData = async () => {
        setLoading(true);

        const now = referenceDate || new Date();
        let start = new Date(now);
        let end = new Date(now);
        end.setHours(23, 59, 59, 999);
        
        let label = '';
        if (period === 'daily') {
            start.setHours(0, 0, 0, 0);
            end = new Date(start);
            end.setHours(23, 59, 59, 999);
            label = `Hari Ini (${start.toLocaleDateString('id-ID')})`;
        } else if (period === 'weekly') {
            const day = start.getDay();
            const diff = start.getDate() - day + (day === 0 ? -6 : 1);
            start = new Date(start.setDate(diff));
            start.setHours(0, 0, 0, 0);
            end = new Date(start);
            end.setDate(start.getDate() + 6);
            end.setHours(23, 59, 59, 999);
            label = `Minggu Ini (${start.toLocaleDateString('id-ID')} - ${end.toLocaleDateString('id-ID')})`;
        } else if (period === 'monthly') {
            start.setDate(1);
            start.setHours(0, 0, 0, 0);
            end = new Date(start.getFullYear(), start.getMonth() + 1, 0);
            end.setHours(23, 59, 59, 999);
            label = `Bulan Ini (${start.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })})`;
        } else if (period === 'yearly') {
            start.setMonth(0, 1);
            start.setHours(0, 0, 0, 0);
            end = new Date(start.getFullYear(), 11, 31);
            end.setHours(23, 59, 59, 999);
            label = `Tahun Ini (${start.toLocaleDateString('id-ID', { year: 'numeric' })})`;
        } else if (period === 'custom' && customStartDate && customEndDate) {
            start = new Date(customStartDate);
            end = new Date(customEndDate);
            end.setHours(23, 59, 59, 999);
            label = `Kustom (${start.toLocaleDateString('id-ID')} - ${end.toLocaleDateString('id-ID')})`;
        } else if (period === 'custom') {
            start.setHours(0,0,0,0);
            label = 'Pilih rentang tanggal';
        }
        setPeriodLabel(label);

        const { data: transactions } = await supabase
            .from('transactions')
            .select('id, amount_due, created_at, status')
            .eq('status', 'Paid')
            .gte('created_at', start.toISOString())
            .lte('created_at', end.toISOString());

        const { data: orderItems } = await supabase
            .from('order_items')
            .select('transaction_id, cogs_at_time, quantity, created_at')
            .gte('created_at', start.toISOString())
            .lte('created_at', end.toISOString());

        const { data: expenses } = await supabase
            .from('expenses')
            .select('amount, expense_date, created_at')
            .gte('created_at', start.toISOString())
            .lte('created_at', end.toISOString());

        const map: Record<string, { omset: number; pengeluaranOp: number; hpp: number }> = {};

        for (const trx of transactions || []) {
            const lbl = getPeriodLabel(trx.created_at, period);
            if (!map[lbl]) map[lbl] = { omset: 0, pengeluaranOp: 0, hpp: 0 };
            map[lbl].omset += parseFloat(trx.amount_due) || 0;
        }

        for (const item of orderItems || []) {
            const lbl = getPeriodLabel(item.created_at, period);
            if (!map[lbl]) map[lbl] = { omset: 0, pengeluaranOp: 0, hpp: 0 };
            map[lbl].hpp += (parseFloat(item.cogs_at_time) || 0) * (item.quantity || 1);
        }

        for (const exp of expenses || []) {
            const dateStr = exp.expense_date || exp.created_at;
            const lbl = getPeriodLabel(dateStr, period);
            if (!map[lbl]) map[lbl] = { omset: 0, pengeluaranOp: 0, hpp: 0 };
            map[lbl].pengeluaranOp += parseFloat(exp.amount) || 0;
        }

        let points: any[] = [];
        
        if (period === 'daily') {
            for (let i = 0; i < 24; i++) {
                const lbl = `${i.toString().padStart(2, '0')}:00`;
                points.push({ label: lbl, omset: map[lbl]?.omset || 0, pengeluaranOp: map[lbl]?.pengeluaranOp || 0, hpp: map[lbl]?.hpp || 0, laba: (map[lbl]?.omset || 0) - (map[lbl]?.pengeluaranOp || 0) });
            }
        } else if (period === 'weekly') {
            const days = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];
            points = days.map(d => ({ label: d, omset: map[d]?.omset || 0, pengeluaranOp: map[d]?.pengeluaranOp || 0, hpp: map[d]?.hpp || 0, laba: (map[d]?.omset || 0) - (map[d]?.pengeluaranOp || 0) }));
        } else if (period === 'monthly') {
            const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
            for (let i = 1; i <= daysInMonth; i++) {
                const d = new Date(now.getFullYear(), now.getMonth(), i);
                const lbl = `${d.getDate().toString().padStart(2, '0')} ${d.toLocaleString('id-ID', { month: 'short' })}`;
                points.push({ label: lbl, omset: map[lbl]?.omset || 0, pengeluaranOp: map[lbl]?.pengeluaranOp || 0, hpp: map[lbl]?.hpp || 0, laba: (map[lbl]?.omset || 0) - (map[lbl]?.pengeluaranOp || 0) });
            }
        } else if (period === 'yearly') {
            for (let i = 0; i < 12; i++) {
                const d = new Date(now.getFullYear(), i, 1);
                const lbl = d.toLocaleString('id-ID', { month: 'short', year: 'numeric' });
                points.push({ label: lbl, omset: map[lbl]?.omset || 0, pengeluaranOp: map[lbl]?.pengeluaranOp || 0, hpp: map[lbl]?.hpp || 0, laba: (map[lbl]?.omset || 0) - (map[lbl]?.pengeluaranOp || 0) });
            }
        } else if (period === 'custom') {
            const sorted = Object.keys(map).sort();
            points = sorted.map(lbl => ({
                label: lbl,
                omset: map[lbl].omset,
                pengeluaranOp: map[lbl].pengeluaranOp,
                hpp: map[lbl].hpp,
                laba: map[lbl].omset - map[lbl].pengeluaranOp
            }));
        }

        const totalOmset = points.reduce((s, p) => s + p.omset, 0);
        const totalPengeluaranOp = points.reduce((s, p) => s + p.pengeluaranOp, 0);
        const totalHpp = points.reduce((s, p) => s + p.hpp, 0);
        setTotals({ omset: totalOmset, pengeluaranOp: totalPengeluaranOp, hpp: totalHpp, laba: totalOmset - totalPengeluaranOp });
        setChartData(points);
        setLoading(false);
    };

    const exportCSV = () => {
        const rows = [
            ['Waktu', 'Omset (Rp)', 'Total HPP (Rp)', 'Pengeluaran (Rp)', 'Laba Bersih (Rp)'],
            ...chartData.map(p => [p.label, p.omset, p.hpp, p.pengeluaranOp, p.laba])
        ];
        const csv = rows.map(r => r.join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `laporan-${period}-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
    };

    return (
        <div className="bg-[#131B2C] border border-gray-800 rounded-2xl p-6 shadow-xl">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <div>
                    <h3 className="font-bold text-xl text-white">Dashboard Keuangan</h3>
                    <p className="text-sm text-gray-400 mt-1">{periodLabel}</p>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                    <button
                        onClick={exportCSV}
                        className="px-4 py-2 bg-green-600 text-white rounded-xl text-sm font-bold hover:bg-green-500 flex items-center gap-1"
                    >
                        Export CSV
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="h-64 flex items-center justify-center text-gray-500">Memuat data...</div>
            ) : chartData.length === 0 ? (
                <div className="h-64 flex flex-col items-center justify-center text-gray-500 gap-2">
                    <p className="text-lg font-semibold">Belum ada data transaksi</p>
                </div>
            ) : (
                <ResponsiveContainer width="100%" height={280}>
                    <ComposedChart data={chartData} margin={{ top: 5, right: 10, bottom: 5, left: 10 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                        <XAxis dataKey="label" stroke="#9ca3af" fontSize={11} tick={{ fill: '#9ca3af' }} />
                        <YAxis stroke="#9ca3af" fontSize={11} tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} />
                        <Tooltip
                            content={(props: any) => {
                                const { active, payload, label } = props;
                                if (active && payload && payload.length) {
                                    return (
                                        <div className="bg-[#131B2C] border border-gray-800 rounded-xl p-3 shadow-xl">
                                            <p className="text-gray-300 font-bold mb-2">{label}</p>
                                            {payload.map((entry: any, index: number) => {
                                                const val = Number(entry.value) || 0;
                                                const isLaba = entry.dataKey === 'laba';
                                                const color = isLaba ? (val < 0 ? '#ef4444' : '#22c55e') : entry.color;
                                                return (
                                                    <div key={index} className="flex justify-between gap-4 text-sm mb-1">
                                                        <span style={{ color }}>{entry.name}:</span>
                                                        <span className="font-bold text-white">{formatRupiah(val)}</span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    );
                                }
                                return null;
                            }}
                        />
                        <Legend wrapperStyle={{ paddingTop: '16px', fontSize: '12px' }} />
                        <Bar dataKey="omset" name="Omset" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={50} />
                        <Bar dataKey="hpp" name="Total HPP" fill="#f59e0b" radius={[4, 4, 0, 0]} maxBarSize={50} />
                        <Bar dataKey="pengeluaranOp" name="Pengeluaran (Operasional)" fill="#ef4444" radius={[4, 4, 0, 0]} maxBarSize={50} />
                        <Line type="monotone" dataKey="laba" name="Laba Bersih" stroke="#22c55e" strokeWidth={2} dot={false} />
                    </ComposedChart>
                </ResponsiveContainer>
            )}

            {!loading && (
                <>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-gray-800">
                        <div className="text-center border-b md:border-b-0 md:border-r border-gray-800 pb-4 md:pb-0">
                            <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider mb-1">Total Omset</p>
                            <p className="text-sm md:text-lg font-extrabold text-blue-400">{formatRupiah(totals.omset)}</p>
                        </div>
                        <div className="text-center border-b md:border-b-0 md:border-r border-gray-800 pb-4 md:pb-0">
                            <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider mb-1">Total HPP</p>
                            <p className="text-sm md:text-lg font-extrabold text-amber-400">{formatRupiah(totals.hpp)}</p>
                        </div>
                        <div className="text-center md:border-r border-gray-800">
                            <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider mb-1">Total Pengeluaran</p>
                            <p className="text-sm md:text-lg font-extrabold text-red-400">{formatRupiah(totals.pengeluaranOp)}</p>
                        </div>
                        <div className="text-center">
                            <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider mb-1">Laba Bersih</p>
                            <p className={`text-sm md:text-lg font-extrabold ${totals.laba >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                {formatRupiah(totals.laba)}
                            </p>
                        </div>
                    </div>
                    <div className="mt-4 text-[10px] md:text-xs text-gray-500 text-center px-4">
                        <p>* <strong className="text-gray-400">Total HPP</strong> adalah hitungan kasar estimasi modal bahan baku.</p>
                        <p>* <strong className="text-gray-400">Laba Bersih</strong> adalah hasil pengurangan <strong className="text-gray-400">Total Omset</strong> dengan <strong className="text-gray-400">Total Pengeluaran</strong> riil (operasional) yang diinput kasir.</p>
                    </div>
                </>
            )}
        </div>
    );
}
