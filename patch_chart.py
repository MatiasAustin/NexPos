import re

with open(r"d:\WORK\BUILD_APP\NexPos\frontend\src\components\ReportChart.tsx", "r", encoding="utf-8") as f:
    content = f.read()

# 1. Add state
content = content.replace("const [periodLabel, setPeriodLabel] = useState('');", "const [periodLabel, setPeriodLabel] = useState('');\n    const [expenseCategoryFilter, setExpenseCategoryFilter] = useState<'all'|'operasional'|'bahan_baku'>('all');")

# 2. Add to useEffect
content = content.replace("}, [period, customStartDate, customEndDate, referenceDate]);", "}, [period, customStartDate, customEndDate, referenceDate, expenseCategoryFilter]);")

# 3. Add to query
content = content.replace(".select('amount, expense_date, created_at')", ".select('amount, expense_date, created_at, category')")

# 4. Filter in loop
old_loop = """        for (const exp of expenses || []) {
            const dateStr = exp.expense_date || exp.created_at;
            const lbl = getPeriodLabel(dateStr, period);
            if (!map[lbl]) map[lbl] = { omset: 0, pengeluaranOp: 0, hpp: 0 };
            map[lbl].pengeluaranOp += parseFloat(exp.amount) || 0;
        }"""
new_loop = """        for (const exp of expenses || []) {
            if (expenseCategoryFilter !== 'all') {
                const expCat = exp.category || 'operasional';
                if (expCat !== expenseCategoryFilter) continue;
            }
            const dateStr = exp.expense_date || exp.created_at;
            const lbl = getPeriodLabel(dateStr, period);
            if (!map[lbl]) map[lbl] = { omset: 0, pengeluaranOp: 0, hpp: 0 };
            map[lbl].pengeluaranOp += parseFloat(exp.amount) || 0;
        }"""
content = content.replace(old_loop, new_loop)

# 5. Add dropdown in UI. Let's find a good place.
# We'll put it next to "Tren Pendapatan & Pengeluaran" title.
old_title = """                    <h3 className="text-xl font-bold text-white mb-2 md:mb-0">Tren Pendapatan & Pengeluaran</h3>"""
new_title = """                    <h3 className="text-xl font-bold text-white mb-2 md:mb-0">Tren Pendapatan & Pengeluaran</h3>
                    <select 
                        value={expenseCategoryFilter}
                        onChange={(e) => setExpenseCategoryFilter(e.target.value as any)}
                        className="bg-gray-800 border border-gray-700 text-white rounded px-3 py-1 text-sm outline-none hover:bg-gray-700 ml-auto md:ml-4"
                    >
                        <option value="all">Semua Pengeluaran</option>
                        <option value="operasional">Hanya Operasional</option>
                        <option value="bahan_baku">Hanya Bahan Baku</option>
                    </select>"""
content = content.replace(old_title, new_title)

# Also update the legend text.
content = content.replace("""name="Pengeluaran (Operasional)""", """name={expenseCategoryFilter === 'bahan_baku' ? 'Pengeluaran (Bahan Baku)' : expenseCategoryFilter === 'operasional' ? 'Pengeluaran (Operasional)' : 'Semua Pengeluaran'}""")


with open(r"d:\WORK\BUILD_APP\NexPos\frontend\src\components\ReportChart.tsx", "w", encoding="utf-8") as f:
    f.write(content)
