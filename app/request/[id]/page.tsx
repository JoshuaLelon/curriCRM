"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import type { Request, CurriculumNode, Source } from "@/types/request"
import StudentView from "@/components/request/student-view"
import ExpertView from "@/components/request/expert-view"
import AdminView from "@/components/request/admin-view"
import { useSupabase } from "@/components/providers/supabase-provider"
import { Button } from "@/components/ui/button"
import { HomeIcon } from "@heroicons/react/24/outline"

interface Profile {
  id: string
  user_id: string
  role: "student" | "expert" | "admin"
  email: string
}

export default function RequestPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const { supabase } = useSupabase()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [request, setRequest] = useState<Request | null>(null)
  const [currentUser, setCurrentUser] = useState<Profile | null>(null)
  const [experts, setExperts] = useState<Profile[]>([])

  async function fetchRequestData() {
    const { data: requestData, error: requestError } = await supabase
      .from("requests")
      .select(`
        *,
        source:sources(*),
        student:profiles!requests_student_id_fkey(*),
        expert:profiles!requests_expert_id_fkey(*),
        curriculum:curriculums!curriculums_request_id_fkey (
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
    
    if (requestError) {
      console.error('Request fetch error:', requestError)
      throw requestError
    }

    console.log('Raw request data:', requestData)
    console.log('Curriculum data:', requestData?.curriculum)
    console.log('Curriculum nodes:', requestData?.curriculum?.[0]?.curriculum_nodes)

    // Transform the curriculum data to match the expected format
    const transformedData = {
      ...requestData,
      curriculum: requestData?.curriculum?.[0] || null
    }

    setRequest(transformedData)
  }

  // Fetch request data and user profile
  useEffect(() => {
    async function loadData() {
      console.log('Starting loadData for request:', params.id)
      try {
        // Get current user
        const { data: { user }, error: userError } = await supabase.auth.getUser()
        if (userError) throw userError

        if (!user) {
          console.log('No user found, redirecting to login')
          router.push("/login")
          return
        }

        // Get user's profile with role
        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("*")
          .eq("user_id", user.id)
          .single()
        if (profileError) throw profileError

        console.log('Profile data:', profileData)

        // Map database fields to role
        const profile = {
          ...profileData,
          role: profileData.is_admin ? "admin" : (profileData.specialty ? "expert" : "student")
        }
        console.log('Mapped profile:', profile)

        setCurrentUser(profile)

        await fetchRequestData()

        // If admin, fetch list of experts
        if (profile.role === "admin") {
          const { data: expertsData, error: expertsError } = await supabase
            .from("profiles")
            .select("*")
            .not("specialty", "is", null)
            .eq("is_admin", false)
          if (expertsError) throw expertsError

          setExperts(expertsData.map(expert => ({
            ...expert,
            role: "expert"
          })))
        }

        // Subscribe to request changes
        const channel = supabase
          .channel(`request_${params.id}`)
          .on(
            "postgres_changes",
            {
              event: "*",
              schema: "public",
              table: "requests",
              filter: `id=eq.${params.id}`,
            },
            async (payload) => {
              console.log("Request updated, fetching new data...")
              await fetchRequestData()
            }
          )
          .subscribe()

        return () => {
          supabase.removeChannel(channel)
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
      // First update the source if it changed
      if (updates.source) {
        const { error: sourceError } = await supabase
          .from("sources")
          .upsert({
            id: request.source?.id || undefined,
            title: updates.source.title,
            URL: updates.source.URL,
            created_by: request.student_id
          })
          .select()
          .single()
        
        if (sourceError) throw sourceError
      }

      // Then update the request
      const { error: updateError } = await supabase
        .from("requests")
        .update({
          tag: updates.tag,
          content_type: updates.content_type
        })
        .eq("id", request.id)
      
      if (updateError) throw updateError

      await fetchRequestData()
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
      console.log('[Request Page] Starting expert assignment')
      console.log('[Request Page] Expert ID:', expertId)
      console.log('[Request Page] Current user:', currentUser)
      console.log('[Request Page] Request:', request)
      
      const isSelfAssigningAdmin = expertId && currentUser?.role === 'admin' && expertId === currentUser.id
      console.log('[Request Page] Checking AI workflow trigger:', {
        expertId,
        currentUserRole: currentUser?.role,
        currentUserId: currentUser?.id,
        isSelfAssigningAdmin,
        requestId: request.id
      })

      const updates = {
        expert_id: expertId || null,
        accepted_at: expertId ? new Date().toISOString() : null,
        started_at: isSelfAssigningAdmin ? new Date().toISOString() : null
      }

      console.log('[Request Page] Updating request with:', updates)
      
      const { data: updateData, error: updateError } = await supabase
        .from("requests")
        .update(updates)
        .eq("id", request.id)
        .select()
      
      if (updateError) {
        console.error('[Request Page] Error updating request:', updateError)
        throw updateError
      }
      
      console.log('[Request Page] Update successful:', updateData)

      // If self-assigning as admin, trigger AI workflow
      if (isSelfAssigningAdmin) {
        console.log('[Request Page] Self-assigned as admin, triggering AI workflow')
        
        try {
          const apiUrl = `/api/ai/requests/${request.id}`
          console.log('[Request Page] Making API request to:', apiUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            }
          })
          
          const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            }
          })
          
          console.log('[Request Page] API response:', {
            status: response.status,
            statusText: response.statusText,
            headers: Object.fromEntries(response.headers.entries())
          })
          
          const responseText = await response.text()
          console.log('[Request Page] API response text:', responseText)
          
          if (!response.ok) {
            console.error('[Request Page] API error:', responseText)
            throw new Error(responseText || 'Failed to start AI workflow')
          }

          console.log('[Request Page] AI workflow triggered successfully')
        } catch (error) {
          console.error('[Request Page] Error triggering AI workflow:', error)
          if (error instanceof Error) {
            console.error('[Request Page] Error details:', {
              name: error.name,
              message: error.message,
              stack: error.stack
            })
          }
          alert('Failed to start AI workflow. Please try again.')
          return
        }
      }

      console.log('[Request Page] Refreshing request data')
      await fetchRequestData()
      console.log('[Request Page] Request data refreshed')
    } catch (err) {
      console.error("[Request Page] Error assigning expert:", err)
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
      const now = new Date().toISOString()
      const { error: updateError } = await supabase
        .from("requests")
        .update({
          finished_at: now
        })
        .eq("id", request.id)
      
      if (updateError) throw updateError

      // Refresh request data
      await fetchRequestData()
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
  const renderView = () => {
    // If user is admin, always show admin view regardless of other roles
    if (currentUser.role === "admin") {
      return (
        <AdminView
          request={request}
          currentUser={{ id: currentUser.id, role: currentUser.role, email: currentUser.email }}
          experts={experts}
          onExpertAssign={handleExpertAssign}
        />
      )
    }

    // For non-admin users, check if they're an expert
    if (currentUser.role === "expert") {
      return (
        <ExpertView
          request={request}
          currentUser={{ id: currentUser.id, role: currentUser.role, email: currentUser.email }}
          onAddNode={handleAddNode}
          onUpdateNode={handleNodeUpdate}
          onUpdateSource={handleSourceUpdate}
          onSubmit={handleSubmit}
        />
      )
    }

    // Default to student view
    if (currentUser.role === "student") {
      return (
        <StudentView
          request={request}
          currentUser={{ id: currentUser.id, role: currentUser.role, email: currentUser.email }}
          onRequestUpdate={handleRequestUpdate}
          onRequestDelete={handleRequestDelete}
        />
      )
    }

    return <div>Invalid user role</div>
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {renderView()}
        <div className="mt-8 flex justify-center">
          <Button
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
            onClick={() => router.push('/home')}
          >
            <HomeIcon className="h-4 w-4" />
            Home
          </Button>
        </div>
      </div>
    </div>
  )
} 