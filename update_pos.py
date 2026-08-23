import re

with open("d:/WORK/BUILD_APP/NexPos/frontend/src/app/pos/page.tsx", "r", encoding="utf-8") as f:
    content = f.read()

# 1. Add states
state_code = """    const [showCloseShiftModal, setShowCloseShiftModal] = useState(false);
    const [actualCashInput, setActualCashInput] = useState("");
"""
content = re.sub(r'(const \[staff, setStaff\] = useState<any>\(null\);)', r'\1\n' + state_code, content)

# 2. Modify handleCloseSession
old_handle_close = """    const handleCloseSession = async () => {
        const isConfirmed = await confirm({
            title: "Tutup Shift",
            message: "Yakin ingin menutup shift sekarang? Uang laci harus dihitung.",
            variant: "warning",
            confirmText: "Tutup Shift"
        });
        if (!isConfirmed) return;

        const actualCash = window.prompt("Masukkan jumlah uang tunai fisik yang ada di laci saat ini:");
        if (actualCash === null) return; // Cancel

        setLoading(true);
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/cash-sessions/close`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    sessionId: sessionId,
                    actualCash: Number(actualCash),
                    discrepancyReason: "Ditutup manual oleh kasir" // Default reason for demo
                })
            });
            if (res.ok) {
                toast.success("Shift berhasil ditutup.");
                setHasSession(false);
                setSessionId(null);
                setOpeningCash("");
            } else {
                const err = await res.json();
                toast.error(`Gagal menutup shift: ${err.error}`);
            }
        } catch (error) {
            console.error(error);
        }
        setLoading(false);
    };"""

new_handle_close = """    const handleCloseSession = () => {
        setActualCashInput("");
        setShowCloseShiftModal(true);
    };

    const submitCloseSession = async () => {
        if (!actualCashInput) return;
        setLoading(true);
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/cash-sessions/close`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    sessionId: sessionId,
                    actualCash: Number(actualCashInput),
                    discrepancyReason: "Ditutup manual oleh kasir" // Default reason for demo
                })
            });
            if (res.ok) {
                toast.success("Shift berhasil ditutup.");
                setHasSession(false);
                setSessionId(null);
                setOpeningCash("");
                setShowCloseShiftModal(false);
            } else {
                const err = await res.json();
                toast.error(`Gagal menutup shift: ${err.error}`);
            }
        } catch (error) {
            console.error(error);
        }
        setLoading(false);
    };"""
content = content.replace(old_handle_close, new_handle_close)

# 3. Add Modal JSX
modal_jsx = """            {showCloseShiftModal && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 backdrop-blur-md">
                    <div className="bg-[#131B2C] border border-gray-800 p-6 md:p-8 rounded-3xl w-full max-w-md shadow-2xl">
                        <h3 className="font-bold text-xl text-white mb-2">Tutup Shift</h3>
                        <p className="text-gray-400 text-sm mb-6">Hitung seluruh uang fisik (kertas & koin) yang ada di dalam laci kasir saat ini, lalu masukkan totalnya di bawah ini.</p>
                        <input 
                            type="number" 
                            placeholder="Total Uang Fisik Laci (Rp)" 
                            value={actualCashInput}
                            onChange={(e) => setActualCashInput(e.target.value)}
                            className="w-full p-4 text-lg bg-gray-900 border border-gray-800 rounded-xl focus:border-blue-500 outline-none text-white font-bold mb-6"
                            autoFocus
                        />
                        <div className="flex gap-3">
                            <button 
                                onClick={() => setShowCloseShiftModal(false)}
                                className="flex-1 py-3 md:py-4 bg-gray-800 text-gray-300 rounded-xl font-bold hover:bg-gray-700 transition-colors"
                            >
                                Batal
                            </button>
                            <button 
                                onClick={submitCloseSession}
                                disabled={!actualCashInput || loading}
                                className="flex-1 py-3 md:py-4 bg-red-600 text-white rounded-xl font-bold hover:bg-red-500 transition-colors disabled:opacity-50"
                            >
                                {loading ? 'Menutup...' : 'Tutup Shift'}
                            </button>
                        </div>
                    </div>
                </div>
            )}"""

content = content.replace("{showExpensesModal && (", modal_jsx + "\n\n            {showExpensesModal && (")

with open("d:/WORK/BUILD_APP/NexPos/frontend/src/app/pos/page.tsx", "w", encoding="utf-8") as f:
    f.write(content)

