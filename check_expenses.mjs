import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const url = 'https://obztklnpmyevnffpsaot.supabase.co';
// I need the service key to alter tables, or I can just use raw query if I have postgres string.
// Let's just fetch one expense to see columns.
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY; 
// Wait, I will just read .env
