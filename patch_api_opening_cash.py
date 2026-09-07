import re

with open(r"d:\WORK\BUILD_APP\NexPos\backend\src\controllers\ApiController.ts", "r", encoding="utf-8") as f:
    content = f.read()

old_block = """router.put('/admin/cash-sessions/:id/opening-cash', async (req, res) => {
    try {
        const { opening_cash } = req.body;
        if (opening_cash === undefined || opening_cash === null) {
            return res.status(400).json({ error: 'opening_cash is required' });
        }
        const { data, error } = await supabase
            .from('cash_sessions')
            .update({ opening_cash: Number(opening_cash) })
            .eq('id', req.params.id)
            .select('*')
            .single();"""

new_block = """router.put('/admin/cash-sessions/:id/opening-cash', async (req, res) => {
    try {
        const { opening_cash } = req.body;
        if (opening_cash === undefined || opening_cash === null) {
            return res.status(400).json({ error: 'opening_cash is required' });
        }
        const { data: oldSession } = await supabase.from('cash_sessions').select('opening_cash, expected_cash').eq('id', req.params.id).single();
        let newExpectedCash = 0;
        if (oldSession) {
            const diff = Number(opening_cash) - Number(oldSession.opening_cash || 0);
            newExpectedCash = Number(oldSession.expected_cash || 0) + diff;
        }

        const { data, error } = await supabase
            .from('cash_sessions')
            .update({ opening_cash: Number(opening_cash), ...(oldSession ? { expected_cash: newExpectedCash } : {}) })
            .eq('id', req.params.id)
            .select('*')
            .single();"""

content = content.replace(old_block, new_block)

with open(r"d:\WORK\BUILD_APP\NexPos\backend\src\controllers\ApiController.ts", "w", encoding="utf-8") as f:
    f.write(content)
