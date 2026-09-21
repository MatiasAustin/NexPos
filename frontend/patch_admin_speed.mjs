import fs from 'fs';

const adminPath = 'd:\\WORK\\BUILD_APP\\NexPos\\frontend\\src\\app\\admin\\page.tsx';
let adminContent = fs.readFileSync(adminPath, 'utf-8');
adminContent = adminContent.replace(/\r\n/g, '\n');

// 1. fetchTransactions
const oldTrans = `const res = await fetch(\`\${process.env.NEXT_PUBLIC_API_URL}/transactions?startDate=\${startStr}&endDate=\${endStr}\`);
            if (res.ok) setTransactions(await res.json());`;
const newTrans = `const { data, error } = await supabase
                .from('transactions')
                .select('*, payment_methods(name, type), order_items(*)')
                .gte('created_at', startStr)
                .lte('created_at', endStr)
                .order('created_at', { ascending: false });
            if (!error && data) setTransactions(data);`;
adminContent = adminContent.replace(oldTrans, newTrans);

// 2. staff fetch in fetchData
const oldStaff = `const res = await fetch(\`\${process.env.NEXT_PUBLIC_API_URL}/staff\`);
                if(res.ok) setStaffList(await res.json());`;
const newStaff = `const { data } = await supabase.from('staff_profiles').select('*').order('full_name', { ascending: true });
                if(data) setStaffList(data);`;
adminContent = adminContent.replace(oldStaff, newStaff);

// 3. inventory products fetch
const oldInvProd = `fetch(\`\${process.env.NEXT_PUBLIC_API_URL}/admin/products\`),`;
const newInvProd = `supabase.from('products').select('*').order('category', { ascending: true }),`;
adminContent = adminContent.replace(oldInvProd, newInvProd);

const oldProdRes = `if (prodRes.ok) setProducts(await prodRes.json());`;
const newProdRes = `if (prodRes.data) setProducts(prodRes.data);`;
adminContent = adminContent.replace(oldProdRes, newProdRes);

// 4. cash_sessions fetch
const oldSession = `const res = await fetch(\`\${process.env.NEXT_PUBLIC_API_URL}/admin/cash-sessions?_t=\${Date.now()}\`, { cache: 'no-store' });
                if (res.ok) {
                    const sessions = await res.json();
                    setCashSessions(sessions);
                }`;
const newSession = `const { data } = await supabase.from('cash_sessions').select('*, staff_profiles(full_name)').order('created_at', { ascending: false });
                if (data) setCashSessions(data.map((s: any) => ({ ...s, staff_name: s.staff_profiles?.full_name })));`;
adminContent = adminContent.replace(oldSession, newSession);

// 5. audit logs fallback
const oldAudit = `const res = await fetch(\`\${process.env.NEXT_PUBLIC_API_URL}/audit-logs?limit=100\`);
                if (res.ok) setAuditLogs(await res.json());`;
const newAudit = `const { data: fallbackData } = await supabase.from('audit_logs').select('*').order('created_at', { ascending: false }).limit(100);
                if (fallbackData) setAuditLogs(fallbackData);`;
adminContent = adminContent.replace(oldAudit, newAudit);


fs.writeFileSync(adminPath, adminContent);
console.log('Patched admin/page.tsx');

// Now api.ts for getReconciliationReport
const apiPath = 'd:\\WORK\\BUILD_APP\\NexPos\\frontend\\src\\lib\\api.ts';
let apiContent = fs.readFileSync(apiPath, 'utf-8');
apiContent = apiContent.replace(/\r\n/g, '\n');

if (!apiContent.includes(`import { supabase } from '@/lib/supabase';`)) {
    apiContent = `import { supabase } from '@/lib/supabase';\n` + apiContent;
}

const oldRecon = `export const getReconciliationReport = async (startDate?: string, endDate?: string) => {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate || startDate!);
    const res = await api.get(\`/reconciliation?\${params.toString()}\`);
    return res.data;
};`;

const newRecon = `export const getReconciliationReport = async (startDate?: string, endDate?: string) => {
    try {
        const { data: transactions, error } = await supabase
            .from('transactions')
            .select('id, amount_due, status, payment_method_id, created_at, payment_methods ( name, type )')
            .gte('created_at', startDate || new Date().toISOString())
            .lte('created_at', endDate || new Date().toISOString())
            .eq('status', 'Paid');

        if (error || !transactions) return [];

        const report: Record<string, any> = {};
        transactions.forEach((tx: any) => {
            const mName = tx.payment_methods?.name || 'Unknown';
            if (!report[mName]) {
                report[mName] = { method_name: mName, pos_total: 0, transaction_count: 0 };
            }
            report[mName].pos_total += Number(tx.amount_due || 0);
            report[mName].transaction_count += 1;
        });
        return Object.values(report);
    } catch(e) {
        console.error(e);
        return [];
    }
};`;

apiContent = apiContent.replace(oldRecon, newRecon);
fs.writeFileSync(apiPath, apiContent);
console.log('Patched api.ts');
