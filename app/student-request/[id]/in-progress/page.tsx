"use client"

import { useEffect, useState } from "react"
import UserHeader from "@/components/user-header"
import RequestDetails from "@/components/request-details"
import Chat from "@/components/chat"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"

interface Message {
  id: string
  content: string
  created_at: string
  sender: {
    id: string
    email: string
  }
}

interface Request {
  id: string
  source: {
    title: string
    URL: string
  } | null
  content_type: string
  tag: string
  created_at: string
  started_at: string | null
  expert: {
    id: string
    email: string
  } | null
  messages: Message[]
}

export default function StudentInProgressRequestPage({
  params,
}: {
  params: { id: string }
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [user, setUser] = useState<{ email: string } | null>(null)
  const [request, setRequest] = useState<Request | null>(null)
  const supabase = createClientComponentClient()
  const [refreshKey, setRefreshKey] = useState(0)

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

        // Get request data
        const response = await fetch(`/api/requests/${params.id}`)
        if (!response.ok) throw new Error("Failed to fetch request")
        const { data, error: requestError } = await response.json()
        if (requestError) throw requestError

        setRequest(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred")
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [supabase, params.id, refreshKey])

  const handleDelete = async () => {
    try {
      const response = await fetch(`/api/requests/${params.id}`, {
        method: "DELETE",
      })
      if (!response.ok) throw new Error("Failed to delete request")
      router.push("/student-home")
    } catch (error) {
      console.error("Error deleting request:", error)
      alert("Failed to delete request")
    }
  }

  if (loading) {
    return <div className="min-h-screen bg-white flex items-center justify-center">Loading...</div>
  }

  if (error || !request) {
    return <div className="min-h-screen bg-white flex items-center justify-center text-red-500">{error || "Request not found"}</div>
  }

  const getTimeElapsed = (dateString: string) => {
    const created = new Date(dateString)
    const now = new Date()
    const diffDays = Math.floor((now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24))
    return `${diffDays} days`
  }

  return (
    <div className="min-h-screen bg-white">
      <UserHeader email={user?.email || ""} userType="Student" />
      <main className="container mx-auto py-8 px-4 space-y-6">
        <RequestDetails
          source={request.source?.title || "No source"}
          tag={request.tag}
          requestType={request.content_type.replace("_", " ")}
          timeElapsed={getTimeElapsed(request.created_at)}
          positionInLine={null}
          status="in_progress"
          expertAssigned={request.expert?.email.split("@")[0] || "Not assigned"}
        />
        <Chat
          messages={request.messages}
          currentUserEmail={user?.email || ""}
          requestId={request.id}
          onMessageSent={() => setRefreshKey(k => k + 1)}
        />
        <div className="flex justify-center gap-4">
          <Link href="/student-home">
            <Button variant="secondary" className="bg-[#7C8CFF] hover:bg-[#666ECC] text-white">
              Home
            </Button>
          </Link>
          <Button variant="destructive" onClick={handleDelete}>
            Delete
          </Button>
        </div>
      </main>
    </div>
  )
}
