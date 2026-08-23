import re

with open("d:/WORK/BUILD_APP/NexPos/backend/src/services/TransactionService.ts", "r", encoding="utf-8") as f:
    content = f.read()

old_func = """    async getTransactionHistory(limit: number = 50) {
        const { data, error } = await supabase
            .from('transactions')
            .select(`
                *,
                payment_methods ( name, type ),
                order_items ( product_id, product_name, quantity, price_at_time, cogs_at_time )
            `)
            .order('created_at', { ascending: false })
            .limit(limit);"""
            
new_func = """    async getTransactionHistory(limit: number = 50, startDate?: string, endDate?: string) {
        let query = supabase
            .from('transactions')
            .select(`
                *,
                payment_methods ( name, type ),
                order_items ( product_id, product_name, quantity, price_at_time, cogs_at_time )
            `)
            .order('created_at', { ascending: false });
            
        if (startDate) query = query.gte('created_at', startDate);
        if (endDate) query = query.lte('created_at', endDate);
        
        const { data, error } = await query.limit(limit);"""
content = content.replace(old_func, new_func)
with open("d:/WORK/BUILD_APP/NexPos/backend/src/services/TransactionService.ts", "w", encoding="utf-8") as f:
    f.write(content)

with open("d:/WORK/BUILD_APP/NexPos/backend/src/controllers/ApiController.ts", "r", encoding="utf-8") as f:
    content = f.read()

old_route = """router.get('/transactions', async (req, res) => {
    try {
        const transactions = await transactionService.getTransactionHistory(100);"""
new_route = """router.get('/transactions', async (req, res) => {
    try {
        const { startDate, endDate } = req.query as any;
        let startISO, endISO;
        if (startDate) startISO = new Date(startDate + 'T00:00:00Z').toISOString();
        if (endDate) endISO = new Date(endDate + 'T23:59:59Z').toISOString();
        
        const transactions = await transactionService.getTransactionHistory(500, startISO, endISO);"""
content = content.replace(old_route, new_route)
with open("d:/WORK/BUILD_APP/NexPos/backend/src/controllers/ApiController.ts", "w", encoding="utf-8") as f:
    f.write(content)
