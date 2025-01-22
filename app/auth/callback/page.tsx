import { createServerSupabaseClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

export default async function AuthCallback() {
  const supabase = createServerSupabaseClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  // You can handle error or no-user scenario
  if (!user || error) {
    return <div>Sign in link invalid or expired.</div>
  }

  // If sign-in is good, you might redirect them to a user dashboard or wherever
  redirect('/student-home')
} 