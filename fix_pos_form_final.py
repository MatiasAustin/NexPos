import os
import re

path = 'frontend/src/app/pos/page.tsx'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# Pattern for the top part:
old_top = """                                          <h3 className="font-bold text-lg text-white">
                                              {materialMode === 'add' ? 'Tambah Bahan Baku Baru' : `Update Stok: ${selectedMaterial?.name}`}
                                          </h3>
                                          {materialMode === 'update' && (
                                              <button onClick={() => { setMaterialMode('add'); setSelectedMaterial(null); }} className="text-xs text-blue-400 hover:text-blue-300">Batal Update</button>
                                          )}
                                      </div>
                                      
                                      {materialMode === 'add' ? (
                                          <form onSubmit={handleCreateMaterial} className="space-y-4">"""

new_top = """                                          <h3 className="font-bold text-lg text-white">
                                              Tambah Bahan Baku Baru
                                          </h3>
                                      </div>
                                      
                                      <form onSubmit={handleCreateMaterial} className="space-y-4">"""

content = content.replace(old_top, new_top)


# Pattern for the bottom part:
# It's from `<button type="submit" disabled={loading} className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-500">Simpan Bahan</button>`
# `</form>`
# `) : (`
# `<form onSubmit={handleAdjustStock} className="space-y-4">`
# ... up to `</form>`
# `)}`

# Actually, let's use a regex to match the `) : (` and the whole adjust stock form up to `)}`

pattern = r"""\s*\) : \(\s*<form onSubmit=\{handleAdjustStock\} className="space-y-4">.*?</form>\s*\)\}"""

content = re.sub(pattern, "", content, flags=re.DOTALL)

# Remove the `setMaterialMode('update'); ` and `setMaterialMode('add'); `
content = content.replace("setMaterialMode('update'); ", "")
content = content.replace("setMaterialMode('add'); ", "")

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Fixed POS page form UI!")

