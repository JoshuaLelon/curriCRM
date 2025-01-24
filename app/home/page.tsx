"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import StudentHome from "@/components/home/student-home"
import ExpertHome from "@/components/home/expert-home"
import AdminHome from "@/components/home/admin-home"
import type { Request, Profile } from "@/types"
import { useSupabase } from '@/components/providers/supabase-provider'

interface User {
  email: string
  role: "student" | "expert" | "admin"
}

export default function HomePage() {
  const { isLoading, hasSession, supabase } = useSupabase()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [requests, setRequests] = useState<Request[]>([])
  const [experts, setExperts] = useState<Profile[]>([])

  useEffect(() => {
    if (!isLoading && !hasSession) {
      router.push('/login')
    }
  }, [isLoading, hasSession, router])

  useEffect(() => {
    async function loadData() {
      if (!hasSession) return // Don't load data if no session

      try {
        // Get current user
        const { data: { user: currentUser }, error: userError } = await supabase.auth.getUser()
        if (userError) throw userError

        if (!currentUser) {
          router.push("/login")
          return
        }

        // Get user's profile to determine role
        const { data: profiles, error: profileError } = await supabase
          .from("profiles")
          .select("*")
          .eq("user_id", currentUser.id)
        if (profileError) throw profileError

        console.log('Found profiles:', profiles)

        // Use the first profile or create one if none exists
        let profile = profiles?.[0]
        if (!profile) {
          const { data: newProfile, error: insertError } = await supabase
            .from("profiles")
            .insert([{
              user_id: currentUser.id,
              email: currentUser.email,
              is_admin: false
            }])
            .select()
            .single()
          
          if (insertError) throw insertError
          profile = newProfile
        }

        console.log('Using profile:', profile)

        // Determine role based on profile fields
        const role = profile.is_admin ? "admin" : profile.specialty ? "expert" : "student"
        console.log('Determined role:', role)

        setUser({
          email: currentUser.email || "",
          role
        })

        // Load relevant requests based on role
        let requestsQuery
        if (role === "student") {
          console.log('Making student query')
          requestsQuery = supabase
            .from("requests")
            .select(`
              *,
              source:sources(*),
              expert:profiles!requests_expert_id_fkey(
                id,
                email,
                specialty,
                is_admin
              )
            `)
        } else if (role === "expert") {
          requestsQuery = supabase
            .from("requests")
            .select(`
              *,
              source:sources(*),
              student:profiles!requests_student_id_fkey(
                id,
                email,
                specialty,
                is_admin
              )
            `)
            .eq("expert_id", profile.id)
        } else {
          // Admin sees all requests
          requestsQuery = supabase
            .from("requests")
            .select(`
              *,
              source:sources(*),
              student:profiles!requests_student_id_fkey(
                id,
                email,
                specialty,
                is_admin
              ),
              expert:profiles!requests_expert_id_fkey(
                id,
                email,
                specialty,
                is_admin
              ),
              curriculum:curriculums!curriculums_request_id_fkey (
                *,
                curriculum_nodes (*)
              )
            `)
        }

        const { data: requestsData, error: requestsError } = await requestsQuery
        if (requestsError) {
          console.error('Request query error:', requestsError)
          throw requestsError
        }
        console.log('Request query successful:', requestsData)
        setRequests(requestsData)

        // Load experts list if admin
        if (role === "admin") {
          console.log('Loading experts for admin')
          const { data: expertsData, error: expertsError } = await supabase
            .from("profiles")
            .select("*")
            .not("specialty", "is", null)
          if (expertsError) throw expertsError
          console.log('Found experts:', expertsData)
          setExperts(expertsData)
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred")
      } finally {
        setLoading(false)
      }
    }

    if (hasSession) {
      loadData()
    }
  }, [hasSession, supabase, router])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  if (!hasSession) {
    return null // Will redirect in useEffect
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <div className="animate-pulse space-y-4">
          <div className="h-16 bg-gray-200" />
          <div className="container mx-auto px-4">
            <div className="h-64 bg-gray-200 rounded" />
          </div>
        </div>
      </div>
    )
  }

  if (error || !user) {
    return (
      <div className="min-h-screen bg-white">
        <div className="container mx-auto px-4 py-8">
          <div className="text-red-600">{error || "User not found"}</div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      <main className="container mx-auto py-8 px-4">
        {user.role === "student" && (
          <StudentHome requests={requests} email={user.email} />
        )}
        {user.role === "expert" && (
          <ExpertHome requests={requests} email={user.email} />
        )}
        {user.role === "admin" && (
          <AdminHome requests={requests} experts={experts} email={user.email} />
        )}
      </main>
    </div>
  )
} 