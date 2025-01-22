import { createServerSupabaseClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const error = requestUrl.searchParams.get('error')
  const errorDescription = requestUrl.searchParams.get('error_description')

  // Handle error cases first
  if (error || !code) {
    console.error('Auth error:', { error, errorDescription })
    const searchParams = new URLSearchParams()
    if (error) searchParams.set('error', error)
    if (errorDescription) searchParams.set('error_description', errorDescription)
    return NextResponse.redirect(new URL(`/login?${searchParams.toString()}`, requestUrl.origin))
  }

  try {
    const supabase = createServerSupabaseClient()
    const { data: { session }, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

    if (exchangeError) {
      console.error('Session exchange error:', exchangeError)
      return NextResponse.redirect(
        new URL('/login?error=auth_failed&error_description=' + encodeURIComponent(exchangeError.message),
        requestUrl.origin
      ))
    }

    // Successful auth - redirect to home
    const redirectTo = session?.user?.user_metadata?.role === 'expert' 
      ? '/expert-home'
      : '/student-home'
    
    return NextResponse.redirect(new URL(redirectTo, requestUrl.origin))
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.redirect(
      new URL('/login?error=unexpected&error_description=' + encodeURIComponent('An unexpected error occurred'),
      requestUrl.origin
    ))
  }
} 