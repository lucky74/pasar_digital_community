import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Manual .env parser
const envPath = path.resolve(process.cwd(), '.env');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) {
        env[key.trim()] = value.trim();
    }
});

const supabaseUrl = env.VITE_SUPABASE_URL;
const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY;

console.log("URL:", supabaseUrl);
console.log("Key:", supabaseAnonKey ? supabaseAnonKey.substring(0, 10) + "..." : "MISSING");

if (!supabaseUrl || !supabaseAnonKey) {
    console.error("ERROR: URL or Key is missing in .env");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function test() {
    console.log("Testing connection...");
    const { data, error } = await supabase.from('products').select('*').limit(1);
    if (error) {
        console.error("CONNECTION FAILED:", error.message);
    } else {
        console.log("CONNECTION SUCCESS. Data:", data);
    }
}

test();
