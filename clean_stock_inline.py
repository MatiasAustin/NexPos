import os
import re

path = 'frontend/src/app/admin/page.tsx'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Remove the "+/- Stok" tab button completely
tab_pattern = r'<button onClick=\{\(\) => setMaterialMode\(\'update\'\)\}.*?\+\/- Stok<\/button>'
content = re.sub(tab_pattern, '', content, flags=re.DOTALL)

# 2. Remove the {materialMode === 'add' ? ... } ternary and just leave the form.
form_pattern = r'\{materialMode === \'add\' \? \(\s*(<form onSubmit=\{handleCreateMaterial\}.*?<\/form>)\s*\) : \(\s*<div className="space-y-4">.*?<\/div>\s*\)\}'
content = re.sub(form_pattern, r'\1', content, flags=re.DOTALL)

# 3. In the table, remove setMaterialMode('update')
table_pattern = r'onClick=\{\(\) => \{\s*setSelectedMaterial\(\{\.\.\.mat\}\};\s*setMaterialMode\(\'update\'\);\s*\}\}'
content = re.sub(table_pattern, r'onClick={() => setSelectedMaterial({...mat})}', content)

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
print("Cleaned inline stock UI")
