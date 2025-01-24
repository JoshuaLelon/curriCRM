"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useSupabase } from '@/components/providers/supabase-provider'
import UserHeader from "@/components/user-header"

interface User {
  email: string
  role: "student" | "expert" | "admin"
}

export default function AuthHeader() {
  const { isLoading, hasSession, supabase } = useSupabase()
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    if (!isLoading && !hasSession) {
      router.push('/login')
      return
    }

    async function loadUser() {
      if (!hasSession) return

      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (!authUser?.email) return

      // Get user's profile to determine role
      const { data: profiles } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", authUser.id)

      const profile = profiles?.[0]
      if (!profile) return

      // Determine role based on profile fields
      const role = profile.is_admin ? "admin" : profile.specialty ? "expert" : "student"

      setUser({
        email: authUser.email,
        role
      })
    }

    loadUser()
  }, [hasSession, supabase, router, isLoading])

  if (isLoading || !hasSession || !user) {
    return null
  }

  return <UserHeader email={user.email} userType={user.role} />
} 