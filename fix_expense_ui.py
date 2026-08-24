import re

with open("d:/WORK/BUILD_APP/NexPos/frontend/src/app/pos/page.tsx", "r", encoding="utf-8") as f:
    content = f.read()

# Insert Payment Method Radio Buttons in pos/page.tsx
target_pos = """<form onSubmit={editingExpense ? handleUpdateExpense : handleCreateExpense} className="space-y-4">"""
replacement_pos = """<form onSubmit={editingExpense ? handleUpdateExpense : handleCreateExpense} className="space-y-4">
                                        <div className="flex gap-4 mb-4">
                                            <label className="flex items-center gap-2 text-white cursor-pointer">
                                                <input type="radio" name="payment_method_pos" value="CASH" checked={newExpense.payment_method === 'CASH'} onChange={e => setNewExpense({...newExpense, payment_method: e.target.value})} className="w-4 h-4 text-blue-500" />
                                                <span>Uang Kasir (Cash)</span>
                                            </label>
                                            <label className="flex items-center gap-2 text-white cursor-pointer">
                                                <input type="radio" name="payment_method_pos" value="QRIS" checked={newExpense.payment_method === 'QRIS'} onChange={e => setNewExpense({...newExpense, payment_method: e.target.value})} className="w-4 h-4 text-blue-500" />
                                                <span>Saldo Rekening (QRIS/Trf)</span>
                                            </label>
                                        </div>"""
content = content.replace(target_pos, replacement_pos)

with open("d:/WORK/BUILD_APP/NexPos/frontend/src/app/pos/page.tsx", "w", encoding="utf-8") as f:
    f.write(content)

with open("d:/WORK/BUILD_APP/NexPos/frontend/src/app/admin/page.tsx", "r", encoding="utf-8") as f:
    content = f.read()

# Insert Payment Method Radio Buttons in admin/page.tsx
target_admin = """<form onSubmit={handleCreateExpense} className="space-y-4">"""
replacement_admin = """<form onSubmit={handleCreateExpense} className="space-y-4">
                                                <div className="flex gap-4 mb-2">
                                                    <label className="flex items-center gap-2 text-white cursor-pointer text-sm">
                                                        <input type="radio" name="admin_payment_method" value="CASH" checked={newExpense.payment_method === 'CASH'} onChange={e => setNewExpense({...newExpense, payment_method: e.target.value})} className="w-4 h-4" />
                                                        <span>Uang Kasir (Cash)</span>
                                                    </label>
                                                    <label className="flex items-center gap-2 text-white cursor-pointer text-sm">
                                                        <input type="radio" name="admin_payment_method" value="QRIS" checked={newExpense.payment_method === 'QRIS'} onChange={e => setNewExpense({...newExpense, payment_method: e.target.value})} className="w-4 h-4" />
                                                        <span>Saldo Rek (QRIS)</span>
                                                    </label>
                                                </div>"""
content = content.replace(target_admin, replacement_admin)

with open("d:/WORK/BUILD_APP/NexPos/frontend/src/app/admin/page.tsx", "w", encoding="utf-8") as f:
    f.write(content)

