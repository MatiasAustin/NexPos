import re

with open("d:/WORK/BUILD_APP/NexPos/frontend/src/app/admin/page.tsx", "r", encoding="utf-8") as f:
    content = f.read()

content = content.replace("<th className=\\\"p-2 md:p-4 text-xs md:text-sm font-semibold text-gray-400 text-center\\\">Status</th>", "<th className=\"p-2 md:p-4 text-xs md:text-sm font-semibold text-gray-400 text-center\">Status</th>")

with open("d:/WORK/BUILD_APP/NexPos/frontend/src/app/admin/page.tsx", "w", encoding="utf-8") as f:
    f.write(content)

