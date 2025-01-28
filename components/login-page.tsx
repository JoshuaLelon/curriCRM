"use client"

import { useState, FormEvent, useEffect } from "react"
import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useSupabase } from '@/components/providers/supabase-provider'

interface LoginPageProps {
  userType: string
  alternateLogins?: any[]
}

export default function LoginPage({ userType, alternateLogins = [] }: LoginPageProps) {
  const { isLoading: isSessionLoading, hasSession, supabase } = useSupabase()
  const [email, setEmail] = useState("")
  const router = useRouter()
  const [showNotification, setShowNotification] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    console.log('[Login] Session state:', { isSessionLoading, hasSession })
    if (!isSessionLoading && hasSession) {
      console.log('[Login] Has session, redirecting to /home')
      router.replace('/home')
      return
    }
  }, [isSessionLoading, hasSession, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()    
    setError(null)
    setIsLoading(true)
    
    console.log('[Login] Starting magic link sign in for:', email)
    
    try {
      const redirectTo = `${window.location.origin}/auth/callback`
      console.log('[Login] Redirect URL:', redirectTo)
      
      const { data, error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: redirectTo,
          data: {
            userType
          }
        }
      })

      console.log('[Login] Sign in attempt result:', {
        error: error || 'none',
        data
      })

      if (error) {
        console.error('[Login] Auth error:', error)
        setError(error.message)
        return
      }

      setShowNotification(true)
      router.push('/login?check_inbox=1')
    } catch (err) {
      console.error('[Login] Unexpected error:', err)
      setError('An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  if (hasSession) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  if (isSessionLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    )
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
            disabled={isLoading}
          />

          <Button 
            type="submit" 
            className="w-full bg-[#7C8CFF] hover:bg-[#666ECC] text-white"
            disabled={isLoading}
          >
            {isLoading ? 'Sending...' : 'Send Magic Link'}
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

