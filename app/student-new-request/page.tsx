'use client'

import { useEffect, useState } from "react"
import UserHeader from "@/components/user-header"
import NewRequestForm from "@/components/new-request-form"
import { useRouter } from "next/navigation"
import { useSupabase } from "@/components/providers/supabase-provider"

// These are the valid types and tags from the database schema
const availableTypes = ["tutorial", "explanation", "how_to_guide", "reference"]
const availableTags = ["math", "software", "ai"]

export default function StudentNewRequest() {
  const router = useRouter()
  const { isLoading, hasSession, supabase } = useSupabase()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [user, setUser] = useState<{ email: string } | null>(null)

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

        setUser({ email: currentUser.email || "" })
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred")
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [hasSession, supabase, router])

  const handleSubmit = async (formData: any) => {
    try {
      // Get current session
      console.log('Getting session...')
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      console.log('Session data:', session, 'Session error:', sessionError)
      
      if (sessionError) throw sessionError
      if (!session) throw new Error("Not authenticated")

      // Get current user's profile ID
      console.log('Getting profile for user:', session.user.id)
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("id")
        .eq("user_id", session.user.id)
        .single()
      console.log('Profile data:', profile, 'Profile error:', profileError)
      
      if (profileError) throw profileError
      if (!profile) throw new Error("Profile not found")

      // Create source using the API route
      console.log('Creating source...')
      const { data: { session: currentSession } } = await supabase.auth.getSession()
      if (!currentSession?.access_token) {
        throw new Error("No access token available")
      }
      
      const sourceResponse = await fetch("/api/sources", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${currentSession.access_token}`
        },
        body: JSON.stringify({
          title: formData.sourceName,
          url: formData.sourceUrl
        }),
      })
      console.log('Source response status:', sourceResponse.status)

      if (!sourceResponse.ok) {
        const errorData = await sourceResponse.json().catch(() => null)
        console.error('Source creation failed:', errorData)
        throw new Error(errorData?.error || "Failed to create source")
      }

      const { data: source } = await sourceResponse.json()
      console.log('Source created:', source)

      // Create request
      console.log('Creating request...')
      const requestResponse = await fetch("/api/requests", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({
          source_id: source.id,
          student_id: profile.id,
          content_type: formData.type,
          tag: formData.tag,
          start_time: parseInt(formData.startTime),
          end_time: parseInt(formData.endTime),
        }),
      })

      if (!requestResponse.ok) {
        const errorData = await requestResponse.json().catch(() => null)
        throw new Error(errorData?.error || "Failed to create request")
      }

      router.push("/home")
    } catch (error) {
      console.error("Error creating request:", error)
      setError(error instanceof Error ? error.message : "Failed to create request")
    }
  }

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
    return <div className="min-h-screen bg-white flex items-center justify-center">Loading...</div>
  }

  if (error) {
    return <div className="min-h-screen bg-white flex items-center justify-center text-red-500">{error}</div>
  }

  return (
    <div className="min-h-screen bg-white">
      <UserHeader email={user?.email || ""} userType="Student" />
      <main className="container mx-auto py-8 px-4">
        <h1 className="text-2xl font-bold mb-6">New Request</h1>
        <NewRequestForm
          availableTypes={availableTypes}
          availableTags={availableTags}
          onSubmit={handleSubmit}
        />
      </main>
    </div>
  )
}

