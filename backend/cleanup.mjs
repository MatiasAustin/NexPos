import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ghlfmcalhlesuouqsaer.supabase.co';
const supabaseKey = 'sb_publishable_jZt9H6VWSznwtwBaYZLerw_oi4PY6T7';
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
    const { data: openSessions } = await supabase
        .from('cash_sessions')
        .select('*')
        .eq('status', 'open')
        .order('opened_at', { ascending: false });
        
    console.log(`Found ${openSessions?.length || 0} open sessions`);
}

check();
