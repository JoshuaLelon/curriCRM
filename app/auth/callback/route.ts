import { createServerSupabaseClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')

  if (code) {
    const supabase = createServerSupabaseClient()
    const { data: { session }, error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      // Get the URL to redirect to after successful authentication
      const redirectTo = '/student-home'
      
      // Create response with redirect
      const response = NextResponse.redirect(new URL(redirectTo, requestUrl.origin))
      
      // Set the auth cookie in the response
      const cookieStore = cookies()
      const authCookie = cookieStore.get('sb-auth-token')
      if (authCookie) {
        response.cookies.set({
          name: authCookie.name,
          value: authCookie.value,
          ...authCookie.options,
        })
      }
      
      return response
    }
  }

  // Handle error cases
  return NextResponse.redirect(new URL('/login?error=auth-failed', requestUrl.origin))
} 