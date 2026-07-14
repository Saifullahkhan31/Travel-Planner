const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

async function run() {
  try {
    const fetch = (await import('node-fetch')).default;
    const res = await fetch(`${supabaseUrl}/rest/v1/profiles?limit=1`, {
      headers: {
        'apikey': supabaseAnonKey,
        'Authorization': `Bearer ${supabaseAnonKey}`
      }
    });
    const data = await res.json();
    console.log('--- PROFILES DATA ---');
    console.log(data);
  } catch (err) {
    console.error('Error:', err);
  }
}

run();
