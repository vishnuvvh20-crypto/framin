import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

// 🛑 IMPORTANT: Replace these with your actual keys from Supabase Dashboard
// Settings -> API -> Project URL & Project API keys (anon)
const supabaseUrl = 'https://vjlakffkbwnvwuecrffx.supabase.co' as string;
const supabaseAnonKey = 'sb_publishable_8sjNuPU3wImY41AFpMM0iQ_G4UYRUsV' as string;

// Validation Shield: Ensures user is guided correctly
export const isCloudReady = 
    supabaseUrl !== 'https://YOUR_PROJECT_REF.supabase.co' && 
    supabaseAnonKey !== 'YOUR_ANON_KEY';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
