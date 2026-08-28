import os

files = ['frontend/src/app/admin/page.tsx', 'frontend/src/app/pos/page.tsx']

old_block = """<div className="grid grid-cols-1 md:grid-cols-2 gap-5">
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
                            </div>"""

new_block = """<div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">
                                <div>
                                    <label className="text-xs md:text-sm font-bold text-gray-400 block mb-2">Penambahan / Pengurangan</label>
                                    <div className="flex items-center gap-2 md:gap-3">
                                        <button type="button" onClick={() => setStockAdjustment({...stockAdjustment, delta: (stockAdjustment.delta || 0) - 1})} className="w-10 h-10 md:w-12 md:h-12 shrink-0 flex items-center justify-center bg-gray-800 hover:bg-gray-700 text-white rounded-xl text-xl md:text-2xl font-black border border-gray-700">-</button>
                                        <input type="number" className="flex-1 min-w-0 w-full text-center bg-gray-900 border border-gray-800 rounded-xl py-2 md:py-3 text-white font-bold text-base md:text-lg outline-none focus:border-blue-500" value={stockAdjustment.delta || ''} onChange={e => setStockAdjustment({...stockAdjustment, delta: Number(e.target.value) || 0})} />
                                        <button type="button" onClick={() => setStockAdjustment({...stockAdjustment, delta: (stockAdjustment.delta || 0) + 1})} className="w-10 h-10 md:w-12 md:h-12 shrink-0 flex items-center justify-center bg-gray-800 hover:bg-gray-700 text-white rounded-xl text-xl md:text-2xl font-black border border-gray-700">+</button>
                                    </div>
                                </div>
                                <div>
                                    <label className="text-xs md:text-sm font-bold text-gray-400 block mb-2">Harga Beli (Opsional)</label>
                                    <input type="number" placeholder="Bila kosong = tetap" value={stockAdjustment.price || ''} onChange={e => setStockAdjustment({...stockAdjustment, price: Number(e.target.value)})} className="w-full p-2 md:p-3 bg-gray-900 border border-gray-800 rounded-xl focus:border-blue-500 outline-none text-white h-10 md:h-12" />
                                </div>
                            </div>"""

for path in files:
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # We should search disregarding exact spaces because they might differ slightly
    import re
    # We will use regex to do a robust replace
    
    # Let's just do an exact replace first, usually it works since I generated it.
    if old_block in content:
        content = content.replace(old_block, new_block)
        with open(path, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Fixed exact block in {path}")
    else:
        # Fallback to regex
        pattern = r'<div className="grid grid-cols-1 md:grid-cols-2 gap-5">.*?Harga Beli \(Opsional\).*?</div>\s*</div>'
        if re.search(pattern, content, flags=re.DOTALL):
            content = re.sub(pattern, new_block, content, flags=re.DOTALL)
            with open(path, 'w', encoding='utf-8') as f:
                f.write(content)
            print(f"Fixed regex block in {path}")
        else:
            print(f"Block NOT found in {path}")
