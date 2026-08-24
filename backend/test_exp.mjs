import { createClient } from '@supabase/supabase-js';
const supabase = createClient('https://ghlfmcalhlesuouqsaer.supabase.co', 'sb_publishable_jZt9H6VWSznwtwBaYZLerw_oi4PY6T7');

async function run() {
    console.log('Fetching expenses schema...');
    const { data: exp, error } = await supabase.from('expenses').select('*').limit(1);
    console.log('Exp:', exp, error);
}
run();
