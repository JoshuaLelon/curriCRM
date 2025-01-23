'use client'

import { useEffect, useState } from "react"
import UserHeader from "@/components/user-header"
import NewRequestForm from "@/components/new-request-form"
import { useRouter } from "next/navigation"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"

// These are the valid types and tags from the database schema
const availableTypes = ["tutorial", "explanation", "how_to_guide", "reference"]
const availableTags = ["math", "software", "ai"]

export default function StudentNewRequest() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [user, setUser] = useState<{ email: string } | null>(null)
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
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred")
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [supabase])

  const handleSubmit = async (formData: any) => {
    try {
      // Get current user's profile ID
      const { data: { user: currentUser }, error: userError } = await supabase.auth.getUser()
      if (userError) throw userError
      if (!currentUser) throw new Error("Not authenticated")

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("id")
        .eq("user_id", currentUser.id)
        .single()
      if (profileError) throw profileError

      // Create source
      const { data: source, error: sourceError } = await supabase
        .from("sources")
        .insert([{
          title: formData.sourceName,
          URL: formData.sourceUrl,
          created_by: profile.id
        }])
        .select()
        .single()
      if (sourceError) throw sourceError

      // Create request
      const response = await fetch("/api/requests", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
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

      if (!response.ok) {
        throw new Error("Failed to create request")
      }

      router.push("/student-home")
    } catch (error) {
      console.error("Error creating request:", error)
      alert("Failed to create request")
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

