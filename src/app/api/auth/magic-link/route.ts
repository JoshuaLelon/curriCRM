import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  console.info('[magic-link] POST endpoint (server log)')

  const requestUrl = new URL(request.url)
  const formData = await request.formData()
  const email = String(formData.get('email'))

  console.info(`[magic-link] Email from formData: ${email}`)

  const supabase = createClient()
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${requestUrl.origin}/auth/callback`,
      shouldCreateUser: true,
    },
  })

  if (error) {
    console.warn(`[magic-link] signInWithOtp error: ${error.message}`)
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  console.info('[magic-link] signInWithOtp success')
  return NextResponse.json({ message: 'Check your email for the magic link' }, { status: 200 })
} 