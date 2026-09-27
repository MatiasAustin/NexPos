const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({path: '.env'});
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
async function run() {
  const { data, error } = await supabase.rpc('exec_sql', {
    sql: `
      ALTER TABLE kiosk_orders ADD COLUMN IF NOT EXISTS store_id UUID;
    `
  });
  console.log('RPC result:', data, error);
}
run();
