import fs from 'fs';

let content = fs.readFileSync('frontend/src/app/admin/page.tsx', 'utf-8');

// The original expenses block starts here:
// {activeTab === "expenses" && (
//     <div className="space-y-8">
//         {/* INPUTS ROW */}
//         <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
//             {/* Bahan Baku */} ...
//             {/* Pengeluaran */} ...
//         </div>
//         {/* LISTS ROW */}
//         <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
//             {/* Daftar Bahan Baku */} ...
//             {/* Riwayat Pengeluaran */} ...
//         </div>
//     </div>
// )}

const expensesStart = content.indexOf('{activeTab === "expenses" && (');
if (expensesStart === -1) {
    console.error("Could not find expenses tab block.");
    process.exit(1);
}

// Find the end of the expenses block
// We can just replace the whole block by extracting its internal pieces.
// We'll use regex to separate it.

const regex = /\{activeTab === "expenses" && \(\s*<div className="space-y-8">\s*\{\/\* INPUTS ROW \*\/\}\s*<div className="grid grid-cols-1 lg:grid-cols-2 gap-8">\s*\{\/\* Bahan Baku \*\/\}([\s\S]*?)\{\/\* Pengeluaran \*\/\}([\s\S]*?)<\/div>\s*\{\/\* LISTS ROW \*\/\}\s*<div className="grid grid-cols-1 lg:grid-cols-2 gap-8">\s*\{\/\* Daftar Bahan Baku \*\/\}([\s\S]*?)\{\/\* Riwayat Pengeluaran \*\/\}([\s\S]*?)<\/div>\s*<\/div>\s*\)\}/;

const match = content.match(regex);
if (match) {
    const bahanBakuInput = match[1];
    const pengeluaranInput = match[2];
    const bahanBakuList = match[3];
    const pengeluaranList = match[4];

    const rawMaterialsTab = `
                            {activeTab === "raw_materials" && (
                                <div className="space-y-8">
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                        {/* Bahan Baku */}
                                        ${bahanBakuInput}
                                        {/* Daftar Bahan Baku */}
                                        ${bahanBakuList}
                                    </div>
                                </div>
                            )}
`;

    const expensesTab = `
                            {activeTab === "expenses" && (
                                <div className="space-y-8">
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                        {/* Pengeluaran */}
                                        ${pengeluaranInput}
                                        {/* Riwayat Pengeluaran */}
                                        ${pengeluaranList}
                                    </div>
                                </div>
                            )}
`;

    content = content.replace(regex, rawMaterialsTab + expensesTab);
    fs.writeFileSync('frontend/src/app/admin/page.tsx', content, 'utf-8');
    console.log("Successfully split expenses and raw_materials.");
} else {
    console.error("Regex did not match.");
}
