const fs = require('fs');
const c = fs.readFileSync('frontend/src/app/admin/page.tsx', 'utf-8');

// Find reconciliation tab section
const reconcIdx = c.indexOf('activeTab === "reconciliation" && (');
const reconcSection = c.substring(reconcIdx, reconcIdx + 10000);

console.log('=== REKONSILIASI TAB CHECK ===');
const reconItems = [
    ['ReportChart', 'Grafik (Chart)'],
    ['navigateDate', 'Navigasi tanggal (prev/next)'],
    ['Pendapatan', 'Data Pendapatan'],
    ['Pengeluaran', 'Data Pengeluaran (di rekonsiliasi)'],
    ['profit', 'Data Keuntungan/Profit'],
    ['HPP', 'Data HPP'],
    ['reconciliationData', 'Data rekonsiliasi'],
    ['omzet', 'Omzet'],
    ['transactions', 'Daftar Transaksi'],
    ['Transaksi Terbaru', 'List transaksi terbaru'],
    ['custom_start', 'Custom date range'],
];
reconItems.forEach(function(item) {
    console.log((reconcSection.includes(item[0]) ? '✅' : '❌') + ' ' + item[1]);
});

// Check history/riwayat tab
const histIdx = c.indexOf('activeTab === "history" && (');
const histSection = c.substring(histIdx, histIdx + 10000);
console.log('\n=== RIWAYAT TRANSAKSI TAB CHECK ===');
const histItems = [
    ['transactions', 'Data Transaksi'],
    ['historyFilterType', 'Filter tipe (Semua/Harian/dll)'],
    ['Semua', 'Pilihan Filter Semua'],
    ['refund', 'Tombol/fitur refund'],
    ['Detail', 'Tombol Detail/expand'],
    ['Print', 'Tombol Print'],
];
histItems.forEach(function(item) {
    console.log((histSection.includes(item[0]) ? '✅' : '❌') + ' ' + item[1]);
});

// Cash sessions tab
const cashIdx = c.indexOf('activeTab === "cash_sessions" && (');
const cashSection = c.substring(cashIdx, cashIdx + 5000);
console.log('\n=== SESI KASIR TAB CHECK ===');
const cashItems = [
    ['cashSessions', 'Data sesi kasir'],
    ['opened_at', 'Waktu buka sesi'],
    ['closed_at', 'Waktu tutup sesi'],
    ['cash_in', 'Uang masuk'],
    ['cash_out', 'Uang keluar'],
    ['total_revenue', 'Total penjualan per sesi'],
];
cashItems.forEach(function(item) {
    console.log((cashSection.includes(item[0]) ? '✅' : '❌') + ' ' + item[1]);
});
