"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import UserHeader from "@/components/user-header"
import ExpertRequestsTable from "@/components/expert-requests-table"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import type { Request, Profile } from "@/types"

export default function ExpertHome() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [user, setUser] = useState<Profile | null>(null)
  const [requests, setRequests] = useState<Request[]>([])
  const supabase = createClientComponentClient()

  useEffect(() => {
    async function loadData() {
      try {
        // Get current user
        const { data: { user: currentUser }, error: userError } = await supabase.auth.getUser()
        if (userError) throw userError

        if (!currentUser) {
          window.location.href = "/login"
          return
        }

        // Get user's profile
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("*")
          .eq("user_id", currentUser.id)
          .single()
        if (profileError) throw profileError

        setUser(profile)

        // Get requests assigned to this expert
        const { data: expertRequests, error: requestsError } = await supabase
          .from("requests")
          .select(`
            *,
            source:sources(*),
            student:profiles!requests_student_id_fkey(*)
          `)
          .eq("expert_id", profile.id)
          .order("created_at", { ascending: false })
        if (requestsError) throw requestsError

        setRequests(expertRequests)
      } catch (err) {
        console.error("Error loading data:", err)
        setError(err instanceof Error ? err.message : "An error occurred")
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [supabase])

  const handleRequestClick = (request: Request) => {
    router.push(`/expert-request/${request.id}`)
  }

  const handleAdvance = async (requestId: string) => {
    try {
      const request = requests.find(r => r.id === requestId)
      if (!request) return

      const newStatus = !request.started_at ? 
        { started_at: new Date().toISOString() } : 
        { finished_at: new Date().toISOString() }

      const { error: updateError } = await supabase
        .from("requests")
        .update(newStatus)
        .eq("id", requestId)
      
      if (updateError) throw updateError

      // Update local state
      setRequests(prevRequests =>
        prevRequests.map(req =>
          req.id === requestId ? { ...req, ...newStatus } : req
        )
      )
    } catch (err) {
      console.error("Error advancing request:", err)
      setError(err instanceof Error ? err.message : "Failed to advance request")
    }
  }

  if (loading) {
    return <div className="min-h-screen bg-white flex items-center justify-center">Loading...</div>
  }

  if (error) {
    return <div className="min-h-screen bg-white flex items-center justify-center text-red-500">{error}</div>
  }

  return (
    <div className="min-h-screen bg-white">
      <UserHeader email={user?.email || ""} userType="Expert" />
      <main className="container mx-auto py-8 px-4">
        <ExpertRequestsTable
          requests={requests}
          onRequestClick={handleRequestClick}
          onAdvance={handleAdvance}
        />
      </main>
    </div>
  )
}

