"use client"

import { useExpertRequests } from "@/hooks/useExpertRequests"
import UserHeader from "@/components/user-header"
import ExpertRequestsTable from "@/components/expert-requests-table"

// This would normally come from an API or database
const mockData = {
  user: {
    id: "123e4567-e89b-12d3-a456-426614174005",
    email: "expert@example.com",
    specialty: "math",
  },
  requests: [
    {
      id: "123e4567-e89b-12d3-a456-426614174001",
      student: {
        email: "student1@example.com",
      },
      source: {
        title: "Differential Equations",
        url: "https://example.com/diff-eq",
      },
      status: "not_started",
      type: "tutorial",
      tag: "math",
      created_at: "2024-03-15T10:00:00Z",
    },
    {
      id: "123e4567-e89b-12d3-a456-426614174002",
      student: {
        email: "student2@example.com",
      },
      source: {
        title: "Linear Algebra Basics",
        url: "https://example.com/linear-algebra",
      },
      status: "in_progress",
      type: "explanation",
      tag: "math",
      created_at: "2024-03-14T15:30:00Z",
    },
  ],
}

export default function ExpertHome() {
  const { requests, handleRequestClick, handleAdvance } = useExpertRequests(mockData.requests)

  return (
    <div className="min-h-screen bg-white">
      <UserHeader email={mockData.user.email} userType="Expert" />
      <main className="container mx-auto py-8 px-4">
        <ExpertRequestsTable requests={requests} onRequestClick={handleRequestClick} onAdvance={handleAdvance} />
      </main>
    </div>
  )
}

