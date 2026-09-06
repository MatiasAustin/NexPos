const fs = require('fs');
const stable = fs.readFileSync('.tmp_stable.tsx','utf-8');
const current = fs.readFileSync('frontend/src/app/admin/page.tsx','utf-8');

const features = [
  ['activeTab === "reconciliation"', 'Tab Laporan Rekonsiliasi'],
  ['activeTab === "history"', 'Tab Riwayat Transaksi'],
  ['activeTab === "cash_sessions"', 'Tab Riwayat Shift/Sesi Kasir'],
  ['activeTab === "inventory"', 'Tab Produk & Stok'],
  ['activeTab === "raw_materials"', 'Tab Bahan Baku (dedicated)'],
  ['activeTab === "expenses"', 'Tab Pengeluaran'],
  ['activeTab === "staff"', 'Tab Manajemen Staf'],
  ['activeTab === "settings"', 'Tab Pengaturan Toko'],
  ['activeTab === "audit"', 'Tab Security/Audit Log'],
  ['historyPage', 'Pagination di Riwayat Transaksi'],
  ['historyTotalPages', 'Total halaman pagination riwayat'],
  ['fetchReconciliation', 'Fungsi fetchReconciliation'],
  ['reconciliationPeriod', 'Filter periode Rekonsiliasi'],
  ['fetchAuditLogs', 'Fungsi Audit Logs'],
  ['auditLogs', 'State audit logs'],
  ['cashSessions', 'State cashSessions (sesi kasir)'],
  ['adjustingProductStock', 'Adjust stok produk (+/- Stok tombol)'],
  ['productStockDelta', 'Delta stok produk'],
  ['refundTarget', 'Fitur refund / batal transaksi'],
  ['materialStockLogs', 'Log perubahan stok bahan baku'],
  ['printTransaction', 'Fitur cetak struk (print)'],
  ['storeSettings', 'State pengaturan toko'],
  ['tax_enabled', 'Fitur Pajak'],
  ['receipt_footer', 'Footer struk'],
  ['wifi_name', 'Info WiFi di struk/pengaturan'],
  ['handleCreateMaterial', 'Tambah bahan baku baru'],
  ['handleDeleteMaterial', 'Hapus bahan baku'],
  ['handleUpdateMaterial', 'Update stok bahan baku'],
  ['handleCreateExpense', 'Catat pengeluaran baru'],
  ['handleDeleteExpense', 'Hapus pengeluaran'],
  ['handleUpdateExpense', 'Edit pengeluaran'],
  ['handleCreateProduct', 'Tambah produk baru'],
  ['handleDeleteProduct', 'Hapus produk'],
  ['discount_percentage', 'Fitur Diskon produk'],
  ['viewingProductHistory', 'Lihat riwayat penjualan per produk'],
  ['logAudit', 'Fungsi log audit trail'],
  ['expensePeriod', 'Filter periode pengeluaran'],
  ['getFilteredExpenses', 'Fungsi filter pengeluaran'],
  ['Bagan Konversi', 'Bagan nilai stok bahan baku (chart)'],
  ['useConfirm', 'Konfirmasi hapus (dialog)'],
  ['Laporan Rekonsiliasi', 'Menu/Link Laporan Rekonsiliasi di sidebar'],
  ['Bahan Baku', 'Tab Bahan Baku di sidebar'],
  ['Pengeluaran', 'Tab Pengeluaran di sidebar'],
];

console.log('=== AUDIT FITUR: STABLE (68eedcd) vs CURRENT (790952e) ===\n');
let missing = 0;
let newFeatures = 0;
features.forEach(function([key, label]) {
  const inStable = stable.includes(key);
  const inCurrent = current.includes(key);
  let status;
  if (!inStable && !inCurrent) {
    status = '⚪ TIDAK ADA di keduanya';
  } else if (inStable && inCurrent) {
    status = '✅ ADA';
  } else if (inStable && !inCurrent) {
    status = '❌ HILANG dari current!';
    missing++;
  } else {
    status = '🆕 BARU di current';
    newFeatures++;
  }
  console.log(status + ' - ' + label);
});
console.log('\n=== RINGKASAN ===');
console.log('Total fitur hilang: ' + missing);
console.log('Total fitur baru: ' + newFeatures);
