import re

with open("d:/WORK/BUILD_APP/NexPos/frontend/src/app/admin/page.tsx", "r", encoding="utf-8") as f:
    content = f.read()

content = content.replace("const merged = sessions.map(s => {", "const merged = sessions.map((s: any) => {")

with open("d:/WORK/BUILD_APP/NexPos/frontend/src/app/admin/page.tsx", "w", encoding="utf-8") as f:
    f.write(content)

