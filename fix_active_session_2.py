import re

with open("d:/WORK/BUILD_APP/NexPos/backend/src/services/CashManagementService.ts", "r", encoding="utf-8") as f:
    content = f.read()

content = content.replace(".order('created_at', { ascending: false })", ".order('opened_at', { ascending: false })")

with open("d:/WORK/BUILD_APP/NexPos/backend/src/services/CashManagementService.ts", "w", encoding="utf-8") as f:
    f.write(content)

