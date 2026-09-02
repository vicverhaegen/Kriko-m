import { createBrowserClient } from '@supabase/ssr'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://dcvrjpbbybkasppgjiyh.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder'

export function createClient() {
  return createBrowserClient(supabaseUrl, supabaseAnonKey, {
    cookieOptions: {
      maxAge: 60 * 60 * 24 * 365,
      sameSite: 'lax',
      path: '/',
    },
  })
}
