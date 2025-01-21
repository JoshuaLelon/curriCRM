"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import UserHeader from "@/components/user-header"
import RequestDetails from "@/components/request-details"
import Chat from "@/components/chat"
import CurriculumTable from "@/components/curriculum-table"
import { Button } from "@/components/ui/button"

const mockData = {
  user: {
    id: "123e4567-e89b-12d3-a456-426614174005",
    email: "expert@example.com",
    specialty: "ai",
  },
  request: {
    id: "123e4567-e89b-12d3-a456-426614174002",
    student: {
      email: "student@example.com",
    },
    source: {
      title: "Introduction to Neural Networks",
      url: "https://example.com/neural-networks",
      id: "123e4567-e89b-12d3-a456-426614174099",
    },
    status: "in_progress",
    type: "explanation",
    tag: "ai",
    startTime: 180,
    endTime: 300,
    created_at: "2024-03-15T10:00:00Z",
    started_at: "2024-03-15T11:00:00Z",
  },
  curriculum: {
    id: "123e4567-e89b-12d3-a456-426614174013",
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
  messages: [
    {
      id: "123e4567-e89b-12d3-a456-426614174024",
      sender: {
        id: "123e4567-e89b-12d3-a456-426614174000",
        email: "student@example.com",
      },
      content: "I'm having trouble understanding backpropagation",
      created_at: "2024-03-15T12:00:00Z",
    },
    {
      id: "123e4567-e89b-12d3-a456-426614174025",
      sender: {
        id: "123e4567-e89b-12d3-a456-426614174005",
        email: "expert@example.com",
      },
      content: "Let me break down backpropagation step by step...",
      created_at: "2024-03-15T12:05:00Z",
    },
  ],
}

export default function ExpertRequestPage() {
  const router = useRouter()
  const [curriculumNodes, setCurriculumNodes] = useState(mockData.curriculum.nodes)

  const handleAdvance = () => {
    console.log("Advance request:", mockData.request.id)
    // In a real application, you would make an API call here
    // and then update the state to reflect the new status
  }

  const handleAddRow = () => {
    const newNode = {
      id: `new-node-${Date.now()}`,
      source: {
        id: `new-source-${Date.now()}`,
        title: "New Source",
        url: "https://example.com/new-source",
      },
      startTime: 0,
      endTime: 0,
      level: 0,
      index: curriculumNodes.length,
    }
    setCurriculumNodes([...curriculumNodes, newNode])
  }

  const handleSubmit = () => {
    console.log("Submit curriculum")
    router.push("/expert-home")
  }

  const handleLevelChange = (nodeId: string, newLevel: number) => {
    setCurriculumNodes((prevNodes) =>
      prevNodes.map((node) => (node.id === nodeId ? { ...node, level: newLevel } : node)),
    )
  }

  return (
    <div className="min-h-screen bg-white">
      <UserHeader email={mockData.user.email} userType="Expert" />
      <main className="container mx-auto py-8 px-4 space-y-6">
        <RequestDetails
          source={mockData.request.source.title}
          tag={mockData.request.tag}
          requestType={mockData.request.type}
          timeElapsed="2 days"
          positionInLine="N/A"
          status={mockData.request.status}
          expertAssigned="Randall"
        />
        <Chat messages={mockData.messages} currentUserEmail={mockData.user.email} />
        <CurriculumTable
          nodes={curriculumNodes}
          onAddRow={handleAddRow}
          onSubmit={handleSubmit}
          onHome={() => router.push("/expert-home")}
          onLevelChange={handleLevelChange}
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

