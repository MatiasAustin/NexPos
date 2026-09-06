import fs from 'fs';

let content = fs.readFileSync('frontend/src/app/admin/page.tsx', 'utf-8');

const expensesRegex = /\{\/\* EXPENSES & RAW MATERIALS TAB \*\/\}[\s\S]*?\{\/\* STAFF TAB \*\/\}/;

const match = content.match(expensesRegex);

if (!match) {
    console.error("Failed to find block");
    process.exit(1);
}

const originalBlock = match[0];

// We need to carefully split it by finding the sub-blocks.
// Rather than complex regex, let's just do simple splits.

let rawMaterialsBlock = `
                            {/* RAW MATERIALS TAB */}
                            {activeTab === "raw_materials" && (
                                <div className="space-y-8">
`;
let expensesBlock = `
                            {/* EXPENSES TAB */}
                            {activeTab === "expenses" && (
                                <div className="space-y-8">
`;

// Extract Bahan Baku Input
const bahanBakuInputRegex = /\{\/\* Bahan Baku \*\/\}[\s\S]*?\{\/\* Pengeluaran \*\/\}/;
const bbInputMatch = originalBlock.match(bahanBakuInputRegex);
if(bbInputMatch) rawMaterialsBlock += `<div className="grid grid-cols-1 gap-8">\n${bbInputMatch[0].replace('{/* Pengeluaran */}', '')}</div>\n`;

// Extract Pengeluaran Input
const pengeluaranInputRegex = /\{\/\* Pengeluaran \*\/\}[\s\S]*?<\/div>\s*\{\/\* TABLES ROW \*\/\}/;
const pengInputMatch = originalBlock.match(pengeluaranInputRegex);
if(pengInputMatch) expensesBlock += `<div className="grid grid-cols-1 gap-8">\n${pengInputMatch[0].replace('</div>\n                                    {/* TABLES ROW */}', '')}</div>\n`;

// Extract Daftar Bahan Baku List
const bbListRegex = /<div className="bg-\[#131B2C\] border border-gray-800 rounded-2xl overflow-hidden shadow-xl">\s*<h3 className="p-4 bg-gray-800\/30 font-bold text-gray-300 border-b border-gray-800">Daftar Bahan Baku<\/h3>[\s\S]*?<\/div>\s*<div className="bg-\[#131B2C\] border border-gray-800 rounded-2xl overflow-hidden shadow-xl">\s*<h3 className="p-4 bg-gray-800\/30 font-bold text-gray-300 border-b border-gray-800">Riwayat Pengeluaran<\/h3>/;
const bbListMatch = originalBlock.match(bbListRegex);
if(bbListMatch) rawMaterialsBlock += `<div className="grid grid-cols-1 gap-8">\n${bbListMatch[0].split('<div className="bg-[#131B2C] border border-gray-800 rounded-2xl overflow-hidden shadow-xl">\n                                            <h3 className="p-4 bg-gray-800/30 font-bold text-gray-300 border-b border-gray-800">Riwayat Pengeluaran</h3>')[0]}</div>\n`;

// Extract Pengeluaran List
const pengListRegex = /<div className="bg-\[#131B2C\] border border-gray-800 rounded-2xl overflow-hidden shadow-xl">\s*<h3 className="p-4 bg-gray-800\/30 font-bold text-gray-300 border-b border-gray-800">Riwayat Pengeluaran<\/h3>[\s\S]*?<\/div>\s*<\/div>\s*\{\/\* Edit Material Modal \*\/\}/;
const pengListMatch = originalBlock.match(pengListRegex);
if(pengListMatch) expensesBlock += `<div className="grid grid-cols-1 gap-8">\n${pengListMatch[0].replace('</div>\n                                    {/* Edit Material Modal */}', '')}</div>\n`;

// Extract Edit Material Modal
const editMatRegex = /\{\/\* Edit Material Modal \*\/\}[\s\S]*?\{\/\* Edit Expense Modal \*\/\}/;
const editMatMatch = originalBlock.match(editMatRegex);
if(editMatMatch) rawMaterialsBlock += editMatMatch[0].replace('{/* Edit Expense Modal */}', '');

// Extract Edit Expense Modal
const editExpRegex = /\{\/\* Edit Expense Modal \*\/\}[\s\S]*?<\/div>\s*\)\}\s*$/;
const editExpMatch = originalBlock.match(editExpRegex);
if(editExpMatch) expensesBlock += editExpMatch[0];

rawMaterialsBlock += `</div>\n                            )}\n`;

// Close the blocks properly and put them together
const finalBlocks = rawMaterialsBlock + '\n' + expensesBlock + '\n                            {/* STAFF TAB */}';

content = content.replace(expensesRegex, finalBlocks);

fs.writeFileSync('frontend/src/app/admin/page.tsx', content, 'utf-8');
console.log("Successfully split expenses and raw_materials using fine-grained regex.");
