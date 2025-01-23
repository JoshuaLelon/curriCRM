"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import type { Request, CurriculumNode, Source } from "@/types/request"
import StudentView from "@/components/request/student-view"
import ExpertView from "@/components/request/expert-view"
import AdminView from "@/components/request/admin-view"

interface Profile {
  id: string
  user_id: string
  role: "student" | "expert" | "admin"
  email: string
}

export default function RequestPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [request, setRequest] = useState<Request | null>(null)
  const [currentUser, setCurrentUser] = useState<Profile | null>(null)
  const [experts, setExperts] = useState<Profile[]>([])
  const supabase = createClientComponentClient()

  // Fetch request data and user profile
  useEffect(() => {
    async function loadData() {
      try {
        // Get current user
        const { data: { user }, error: userError } = await supabase.auth.getUser()
        if (userError) throw userError

        if (!user) {
          router.push("/login")
          return
        }

        // Get user's profile with role
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("*")
          .eq("user_id", user.id)
          .single()
        if (profileError) throw profileError

        setCurrentUser(profile)

        // Get request details
        const { data: requestData, error: requestError } = await supabase
          .from("requests")
          .select(`
            *,
            source:sources(*),
            student:profiles!requests_student_id_fkey(*),
            expert:profiles!requests_expert_id_fkey(*),
            curriculum:curriculums (
              *,
              curriculum_nodes (
                *,
                source:sources(*)
              )
            ),
            messages (
              *,
              sender:profiles(*)
            )
          `)
          .eq("id", params.id)
          .single()
        if (requestError) throw requestError

        setRequest(requestData)

        // If admin, fetch list of experts
        if (profile.role === "admin") {
          const { data: expertsData, error: expertsError } = await supabase
            .from("profiles")
            .select("*")
            .eq("role", "expert")
          if (expertsError) throw expertsError

          setExperts(expertsData)
        }
      } catch (err) {
        console.error("Error loading data:", err)
        setError(err instanceof Error ? err.message : "An error occurred")
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [supabase, params.id, router])

  // Handle request updates (for student)
  const handleRequestUpdate = async (updates: Partial<Request>) => {
    if (!request) return

    try {
      const { error: updateError } = await supabase
        .from("requests")
        .update(updates)
        .eq("id", request.id)
      
      if (updateError) throw updateError

      // Refresh request data
      router.refresh()
    } catch (err) {
      console.error("Error updating request:", err)
      alert("Failed to update request")
    }
  }

  // Handle request deletion (for student)
  const handleRequestDelete = async () => {
    if (!request) return

    try {
      const { error: deleteError } = await supabase
        .from("requests")
        .delete()
        .eq("id", request.id)
      
      if (deleteError) throw deleteError

      router.push("/home")
    } catch (err) {
      console.error("Error deleting request:", err)
      alert("Failed to delete request")
    }
  }

  // Handle expert assignment (for admin)
  const handleExpertAssign = async (expertId: string) => {
    if (!request) return

    try {
      const updates = {
        expert_id: expertId || null,
        accepted_at: expertId ? new Date().toISOString() : null
      }

      const { error: updateError } = await supabase
        .from("requests")
        .update(updates)
        .eq("id", request.id)
      
      if (updateError) throw updateError

      // Refresh request data
      router.refresh()
    } catch (err) {
      console.error("Error assigning expert:", err)
      alert("Failed to assign expert")
    }
  }

  // Handle curriculum node creation (for expert)
  const handleAddNode = async () => {
    if (!request?.curriculum?.id || !currentUser) return

    try {
      // Create source
      const { data: source, error: sourceError } = await supabase
        .from("sources")
        .insert([{
          title: "New Source",
          URL: "https://example.com",
          created_by: currentUser.id
        }])
        .select()
        .single()
      if (sourceError) throw sourceError

      // Create curriculum node
      const { error: nodeError } = await supabase
        .from("curriculum_nodes")
        .insert([{
          curriculum_id: request.curriculum.id,
          source_id: source.id,
          start_time: 0,
          end_time: 0,
          level: 0,
          index_in_curriculum: request.curriculum.curriculum_nodes?.length || 0
        }])
      
      if (nodeError) throw nodeError

      // Update request status if this is the first node
      if (!request.started_at) {
        const { error: requestError } = await supabase
          .from("requests")
          .update({ started_at: new Date().toISOString() })
          .eq("id", request.id)
        
        if (requestError) throw requestError
      }

      // Refresh request data
      router.refresh()
    } catch (err) {
      console.error("Error adding node:", err)
      alert("Failed to add node")
    }
  }

  // Handle node updates (for expert)
  const handleNodeUpdate = async (nodeId: string, updates: Partial<CurriculumNode>) => {
    try {
      const { error: updateError } = await supabase
        .from("curriculum_nodes")
        .update(updates)
        .eq("id", nodeId)
      
      if (updateError) throw updateError

      // Refresh request data
      router.refresh()
    } catch (err) {
      console.error("Error updating node:", err)
      alert("Failed to update node")
    }
  }

  // Handle source updates (for expert)
  const handleSourceUpdate = async (sourceId: string, updates: Partial<Source>) => {
    try {
      const { error: updateError } = await supabase
        .from("sources")
        .update(updates)
        .eq("id", sourceId)
      
      if (updateError) throw updateError

      // Refresh request data
      router.refresh()
    } catch (err) {
      console.error("Error updating source:", err)
      alert("Failed to update source")
    }
  }

  // Handle request submission (for expert)
  const handleSubmit = async () => {
    if (!request) return

    try {
      const { error: updateError } = await supabase
        .from("requests")
        .update({ finished_at: new Date().toISOString() })
        .eq("id", request.id)
      
      if (updateError) throw updateError

      // Refresh request data
      router.refresh()
    } catch (err) {
      console.error("Error submitting request:", err)
      alert("Failed to submit request")
    }
  }

  if (loading) {
    return <div className="min-h-screen bg-white flex items-center justify-center">Loading...</div>
  }

  if (error || !request || !currentUser) {
    return <div className="min-h-screen bg-white flex items-center justify-center text-red-500">{error || "Request not found"}</div>
  }

  // Render view based on user role
  switch (currentUser.role) {
    case "student":
      return (
        <StudentView
          request={request}
          currentUser={{ id: currentUser.id, role: currentUser.role }}
          onRequestUpdate={handleRequestUpdate}
          onRequestDelete={handleRequestDelete}
        />
      )
    case "expert":
      return (
        <ExpertView
          request={request}
          currentUser={{ id: currentUser.id, role: currentUser.role }}
          onAddNode={handleAddNode}
          onUpdateNode={handleNodeUpdate}
          onUpdateSource={handleSourceUpdate}
          onSubmit={handleSubmit}
        />
      )
    case "admin":
      return (
        <AdminView
          request={request}
          currentUser={{ id: currentUser.id, role: currentUser.role }}
          experts={experts}
          onExpertAssign={handleExpertAssign}
        />
      )
    default:
      return <div>Invalid user role</div>
  }
} 