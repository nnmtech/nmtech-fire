// Client-side configuration
// These values are embedded at build time
export const config = {
  remotionApiUrl: process.env.NEXT_PUBLIC_REMOTION_API_URL || 'http://localhost:3001',
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ||  '',
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
}
