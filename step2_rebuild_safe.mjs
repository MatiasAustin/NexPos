import fs from 'fs';

const lines = fs.readFileSync('frontend/src/app/admin/page.tsx', 'utf-8').split('\n');

const expensesStartIdx = lines.findIndex(l => l.includes('{activeTab === "expenses" && ('));
const staffTabIdx = lines.findIndex(l => l.includes('{/* STAFF TAB */}'));

if (expensesStartIdx === -1 || staffTabIdx === -1) {
    console.error("Could not find boundaries");
    process.exit(1);
}

const oldBlock = lines.slice(expensesStartIdx, staffTabIdx).join('\n');

const extract = (regex) => {
    const match = oldBlock.match(regex);
    return match ? match[1] : '';
}

const bahanInput = extract(/\{\/\* Bahan Baku \*\/\}\s*(<div className="p-6 md:p-8 bg-\[\#131B2C\][\s\S]*?<\/div>)\s*\{\/\* Pengeluaran \*\/\}/);
const pengInput = extract(/\{\/\* Pengeluaran \*\/\}\s*(<div className="p-6 md:p-8 bg-\[\#131B2C\][\s\S]*?<\/div>)\s*<\/div>\s*\{\/\* TABLES ROW \*\/\}/);
const bahanList = extract(/<h3 className="p-4 bg-gray-800\/30 font-bold text-gray-300 border-b border-gray-800">Daftar Bahan Baku<\/h3>[\s\S]*?<\/table>\s*\)\}\s*<\/div>/);
const pengList = extract(/<h3 className="p-4 bg-gray-800\/30 font-bold text-gray-300 border-b border-gray-800">Riwayat Pengeluaran<\/h3>[\s\S]*?<\/table>\s*\)\}\s*<\/div>/);
const editBahanModal = extract(/(\{\/\* Edit Material Modal \*\/\}[\s\S]*?<\/div>\s*\)\})\s*\{\/\* Edit Expense Modal \*\/\}/);
const editPengModal = extract(/(\{\/\* Edit Expense Modal \*\/\}[\s\S]*?<\/div>\s*\)\})\s*$/); // Note: it's at the end of oldBlock before STAFF TAB

const rawMaterialsTab = `
                            {/* RAW MATERIALS TAB */}
                            {activeTab === "raw_materials" && (
                                <div className="space-y-8">
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                        {/* Bahan Baku */}
                                        ${bahanInput}
                                        <div className="bg-[#131B2C] border border-gray-800 rounded-2xl overflow-hidden shadow-xl">
                                            <h3 className="p-4 bg-gray-800/30 font-bold text-gray-300 border-b border-gray-800">Daftar Bahan Baku</h3>
                                            ${bahanList}
                                        </div>
                                    </div>
                                    ${editBahanModal}
                                </div>
                            )}
`;

const expensesTab = `
                            {/* EXPENSES TAB */}
                            {activeTab === "expenses" && (
                                <div className="space-y-8">
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                        {/* Pengeluaran */}
                                        ${pengInput}
                                        <div className="bg-[#131B2C] border border-gray-800 rounded-2xl overflow-hidden shadow-xl">
                                            <h3 className="p-4 bg-gray-800/30 font-bold text-gray-300 border-b border-gray-800">Riwayat Pengeluaran</h3>
                                            ${pengList}
                                        </div>
                                    </div>
                                    ${editPengModal}
                                </div>
                            )}
`;

const finalBlocks = rawMaterialsTab + '\n' + expensesTab;

lines.splice(expensesStartIdx, staffTabIdx - expensesStartIdx, finalBlocks);

fs.writeFileSync('frontend/src/app/admin/page.tsx', lines.join('\n'), 'utf-8');
console.log("Successfully rebuilt expenses and raw_materials tabs.");
