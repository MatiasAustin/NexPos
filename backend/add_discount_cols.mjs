import { createClient } from "@supabase/supabase-js";
const supabase = createClient("https://ghlfmcalhlesuouqsaer.supabase.co", "sb_publishable_jZt9H6VWSznwtwBaYZLerw_oi4PY6T7");

async function run() {
    const sqls = [
        "ALTER TABLE transactions ADD COLUMN IF NOT EXISTS discount_amount DECIMAL(12,2) DEFAULT 0;",
        "ALTER TABLE kiosk_orders ADD COLUMN IF NOT EXISTS discount_amount DECIMAL(12,2) DEFAULT 0;"
    ];

    for (let sql of sqls) {
        console.log(`Executing: ${sql}`);
        const { data, error } = await supabase.rpc('exec_sql', { sql });
        if (error) {
            console.error(error);
        } else {
            console.log("Success");
        }
    }
}
run();
