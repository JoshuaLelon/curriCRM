import UserHeader from "@/components/user-header"
import RequestDetails from "@/components/request-details"
import Chat from "@/components/chat"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { useRouter } from "next/router"

// This would normally come from an API or database
const mockData = {
  user: {
    id: "123e4567-e89b-12d3-a456-426614174000",
    email: "student@example.com",
  },
  request: {
    id: "123e4567-e89b-12d3-a456-426614174002",
    source: {
      title: "Introduction to Neural Networks",
      url: "https://example.com/neural-networks",
    },
    status: "in_progress",
    type: "explanation",
    tag: "ai",
    startTime: 180,
    endTime: 300,
    created_at: "2024-03-15T10:00:00Z",
    started_at: "2024-03-15T11:00:00Z",
  },
  messages: [
    {
      id: "123e4567-e89b-12d3-a456-426614174022",
      sender: {
        id: "123e4567-e89b-12d3-a456-426614174000",
        email: "student@example.com",
      },
      content: "I'm having trouble understanding backpropagation",
      created_at: "2024-03-15T12:00:00Z",
    },
    {
      id: "123e4567-e89b-12d3-a456-426614174023",
      sender: {
        id: "123e4567-e89b-12d3-a456-426614174005",
        email: "expert@example.com",
      },
      content: "Let me break down backpropagation step by step...",
      created_at: "2024-03-15T12:05:00Z",
    },
  ],
}

export default function StudentInProgressRequestPage() {
  const router = useRouter()
  const handleDelete = () => {
    console.log("Delete request:", mockData.request.id)
    // In a real application, you would make an API call here
    router.push("/student-home")
  }

  return (
    <div className="min-h-screen bg-white">
      <UserHeader email={mockData.user.email} userType="Student" />
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
        <div className="flex justify-center gap-4">
          <Link href="/student-home">
            <Button variant="secondary" className="bg-[#7C8CFF] hover:bg-[#666ECC] text-white">
              Home
            </Button>
          </Link>
          <Button variant="destructive" onClick={handleDelete}>
            Delete
          </Button>
        </div>
      </main>
    </div>
  )
}

