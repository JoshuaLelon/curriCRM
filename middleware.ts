import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import type { Database } from '@/types/supabase'

export async function middleware(req: NextRequest) {
  console.log(`[Middleware] Processing request for: ${req.nextUrl.pathname}`)
  
  // Skip middleware for auth-related paths
  if (req.nextUrl.pathname.startsWith('/auth/') || req.nextUrl.pathname === '/login') {
    console.log('[Middleware] Skipping auth path')
    return NextResponse.next()
  }
  
  const res = NextResponse.next()
  
  const cookieOptions = {
    path: '/',
    sameSite: 'lax' as const,
    secure: false, // Allow non-HTTPS in development
    maxAge: 60 * 60 * 24 * 7 // 1 week
  }
  
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          const cookie = req.cookies.get(name)
          console.log(`[Middleware Cookie Get] ${name}:`, cookie?.value || 'not found')
          return cookie?.value
        },
        set(name: string, value: string, options: any) {
          console.log(`[Middleware Cookie Set] Setting ${name}`)
          try {
            res.cookies.set({
              name,
              value,
              ...cookieOptions,
            })
          } catch (error) {
            console.error(`[Middleware Cookie Set] Error setting ${name}:`, error)
          }
        },
        remove(name: string, options: any) {
          console.log(`[Middleware Cookie Remove] Removing ${name}`)
          try {
            res.cookies.set({
              name,
              value: '',
              ...cookieOptions,
            })
          } catch (error) {
            console.error(`[Middleware Cookie Remove] Error removing ${name}:`, error)
          }
        },
      },
      global: {
        headers: {
          'Accept': 'application/json'
        }
      }
    }
  )

  try {
    const { data: { session } } = await supabase.auth.getSession()
    console.log(`[Middleware] Session check for ${req.nextUrl.pathname}:`, session ? 'authenticated' : 'no session')
  } catch (error) {
    console.error('[Middleware] Error checking session:', error)
  }
  
  return res
}

// Ensure the middleware is only called for relevant paths
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     * - auth paths
     */
    '/((?!_next/static|_next/image|favicon.ico|public/|auth/).*)',
  ],
} 