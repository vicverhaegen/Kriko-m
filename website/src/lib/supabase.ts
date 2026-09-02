import { createBrowserClient } from '@supabase/ssr'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://dcvrjpbbybkasppgjiyh.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder'

// Client-side Supabase client (gebruik in componenten)
export function createClient() {
  return createBrowserClient(supabaseUrl, supabaseAnonKey)
}

// Server-side Supabase client (gebruik in Server Components & API routes)
export async function createServerSupabaseClient() {
  const cookieStore = await cookies()
  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        } catch {
          // Server Component — cookies kunnen niet gezet worden, is ok
        }
      },
    },
  })
}

// Admin client met service role (alleen server-side, nooit naar client sturen)
import { createClient as createSupabaseClient } from '@supabase/supabase-js'

export function createAdminClient() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder'
  return createSupabaseClient(
    supabaseUrl,
    key,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}
