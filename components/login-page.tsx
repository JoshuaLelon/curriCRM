"use client"

import { useState, FormEvent, useMemo } from "react"
import { createBrowserClient } from '@supabase/ssr'
import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface LoginPageProps {
  userType: string
}

export default function LoginPage({ userType }: LoginPageProps) {
  const supabase = useMemo(() => 
    createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    ), 
  [])
  const [email, setEmail] = useState("")
  const router = useRouter()
  const [showNotification, setShowNotification] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()    
    setError(null)
    
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`
        }
      })

      if (error) {
        console.error('Auth error:', error)
        setError(error.message)
        return
      }

      setShowNotification(true)
      setTimeout(() => setShowNotification(false), 3000)
      router.push('/login?check_inbox=1')
    } catch (err) {
      console.error('Unexpected error:', err)
      setError('An unexpected error occurred')
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <h1 className="text-2xl font-semibold mb-8">Welcome to Curricrm</h1>

      <div className="w-full max-w-sm bg-[#E6F4FF] p-6 rounded-lg">
        <h2 className="text-xl font-medium text-center mb-4">
          Sign In
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            type="email"
            placeholder="name@org.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="bg-white"
          />

          <Button type="submit" className="w-full bg-[#7C8CFF] hover:bg-[#666ECC] text-white">
            Send Magic Link
          </Button>
        </form>

        {error && (
          <div className="mt-4 text-red-600 bg-red-50 px-4 py-2 rounded">{error}</div>
        )}

        {showNotification && (
          <div className="mt-4 text-green-600 bg-green-50 px-4 py-2 rounded">
            Check your email for the magic link!
          </div>
        )}
      </div>
    </div>
  )
}

