import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
async function test() {
    const { data, error } = await supabase
        .from('order_items')
        .select(`
            quantity,
            price_at_time,
            created_at,
            transaction:transactions (order_reference, staff_name)
        `)
        .limit(1);
    console.log("Error:", error);
    console.log("Data:", data);
}
test();
