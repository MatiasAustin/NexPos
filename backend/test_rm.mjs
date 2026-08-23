import { createClient } from '@supabase/supabase-js';
const supabase = createClient('https://ghlfmcalhlesuouqsaer.supabase.co', 'sb_publishable_jZt9H6VWSznwtwBaYZLerw_oi4PY6T7');
async function run() {
    const { data } = await supabase.from('raw_materials').select('*').limit(1);
    console.log(data);
}
run();
