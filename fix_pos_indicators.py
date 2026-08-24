import re

with open("d:/WORK/BUILD_APP/NexPos/frontend/src/app/pos/page.tsx", "r", encoding="utf-8") as f:
    content = f.read()

# 1. Update fetchSessionData to include total_expense
target_fetch = """    const fetchSessionData = async (id: string) => {
        if (!id) return;
        const { data } = await supabase.from('cash_sessions').select('*').eq('id', id).single();
        if (data) setSessionData(data);
    };"""

replacement_fetch = """    const fetchSessionData = async (id: string) => {
        if (!id) return;
        const { data } = await supabase.from('cash_sessions').select('*').eq('id', id).single();
        if (data) {
            const { data: movements } = await supabase.from('cash_movements').select('amount').eq('session_id', id).eq('type', 'expense');
            const total_expense = movements ? movements.reduce((sum, m) => sum + Math.abs(m.amount), 0) : 0;
            setSessionData({ ...data, total_expense });
        }
    };"""
content = content.replace(target_fetch, replacement_fetch)

# 2. Update the header UI
target_ui = """                        {sessionData && (
                            <div className="flex flex-col ml-2 pl-3 border-l border-gray-800 shrink-0">
                                <span className="text-gray-400 text-[10px] leading-tight">Laci (Sistem)</span>
                                <span className="text-green-400 text-xs font-bold">Rp {Number(sessionData.expected_cash || 0).toLocaleString('id-ID')}</span>
                            </div>
                        )}"""

replacement_ui = """                        {sessionData && (
                            <div className="flex gap-4 ml-2 pl-3 border-l border-gray-800 shrink-0 items-center">
                                <div className="flex flex-col">
                                    <span className="text-gray-400 text-[10px] leading-tight">Modal</span>
                                    <span className="text-blue-400 text-xs font-bold">Rp {Number(sessionData.opening_cash || 0).toLocaleString('id-ID')}</span>
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-gray-400 text-[10px] leading-tight">Pengeluaran</span>
                                    <span className="text-red-400 text-xs font-bold">Rp {Number(sessionData.total_expense || 0).toLocaleString('id-ID')}</span>
                                </div>
                                <div className="flex flex-col border-l border-gray-800 pl-4">
                                    <span className="text-gray-400 text-[10px] leading-tight">Laci (Sistem)</span>
                                    <span className="text-green-400 text-xs font-bold">Rp {Number(sessionData.expected_cash || 0).toLocaleString('id-ID')}</span>
                                </div>
                            </div>
                        )}"""

content = content.replace(target_ui, replacement_ui)

with open("d:/WORK/BUILD_APP/NexPos/frontend/src/app/pos/page.tsx", "w", encoding="utf-8") as f:
    f.write(content)

