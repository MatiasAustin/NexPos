import { createClient } from '@supabase/supabase-js';
const supabase = createClient('https://ghlfmcalhlesuouqsaer.supabase.co', 'sb_publishable_jZt9H6VWSznwtwBaYZLerw_oi4PY6T7');
async function run() {
    const { data: storeSettings } = await supabase.from('store_settings').select('*').single();
    console.log('Store categories:', storeSettings.categories);

    // Let's update it to exactly match the PDF
    const newCategories = ['SIGNATURE', 'COFFEE', 'MANUAL BREW', 'FOOD', 'NON COFFEE'];
    await supabase.from('store_settings').update({ categories: newCategories }).eq('id', storeSettings.id);
    
    // Now update all existing products to use the uppercase category names
    const { data: prods } = await supabase.from('products').select('*');
    for (const p of prods) {
        if (p.category) {
            await supabase.from('products').update({ category: p.category.toUpperCase() }).eq('id', p.id);
        }
    }
    console.log('Updated categories successfully.');
}
run();
