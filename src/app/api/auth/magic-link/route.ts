import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  console.log('[magic-link] POST endpoint called (Hosted Supabase)')
  const requestUrl = new URL(request.url)
  const formData = await request.formData()
  const email = String(formData.get('email'))

  console.log('[magic-link] Email received:', email)

  const supabase = createClient()
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${requestUrl.origin}/auth/callback`,
      shouldCreateUser: true,
    },
  })

  if (error) {
    console.error('[magic-link] Supabase error:', error)
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  console.log('[magic-link] Magic link request successful')
  return NextResponse.json(
    { message: 'Check your email for the magic link' },
    { status: 200 }
  )
} 