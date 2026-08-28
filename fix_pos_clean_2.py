import os
import re

path = 'frontend/src/app/pos/page.tsx'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# Replace the top part
content = content.replace("""{materialMode === 'add' ? 'Tambah Bahan Baku Baru' : `Update Stok: ${selectedMaterial?.name}`}
                                        </h3>
                                        {materialMode === 'update' && (
                                            <button onClick={() => { setMaterialMode('add'); setSelectedMaterial(null); }} className="text-xs text-blue-400 hover:text-blue-300">Batal Update</button>
                                        )}
                                    </div>
                                    
                                    {materialMode === 'add' ? (""", """Tambah Bahan Baku Baru
                                        </h3>
                                    </div>
                                    """)

# Because of indentation, maybe regex is safer for the top part
content = re.sub(r'\{materialMode === \'add\' \? \'Tambah Bahan Baku Baru\' : `Update Stok: \$\{selectedMaterial\?\.name\}`\}[\s\S]*?\{materialMode === \'add\' \? \(', r'Tambah Bahan Baku Baru\n                                        </h3>\n                                    </div>', content)

# Now remove the `) : (` and `handleAdjustStock` form
# It looks like:
# </form>
# ) : (
# <form onSubmit={handleAdjustStock} className="space-y-4">
# ...
# </form>
# )}
content = re.sub(r'</form>\s*\)\s*:\s*\(\s*<form onSubmit=\{handleAdjustStock\} className="space-y-4">[\s\S]*?</form>\s*\)\}', '</form>', content)

# Add the modal to the very end
modal_code = """
            {/* Adjust Material Stock Modal */}
            {selectedMaterial && (
                <div className="fixed inset-0 bg-black/80 flex items-start justify-center z-[200] p-4 overflow-y-auto backdrop-blur-md">
                    <div className="bg-[#131B2C] border border-gray-800 p-4 md:p-8 rounded-3xl w-full max-w-lg shadow-2xl my-auto flex-shrink-0">
                        <div className="flex justify-between items-center mb-6 border-b border-gray-800 pb-4">
                            <div>
                                <h3 className="font-bold text-xl text-white">Update Stok Bahan</h3>
                                <p className="text-gray-400 font-bold mt-1">{selectedMaterial.name}</p>
                            </div>
                            <span className="text-sm bg-gray-800 px-3 py-1.5 rounded-lg text-gray-300 font-bold">Stok: {selectedMaterial.current_stock} {selectedMaterial.unit}</span>
                        </div>
                        <form onSubmit={handleAdjustStock} className="space-y-5">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div>
                                    <label className="text-sm font-bold text-gray-400 block mb-2">Penambahan / Pengurangan</label>
                                    <div className="flex items-center gap-3">
                                        <button type="button" onClick={() => setStockAdjustment({...stockAdjustment, delta: (stockAdjustment.delta || 0) - 1})} className="w-12 h-12 flex items-center justify-center bg-gray-800 hover:bg-gray-700 text-white rounded-xl text-2xl font-black border border-gray-700">-</button>
                                        <input type="number" className="flex-1 text-center bg-gray-900 border border-gray-800 rounded-xl py-3 text-white font-bold text-lg outline-none focus:border-blue-500" value={stockAdjustment.delta || ''} onChange={e => setStockAdjustment({...stockAdjustment, delta: Number(e.target.value) || 0})} />
                                        <button type="button" onClick={() => setStockAdjustment({...stockAdjustment, delta: (stockAdjustment.delta || 0) + 1})} className="w-12 h-12 flex items-center justify-center bg-gray-800 hover:bg-gray-700 text-white rounded-xl text-2xl font-black border border-gray-700">+</button>
                                    </div>
                                </div>
                                <div>
                                    <label className="text-sm font-bold text-gray-400 block mb-2">Harga Beli (Opsional)</label>
                                    <input type="number" placeholder="Bila kosong = tetap" value={stockAdjustment.price || ''} onChange={e => setStockAdjustment({...stockAdjustment, price: Number(e.target.value)})} className="w-full p-3 bg-gray-900 border border-gray-800 rounded-xl focus:border-blue-500 outline-none text-white h-12" />
                                </div>
                            </div>
                            <div>
                                <label className="text-sm font-bold text-gray-400 block mb-2">Keterangan Aktivitas</label>
                                <input type="text" placeholder="Contoh: Beli bahan baru, terpakai tester..." required value={stockAdjustment.note || ''} onChange={e => setStockAdjustment({...stockAdjustment, note: e.target.value})} className="w-full p-3 bg-gray-900 border border-gray-800 rounded-xl focus:border-blue-500 outline-none text-white" />
                            </div>
                            <p className="text-xs text-gray-500">?? <b>Tip:</b> Anda bisa langsung mengetik jumlah di kotak angka. Gunakan angka minus (-) jika bahan terpakai/dibuang.</p>
                            <div className="flex gap-4 mt-6 pt-4 border-t border-gray-800">
                                <button type="button" onClick={() => setSelectedMaterial(null)} className="flex-1 py-3 bg-gray-800 text-gray-300 rounded-xl font-bold hover:bg-gray-700 transition-colors">Batal</button>
                                <button type="submit" disabled={loading} className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-500 transition-colors">Simpan Stok</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
"""

# Append it securely to the end of the file
content = content.replace("        </div>\n    );\n}", modal_code + "\n        </div>\n    );\n}")

# Also replace setMaterialMode('update') everywhere just in case
content = content.replace("setMaterialMode('update'); ", "")
content = content.replace("setMaterialMode('update');", "")

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
print('Done')
