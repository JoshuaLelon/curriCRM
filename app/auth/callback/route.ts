import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  console.log('\n\n🔐 =====================================')
  console.log('🔐 MAGIC LINK CALLBACK ROUTE TRIGGERED')
  console.log('🔐 =====================================\n')
  
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const next = requestUrl.searchParams.get('next') ?? '/home'
  
  if (!code) {
    console.log('No code present, redirecting to:', next)
    return NextResponse.redirect(new URL(next, request.url))
  }

  const cookieStore = cookies()

  // Log all cookies for debugging
  const allCookies = cookieStore.getAll()
  console.log('Available cookies:', allCookies.map(c => `${c.name}: ${c.value}`))
  
  // Get the code verifier from cookies - using the full cookie name
  const codeVerifier = cookieStore.get('sb-umpdxfvwsgbaqeljigmr-auth-token-code-verifier')?.value

  console.log('Code verifier:', codeVerifier ? 'present' : 'missing')
  
  const cookieOptions = {
    path: '/',
    sameSite: 'lax' as const,
    // httpOnly: true, // Removed to allow client-side access
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 24 * 7 // 1 week
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: any) {
          try {
            cookieStore.set({
              name,
              value,
              ...options,
              ...cookieOptions
            })
          } catch (error) {
            console.error('Error setting cookie:', name, error)
          }
        },
        remove(name: string, options: any) {
          try {
            cookieStore.set({
              name,
              value: '',
              ...options,
              ...cookieOptions,
              maxAge: 0
            })
          } catch (error) {
            console.error('Error removing cookie:', name, error)
          }
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

  try {
    // Exchange the code for a session using the code verifier
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
    if (exchangeError) {
      console.error('Session exchange error:', exchangeError)
      // Log more details about the error
      console.error('Exchange attempt details:', {
        code,
        codeVerifier: codeVerifier ? 'present' : 'missing',
        error: exchangeError.message
      })
      return NextResponse.redirect(new URL('/login?error=auth_error', request.url))
    }

    // Verify we have a session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    if (!session || sessionError) {
      console.error('Session verification failed:', sessionError || 'No session')
      return NextResponse.redirect(new URL('/login?error=no_session', request.url))
    }

    // Create response with redirect
    const response = NextResponse.redirect(new URL(next, request.url))

    // Copy auth cookies to response
    const authCookies = cookieStore.getAll()
      .filter(cookie => cookie.name.includes('auth'))
    
    for (const cookie of authCookies) {
      response.cookies.set({
        name: cookie.name,
        value: cookie.value,
        ...cookieOptions
      })
    }

    // Log success
    console.log('Auth callback successful, redirecting to:', next)
    console.log('Session user:', session.user.email)
    console.log('Cookies being set:', authCookies.map(c => c.name))

    return response
  } catch (error) {
    console.error('Auth callback error:', error)
    return NextResponse.redirect(new URL('/login?error=unknown', request.url))
  }
} 