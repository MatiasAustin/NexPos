import os

files = ['frontend/src/app/admin/page.tsx', 'frontend/src/app/pos/page.tsx']

for path in files:
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # We want to find the form for handleAdjustStock
    content = content.replace('<form onSubmit={handleAdjustStock} className="space-y-5">', '<form onSubmit={handleAdjustStock} className="space-y-4 md:space-y-5">')
    
    # Keterangan label
    content = content.replace('<label className="text-sm font-bold text-gray-400 block mb-2">Keterangan Aktivitas</label>', '<label className="text-xs md:text-sm font-bold text-gray-400 block mb-1 md:mb-2">Keterangan Aktivitas</label>')
    
    # Keterangan input
    content = content.replace('placeholder="Contoh: Beli bahan baru, terpakai tester..." required value={stockAdjustment.note || \'\'} onChange={e => setStockAdjustment({...stockAdjustment, note: e.target.value})} className="w-full p-3 bg-gray-900 border border-gray-800 rounded-xl focus:border-blue-500 outline-none text-white"', 'placeholder="Contoh: Beli bahan baru, terpakai tester..." required value={stockAdjustment.note || \'\'} onChange={e => setStockAdjustment({...stockAdjustment, note: e.target.value})} className="w-full p-2 md:p-3 text-sm md:text-base bg-gray-900 border border-gray-800 rounded-xl focus:border-blue-500 outline-none text-white"')
    
    # Batal / Simpan buttons
    content = content.replace('<button type="button" onClick={() => setSelectedMaterial(null)} className="flex-1 py-3 bg-gray-800 text-gray-300 rounded-xl font-bold hover:bg-gray-700 transition-colors">Batal</button>', '<button type="button" onClick={() => setSelectedMaterial(null)} className="flex-1 py-2 md:py-3 text-sm md:text-base bg-gray-800 text-gray-300 rounded-xl font-bold hover:bg-gray-700 transition-colors">Batal</button>')
    content = content.replace('<button type="submit" disabled={loading} className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-500 transition-colors">Simpan Stok</button>', '<button type="submit" disabled={loading} className="flex-1 py-2 md:py-3 text-sm md:text-base bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-500 transition-colors">Simpan Stok</button>')
    
    # Header Update Stok Bahan
    content = content.replace('<h3 className="font-bold text-xl text-white">Update Stok Bahan</h3>', '<h3 className="font-bold text-lg md:text-xl text-white">Update Stok Bahan</h3>')
    
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"Fixed tweaks in {path}")
