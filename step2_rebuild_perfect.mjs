import fs from 'fs';

let content = fs.readFileSync('frontend/src/app/admin/page.tsx', 'utf-8');

const expensesStartIdx = content.indexOf('{activeTab === "expenses" && (\\n                                <div className="space-y-8">');
// Since regex had issues, let's just find by exact strings.

const b1 = content.indexOf('{activeTab === "expenses" && (');
const b2 = content.indexOf('{/* STAFF TAB */}', b1);

const oldBlock = content.substring(b1, b2);

// Inside oldBlock, find the pieces:
const bahanInputStart = oldBlock.indexOf('{/* Bahan Baku */}');
const pengeluaranInputStart = oldBlock.indexOf('{/* Pengeluaran */}');
const tablesRowStart = oldBlock.indexOf('{/* TABLES ROW */}');
const editMaterialModalStart = oldBlock.indexOf('{/* Edit Material Modal */}');
const editExpenseModalStart = oldBlock.indexOf('{/* Edit Expense Modal */}');
const endOfOldBlock = oldBlock.length;

const bahanInput = oldBlock.substring(bahanInputStart, pengeluaranInputStart);
const pengInput = oldBlock.substring(pengeluaranInputStart, tablesRowStart);

// Within TABLES ROW, it is split into two halves: Daftar Bahan Baku and Riwayat Pengeluaran.
const tablesRowContent = oldBlock.substring(tablesRowStart, editMaterialModalStart);
// tablesRowContent contains:
// {/* TABLES ROW */}
// <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
//    <div className="bg-[#131B2C]..."> Daftar Bahan Baku ... </div>
//    <div className="bg-[#131B2C]..."> Riwayat Pengeluaran ... </div>
// </div>

const daftarBahanStart = tablesRowContent.indexOf('<div className="bg-[#131B2C]');
const riwayatPengStart = tablesRowContent.indexOf('<div className="bg-[#131B2C]', daftarBahanStart + 10);
const endOfTables = tablesRowContent.lastIndexOf('</div>');

const bahanList = tablesRowContent.substring(daftarBahanStart, riwayatPengStart);
const pengList = tablesRowContent.substring(riwayatPengStart, endOfTables); // excludes the closing </div> of the grid

const editBahanModal = oldBlock.substring(editMaterialModalStart, editExpenseModalStart);
const editPengModalAndClose = oldBlock.substring(editExpenseModalStart);
// editPengModalAndClose contains the modal and the closing </div> )} of the expenses block.

const rawMaterialsTab = `
                            {/* RAW MATERIALS TAB */}
                            {activeTab === "raw_materials" && (
                                <div className="space-y-8">
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                        ${bahanInput.trim()}
                                    </div>
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                        ${bahanList.trim()}
                                    </div>
                                    ${editBahanModal.trim()}
                                </div>
                            )}
`;

// editPengModalAndClose has the closing tags for the block at the end
const expensesTab = `
                            {/* EXPENSES TAB */}
                            {activeTab === "expenses" && (
                                <div className="space-y-8">
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                        ${pengInput.substring(0, pengInput.lastIndexOf('</div>')).trim()}
                                    </div>
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                        ${pengList.trim()}
                                    </div>
                                    ${editPengModalAndClose.trim()}
`;

const finalBlocks = rawMaterialsTab + '\\n' + expensesTab + '\\n                            ';

content = content.replace(oldBlock, finalBlocks);
fs.writeFileSync('frontend/src/app/admin/page.tsx', content, 'utf-8');
console.log("Successfully rebuilt expenses and raw_materials tabs perfectly.");
