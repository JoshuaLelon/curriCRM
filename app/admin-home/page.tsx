"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import UserHeader from "@/components/user-header"
import RequestsTable from "@/components/requests-table"

// This would normally come from an API or database
const mockData = {
  user: {
    id: "123e4567-e89b-12d3-a456-426614174004",
    email: "admin@example.com",
  },
  requests: [
    {
      id: "123e4567-e89b-12d3-a456-426614174001",
      student: {
        email: "student1@example.com",
      },
      expert: {
        email: "expert1@example.com",
      },
      source: {
        title: "Introduction to Machine Learning",
        url: "https://example.com/ml-intro",
      },
      status: "in_progress",
      type: "tutorial",
      tag: "ai",
      created_at: "2024-03-15T10:00:00Z",
    },
    {
      id: "123e4567-e89b-12d3-a456-426614174002",
      student: {
        email: "student2@example.com",
      },
      expert: {
        email: "expert2@example.com",
      },
      source: {
        title: "Advanced Calculus Concepts",
        url: "https://example.com/calculus",
      },
      status: "finished",
      type: "explanation",
      tag: "math",
      created_at: "2024-03-14T15:30:00Z",
    },
  ],
  experts: [
    { id: "expert1", email: "expert1@example.com" },
    { id: "expert2", email: "expert2@example.com" },
    { id: "expert3", email: "expert3@example.com" },
  ],
}

export default function AdminHome() {
  const router = useRouter()
  const [requests, setRequests] = useState(mockData.requests)

  const handleRequestClick = (request: any) => {
    if (request.status === "finished") {
      router.push(`/student-request/${request.id}/finished`)
    } else {
      router.push(`/student-request/${request.id}/in-progress`)
    }
  }

  const handleExpertChange = (requestId: string, expertId: string) => {
    const newExpert = mockData.experts.find((expert) => expert.id === expertId)
    if (newExpert) {
      setRequests((prevRequests) =>
        prevRequests.map((req) => (req.id === requestId ? { ...req, expert: newExpert } : req)),
      )
      console.log(`Changed expert for request ${requestId} to ${newExpert.email}`)
    }
  }

  const handleDeleteRequest = (requestId: string) => {
    setRequests((prevRequests) => prevRequests.filter((req) => req.id !== requestId))
    console.log(`Deleted request ${requestId}`)
  }

  return (
    <div className="min-h-screen bg-white">
      <UserHeader email={mockData.user.email} userType="Admin" />
      <main className="container mx-auto py-8 px-4">
        <RequestsTable
          requests={requests}
          experts={mockData.experts}
          onRequestClick={handleRequestClick}
          onExpertChange={handleExpertChange}
          onDeleteRequest={handleDeleteRequest}
        />
      </main>
    </div>
  )
}

