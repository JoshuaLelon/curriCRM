"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import UserHeader from "@/components/user-header"
import RequestsTable from "@/components/requests-table"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import type { Request, Profile } from "@/types"

export default function AdminHome() {
  const router = useRouter()
  const [requests, setRequests] = useState<Request[]>([])
  const [experts, setExperts] = useState<Profile[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClientComponentClient()

  useEffect(() => {
    async function fetchData() {
      try {
        setIsLoading(true)
        setError(null)

        // Fetch all requests
        const { data: requestsData, error: requestsError } = await supabase
          .from("requests")
          .select(`
            *,
            source:sources(*),
            student:profiles!requests_student_id_fkey(*),
            expert:profiles!requests_expert_id_fkey(*)
          `)
          .order("created_at", { ascending: false })

        if (requestsError) throw new Error("Failed to fetch requests")

        // Fetch all experts (profiles with specialty)
        const { data: expertsData, error: expertsError } = await supabase
          .from("profiles")
          .select("*")
          .not("specialty", "is", null)

        if (expertsError) throw new Error("Failed to fetch experts")

        setRequests(requestsData)
        setExperts(expertsData)
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred")
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [supabase])

  const handleRequestClick = (request: Request) => {
    if (request.finished_at) {
      router.push(`/student-request/${request.id}/finished`)
    } else {
      router.push(`/student-request/${request.id}/in-progress`)
    }
  }

  const handleExpertChange = async (requestId: string, expertId: string) => {
    try {
      const expert = experts.find((e) => e.id.toString() === expertId)
      if (!expert) return

      const { error } = await supabase
        .from("requests")
        .update({ expert_id: expert.id })
        .eq("id", requestId)

      if (error) throw error

      setRequests((prevRequests) =>
        prevRequests.map((req) =>
          req.id === requestId ? { ...req, expert } : req
        )
      )
    } catch (err) {
      console.error("Failed to update expert:", err)
      alert("Failed to update expert")
    }
  }

  const handleDeleteRequest = async (requestId: string) => {
    try {
      const { error } = await supabase.from("requests").delete().eq("id", requestId)
      if (error) throw error

      setRequests((prevRequests) => prevRequests.filter((req) => req.id !== requestId))
    } catch (err) {
      console.error("Failed to delete request:", err)
      alert("Failed to delete request")
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white">
        <UserHeader email="Loading..." userType="Admin" />
        <main className="container mx-auto py-8 px-4">
          <div className="animate-pulse space-y-4">
            <div className="h-10 bg-gray-200 rounded w-full" />
            <div className="h-64 bg-gray-200 rounded w-full" />
          </div>
        </main>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white">
        <UserHeader email="Error" userType="Admin" />
        <main className="container mx-auto py-8 px-4">
          <div className="text-red-600">Error: {error}</div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      <UserHeader email="admin@example.com" userType="Admin" />
      <main className="container mx-auto py-8 px-4">
        <RequestsTable
          requests={requests}
          experts={experts}
          onRequestClick={handleRequestClick}
          onExpertChange={handleExpertChange}
          onDeleteRequest={handleDeleteRequest}
        />
      </main>
    </div>
  )
}

