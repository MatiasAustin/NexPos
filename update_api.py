import re

with open("d:/WORK/BUILD_APP/NexPos/backend/src/controllers/ApiController.ts", "r", encoding="utf-8") as f:
    content = f.read()

content = content.replace("router.get('/cash-sessions/active', async (req, res) => {", "router.get('/health2', (req, res) => res.json({ status: 'v3' }));\nrouter.get('/cash-sessions/active', async (req, res) => {")

with open("d:/WORK/BUILD_APP/NexPos/backend/src/controllers/ApiController.ts", "w", encoding="utf-8") as f:
    f.write(content)

