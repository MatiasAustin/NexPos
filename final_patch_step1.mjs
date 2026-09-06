import fs from 'fs';

let content = fs.readFileSync('frontend/src/app/admin/page.tsx', 'utf-8');

// ============================================================
// 1. Add "raw_materials" to activeTab type
// ============================================================
content = content.replace(
    `"reconciliation" | "audit" | "staff" | "inventory" | "history" | "settings" | "expenses" | "cash_sessions"`,
    `"reconciliation" | "audit" | "staff" | "inventory" | "history" | "settings" | "expenses" | "cash_sessions" | "raw_materials"`
);

// ============================================================
// 2. Add fetch for raw_materials and expenses when tab = "raw_materials"
//    Insert BEFORE the closing `} else if (activeTab === "cash_sessions")`
// ============================================================
content = content.replace(
    `} else if (activeTab === "cash_sessions") {`,
    `} else if (activeTab === "raw_materials") {
                const { data: matData } = await supabase.from('raw_materials').select('*').order('name', { ascending: true });
                setRawMaterials(matData || []);
            } else if (activeTab === "cash_sessions") {`
);

// ============================================================
// 3. Update sidebar: split "Bahan & Pengeluaran" into two tabs
// ============================================================
content = content.replace(
    `{ id: "expenses", label: "Bahan & Pengeluaran", icon: FileText },`,
    `{ id: "raw_materials", label: "Bahan Baku", icon: Package },
                        { id: "expenses", label: "Pengeluaran", icon: FileText },`
);

// ============================================================
// 4. Add Stock Valuation Chart as a new raw_materials tab block
//    INSERT before the {/* STAFF TAB */} block
// ============================================================
const rawMaterialsTabCode = `
                            {/* RAW MATERIALS TAB */}
                            {activeTab === "raw_materials" && (
                                <div className="space-y-8">
                                    {/* Stock Valuation Chart */}
                                    <div className="bg-[#131B2C] border border-gray-800 rounded-2xl overflow-hidden shadow-xl p-4 md:p-6">
                                        <h3 className="font-bold text-lg mb-4 text-white border-b border-gray-800 pb-3">Bagan Konversi Nilai Stok Bahan Baku</h3>
                                        {rawMaterials.length === 0 ? (
                                            <p className="text-gray-500 text-center py-8">Belum ada bahan baku. Tambah bahan baku terlebih dahulu.</p>
                                        ) : (
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                <div>
                                                    <div className="text-sm text-gray-400 mb-2">Total Nilai Aset Bahan Baku:</div>
                                                    <div className="text-3xl font-bold text-blue-400 mb-4">
                                                        Rp {rawMaterials.reduce((sum, item) => sum + (Number(item.current_stock) * Number(item.last_price_per_unit)), 0).toLocaleString('id-ID')}
                                                    </div>
                                                    <div className="space-y-2 max-h-64 overflow-y-auto pr-2">
                                                        {rawMaterials.map((item: any) => {
                                                            const val = Number(item.current_stock) * Number(item.last_price_per_unit);
                                                            const total = rawMaterials.reduce((s: number, m: any) => s + Number(m.current_stock) * Number(m.last_price_per_unit), 0);
                                                            const pct = total > 0 ? (val / total * 100) : 0;
                                                            return (
                                                                <div key={item.id} className="flex flex-col border-b border-gray-800 pb-2">
                                                                    <div className="flex justify-between items-center text-sm">
                                                                        <span className="text-gray-300">{item.name}</span>
                                                                        <div className="text-right">
                                                                            <div className="font-bold text-white">Rp {val.toLocaleString('id-ID')}</div>
                                                                            <div className="text-xs text-gray-500">{item.current_stock} {item.unit} × Rp {Number(item.last_price_per_unit).toLocaleString('id-ID')}</div>
                                                                        </div>
                                                                    </div>
                                                                    <div className="w-full bg-gray-800 rounded-full h-1.5 mt-1.5">
                                                                        <div className="bg-blue-500 h-1.5 rounded-full" style={{ width: \`\${pct}%\` }}></div>
                                                                    </div>
                                                                    <div className="text-[10px] text-gray-600 text-right">{pct.toFixed(1)}% dari total aset</div>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                                <div className="h-72 flex items-end gap-1.5 pb-4 pt-4 border-l border-gray-800 pl-4 overflow-x-auto">
                                                    {rawMaterials.length > 0 && rawMaterials.map((item: any) => {
                                                        const totalVal = Number(item.current_stock) * Number(item.last_price_per_unit);
                                                        const maxVal = Math.max(...rawMaterials.map((m: any) => Number(m.current_stock) * Number(m.last_price_per_unit)));
                                                        const heightPct = maxVal > 0 ? (totalVal / maxVal) * 100 : 0;
                                                        return (
                                                            <div key={item.id} className="flex flex-col justify-end items-center h-full w-14 group flex-shrink-0">
                                                                <div className="text-xs text-gray-400 mb-2 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap bg-gray-900 px-2 py-1 rounded z-10 absolute -translate-y-full">
                                                                    Rp {totalVal.toLocaleString('id-ID')}
                                                                </div>
                                                                <div className="w-10 bg-blue-500/80 rounded-t-sm hover:bg-blue-400 transition-colors" style={{ height: \`\${heightPct}%\` }}></div>
                                                                <div className="text-[9px] text-gray-500 mt-2 truncate w-full text-center" title={item.name}>{item.name.substring(0, 6)}</div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Input & List Bahan Baku */}
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                        {/* Tambah Bahan Baku */}
                                        <div className="p-2 md:p-4 md:p-8 bg-[#131B2C] rounded-2xl border border-gray-800 shadow-xl">
                                            <div className="flex items-center gap-2 mb-6 border-b border-gray-800 pb-3">
                                                <button onClick={() => setMaterialMode('add')} className={\`pb-2 px-2 text-lg font-bold border-b-2 transition-colors \${materialMode === 'add' ? 'border-blue-500 text-blue-500' : 'border-transparent text-gray-400 hover:text-white'}\`}>Tambah Bahan</button>
                                            </div>
                                            <form onSubmit={handleCreateMaterial} className="space-y-4">
                                                <input type="text" placeholder="Nama Bahan (contoh: Susu)" required value={newMaterial.name} onChange={e => setNewMaterial({...newMaterial, name: e.target.value})} className="w-full p-3 bg-gray-900 border border-gray-800 rounded-xl focus:border-blue-500 outline-none text-white" />
                                                <div className="grid grid-cols-3 gap-4">
                                                    <input type="text" placeholder="Unit (kg/lt)" required value={newMaterial.unit} onChange={e => setNewMaterial({...newMaterial, unit: e.target.value})} className="p-3 bg-gray-900 border border-gray-800 rounded-xl focus:border-blue-500 outline-none text-white" />
                                                    <input type="number" placeholder="Stok" required value={newMaterial.current_stock || ''} onChange={e => setNewMaterial({...newMaterial, current_stock: Number(e.target.value)})} className="p-3 bg-gray-900 border border-gray-800 rounded-xl focus:border-blue-500 outline-none text-white" />
                                                    <input type="number" placeholder="Harga/Unit" required value={newMaterial.last_price_per_unit || ''} onChange={e => setNewMaterial({...newMaterial, last_price_per_unit: Number(e.target.value)})} className="p-3 bg-gray-900 border border-gray-800 rounded-xl focus:border-blue-500 outline-none text-white" />
                                                </div>
                                                <button type="submit" disabled={loading} className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-500">Simpan Bahan</button>
                                            </form>
                                        </div>

                                        {/* Daftar Bahan Baku */}
                                        <div className="bg-[#131B2C] border border-gray-800 rounded-2xl overflow-hidden shadow-xl">
                                            <h3 className="p-2 md:p-4 bg-gray-800/30 font-bold text-gray-300 border-b border-gray-800">Daftar Bahan Baku</h3>
                                            {rawMaterials.length === 0 ? (
                                                <p className="p-2 md:p-4 md:p-6 text-gray-500 text-center text-sm">Belum ada bahan baku.</p>
                                            ) : (
                                                <table className="w-full text-left text-xs md:text-sm">
                                                    <tbody>
                                                        {rawMaterials.map((mat: any) => (
                                                            <tr key={mat.id} className="border-b border-gray-800 hover:bg-gray-800/20 group">
                                                                <td className="p-2 md:p-4">
                                                                    <div className="font-bold text-white">{mat.name}</div>
                                                                    {mat.updated_by_name && <div className="text-[10px] text-blue-400 mt-1">Oleh: {mat.updated_by_name}</div>}
                                                                </td>
                                                                <td className="p-2 md:p-4 text-center"><span className="px-3 py-1 bg-gray-800 rounded-lg text-sm">{mat.current_stock} {mat.unit}</span></td>
                                                                <td className="p-2 md:p-4 text-right text-gray-400 text-sm">Rp {Number(mat.last_price_per_unit).toLocaleString('id-ID')}/{mat.unit}</td>
                                                                <td className="p-3 text-right">
                                                                    <div className="flex gap-1 justify-end">
                                                                        <button onClick={() => { setSelectedMaterial({...mat}); setMaterialMode('update'); }} className="px-2 py-1 text-xs bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-lg hover:bg-blue-600 hover:text-white font-bold transition-colors">+/- Stok</button>
                                                                        <button onClick={() => handleDeleteMaterial(mat.id)} className="px-2 py-1 text-xs bg-red-500/10 text-red-400 border border-red-500/20 rounded-lg hover:bg-red-600 hover:text-white font-bold transition-colors">Hapus</button>
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            )}
                                        </div>
                                    </div>

                                    {/* Riwayat Update Stok */}
                                    <div className="bg-[#131B2C] border border-gray-800 rounded-2xl overflow-hidden shadow-xl">
                                        <h3 className="p-2 md:p-4 bg-gray-800/30 font-bold text-gray-300 border-b border-gray-800">Riwayat Update Stok Bahan Baku</h3>
                                        {materialStockLogs.length === 0 ? (
                                            <p className="p-2 md:p-4 md:p-6 text-gray-500 text-center text-sm">Belum ada riwayat update stok.</p>
                                        ) : (
                                            <div className="overflow-x-auto">
                                                <table className="w-full text-left text-xs md:text-sm">
                                                    <thead>
                                                        <tr className="bg-gray-800/50 border-b border-gray-800 text-gray-400">
                                                            <th className="p-2 md:p-4 text-xs md:text-sm">Waktu</th>
                                                            <th className="p-2 md:p-4 text-xs md:text-sm">Bahan Baku</th>
                                                            <th className="p-2 md:p-4 text-xs md:text-sm">Perubahan</th>
                                                            <th className="p-2 md:p-4 text-xs md:text-sm">Keterangan</th>
                                                            <th className="p-2 md:p-4 text-xs md:text-sm">Oleh</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {materialStockLogs.map((log: any) => (
                                                            <tr key={log.id} className="border-b border-gray-800 hover:bg-gray-800/20">
                                                                <td className="p-2 md:p-4 text-gray-400">{new Date(log.created_at).toLocaleString('id-ID')}</td>
                                                                <td className="p-2 md:p-4 font-bold text-white">{log.material_name}</td>
                                                                <td className="p-2 md:p-4">
                                                                    <span className={\`px-2 py-1 rounded-md font-bold text-xs \${log.delta > 0 ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}\`}>
                                                                        {log.delta > 0 ? '+' : ''}{log.delta}
                                                                    </span>
                                                                </td>
                                                                <td className="p-2 md:p-4 text-gray-400">{log.note || '-'}</td>
                                                                <td className="p-2 md:p-4">
                                                                    {log.staff_name ? (
                                                                        <span className="px-2 py-1 bg-blue-500/10 text-blue-400 rounded-md text-[10px] font-bold border border-blue-500/20">{log.staff_name}</span>
                                                                    ) : (
                                                                        <span className="px-2 py-1 bg-gray-800 text-gray-400 rounded-md text-[10px] border border-gray-700">Admin</span>
                                                                    )}
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

`;

content = content.replace(`{/* STAFF TAB */}`, rawMaterialsTabCode + `{/* STAFF TAB */}`);

// ============================================================
// 5. In the expenses tab, REMOVE the Bahan Baku section (keep only Pengeluaran)
//    Replace the INPUTS ROW section to only have pengeluaran
// ============================================================
// Find the expenses tab and replace the inputs row grid to only show Pengeluaran
content = content.replace(
    `{/* INPUTS ROW */}
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                        {/* Bahan Baku */}`,
    `{/* PENGELUARAN INPUT */}
                                    <div className="grid grid-cols-1 gap-8">
                                        {/* -Removed Bahan Baku - moved to Bahan Baku tab- */}`
);

// Remove the entire Bahan Baku div (from its start to the Pengeluaran comment)
content = content.replace(
    /\{\/\* -Removed Bahan Baku - moved to Bahan Baku tab- \*\/\}\s*<div className="p-2 md:p-4 md:p-8 bg-\[\#131B2C\] rounded-2xl border border-gray-800 shadow-xl">\s*<div className="flex items-center gap-2 mb-6 border-b border-gray-800 pb-3">\s*<button onClick=\{\(\) => setMaterialMode\('add'\)\}[\s\S]*?<\/form>\s*<\/div>\s*\{\/\* Pengeluaran \*\/\}/,
    `{/* Pengeluaran */}`
);

// TABLES ROW: Remove Bahan Baku list - keep only Pengeluaran
// Change the TABLES ROW grid to single column (just Pengeluaran)
content = content.replace(
    `{/* TABLES ROW */}
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                        <div className="bg-[#131B2C] border border-gray-800 rounded-2xl overflow-hidden shadow-xl">
                                            <h3 className="p-2 md:p-4 bg-gray-800/30 font-bold text-gray-300 border-b border-gray-800">Daftar Bahan Baku</h3>`,
    `{/* TABLES ROW - only Pengeluaran */}
                                    <div className="grid grid-cols-1 gap-8">
                                        {/* -REMOVED Daftar Bahan Baku - moved to Bahan Baku tab- */}
                                        <div style={{display:'none'}}>
                                            <h3 className="p-2 md:p-4 bg-gray-800/30 font-bold text-gray-300 border-b border-gray-800">Daftar Bahan Baku</h3>`
);

// Find the closing of the Daftar Bahan Baku div and the Pengeluaran div start
content = content.replace(
    /\{\/\* -REMOVED Daftar Bahan Baku - moved to Bahan Baku tab- \*\/\}\s*<div style=\{\{display:'none'\}\}>([\s\S]*?)<\/div>\s*\{\/\* Pengeluaran \*\/\}/,
    `{/* Pengeluaran */}`
);

// Also remove Material Stock Logs section from expenses tab (it's now in raw_materials tab)
content = content.replace(
    `{/* Material Stock Logs Row */}
                                    <div className="bg-[#131B2C] border border-gray-800 rounded-2xl overflow-hidden shadow-xl mt-8">
                                        <h3 className="p-2 md:p-4 bg-gray-800/30 font-bold text-gray-300 border-b border-gray-800">Riwayat Update Stok Bahan Baku</h3>`,
    `{/* -Material Stock Logs moved to Bahan Baku tab- */}
                                    <div style={{display:'none'}}>
                                        <h3 className="p-2 md:p-4 bg-gray-800/30 font-bold text-gray-300 border-b border-gray-800">Riwayat Update Stok Bahan Baku - hidden</h3>`
);

fs.writeFileSync('frontend/src/app/admin/page.tsx', content, 'utf-8');
console.log("Step 1 completed: Added raw_materials tab and split from expenses.");
