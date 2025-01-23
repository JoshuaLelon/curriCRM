"use client"

import { useEffect, useState } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { useRouter } from "next/navigation"
import UserHeader from "@/components/user-header"
import StudentHome from "@/components/home/student-home"
import ExpertHome from "@/components/home/expert-home"
import AdminHome from "@/components/home/admin-home"
import type { Request, Profile } from "@/types"

interface User {
  email: string
  role: "student" | "expert" | "admin"
}

export default function HomePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [requests, setRequests] = useState<Request[]>([])
  const [experts, setExperts] = useState<Profile[]>([])
  const supabase = createClientComponentClient()

  useEffect(() => {
    async function loadData() {
      try {
        // Get current user
        const { data: { user: currentUser }, error: userError } = await supabase.auth.getUser()
        if (userError) throw userError

        if (!currentUser) {
          router.push("/login")
          return
        }

        // Get user's profile to determine role
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("*")
          .eq("user_id", currentUser.id)
          .single()
        if (profileError) throw profileError

        setUser({
          email: currentUser.email || "",
          role: profile.role
        })

        // Load relevant requests based on role
        let requestsQuery
        if (profile.role === "student") {
          requestsQuery = supabase
            .from("requests")
            .select("*, source(*), expert(*)")
            .eq("student_id", profile.id)
        } else if (profile.role === "expert") {
          requestsQuery = supabase
            .from("requests")
            .select("*, source(*), student:profiles!requests_student_id_fkey(*)")
            .eq("expert_id", profile.id)
        } else {
          // Admin sees all requests
          requestsQuery = supabase
            .from("requests")
            .select("*, source(*), student:profiles!requests_student_id_fkey(*), expert:profiles!requests_expert_id_fkey(*)")
        }

        const { data: requestsData, error: requestsError } = await requestsQuery
        if (requestsError) throw requestsError
        setRequests(requestsData)

        // Load experts list if admin
        if (profile.role === "admin") {
          const { data: expertsData, error: expertsError } = await supabase
            .from("profiles")
            .select("*")
            .eq("role", "expert")
          if (expertsError) throw expertsError
          setExperts(expertsData)
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred")
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [supabase, router])

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
      <UserHeader email={user.email} userType={user.role} />
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