import { createServerClient } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'

export async function updateSession(request: NextRequest) {
  try {
    // Create a response early to modify cookies
    let response = NextResponse.next({
      request: {
        headers: request.headers,
      },
    })

    const cookieOptions = {
      path: '/',
      sameSite: 'lax' as const,
      httpOnly: true, // Re-enable httpOnly for security
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 7 // 1 week
    }

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return request.cookies.get(name)?.value
          },
          set(name: string, value: string, options: any) {
            response.cookies.set({
              name,
              value,
              ...options,
              ...cookieOptions
            })
          },
          remove(name: string, options: any) {
            response.cookies.set({
              name,
              value: '',
              ...options,
              ...cookieOptions,
              maxAge: 0
            })
          },
        },
        auth: {
          flowType: 'pkce',
          autoRefreshToken: true,
          detectSessionInUrl: true,
          persistSession: true,
        }
      }
    )

    // Refresh the session if it exists
    const { data: { session }, error } = await supabase.auth.getSession()
    
    console.log("Middleware session check:", {
      hasSession: !!session,
      error: error || 'none',
      path: request.nextUrl.pathname,
      userId: session?.user?.id || 'none',
      cookies: request.cookies.getAll().map(c => c.name)
    })

    // Only redirect if not on auth-related pages or during auth flow
    const isAuthRoute = request.nextUrl.pathname.startsWith('/auth') || 
                       request.nextUrl.pathname.startsWith('/login')
    const isAuthFlow = request.nextUrl.searchParams.has('code') || 
                      request.nextUrl.searchParams.has('error')
    
    if (!session && !isAuthRoute && !isAuthFlow) {
      const redirectUrl = new URL('/login', request.url)
      return NextResponse.redirect(redirectUrl)
    }

    // Copy all auth cookies from response to ensure they persist
    const authCookies = response.cookies.getAll()
      .filter(cookie => cookie.name.includes('auth'))
    
    for (const cookie of authCookies) {
      response.cookies.set({
        name: cookie.name,
        value: cookie.value,
        ...cookieOptions,
        httpOnly: true // Ensure httpOnly is set for auth cookies
      })
    }

    return response
  } catch (e) {
    console.error('Middleware error:', e)
    // On error, still allow the request to proceed
    return NextResponse.next({
      request: {
        headers: request.headers,
      },
    })
  }
} 