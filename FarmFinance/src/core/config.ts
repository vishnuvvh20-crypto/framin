export const Config = {
  SUPABASE_URL: process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://vjlakffkbwnvwuecrffx.supabase.co',
  SUPABASE_ANON_KEY: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_8sjNuPU3wImY41AFpMM0iQ_G4UYRUsV',
  BACKEND_URL: process.env.EXPO_PUBLIC_BACKEND_URL || 'http://localhost:3000',
  YOUTUBE_API_KEY: process.env.EXPO_PUBLIC_YOUTUBE_API_KEY || '',
};

export const isCloudReady =
  Config.SUPABASE_URL !== 'https://YOUR_PROJECT_REF.supabase.co' &&
  Config.SUPABASE_ANON_KEY !== 'YOUR_ANON_KEY';
