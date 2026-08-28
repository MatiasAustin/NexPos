import os

path = 'frontend/src/app/admin/page.tsx'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Product Stock Delta DIV to INPUT
old_prod_div = """<div className="flex-1 text-center bg-gray-900 border border-gray-800 rounded-xl py-3 text-white font-bold text-lg">
                                                                  {productStockDelta >= 0 ? `+${productStockDelta}` : productStockDelta}
                                                              </div>"""
new_prod_input = """<input type="number" className="flex-1 text-center bg-gray-900 border border-gray-800 rounded-xl py-3 text-white font-bold text-lg outline-none focus:border-blue-500" value={productStockDelta || ''} onChange={e => setProductStockDelta(Number(e.target.value) || 0)} />"""
content = content.replace(old_prod_div, new_prod_input)

# 2. Material Stock Delta DIV to INPUT
old_mat_div = """<div className="flex-1 text-center bg-gray-900 border border-gray-800 rounded-xl py-3 text-white font-bold text-lg">
                                                                                  {stockAdjustment.delta >= 0 ? `+${stockAdjustment.delta}` : stockAdjustment.delta}
                                                                              </div>"""
new_mat_input = """<input type="number" className="flex-1 text-center bg-gray-900 border border-gray-800 rounded-xl py-3 text-white font-bold text-lg outline-none focus:border-blue-500" value={stockAdjustment.delta || ''} onChange={e => setStockAdjustment({...stockAdjustment, delta: Number(e.target.value) || 0})} />"""
content = content.replace(old_mat_div, new_mat_input)

# 3. Move selectedMaterial to a Modal Popup
# The block is inside:
#                                              {materialMode === 'add' ? (
# ... ) : (
#                                                  <div className="space-y-4">
#                                                      {!selectedMaterial ? ( ... ) : ( <div className="bg-gray-800/30 ..."> ... </div> )}
#                                                  </div>
#                                              )}
# We want to remove the conditional rendering inside the `else` branch (materialMode='update') so it just shows a placeholder, OR actually since we just want a popup, we can just leave it! Wait, if we leave it, the user will see a popup AND the inline view. Better to remove the inline view.

old_inline = """                                                      {!selectedMaterial ? (
                                                          <div className="text-gray-400 text-sm text-center py-3 md:py-4 border border-dashed border-gray-700 rounded-xl">
                                                              Pilih bahan baku dari tabel di bawah untuk mengatur stok.
                                                          </div>
                                                      ) : (
                                                          <div className="bg-gray-800/30 p-4 rounded-xl border border-gray-800">
                                                              <div className="flex justify-between items-center mb-4">
                                                                  <h4 className="font-bold text-white">{selectedMaterial.name}</h4>
                                                                  <span className="text-xs bg-gray-800 px-2 py-1 rounded-md text-gray-300">Stok saat ini: {selectedMaterial.current_stock} {selectedMaterial.unit}</span>
                                                              </div>
                                                              <form onSubmit={handleAdjustStock} className="space-y-4">
                                                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                                      <div>
                                                                          <label className="text-xs text-gray-500 mb-1 block">Penambahan/Pengurangan Stok</label>
                                                                          <div className="flex items-center gap-3">
                                                                              <button type="button" onClick={() => setStockAdjustment({...stockAdjustment, delta: (stockAdjustment.delta || 0) - 1})} className="w-12 h-12 flex items-center justify-center bg-gray-800 hover:bg-gray-700 text-white rounded-xl text-2xl font-black border border-gray-700">-</button>
                                                                              <input type="number" className="flex-1 text-center bg-gray-900 border border-gray-800 rounded-xl py-3 text-white font-bold text-lg outline-none focus:border-blue-500" value={stockAdjustment.delta || ''} onChange={e => setStockAdjustment({...stockAdjustment, delta: Number(e.target.value) || 0})} />
                                                                              <button type="button" onClick={() => setStockAdjustment({...stockAdjustment, delta: (stockAdjustment.delta || 0) + 1})} className="w-12 h-12 flex items-center justify-center bg-gray-800 hover:bg-gray-700 text-white rounded-xl text-2xl font-black border border-gray-700">+</button>
                                                                          </div>
                                                                      </div>
                                                                      <div>
                                                                          <label className="text-xs text-gray-500 mb-1 block">Harga Beli Baru (Opsional)</label>
                                                                          <input type="number" placeholder="Biarkan kosong jika tetap" value={stockAdjustment.price || ''} onChange={e => setStockAdjustment({...stockAdjustment, price: Number(e.target.value)})} className="w-full p-3 bg-gray-900 border border-gray-800 rounded-xl focus:border-blue-500 outline-none text-white" />
                                                                      </div>
                                                                  </div>
                                                                  <div>
                                                                      <label className="text-xs text-gray-500 mb-1 block">Keterangan (Contoh: Beli baru, Rusak, Terpakai)</label>
                                                                      <input type="text" placeholder="Masukkan keterangan" required value={stockAdjustment.note || ''} onChange={e => setStockAdjustment({...stockAdjustment, note: e.target.value})} className="w-full p-3 bg-gray-900 border border-gray-800 rounded-xl focus:border-blue-500 outline-none text-white" />
                                                                  </div>
                                                                  <p className="text-xs text-gray-500">Gunakan angka minus (-) jika bahan terpakai/dibuang.</p>
                                                                  <div className="flex gap-2 mt-2">
                                                                      <button type="button" onClick={() => setSelectedMaterial(null)} className="flex-1 py-3 bg-gray-800 text-gray-300 rounded-xl font-bold hover:bg-gray-700">Batal</button>
                                                                      <button type="submit" disabled={loading} className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-500">Update Stok</button>
                                                                  </div>
                                                              </form>
                                                          </div>
                                                      )}"""

new_inline = """                                                      <div className="text-gray-400 text-sm text-center py-3 md:py-4 border border-dashed border-gray-700 rounded-xl">
                                                          Pilih bahan baku dari tabel di bawah untuk mengatur stok. Modal akan muncul.
                                                      </div>"""

content = content.replace(old_inline, new_inline)

# Append Modal to the end of the page
modal_code = """
                                      {/* Adjust Material Stock Modal */}
                                      {selectedMaterial && (
                                          <div className="fixed inset-0 bg-black/80 flex items-start justify-center z-50 p-4 overflow-y-auto backdrop-blur-md">
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
                                      )}"""

content = content.replace("                                      {/* Adjust Product Stock Modal */}", modal_code + "\n                                      {/* Adjust Product Stock Modal */}")

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Patched Modals & Inputs")
