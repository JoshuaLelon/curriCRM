import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'

export function createClient() {
  console.info('[supabase/server] Creating Supabase client (server log)')
  const cookieStore = cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            console.info(`[supabase/server] Setting cookie: ${name}`)
            cookieStore.set({ name, value, ...options })
          } catch (error) {
            console.error('[supabase/server] Cookie set error:', error)
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            console.info(`[supabase/server] Removing cookie: ${name}`)
            cookieStore.delete({ name, ...options })
          } catch (error) {
            console.error('[supabase/server] Cookie remove error:', error)
          }
        },
      },
    }
  )
} 