const fs = require('fs');
const c = fs.readFileSync('frontend/src/app/admin/page.tsx', 'utf-8');
const s = fs.readFileSync('.tmp_stable.tsx', 'utf-8');

// Check key functions and features
const checks = [
    // All tabs
    { key: 'activeTab === "reconciliation"', label: 'Tab Rekonsiliasi' },
    { key: 'activeTab === "history"', label: 'Tab Riwayat Transaksi' },
    { key: 'activeTab === "cash_sessions"', label: 'Tab Sesi Kasir' },
    { key: 'activeTab === "inventory"', label: 'Tab Produk & Stok' },
    { key: 'activeTab === "raw_materials"', label: 'Tab Bahan Baku' },
    { key: 'activeTab === "expenses"', label: 'Tab Pengeluaran' },
    { key: 'activeTab === "staff"', label: 'Tab Manajemen Staf' },
    { key: 'activeTab === "settings"', label: 'Tab Pengaturan Toko' },
    { key: 'activeTab === "audit"', label: 'Tab Audit/Security Log' },
    // Pagination in riwayat
    { key: 'fetchTransactions', label: 'Fungsi fetchTransactions' },
    // Key handlers
    { key: 'handleCreateProduct', label: 'Handler Tambah Produk' },
    { key: 'handleDeleteProduct', label: 'Handler Hapus Produk' },
    { key: 'handleCreateMaterial', label: 'Handler Tambah Bahan Baku' },
    { key: 'handleDeleteMaterial', label: 'Handler Hapus Bahan Baku' },
    { key: 'handleCreateExpense', label: 'Handler Catat Pengeluaran' },
    { key: 'handleDeleteExpense', label: 'Handler Hapus Pengeluaran' },
    { key: 'handleUpdateExpense', label: 'Handler Edit Pengeluaran' },
    { key: 'handleUpdateMaterialStock', label: 'Handler Update Stok Bahan Baku' },
    // Reconciliation
    { key: 'fetchReconciliation', label: 'Fungsi fetchReconciliation' },
    { key: 'reconciliationData', label: 'Data reconciliation' },
    // Audit
    { key: 'fetchAuditLogs', label: 'Fungsi fetchAuditLogs' },
    // Cash sessions
    { key: 'cashSessions', label: 'State cashSessions' },
    // Modals / UI
    { key: 'adjustingProductStock', label: 'Modal Adjust Stok Produk' },
    { key: 'viewingProductHistory', label: 'Modal Riwayat Per Produk' },
    { key: 'refundTarget', label: 'Fitur Refund Transaksi' },
    { key: 'printTransaction', label: 'Fitur Print Struk' },
    { key: 'editingExpense', label: 'Modal Edit Pengeluaran' },
    { key: 'editingProduct', label: 'Modal Edit Produk' },
    { key: 'editingStaff', label: 'Modal Edit Staf' },
    // Settings features
    { key: 'tax_enabled', label: 'Pengaturan Pajak' },
    { key: 'receipt_footer', label: 'Footer Struk' },
    { key: 'wifi_name', label: 'WiFi di pengaturan' },
    { key: 'categories', label: 'Kategori produk' },
    // New features
    { key: 'discount_percentage', label: 'Diskon Produk [BARU]' },
    { key: 'Bagan Konversi', label: 'Bagan Nilai Stok Bahan Baku [BARU]' },
    { key: 'materialStockLogs', label: 'Log Stok Bahan Baku' },
    // Sidebar items
    { key: 'Laporan Rekonsiliasi', label: 'Sidebar: Laporan Rekonsiliasi' },
    { key: 'Riwayat Transaksi', label: 'Sidebar: Riwayat Transaksi' },
    { key: 'Bahan Baku', label: 'Sidebar: Bahan Baku' },
    { key: 'Pengeluaran', label: 'Sidebar: Pengeluaran' },
    { key: 'Manajemen Staf', label: 'Sidebar: Manajemen Staf' },
    { key: 'Pengaturan Toko', label: 'Sidebar: Pengaturan Toko' },
    { key: 'Security Log', label: 'Sidebar: Security Log' },
];

console.log('=== AUDIT LENGKAP FITUR ADMIN ===\n');
let issues = [];
checks.forEach(function(check) {
    const inStable = s.includes(check.key);
    const inCurrent = c.includes(check.key);
    let status;
    if (!inStable && !inCurrent) {
        status = '⚪ [tidak ada di keduanya]';
    } else if (inStable && inCurrent) {
        status = '✅ ADA';
    } else if (inStable && !inCurrent) {
        status = '❌ HILANG!';
        issues.push(check.label);
    } else {
        status = '🆕 BARU';
    }
    console.log(status + ' - ' + check.label);
});

console.log('\n=== HASIL ===');
if (issues.length === 0) {
    console.log('✅ Tidak ada fitur yang hilang dari versi stabil!');
} else {
    console.log('❌ ' + issues.length + ' fitur hilang:');
    issues.forEach(function(i) { console.log('  - ' + i); });
}
