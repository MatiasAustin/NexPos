import { createClient } from '@supabase/supabase-js';

let supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
if (typeof window !== 'undefined' && (supabaseUrl.includes('localhost') || supabaseUrl.includes('127.0.0.1')) && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
    supabaseUrl = supabaseUrl.replace(/localhost|127\.0\.0\.1/, window.location.hostname);
}
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
