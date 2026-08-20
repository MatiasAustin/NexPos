'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import {
    ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid,
    Tooltip, Legend, ResponsiveContainer
} from 'recharts';

type PeriodMode = 'daily' | 'weekly' | 'monthly' | 'yearly';

interface ChartPoint {
    label: string;
    omset: number;
    pengeluaran: number;
    laba: number;
}

function formatRupiah(n: number) {
    return 'Rp ' + Math.abs(n).toLocaleString('id-ID');
}

function getDateRange(mode: PeriodMode): { start: Date; end: Date } {
    const now = new Date();
    const end = new Date(now);
    end.setHours(23, 59, 59, 999);

    let start = new Date(now);
    if (mode === 'daily') {
        // Show last 30 days
        start.setDate(now.getDate() - 29);
        start.setHours(0, 0, 0, 0);
    } else if (mode === 'weekly') {
        // Show last 12 weeks
        start.setDate(now.getDate() - 83);
        start.setHours(0, 0, 0, 0);
    } else if (mode === 'monthly') {
        // Show last 12 months
        start.setMonth(now.getMonth() - 11);
        start.setDate(1);
        start.setHours(0, 0, 0, 0);
    } else {
        // yearly: last 5 years
        start.setFullYear(now.getFullYear() - 4);
        start.setMonth(0);
        start.setDate(1);
        start.setHours(0, 0, 0, 0);
    }
    return { start, end };
}

function getPeriodLabel(date: Date, mode: PeriodMode): string {
    if (mode === 'daily') {
        return date.toISOString().split('T')[0]; // YYYY-MM-DD
    } else if (mode === 'weekly') {
        // week of year
        const firstDay = new Date(date.getFullYear(), 0, 1);
        const weekNo = Math.ceil((((date.getTime() - firstDay.getTime()) / 86400000) + firstDay.getDay() + 1) / 7);
        return `${date.getFullYear()}-W${String(weekNo).padStart(2, '0')}`;
    } else if (mode === 'monthly') {
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    } else {
        return String(date.getFullYear());
    }
}

function formatLabel(label: string, mode: PeriodMode): string {
    if (mode === 'daily') {
        const parts = label.split('-');
        return `${parts[2]}/${parts[1]}`;
    } else if (mode === 'weekly') {
        return label.replace('-', ' ');
    } else if (mode === 'monthly') {
        const months = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agt','Sep','Okt','Nov','Des'];
        const parts = label.split('-');
        return `${months[parseInt(parts[1]) - 1]} '${parts[0].slice(2)}`;
    }
    return label;
}

export default function ReportChart() {
    const [mode, setMode] = useState<PeriodMode>('daily');
    const [chartData, setChartData] = useState<ChartPoint[]>([]);
    const [loading, setLoading] = useState(true);
    const [totals, setTotals] = useState({ omset: 0, pengeluaran: 0, laba: 0 });

    useEffect(() => {
        fetchChartData();
    }, [mode]);

    const fetchChartData = async () => {
        setLoading(true);
        const { start, end } = getDateRange(mode);

        // Fetch real transactions
        const { data: transactions } = await supabase
            .from('transactions')
            .select('id, amount_due, created_at, status')
            .eq('status', 'Paid')
            .gte('created_at', start.toISOString())
            .lte('created_at', end.toISOString());

        // Fetch order_items for COGS calculation (HPP)
        const { data: orderItems } = await supabase
            .from('order_items')
            .select('transaction_id, cogs_at_time, quantity, created_at')
            .gte('created_at', start.toISOString())
            .lte('created_at', end.toISOString());

        // Fetch operational expenses (real)
        const { data: expenses } = await supabase
            .from('expenses')
            .select('amount, expense_date, created_at')
            .gte('created_at', start.toISOString())
            .lte('created_at', end.toISOString());

        // Build aggregation map
        const map: Record<string, { omset: number; pengeluaran: number }> = {};

        for (const trx of transactions || []) {
            const label = getPeriodLabel(new Date(trx.created_at), mode);
            if (!map[label]) map[label] = { omset: 0, pengeluaran: 0 };
            map[label].omset += parseFloat(trx.amount_due) || 0;
        }

        for (const item of orderItems || []) {
            const label = getPeriodLabel(new Date(item.created_at), mode);
            if (!map[label]) map[label] = { omset: 0, pengeluaran: 0 };
            map[label].pengeluaran += (parseFloat(item.cogs_at_time) || 0) * (item.quantity || 1);
        }

        for (const exp of expenses || []) {
            const dateStr = exp.expense_date || exp.created_at;
            const label = getPeriodLabel(new Date(dateStr), mode);
            if (!map[label]) map[label] = { omset: 0, pengeluaran: 0 };
            map[label].pengeluaran += parseFloat(exp.amount) || 0;
        }

        // Convert to sorted array
        const sorted = Object.keys(map).sort();
        const points: ChartPoint[] = sorted.map(label => ({
            label: formatLabel(label, mode),
            omset: map[label].omset,
            pengeluaran: map[label].pengeluaran,
            laba: map[label].omset - map[label].pengeluaran
        }));

        // Compute totals
        const totalOmset = points.reduce((s, p) => s + p.omset, 0);
        const totalPengeluaran = points.reduce((s, p) => s + p.pengeluaran, 0);
        setTotals({ omset: totalOmset, pengeluaran: totalPengeluaran, laba: totalOmset - totalPengeluaran });
        setChartData(points);
        setLoading(false);
    };

    const exportCSV = () => {
        const rows = [
            ['Periode', 'Omset (Rp)', 'Pengeluaran+HPP (Rp)', 'Laba Bersih (Rp)'],
            ...chartData.map(p => [p.label, p.omset, p.pengeluaran, p.laba])
        ];
        const csv = rows.map(r => r.join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `laporan-${mode}-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
    };

    const modes: { key: PeriodMode; label: string }[] = [
        { key: 'daily', label: 'Harian' },
        { key: 'weekly', label: 'Mingguan' },
        { key: 'monthly', label: 'Bulanan' },
        { key: 'yearly', label: 'Tahunan' },
    ];

    return (
        <div className="bg-[#131B2C] border border-gray-800 rounded-2xl p-6 shadow-xl">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <h3 className="font-bold text-xl text-white">Dashboard Keuangan</h3>
                <div className="flex items-center gap-2 flex-wrap">
                    <div className="flex bg-gray-900 rounded-xl p-1 border border-gray-800">
                        {modes.map(m => (
                            <button
                                key={m.key}
                                onClick={() => setMode(m.key)}
                                className={`px-3 py-1.5 rounded-lg text-sm font-bold transition-all ${mode === m.key ? 'bg-blue-600 text-white shadow' : 'text-gray-400 hover:text-white'}`}
                            >
                                {m.label}
                            </button>
                        ))}
                    </div>
                    <button
                        onClick={exportCSV}
                        className="px-4 py-2 bg-green-600 text-white rounded-xl text-sm font-bold hover:bg-green-500 flex items-center gap-1"
                    >
                        ↓ Export CSV
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="h-64 flex items-center justify-center text-gray-500">Memuat data nyata dari database...</div>
            ) : chartData.length === 0 ? (
                <div className="h-64 flex flex-col items-center justify-center text-gray-500 gap-2">
                    <p className="text-lg font-semibold">Belum ada data transaksi</p>
                    <p className="text-sm text-gray-600">Lakukan transaksi dari POS untuk melihat laporan di sini.</p>
                </div>
            ) : (
                <ResponsiveContainer width="100%" height={280}>
                    <ComposedChart data={chartData} margin={{ top: 5, right: 10, bottom: 5, left: 10 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                        <XAxis dataKey="label" stroke="#9ca3af" fontSize={11} tick={{ fill: '#9ca3af' }} />
                        <YAxis stroke="#9ca3af" fontSize={11} tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} />
                        <Tooltip
                            contentStyle={{ backgroundColor: '#131B2C', borderColor: '#1f2937', borderRadius: '12px' }}
                            formatter={(value: any) => [formatRupiah(Number(value) || 0), undefined]}
                        />
                        <Legend wrapperStyle={{ paddingTop: '16px', fontSize: '12px' }} />
                        <Bar dataKey="omset" name="Omset" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={50} />
                        <Bar dataKey="pengeluaran" name="Pengeluaran (HPP+Operasional)" fill="#ef4444" radius={[4, 4, 0, 0]} maxBarSize={50} />
                        <Line type="monotone" dataKey="laba" name="Laba Bersih" stroke="#22c55e" strokeWidth={2} dot={false} />
                    </ComposedChart>
                </ResponsiveContainer>
            )}

            {/* Summary Cards */}
            {!loading && (
                <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-gray-800">
                    <div className="text-center">
                        <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider mb-1">Total Omset</p>
                        <p className="text-lg font-extrabold text-blue-400">{formatRupiah(totals.omset)}</p>
                    </div>
                    <div className="text-center border-x border-gray-800">
                        <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider mb-1">Total Pengeluaran</p>
                        <p className="text-lg font-extrabold text-red-400">{formatRupiah(totals.pengeluaran)}</p>
                    </div>
                    <div className="text-center">
                        <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider mb-1">Laba Bersih</p>
                        <p className={`text-lg font-extrabold ${totals.laba >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                            {totals.laba < 0 ? '-' : ''}{formatRupiah(totals.laba)}
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}
