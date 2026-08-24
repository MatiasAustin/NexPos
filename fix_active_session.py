import re

with open("d:/WORK/BUILD_APP/NexPos/backend/src/services/CashManagementService.ts", "r", encoding="utf-8") as f:
    content = f.read()

old_get = """    async getActiveSession(staffId: string, terminalId: string) {
        const { data, error } = await supabase
            .from('cash_sessions')
            .select('*')
            .eq('staff_id', staffId)
            .eq('terminal_id', terminalId)
            .eq('status', 'open')
            .single();
            
        return data;
    }"""
new_get = """    async getActiveSession(staffId: string, terminalId: string) {
        const { data, error } = await supabase
            .from('cash_sessions')
            .select('*')
            .eq('staff_id', staffId)
            .eq('terminal_id', terminalId)
            .eq('status', 'open')
            .order('created_at', { ascending: false })
            .limit(1);
            
        return data && data.length > 0 ? data[0] : null;
    }"""
content = content.replace(old_get, new_get)

with open("d:/WORK/BUILD_APP/NexPos/backend/src/services/CashManagementService.ts", "w", encoding="utf-8") as f:
    f.write(content)

