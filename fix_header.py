import re

with open("d:/WORK/BUILD_APP/NexPos/frontend/src/app/admin/page.tsx", "r", encoding="utf-8") as f:
    content = f.read()

pattern = r"(<th className=\"[^\"]*\">Stok</th>)\s*(<th className=\"[^\"]*\">Aksi</th>)"
replacement = r"\1\n<th className=\"p-2 md:p-4 text-xs md:text-sm font-semibold text-gray-400 text-center\">Status</th>\n\2"

content = re.sub(pattern, replacement, content)

with open("d:/WORK/BUILD_APP/NexPos/frontend/src/app/admin/page.tsx", "w", encoding="utf-8") as f:
    f.write(content)

