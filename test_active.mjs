import { createClient } from "@supabase/supabase-js";
const supabase = createClient("https://ghlfmcalhlesuouqsaer.supabase.co", "sb_publishable_jZt9H6VWSznwtwBaYZLerw_oi4PY6T7");

async function run() {
    const { data, error } = await supabase.from("cash_sessions").select("*").eq("status", "open");
    console.log("Sessions:", data, error);
}
run();
