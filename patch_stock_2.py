import os
import re

path = 'frontend/src/app/admin/page.tsx'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# Replace product stock delta div
prod_pattern = r'<div className="flex-1 text-center bg-gray-900 border border-gray-800 rounded-xl py-3 text-white font-bold text-lg">\s*\{productStockDelta >= 0 \? `\+\$\{productStockDelta\}` : productStockDelta\}\s*</div>'
prod_repl = r'<input type="number" className="flex-1 text-center bg-gray-900 border border-gray-800 rounded-xl py-3 text-white font-bold text-lg outline-none focus:border-blue-500" value={productStockDelta || ""} onChange={e => setProductStockDelta(Number(e.target.value) || 0)} />'
content = re.sub(prod_pattern, prod_repl, content)

# Check if modal was added correctly.
# If modal is there, we don't need to replace the material stock delta inside the inline form because we already replaced the inline form with a placeholder.
# Wait, let's verify if my modal append was successful.

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Regex patched product stock delta")
