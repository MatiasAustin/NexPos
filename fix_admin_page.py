import re

with open("d:/WORK/BUILD_APP/NexPos/frontend/src/app/admin/page.tsx", "r", encoding="utf-8") as f:
    content = f.read()

target = """                const { data: sessions, error } = await supabase.from('cash_sessions').select('*').order('opened_at', { ascending: false }); if (error) console.error('Error fetching cash sessions:', error);
                const { data: movements } = await supabase.from('cash_movements').select('session_id, amount').eq('type', 'expense');
                if (sessions) {"""
replacement = """                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/cash-sessions`);
                if (res.ok) {
                    const sessions = await res.json();
                    const { data: movements } = await supabase.from('cash_movements').select('session_id, amount').eq('type', 'expense');
"""
content = content.replace(target, replacement)

with open("d:/WORK/BUILD_APP/NexPos/frontend/src/app/admin/page.tsx", "w", encoding="utf-8") as f:
    f.write(content)

