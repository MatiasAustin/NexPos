import os

path = 'frontend/src/app/admin/page.tsx'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

helper = """
    const logAudit = async (action: string, entity_type: string, entity_id: string, details: any = {}) => {
        try {
            await supabase.from('audit_logs').insert([{
                action,
                entity_type,
                entity_id,
                staff_id: profile?.id || 'unknown',
                details: {
                    ...details,
                    staff_name: profile?.full_name || 'Admin System'
                }
            }]);
            if (activeTab === 'audit') fetchAuditLogs();
        } catch(e) {}
    };
"""

if 'const logAudit = async' not in content:
    content = content.replace('const fetchAuditLogs = async', helper + '\n    const fetchAuditLogs = async')

replacements = [
    ('toast.success("Produk berhasil diperbarui!");', 'toast.success("Produk berhasil diperbarui!"); await logAudit("EDIT_DATA", "products", editingProduct.id, { product_name: editingProduct.name, action: "Edit Produk" });'),
    ('toast.success("Menu berhasil dihapus.");', 'toast.success("Menu berhasil dihapus."); await logAudit("DELETE_DATA", "products", product.id, { product_name: product.name, action: "Hapus Produk" });'),
    ('toast.success("Pengeluaran berhasil diperbarui.");', 'toast.success("Pengeluaran berhasil diperbarui."); await logAudit("EDIT_DATA", "expenses", editingExpense.id, { description: editingExpense.description, action: "Edit Pengeluaran" });'),
    ('toast.success("Data pengeluaran berhasil dihapus.");', 'toast.success("Data pengeluaran berhasil dihapus."); await logAudit("DELETE_DATA", "expenses", id, { action: "Hapus Pengeluaran" });'),
    ('toast.success("Transaksi berhasil dibatalkan dan dihapus");', 'toast.success("Transaksi berhasil dibatalkan dan dihapus"); await logAudit("DELETE_DATA", "transactions", trx.id, { order_reference: trx.order_reference, action: "Hapus Transaksi" });'),
    ('toast.success("Data staf berhasil diupdate.");', 'toast.success("Data staf berhasil diupdate."); await logAudit("EDIT_DATA", "staff", editingStaff.id, { staff_name: editingStaff.full_name, action: "Edit Staf" });'),
    ('toast.success("Staf berhasil dihapus.");', 'toast.success("Staf berhasil dihapus."); await logAudit("DELETE_DATA", "staff", id, { action: "Hapus Staf" });'),
    ('toast.success("Bahan baku berhasil dihapus.");', 'toast.success("Bahan baku berhasil dihapus."); await logAudit("DELETE_DATA", "raw_materials", id, { action: "Hapus Bahan Baku" });'),
    ('toast.success("Sesi kasir berhasil dihapus.");', 'toast.success("Sesi kasir berhasil dihapus."); await logAudit("DELETE_DATA", "cash_sessions", id, { action: "Hapus Sesi Kasir" });')
]

for old, new_s in replacements:
    content = content.replace(old, new_s)

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
print('Patched page.tsx with logAudit')
