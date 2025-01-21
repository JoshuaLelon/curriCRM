import UserHeader from "@/components/user-header"
import StudentRequestsTable from "@/components/student-requests-table"
import Link from "next/link"
import { Button } from "@/components/ui/button"

// This would normally come from an API or database
const mockData = {
  user: {
    id: "123e4567-e89b-12d3-a456-426614174000",
    email: "student@example.com",
  },
  requests: [
    {
      id: "123e4567-e89b-12d3-a456-426614174001",
      source: {
        title: "Introduction to Machine Learning",
        url: "https://example.com/ml-intro",
      },
      status: "not_started",
      type: "tutorial",
      tag: "ai",
      created_at: "2024-03-15T10:00:00Z",
    },
    {
      id: "123e4567-e89b-12d3-a456-426614174002",
      source: {
        title: "Advanced Calculus Concepts",
        url: "https://example.com/calculus",
      },
      status: "in_progress",
      type: "explanation",
      tag: "math",
      created_at: "2024-03-14T15:30:00Z",
    },
    {
      id: "123e4567-e89b-12d3-a456-426614174003",
      source: {
        title: "Software Design Patterns",
        url: "https://example.com/design-patterns",
      },
      status: "finished",
      type: "reference",
      tag: "software",
      created_at: "2024-03-13T09:15:00Z",
    },
    {
      id: "123e4567-e89b-12d3-a456-426614174004",
      source: {
        title: "Quantum Computing Basics",
        url: "https://example.com/quantum-computing",
      },
      status: "not_accepted",
      type: "how_to_guide",
      tag: "physics",
      created_at: "2024-03-16T08:00:00Z",
    },
  ],
}

export default function StudentHome() {
  return (
    <div className="min-h-screen bg-white">
      <UserHeader email={mockData.user.email} userType="Student" />
      <main className="container mx-auto py-8 px-4">
        <StudentRequestsTable requests={mockData.requests} />
        <div className="mt-6 flex justify-center">
          <Link href="/student-new-request" passHref>
            <Button className="bg-[#7C8CFF] hover:bg-[#666ECC] text-white">New Request</Button>
          </Link>
        </div>
      </main>
    </div>
  )
}

