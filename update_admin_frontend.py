import re

with open("d:/WORK/BUILD_APP/NexPos/frontend/src/app/admin/page.tsx", "r", encoding="utf-8") as f:
    content = f.read()

# ADD STATES
states_old = 'const [reconciliationPeriod, setReconciliationPeriod] = useState<"daily" | "weekly" | "monthly" | "yearly" | "custom">("daily");'
states_new = 'const [reconciliationDate, setReconciliationDate] = useState<Date>(new Date());\n    const [historyDate, setHistoryDate] = useState<Date>(new Date());\n    ' + states_old
content = content.replace(states_old, states_new)

# REPLACE FETCH RECONCILIATION
fetch_old = """        try {
            const now = new Date();
            let start = new Date(now);
            let end = new Date(now);"""
fetch_new = """        try {
            const now = reconciliationDate;
            let start = new Date(now);
            let end = new Date(now);"""
content = content.replace(fetch_old, fetch_new)

# REPLACE FETCH HISTORY
history_old = """            } else if (activeTab === "history") {
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/transactions`);
                if(res.ok) setTransactions(await res.json());"""
history_new = """            } else if (activeTab === "history") {
                await fetchTransactions(historyFilterType);"""
content = content.replace(history_old, history_new)

# ADD FETCH TRANSACTIONS METHOD and SHIFT METHODS
after_fetch_recon = """    const fetchTransactions = async (period: 'daily' | 'weekly' | 'monthly' | 'yearly' | 'custom', customStart?: string, customEnd?: string) => {
        setLoading(true);
        try {
            const now = historyDate;
            let start = new Date(now);
            let end = new Date(now);
            end.setHours(23, 59, 59, 999);
            
            if (period === 'daily') {
                start.setHours(0, 0, 0, 0);
            } else if (period === 'weekly') {
                const day = start.getDay();
                const diff = start.getDate() - day + (day === 0 ? -6 : 1);
                start = new Date(start.setDate(diff));
                start.setHours(0, 0, 0, 0);
            } else if (period === 'monthly') {
                start.setDate(1);
                start.setHours(0, 0, 0, 0);
            } else if (period === 'yearly') {
                start.setMonth(0, 1);
                start.setHours(0, 0, 0, 0);
            } else if (period === 'custom' && customStart && customEnd) {
                start = new Date(customStart);
                start.setHours(0, 0, 0, 0);
                end = new Date(customEnd);
                end.setHours(23, 59, 59, 999);
            } else if (period === 'custom') {
                setLoading(false);
                return;
            }
            
            const startStr = start.toISOString().split('T')[0];
            const endStr = end.toISOString().split('T')[0];
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/transactions?startDate=${startStr}&endDate=${endStr}`);
            if (res.ok) setTransactions(await res.json());
        } catch (error) {
            console.error(error);
        }
        setLoading(false);
    };

    const shiftReconciliationDate = (dir: number) => {
        setReconciliationDate(prev => {
            const d = new Date(prev);
            if (reconciliationPeriod === 'daily') d.setDate(d.getDate() + dir);
            else if (reconciliationPeriod === 'weekly') d.setDate(d.getDate() + (dir * 7));
            else if (reconciliationPeriod === 'monthly') d.setMonth(d.getMonth() + dir);
            else if (reconciliationPeriod === 'yearly') d.setFullYear(d.getFullYear() + dir);
            return d;
        });
    };
    
    useEffect(() => {
        if (activeTab === "reconciliation" && reconciliationPeriod !== "custom") fetchReconciliation(reconciliationPeriod);
    }, [reconciliationDate]);

    const shiftHistoryDate = (dir: number) => {
        setHistoryDate(prev => {
            const d = new Date(prev);
            if (historyFilterType === 'daily') d.setDate(d.getDate() + dir);
            else if (historyFilterType === 'weekly') d.setDate(d.getDate() + (dir * 7));
            else if (historyFilterType === 'monthly') d.setMonth(d.getMonth() + dir);
            else if (historyFilterType === 'yearly') d.setFullYear(d.getFullYear() + dir);
            return d;
        });
    };
    
    useEffect(() => {
        if (activeTab === "history" && historyFilterType !== "custom") fetchTransactions(historyFilterType);
    }, [historyDate, historyFilterType]);
"""

content = content.replace("    const fetchReconciliation = async", after_fetch_recon + "\n    const fetchReconciliation = async")

# GET FILTERED TRANSACTIONS REPLACEMENT
filter_old = """    const getFilteredTransactions = () => {
        let filtered = transactions.filter(trx => {
            const trxDate = new Date(trx.created_at);
            const now = new Date();"""
filter_new = """    const getFilteredTransactions = () => {
        let filtered = transactions.filter(trx => {
            const trxDate = new Date(trx.created_at);
            const now = historyDate;"""
content = content.replace(filter_old, filter_new)

# ADD BUTTONS TO RECONCILIATION UI
rec_ui_old = """                                    {/* Global Tab Filter */}
                                    <div className="flex flex-col md:flex-row md:items-center justify-between bg-[#131B2C] p-4 rounded-2xl border border-gray-800/60 shadow-sm gap-4">
                                        <div>
                                            <h3 className="font-bold text-white">Laporan Keuangan</h3>
                                            <p className="text-xs text-gray-500">Pilih periode untuk semua metrik di bawah</p>
                                        </div>
                                        <div className="flex flex-col sm:flex-row items-center gap-3">"""
rec_ui_new = """                                    {/* Global Tab Filter */}
                                    <div className="flex flex-col md:flex-row md:items-center justify-between bg-[#131B2C] p-4 rounded-2xl border border-gray-800/60 shadow-sm gap-4">
                                        <div className="flex items-center gap-4">
                                            <div>
                                                <h3 className="font-bold text-white">Laporan Keuangan</h3>
                                                <p className="text-xs text-gray-500">Pilih periode untuk semua metrik di bawah</p>
                                            </div>
                                            {reconciliationPeriod !== 'custom' && (
                                                <div className="flex bg-gray-900 rounded-lg overflow-hidden border border-gray-800">
                                                    <button onClick={() => shiftReconciliationDate(-1)} className="px-3 py-1 hover:bg-gray-800 text-gray-400 hover:text-white transition-colors">&lt;</button>
                                                    <div className="px-3 py-1 text-sm font-bold text-white border-l border-r border-gray-800 bg-gray-800/30">
                                                        {reconciliationPeriod === 'daily' ? reconciliationDate.toLocaleDateString('id-ID', {day:'numeric', month:'short', year:'numeric'}) :
                                                         reconciliationPeriod === 'weekly' ? 'Minggu ' + Math.ceil(reconciliationDate.getDate()/7) :
                                                         reconciliationPeriod === 'monthly' ? reconciliationDate.toLocaleDateString('id-ID', {month:'long', year:'numeric'}) :
                                                         reconciliationDate.getFullYear()}
                                                    </div>
                                                    <button onClick={() => shiftReconciliationDate(1)} className="px-3 py-1 hover:bg-gray-800 text-gray-400 hover:text-white transition-colors">&gt;</button>
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex flex-col sm:flex-row items-center gap-3">"""
content = content.replace(rec_ui_old, rec_ui_new)

# ADD BUTTONS TO HISTORY UI
history_ui_old = """                                    <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-[#131B2C] p-4 rounded-2xl border border-gray-800/60 shadow-sm mb-6">
                                        <div className="flex flex-wrap gap-2 w-full md:w-auto">
                                            {[{k:'daily',l:'Harian'},{k:'weekly',l:'Mingguan'},{k:'monthly',l:'Bulanan'},{k:'yearly',l:'Tahunan'},{k:'custom',l:'Kustom'}].map(f => (
                                                <button key={f.k} onClick={() => setHistoryFilterType(f.k as any)}"""
history_ui_new = """                                    <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-[#131B2C] p-4 rounded-2xl border border-gray-800/60 shadow-sm mb-6">
                                        <div className="flex flex-col gap-3 w-full md:w-auto">
                                            <div className="flex flex-wrap gap-2">
                                                {[{k:'daily',l:'Harian'},{k:'weekly',l:'Mingguan'},{k:'monthly',l:'Bulanan'},{k:'yearly',l:'Tahunan'},{k:'custom',l:'Kustom'}].map(f => (
                                                    <button key={f.k} onClick={() => setHistoryFilterType(f.k as any)}"""
history_ui_old_2 = """                                                </button>
                                            ))}
                                        </div>
                                        <div className="flex items-center gap-3 w-full md:w-auto">"""
history_ui_new_2 = """                                                </button>
                                                ))}
                                            </div>
                                            {historyFilterType !== 'custom' && (
                                                <div className="flex bg-gray-900 rounded-lg overflow-hidden border border-gray-800 w-fit">
                                                    <button onClick={() => shiftHistoryDate(-1)} className="px-3 py-1.5 hover:bg-gray-800 text-gray-400 hover:text-white transition-colors">&lt; Prev</button>
                                                    <div className="px-4 py-1.5 text-sm font-bold text-white border-l border-r border-gray-800 bg-gray-800/30">
                                                        {historyFilterType === 'daily' ? historyDate.toLocaleDateString('id-ID', {day:'numeric', month:'short', year:'numeric'}) :
                                                         historyFilterType === 'weekly' ? 'Minggu ' + Math.ceil(historyDate.getDate()/7) :
                                                         historyFilterType === 'monthly' ? historyDate.toLocaleDateString('id-ID', {month:'long', year:'numeric'}) :
                                                         historyDate.getFullYear()}
                                                    </div>
                                                    <button onClick={() => shiftHistoryDate(1)} className="px-3 py-1.5 hover:bg-gray-800 text-gray-400 hover:text-white transition-colors">Next &gt;</button>
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-3 w-full md:w-auto">"""
content = content.replace(history_ui_old, history_ui_new)
content = content.replace(history_ui_old_2, history_ui_new_2)

with open("d:/WORK/BUILD_APP/NexPos/frontend/src/app/admin/page.tsx", "w", encoding="utf-8") as f:
    f.write(content)
