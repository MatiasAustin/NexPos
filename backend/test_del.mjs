import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
const envFile = fs.readFileSync('../frontend/.env', 'utf8');
const urlMatch = envFile.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/);
const keyMatch = envFile.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY=(.*)/);
const supabase = createClient(urlMatch[1].trim(), keyMatch[1].trim());

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
