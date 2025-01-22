import { createServerSupabaseClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')

  if (!code) {
    return NextResponse.redirect(new URL('/login?error=missing-code', requestUrl.origin))
  }

  const supabase = createServerSupabaseClient()
  const { data: { session }, error } = await supabase.auth.exchangeCodeForSession(code)

  if (error) {
    console.error('Auth error:', error)
    return NextResponse.redirect(new URL('/login?error=auth-failed', requestUrl.origin))
  }

  // Get the URL to redirect to after successful authentication
  const redirectTo = '/student-home'
  return NextResponse.redirect(new URL(redirectTo, requestUrl.origin))
} 