"use client"

import { useEffect, useState } from "react"
import UserHeader from "@/components/user-header"
import StudentRequestsTable from "@/components/student-requests-table"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"

export default function StudentHome() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [user, setUser] = useState<{ email: string } | null>(null)
  const [requests, setRequests] = useState([])
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

        setUser({ email: currentUser.email || "" })

        // Get user's profile to get their ID
        const { data: profiles, error: profileError } = await supabase
          .from("profiles")
          .select("id")
          .eq("user_id", currentUser.id)
          .single()
        if (profileError) throw profileError

        // Get user's requests
        const response = await fetch(`/api/requests?studentId=${profiles.id}`)
        if (!response.ok) throw new Error("Failed to fetch requests")
        const { data, error: requestsError } = await response.json()
        if (requestsError) throw requestsError

        setRequests(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred")
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [supabase])

  if (loading) {
    return <div className="min-h-screen bg-white flex items-center justify-center">Loading...</div>
  }

  if (error) {
    return <div className="min-h-screen bg-white flex items-center justify-center text-red-500">{error}</div>
  }

  return (
    <div className="min-h-screen bg-white">
      <UserHeader email={user?.email || ""} userType="Student" />
      <main className="container mx-auto py-8 px-4">
        <StudentRequestsTable requests={requests} />
        <div className="mt-6 flex justify-center">
          <Link href="/student-new-request" passHref>
            <Button className="bg-[#7C8CFF] hover:bg-[#666ECC] text-white">New Request</Button>
          </Link>
        </div>
      </main>
    </div>
  )
}

