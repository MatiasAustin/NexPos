import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ComposedChart, Line
} from 'recharts';
import { Download } from 'lucide-react';

export default function ReportChart() {
    const [mode, setMode] = useState<'daily'|'weekly'|'monthly'|'yearly'>('daily');
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchData();
    }, [mode]);

    const fetchData = async () => {
        setLoading(true);
        try {
            // Fetch transactions and expenses
            const { data: txData } = await supabase.from('transactions').select('amount_due, created_at, status, order_items(cogs_at_time, quantity)').eq('status', 'Paid');
            const { data: expData } = await supabase.from('expenses').select('amount, expense_date');

            const aggregated: Record<string, { omset: number; pengeluaran: number; laba_bersih: number; label: string }> = {};

            const getDateKey = (dateStr: string) => {
                const date = new Date(dateStr);
                if (mode === 'daily') {
                    return date.toISOString().split('T')[0];
                } else if (mode === 'weekly') {
                    const d = new Date(date);
                    const day = d.getDay();
                    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
                    d.setDate(diff);
                    return d.toISOString().split('T')[0] + ' (Week)';
                } else if (mode === 'monthly') {
                    return date.toISOString().substring(0, 7);
                } else {
                    return date.toISOString().substring(0, 4);
                }
            };

            if (txData) {
                txData.forEach((tx: any) => {
                    if (!tx.created_at) return;
                    const key = getDateKey(tx.created_at);
                    if (!aggregated[key]) aggregated[key] = { omset: 0, pengeluaran: 0, laba_bersih: 0, label: key };
                    
                    aggregated[key].omset += Number(tx.amount_due);
                    
                    let totalCogs = 0;
                    if (tx.order_items && Array.isArray(tx.order_items)) {
                        tx.order_items.forEach((item: any) => {
                            totalCogs += Number(item.cogs_at_time || 0) * Number(item.quantity || 1);
                        });
                    }
                    aggregated[key].pengeluaran += totalCogs;
                });
            }

            if (expData) {
                expData.forEach((exp: any) => {
                    if (!exp.expense_date) return;
                    const key = getDateKey(exp.expense_date);
                    if (!aggregated[key]) aggregated[key] = { omset: 0, pengeluaran: 0, laba_bersih: 0, label: key };
                    
                    aggregated[key].pengeluaran += Number(exp.amount || 0);
                });
            }

            const finalData = Object.values(aggregated).map(item => ({
                ...item,
                laba_bersih: item.omset - item.pengeluaran
            })).sort((a, b) => a.label.localeCompare(b.label));

            setData(finalData);
        } catch (error) {
            console.error(error);
        }
        setLoading(false);
    };

    const handleExportCSV = () => {
        if (data.length === 0) return;
        const headers = ["Tanggal/Periode", "Omset (Rp)", "Pengeluaran (Rp)", "Laba Bersih (Rp)"];
        const rows = data.map(d => [d.label, d.omset, d.pengeluaran, d.laba_bersih]);
        
        const csvContent = [
            headers.join(","),
            ...rows.map(e => e.join(","))
        ].join("\n");

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `Laporan_Keuangan_${mode}_${new Date().getTime()}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const formatRupiah = (value: number) => new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(value);

    return (
        <div className="bg-[#131B2C] rounded-2xl border border-gray-800 shadow-xl overflow-hidden mb-8">
            <div className="p-6 border-b border-gray-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <h3 className="font-bold text-xl text-white">Dashboard Keuangan</h3>
                
                <div className="flex flex-wrap items-center gap-3">
                    <div className="flex bg-gray-900 rounded-lg p-1">
                        {['daily', 'weekly', 'monthly', 'yearly'].map((m) => (
                            <button
                                key={m}
                                onClick={() => setMode(m as any)}
                                className={`px-4 py-2 text-sm font-bold rounded-md transition-colors capitalize ${
                                    mode === m ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'
                                }`}
                            >
                                {m === 'daily' ? 'Harian' : m === 'weekly' ? 'Mingguan' : m === 'monthly' ? 'Bulanan' : 'Tahunan'}
                            </button>
                        ))}
                    </div>

                    <button 
                        onClick={handleExportCSV}
                        className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-500 text-white font-bold rounded-lg transition-colors text-sm"
                    >
                        <Download className="w-4 h-4" /> Export CSV
                    </button>
                </div>
            </div>

            <div className="p-6">
                {loading ? (
                    <div className="h-[400px] flex items-center justify-center text-gray-500">Memuat data...</div>
                ) : data.length === 0 ? (
                    <div className="h-[400px] flex items-center justify-center text-gray-500">Belum ada data transaksi/pengeluaran.</div>
                ) : (
                    <div className="h-[400px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <ComposedChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
                                <XAxis dataKey="label" stroke="#9ca3af" fontSize={12} tickMargin={10} />
                                <YAxis stroke="#9ca3af" fontSize={12} tickFormatter={(value) => `Rp${(value/1000)}k`} />
                                <Tooltip 
                                    contentStyle={{ backgroundColor: '#131B2C', borderColor: '#1f2937', borderRadius: '12px' }}
                                    formatter={(value: any) => [formatRupiah(Number(value) || 0), undefined]}
                                />
                                <Legend wrapperStyle={{ paddingTop: '20px' }} />
                                <Bar dataKey="omset" name="Omset" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={50} />
                                <Bar dataKey="pengeluaran" name="Pengeluaran (Termasuk HPP)" fill="#ef4444" radius={[4, 4, 0, 0]} maxBarSize={50} />
                                <Line type="monotone" dataKey="laba_bersih" name="Laba Bersih" stroke="#10b981" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} />
                            </ComposedChart>
                        </ResponsiveContainer>
                    </div>
                )}
            </div>
            
            {/* Summary Cards */}
            {!loading && data.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-gray-800 border-t border-gray-800">
                    <div className="p-6 text-center bg-gray-900/30">
                        <p className="text-gray-400 text-sm font-bold mb-1">Total Omset ({mode})</p>
                        <p className="text-2xl font-black text-blue-400">{formatRupiah(data.reduce((sum, d) => sum + d.omset, 0))}</p>
                    </div>
                    <div className="p-6 text-center bg-gray-900/30">
                        <p className="text-gray-400 text-sm font-bold mb-1">Total Pengeluaran ({mode})</p>
                        <p className="text-2xl font-black text-red-400">{formatRupiah(data.reduce((sum, d) => sum + d.pengeluaran, 0))}</p>
                    </div>
                    <div className="p-6 text-center bg-gray-900/30">
                        <p className="text-gray-400 text-sm font-bold mb-1">Total Laba Bersih ({mode})</p>
                        <p className="text-2xl font-black text-green-400">{formatRupiah(data.reduce((sum, d) => sum + d.laba_bersih, 0))}</p>
                    </div>
                </div>
            )}
        </div>
    );
}
