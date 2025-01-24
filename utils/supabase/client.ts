import { createBrowserClient } from '@supabase/ssr'

export function createBrowserSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  
  return createBrowserClient(supabaseUrl, supabaseKey, {
    cookies: {
      get(name: string) {
        if (typeof document === 'undefined') return undefined
        const cookie = document.cookie
          .split('; ')
          .find((row) => row.startsWith(`${name}=`))
        return cookie ? decodeURIComponent(cookie.split('=')[1]) : undefined
      },
      set(name: string, value: string, options: { maxAge?: number; path?: string }) {
        if (typeof document === 'undefined') return
        const maxAge = options.maxAge || 60 * 60 * 24 * 7 // 1 week
        const isAuthCookie = name.includes('auth')
        
        document.cookie = `${name}=${encodeURIComponent(value)}; path=${
          options.path || '/'
        }; max-age=${maxAge}; SameSite=Lax; ${
          process.env.NODE_ENV === 'production' ? 'Secure;' : ''
        }`

        // Also set the code verifier cookie if this is a PKCE flow
        if (name.includes('code-verifier')) {
          const verifierCookie = `sb-umpdxfvwsgbaqeljigmr-auth-token-code-verifier=${encodeURIComponent(value)}; path=/; max-age=${maxAge}; SameSite=Lax; ${
            process.env.NODE_ENV === 'production' ? 'Secure;' : ''
          }`
          document.cookie = verifierCookie
        }
      },
      remove(name: string, options?: { path?: string }) {
        if (typeof document === 'undefined') return
        document.cookie = `${name}=; path=${options?.path || '/'}; max-age=0`
        
        // Also remove the code verifier cookie if this is an auth cookie
        if (name.includes('auth')) {
          document.cookie = `sb-umpdxfvwsgbaqeljigmr-auth-token-code-verifier=; path=/; max-age=0`
        }
      },
    },
    auth: {
      flowType: 'pkce',
      autoRefreshToken: true,
      detectSessionInUrl: true,
      persistSession: true,
    },
  })
} 