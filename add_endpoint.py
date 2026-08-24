import re

with open("d:/WORK/BUILD_APP/NexPos/backend/src/controllers/ApiController.ts", "r", encoding="utf-8") as f:
    content = f.read()

target = "router.get('/cash-sessions/active', async (req, res) => {"
replacement = """router.get('/admin/cash-sessions', async (req, res) => {
    try {
        const { data, error } = await supabase.from('cash_sessions').select('*').order('opened_at', { ascending: false });
        if (error) throw error;
        res.json(data);
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
});

router.get('/cash-sessions/active', async (req, res) => {"""

content = content.replace(target, replacement)

with open("d:/WORK/BUILD_APP/NexPos/backend/src/controllers/ApiController.ts", "w", encoding="utf-8") as f:
    f.write(content)

