"use client"

import { useCallback, useEffect, useState } from "react"
import UserHeader from "@/components/user-header"
import RequestDetails from "@/components/request-details"
import CurriculumViewTable from "@/components/curriculum-view-table"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import ReactFlow, {
  type Node,
  type Edge,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  type Connection,
  type OnConnect
} from "reactflow"
import "reactflow/dist/style.css"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"

interface CurriculumNode {
  id: string
  source: {
    id: string
    title: string
    URL: string
  }
  start_time: number
  end_time: number
  level: number
  index_in_curriculum: number
}

interface Request {
  id: string
  source: {
    id: string
    title: string
    URL: string
  } | null
  content_type: string
  tag: string
  created_at: string
  finished_at: string | null
  expert: {
    id: string
    email: string
  } | null
  curriculum: {
    id: string
    curriculum_nodes: CurriculumNode[]
  } | null
}

export default function StudentFinishedRequestPage({
  params,
}: {
  params: { id: string }
}) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [user, setUser] = useState<{ email: string } | null>(null)
  const [request, setRequest] = useState<Request | null>(null)
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
  }, [supabase, params.id])

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

  // Create nodes and edges for ReactFlow
  const nodes: Node[] = request.curriculum?.curriculum_nodes.map((node, index) => ({
    id: node.id,
    data: { label: `Source ${String.fromCharCode(65 + index)}` },
    position: { x: 250 * index, y: 100 * node.level },
    type: "default",
  })) || []

  const edges: Edge[] = []
  if (request.curriculum?.curriculum_nodes) {
    for (let i = 0; i < request.curriculum.curriculum_nodes.length - 1; i++) {
      edges.push({
        id: `e${i}-${i + 1}`,
        source: request.curriculum.curriculum_nodes[i].id,
        target: request.curriculum.curriculum_nodes[i + 1].id,
        type: "smoothstep",
      })
    }
  }

  const [flowNodes, setNodes, onNodesChange] = useNodesState(nodes)
  const [flowEdges, setEdges, onEdgesChange] = useEdgesState(edges)

  const onConnect: OnConnect = useCallback(
    (connection) => setEdges((eds) => addEdge(connection, eds)),
    [setEdges]
  )

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
          status="finished"
          expertAssigned={request.expert?.email.split("@")[0] || "Not assigned"}
        />
        <div style={{ height: "400px", border: "1px solid #ddd" }}>
          <ReactFlow
            nodes={flowNodes}
            edges={flowEdges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            fitView
          >
            <Background />
            <Controls />
            <MiniMap />
          </ReactFlow>
        </div>
        <CurriculumViewTable nodes={request.curriculum?.curriculum_nodes || []} />
        <div className="flex justify-center">
          <Link href="/student-home">
            <Button className="bg-[#7C8CFF] hover:bg-[#666ECC] text-white">Home</Button>
          </Link>
        </div>
      </main>
    </div>
  )
}

