import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          tier: 'free' | 'paid'
          render_count_month: number
          render_limit_month: number
          last_reset_date: string
          metadata: any
          created_at: string
          updated_at: string
        }
      }
      videos: {
        Row: {
          id: string
          user_id: string | null
          execution_id: string
          title: string | null
          composition_type: 'TextScene' | 'ImageScene' | 'MultiSceneVideo'
          duration_seconds: number | null
          status: 'pending' | 'rendering' | 'completed' | 'failed'
          supabase_path: string | null
          public_url: string | null
          thumbnail_url: string | null
          file_size_bytes: number | null
          resolution: string
          fps: number
          format: string
          has_watermark: boolean
          input_props: any
          render_duration_ms: number | null
          error_message: string | null
          created_at: string
          started_at: string | null
          completed_at: string | null
          updated_at: string
        }
      }
    }
  }
}

// Client-side Supabase client
export function createClient() {
  return createClientComponentClient<Database>()
}

// Server-side Supabase client (Server Components)
export async function createServerClient() {
  const cookieStore = await cookies()
  return createServerComponentClient<Database>({
    cookies: () => cookieStore
  })
}

// Route Handler Supabase client (API routes)
export async function createRouteClient() {
  const cookieStore = await cookies()
  return createRouteHandlerClient<Database>({
    cookies: () => cookieStore
  })
}
