"use client"

import { useCallback } from "react"
import UserHeader from "@/components/user-header"
import RequestDetails from "@/components/request-details"
import CurriculumViewTable from "@/components/curriculum-view-table"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import ReactFlow, { type Node, type Edge, Background, Controls, MiniMap, useNodesState, useEdgesState } from "reactflow"
import "reactflow/dist/style.css"

// This would normally come from an API or database
const mockData = {
  user: {
    id: "123e4567-e89b-12d3-a456-426614174000",
    email: "student@example.com",
  },
  request: {
    id: "123e4567-e89b-12d3-a456-426614174001",
    source: {
      title: "Introduction to Neural Networks",
      url: "https://example.com/neural-networks",
      id: "123e4567-e89b-12d3-a456-426614174099",
    },
    status: "finished",
    type: "tutorial",
    tag: "ai",
    startTime: 180,
    endTime: 300,
    created_at: "2024-03-15T10:00:00Z",
    finished_at: "2024-03-16T15:00:00Z",
  },
  curriculum: {
    nodes: [
      {
        id: "123e4567-e89b-12d3-a456-426614174014",
        source: {
          id: "123e4567-e89b-12d3-a456-426614174098",
          title: "Basic Math for Neural Networks",
          url: "https://example.com/neural-networks-math",
        },
        startTime: 0,
        endTime: 150,
        level: 0,
        index: 0,
      },
      {
        id: "123e4567-e89b-12d3-a456-426614174015",
        source: {
          id: "123e4567-e89b-12d3-a456-426614174099",
          title: "Introduction to Neural Networks",
          url: "https://example.com/neural-networks",
        },
        startTime: 180,
        endTime: 300,
        level: 1,
        index: 1,
      },
      {
        id: "123e4567-e89b-12d3-a456-426614174016",
        source: {
          id: "123e4567-e89b-12d3-a456-426614174100",
          title: "Activation Functions Deep Dive",
          url: "https://example.com/activation-functions",
        },
        startTime: 320,
        endTime: 450,
        level: 2,
        index: 2,
      },
      {
        id: "123e4567-e89b-12d3-a456-426614174017",
        source: {
          id: "123e4567-e89b-12d3-a456-426614174101",
          title: "Backpropagation Fundamentals",
          url: "https://example.com/backpropagation",
        },
        startTime: 460,
        endTime: 600,
        level: 2,
        index: 3,
      },
      {
        id: "123e4567-e89b-12d3-a456-426614174018",
        source: {
          id: "123e4567-e89b-12d3-a456-426614174102",
          title: "Advanced Neural Network Architectures",
          url: "https://example.com/advanced-architectures",
        },
        startTime: 620,
        endTime: 800,
        level: 3,
        index: 4,
      },
    ],
  },
}

const initialNodes: Node[] = mockData.curriculum.nodes.map((node, index) => ({
  id: node.id,
  data: { label: `Source ${String.fromCharCode(65 + index)}` },
  position: { x: 250 * index, y: 100 * node.level },
  type: "default",
}))

const initialEdges: Edge[] = mockData.curriculum.nodes.slice(0, -1).map((node, index) => ({
  id: `e${index}-${index + 1}`,
  source: node.id,
  target: mockData.curriculum.nodes[index + 1].id,
  type: "smoothstep",
}))

export default function StudentFinishedRequestPage() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges)

  const onConnect = useCallback((params) => setEdges((eds) => addEdge(params, eds)), [setEdges])

  return (
    <div className="min-h-screen bg-white">
      <UserHeader email={mockData.user.email} userType="Student" />
      <main className="container mx-auto py-8 px-4 space-y-6">
        <RequestDetails
          source={mockData.request.source.title}
          tag={mockData.request.tag}
          requestType={mockData.request.type}
          timeElapsed="7 days"
          positionInLine="N/A"
          status={mockData.request.status}
          expertAssigned="Randall"
        />
        <div style={{ height: "400px", border: "1px solid #ddd" }}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
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
        <CurriculumViewTable nodes={mockData.curriculum.nodes} />
        <div className="flex justify-center">
          <Link href="/student-home">
            <Button className="bg-[#7C8CFF] hover:bg-[#666ECC] text-white">Home</Button>
          </Link>
        </div>
      </main>
    </div>
  )
}

