import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
dotenv.config();
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY);

async function run() {
    console.log("--- Products ---");
    const { data: prodData } = await supabase.from('products').select('*').limit(1);
    console.log(prodData);
    
    console.log("--- Order Items ---");
    const { data: itemData } = await supabase.from('order_items').select('*').limit(1);
    console.log(itemData);
}
run();
