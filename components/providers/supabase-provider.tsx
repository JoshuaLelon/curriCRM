'use client'

import { createBrowserSupabaseClient } from '@/utils/supabase/client'
import { useRouter, usePathname } from 'next/navigation'
import { createContext, useContext, useEffect, useState } from 'react'
import type { SupabaseClient } from '@supabase/supabase-js'

interface SupabaseContextType {
  isLoading: boolean
  hasSession: boolean
  supabase: SupabaseClient
}

const SupabaseContext = createContext<SupabaseContextType>({
  isLoading: true,
  hasSession: false,
  supabase: createBrowserSupabaseClient(),
})

export function SupabaseProvider({ children }: { children: React.ReactNode }) {
  const [supabase] = useState(() => createBrowserSupabaseClient())
  const [isLoading, setIsLoading] = useState(true)
  const [hasSession, setHasSession] = useState(false)
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    let mounted = true

    async function checkSession(retryCount = 0) {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        console.log('Provider session check:', {
          hasSession: !!session,
          error: error || 'none',
          pathname,
          userId: session?.user?.id || 'none',
          retryCount
        })
        
        if (error) {
          throw error
        }
        
        if (mounted) {
          setHasSession(!!session)
          setIsLoading(false)

          // Initial redirect if needed
          if (session && (pathname === '/login' || pathname === '/')) {
            router.push('/home')
          } else if (!session && pathname !== '/login' && !pathname?.startsWith('/auth')) {
            router.push('/login')
          }
        }
      } catch (error) {
        console.error('Session check error:', error)
        
        // Retry up to 3 times with exponential backoff
        if (retryCount < 3 && mounted) {
          const delay = Math.pow(2, retryCount) * 1000 // 1s, 2s, 4s
          console.log(`Retrying session check in ${delay}ms...`)
          setTimeout(() => checkSession(retryCount + 1), delay)
          return
        }
        
        if (mounted) {
          setHasSession(false)
          setIsLoading(false)
          // If all retries fail, redirect to login
          if (pathname !== '/login' && !pathname?.startsWith('/auth')) {
            router.push('/login')
          }
        }
      }
    }

    // Initial session check
    checkSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', { 
        event, 
        userId: session?.user?.id || 'none',
        pathname 
      })

      if (!mounted) return

      setHasSession(!!session)
      
      if (event === 'SIGNED_IN') {
        const isAuthRoute = pathname === '/login' || pathname?.startsWith('/auth')
        if (isAuthRoute) {
          router.push('/home')
        }
      } else if (event === 'SIGNED_OUT') {
        router.push('/login')
      }
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [supabase, router, pathname])

  return (
    <SupabaseContext.Provider value={{ isLoading, hasSession, supabase }}>
      {children}
    </SupabaseContext.Provider>
  )
}

export function useSupabase() {
  return useContext(SupabaseContext)
} 