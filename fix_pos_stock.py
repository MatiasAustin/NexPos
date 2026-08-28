import os
import re

path = 'frontend/src/app/pos/page.tsx'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Remove "+/- Stok" tab button
tab_pattern = r'<button onClick=\{\(\) => setMaterialMode\(\'update\'\)\}.*?\+\/- Stok<\/button>'
content = re.sub(tab_pattern, '', content, flags=re.DOTALL)

# 2. Remove the {materialMode === 'add' ? ... } ternary and just leave the form.
form_pattern = r'\{materialMode === \'add\' \? \(\s*(<form onSubmit=\{handleCreateMaterial\}.*?<\/form>)\s*\) : \(\s*<div className="space-y-4">.*?<\/div>\s*\)\}'
content = re.sub(form_pattern, r'\1', content, flags=re.DOTALL)

# 3. In the table, remove setMaterialMode('update')
table_pattern = r'onClick=\{\(\) => \{\s*setSelectedMaterial\(\{\.\.\.mat\}\};\s*setMaterialMode\(\'update\'\);\s*\}\}'
content = re.sub(table_pattern, r'onClick={() => setSelectedMaterial({...mat})}', content)

# Fix syntax orphans left behind
broken2 = """                                                </form>
                                                </div>
                                            )}
                                        </div>"""
fixed2 = """                                                </form>
                                        </div>"""
if broken2 in content:
    content = content.replace(broken2, fixed2)

content = content.replace("""                                                </form>\n                                                </div>\n                                            )}""", """                                                </form>""")


# 4. Append Material Modal before the end of the Expenses Modal (or at the bottom of the page)
# We can just put it right before the last closing tags of POS page.
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

content = content.replace("        </main>\n    );", modal_code + "\n        </main>\n    );")

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)

print("POS page patched")
