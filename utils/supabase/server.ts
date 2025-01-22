import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export function createServerSupabaseClient() {
  const requestCookies = cookies()
  let cookiesToReturn: Response | undefined

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return requestCookies.getAll()
        },
        setAll(cookiesToSet) {
          // For normal server calls, you can set them on the cookies object
          cookiesToSet.forEach(({ name, value, options }) => {
            requestCookies.set(name, value, options)
          })
          // If you are returning a NextResponse in route handlers, manually copy them there
        },
      },
    }
  )

  return supabase
} 