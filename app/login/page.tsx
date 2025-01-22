'use client'

import { FormEvent, useState } from 'react'
import { createBrowserSupabaseClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export default function LoginPage() {
  const supabase = createBrowserSupabaseClient()
  const [email, setEmail] = useState('')
  const router = useRouter()

  async function handleLogin(e: FormEvent) {
    e.preventDefault()
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
      },
    })
    if (!error) {
      // Show success notification or simply redirect
      router.push('/login?check_inbox=1')
    } else {
      console.error(error)
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <form onSubmit={handleLogin}>
        <Input
          type="email"
          onChange={(e) => setEmail(e.target.value)}
          placeholder="me@example.com"
          required
        />
        <Button type="submit" className="mt-2 bg-[#7C8CFF] text-white">
          Send Magic Link
        </Button>
      </form>
    </div>
  )
} 