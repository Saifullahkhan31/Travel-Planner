import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl     = process.env.EXPO_PUBLIC_SUPABASE_URL      || '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    // Persist session tokens in AsyncStorage so they survive app restarts
    storage            : AsyncStorage,
    autoRefreshToken   : true,
    persistSession     : true,
    detectSessionInUrl : false,   // must be false for React Native (no browser URL)
  },
});
