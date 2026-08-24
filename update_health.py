import re

with open("d:/WORK/BUILD_APP/NexPos/backend/src/index.ts", "r", encoding="utf-8") as f:
    content = f.read()

content = content.replace("res.json({ status: 'NexPos Payment System API is running' });", "res.json({ status: 'NexPos Payment System API is running v2' });")

with open("d:/WORK/BUILD_APP/NexPos/backend/src/index.ts", "w", encoding="utf-8") as f:
    f.write(content)

