import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseServiceKey = import.meta.env.VITE_SUPABASE_SERVICE_KEY || '';

// Create a specialized client using the service role key to bypass RLS and create users silently
export const supabaseAdmin = createClient(
  supabaseUrl,
  supabaseServiceKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);
