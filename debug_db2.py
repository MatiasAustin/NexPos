import re

with open("d:/WORK/BUILD_APP/NexPos/backend/src/controllers/ApiController.ts", "r", encoding="utf-8") as f:
    content = f.read()

content = content.replace("router.get('/debug-sessions', async (req, res) => { const { data } = await supabase.from('cash_sessions').select('*').order('created_at', { ascending: false }).limit(10); res.json(data); });", "router.get('/debug-sessions2', async (req, res) => { const { data, error } = await supabase.from('cash_sessions').select('*').order('created_at', { ascending: false }).limit(10); res.json({ data, error }); });")

with open("d:/WORK/BUILD_APP/NexPos/backend/src/controllers/ApiController.ts", "w", encoding="utf-8") as f:
    f.write(content)

