import { createClient } from '@supabase/supabase-js';
const supabase = createClient('https://ghlfmcalhlesuouqsaer.supabase.co', 'sb_publishable_jZt9H6VWSznwtwBaYZLerw_oi4PY6T7');

async function run() {
    console.log('Inserting dummy...');
    const { data: insertData, error: insertError } = await supabase.from('kiosk_orders').insert([{ queue_number: 'TEST', items: [], total: 0 }]).select();
    if(insertError) { console.error('Insert Error:', insertError); return; }
    console.log('Inserted:', insertData);
    
    console.log('Deleting...');
    const { data, error } = await supabase.from('kiosk_orders').delete().eq('id', insertData[0].id).select();
    if (error) {
        console.error('Delete Error:', error);
    } else {
        console.log('Deleted successfully:', data);
    }
}
run();
