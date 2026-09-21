const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

const envContent = fs.readFileSync('../.env', 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const [key, ...val] = line.split('=');
  if(key && val.length > 0) env[key.trim()] = val.join('=').trim();
});

const supabaseUrl = env['SUPABASE_URL'];
const supabaseKey = env['SUPABASE_KEY'];

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const { data, error } = await supabase.from('cash_sessions').select('*');
  console.log("Error:", error);
  console.log("Data count:", data ? data.length : 0);
  if (data && data.length > 0) {
    console.log("First item:", data[0]);
  }
}
check();
