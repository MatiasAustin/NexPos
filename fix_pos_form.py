import os

path = 'frontend/src/app/pos/page.tsx'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

start_marker = '<div className="flex justify-between items-center mb-6">'
end_marker = '<form onSubmit={handleCreateExpense}' # Look for the expenses form instead

idx1 = content.find(start_marker)
idx2 = content.find(end_marker, idx1)

if idx1 != -1 and idx2 != -1:
    # Need to backtrack to the parent div of expenses form
    # Usually it's `<div className="bg-[#131B2C] border border-gray-800 p-4 md:p-6 rounded-2xl">`
    # Let's just find the closing `</div>` of the Tambah Bahan block which is right before `<div className="bg-[#...`
    
    idx_expense_div = content.rfind('<div className="bg-[', idx1, idx2)
    if idx_expense_div != -1:
        new_block = """<div className="flex justify-between items-center mb-6">
                                          <h3 className="font-bold text-lg text-white">Tambah Bahan Baru</h3>
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
                                      
                                      """
        content = content[:idx1] + new_block + content[idx_expense_div:]

        # Now remove setMaterialMode('update') from the table button
        content = content.replace("setMaterialMode('update'); ", "")
        content = content.replace("setMaterialMode('update');", "")

        with open(path, 'w', encoding='utf-8') as f:
            f.write(content)
        print('Fixed pos page form completely')
    else:
        print('Could not find expense div')
else:
    print('Markers not found')
