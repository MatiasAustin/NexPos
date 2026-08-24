import re

with open("d:/WORK/BUILD_APP/NexPos/frontend/src/app/admin/page.tsx", "r", encoding="utf-8") as f:
    content = f.read()

content = content.replace("Buka: {new Date(session.created_at).toLocaleString('id-ID')}", "Buka: {new Date(session.opened_at).toLocaleString('id-ID')}")

with open("d:/WORK/BUILD_APP/NexPos/frontend/src/app/admin/page.tsx", "w", encoding="utf-8") as f:
    f.write(content)

