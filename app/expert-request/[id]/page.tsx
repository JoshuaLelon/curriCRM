"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import UserHeader from "@/components/user-header"
import RequestDetails from "@/components/request-details"
import Chat from "@/components/chat"
import CurriculumTable from "@/components/curriculum-table"
import { Button } from "@/components/ui/button"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import type { Request, Profile, Message, CurriculumNode, Source } from "@/types"

interface RequestWithDetails extends Request {
  curriculum?: {
    id: string
    curriculum_nodes: CurriculumNode[]
  }
  messages?: Message[]
}

export default function ExpertRequestPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [user, setUser] = useState<Profile | null>(null)
  const [request, setRequest] = useState<RequestWithDetails | null>(null)
  const [curriculumNodes, setCurriculumNodes] = useState<CurriculumNode[]>([])
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
        if (requestData.curriculum?.curriculum_nodes) {
          setCurriculumNodes(requestData.curriculum.curriculum_nodes)
        }
      } catch (err) {
        console.error("Error loading data:", err)
        setError(err instanceof Error ? err.message : "An error occurred")
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [supabase, params.id])

  const handleAdvance = async () => {
    if (!request) return

    try {
      const newStatus = !request.started_at ? 
        { started_at: new Date().toISOString() } : 
        { finished_at: new Date().toISOString() }

      const { error: updateError } = await supabase
        .from("requests")
        .update(newStatus)
        .eq("id", request.id)
      
      if (updateError) throw updateError

      // Update local state
      setRequest(prev => prev ? { ...prev, ...newStatus } : null)
    } catch (err) {
      console.error("Error advancing request:", err)
      setError(err instanceof Error ? err.message : "Failed to advance request")
    }
  }

  const handleAddRow = async () => {
    if (!request?.curriculum?.id || !user) return

    try {
      // Create source
      const { data: source, error: sourceError } = await supabase
        .from("sources")
        .insert([{
          title: "New Source",
          URL: "https://example.com/new-source",
          created_by: user.id
        }])
        .select()
        .single()
      if (sourceError) throw sourceError

      // Create curriculum node
      const { data: node, error: nodeError } = await supabase
        .from("curriculum_nodes")
        .insert([{
          curriculum_id: request.curriculum.id,
          source_id: source.id,
          start_time: 0,
          end_time: 0,
          level: 0,
          index_in_curriculum: curriculumNodes.length
        }])
        .select(`
          *,
          source:sources(*)
        `)
        .single()
      if (nodeError) throw nodeError

      // Update local state
      setCurriculumNodes([...curriculumNodes, node])
    } catch (err) {
      console.error("Error adding row:", err)
      setError(err instanceof Error ? err.message : "Failed to add row")
    }
  }

  const handleSubmit = async () => {
    if (!request?.curriculum?.id) return

    try {
      // Update existing nodes
      const { error: updateError } = await supabase
        .from("curriculum_nodes")
        .upsert(
          curriculumNodes.map(node => ({
            ...node,
            curriculum_id: request.curriculum?.id
          }))
        )
      
      if (updateError) throw updateError

      router.push("/expert-home")
    } catch (err) {
      console.error("Error submitting curriculum:", err)
      setError(err instanceof Error ? err.message : "Failed to submit curriculum")
    }
  }

  const handleLevelChange = (nodeId: string, newLevel: number) => {
    setCurriculumNodes(prevNodes =>
      prevNodes.map(node => 
        node.id === nodeId ? { ...node, level: newLevel } : node
      )
    )
  }

  const handleNodeUpdate = async (nodeId: string, updates: Partial<CurriculumNode>) => {
    try {
      const { error: updateError } = await supabase
        .from("curriculum_nodes")
        .update(updates)
        .eq("id", nodeId)
      
      if (updateError) throw updateError

      // Update local state
      setCurriculumNodes(prevNodes =>
        prevNodes.map(node =>
          node.id === nodeId ? { ...node, ...updates } : node
        )
      )
    } catch (err) {
      console.error("Error updating node:", err)
      setError(err instanceof Error ? err.message : "Failed to update node")
    }
  }

  const handleSourceUpdate = async (sourceId: string, updates: Partial<Source>) => {
    try {
      const { error: updateError } = await supabase
        .from("sources")
        .update(updates)
        .eq("id", sourceId)
      
      if (updateError) throw updateError

      // Update local state
      setCurriculumNodes(prevNodes =>
        prevNodes.map(node =>
          node.source?.id === sourceId
            ? { ...node, source: { ...node.source, ...updates } }
            : node
        )
      )
    } catch (err) {
      console.error("Error updating source:", err)
      setError(err instanceof Error ? err.message : "Failed to update source")
    }
  }

  const handleMessageSent = async () => {
    try {
      // Refresh request data to get new messages
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
    } catch (err) {
      console.error("Error refreshing request data:", err)
      setError(err instanceof Error ? err.message : "Failed to refresh request data")
    }
  }

  if (loading) {
    return <div className="min-h-screen bg-white flex items-center justify-center">Loading...</div>
  }

  if (error) {
    return <div className="min-h-screen bg-white flex items-center justify-center text-red-500">{error}</div>
  }

  if (!request || !user) {
    return <div className="min-h-screen bg-white flex items-center justify-center">Request not found</div>
  }

  return (
    <div className="min-h-screen bg-white">
      <UserHeader email={user.email} userType="Expert" />
      <main className="container mx-auto py-8 px-4 space-y-6">
        <RequestDetails
          source={request.source?.title || "No source"}
          tag={request.tag}
          requestType={request.content_type}
          timeElapsed={getTimeElapsed(request.created_at)}
          positionInLine="N/A"
          status={getStatus(request)}
          expertAssigned={request.expert?.email || "None"}
        />
        <Chat
          messages={request.messages || []}
          currentUserEmail={user.email}
          requestId={request.id}
          onMessageSent={handleMessageSent}
        />
        <CurriculumTable
          nodes={curriculumNodes}
          onAddRow={handleAddRow}
          onSubmit={handleSubmit}
          onHome={() => router.push("/expert-home")}
          onLevelChange={handleLevelChange}
          onNodeUpdate={handleNodeUpdate}
          onSourceUpdate={handleSourceUpdate}
        />
        <div className="flex justify-center gap-4">
          <Button variant="outline" onClick={() => router.push("/expert-home")}>
            Home
          </Button>
          <Button onClick={handleSubmit} className="bg-[#7C8CFF] hover:bg-[#666ECC] text-white">
            Submit
          </Button>
          <Button onClick={handleAdvance} className="bg-[#7C8CFF] hover:bg-[#666ECC] text-white">
            Advance
          </Button>
        </div>
      </main>
    </div>
  )
}

function getTimeElapsed(dateString: string) {
  const created = new Date(dateString)
  const now = new Date()
  const diffDays = Math.floor((now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24))
  return `${diffDays} days`
}

function getStatus(request: Request): string {
  if (request.finished_at) return "finished"
  if (request.started_at) return "in_progress"
  if (request.accepted_at) return "accepted"
  return "not_accepted"
}

