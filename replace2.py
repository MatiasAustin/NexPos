import re
with open('frontend/src/app/admin/page.tsx', 'r', encoding='utf-8') as f:
    c = f.read()

c = c.replace(const { data: payMethods } = await supabase.from('payment_methods').select('*').order('created_at', { ascending: true });, const { data: payMethods } = await supabase.from('payment_methods').select('*').eq('is_active', true).order('created_at', { ascending: true });)

c = c.replace(const { data } = await supabase.from('payment_methods').select('*').order('created_at', { ascending: true });, const { data } = await supabase.from('payment_methods').select('*').eq('is_active', true).order('created_at', { ascending: true });)

c = c.replace(const { error } = await supabase.from('payment_methods').delete().eq('id', id);, const { error } = await supabase.from('payment_methods').update({ is_active: false }).eq('id', id);)

with open('frontend/src/app/admin/page.tsx', 'w', encoding='utf-8') as f:
    f.write(c)
