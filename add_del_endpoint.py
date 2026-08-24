import re

with open("d:/WORK/BUILD_APP/NexPos/backend/src/controllers/ApiController.ts", "r", encoding="utf-8") as f:
    content = f.read()

target = """router.get('/admin/cash-sessions', async (req, res) => {"""
replacement = """router.delete('/admin/cash-sessions/:id', async (req, res) => {
    try {
        await supabase.from('cash_movements').delete().eq('session_id', req.params.id);
        const { error } = await supabase.from('cash_sessions').delete().eq('id', req.params.id);
        if (error) throw error;
        res.status(204).send();
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
});

router.get('/admin/cash-sessions', async (req, res) => {"""

content = content.replace(target, replacement)

with open("d:/WORK/BUILD_APP/NexPos/backend/src/controllers/ApiController.ts", "w", encoding="utf-8") as f:
    f.write(content)

