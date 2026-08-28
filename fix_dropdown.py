import os

path = 'frontend/src/app/admin/page.tsx'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# Replace for both newProduct and editingProduct
content = content.replace("value={ing.raw_material_id || ''}", "value={ing.raw_material_id || ing.id || ''}")

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
print("Dropdown value patched")
