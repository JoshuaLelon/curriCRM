import UserHeader from "@/components/user-header"
import NewRequestForm from "@/components/new-request-form"
import { useRouter } from "next/navigation"

const mockData = {
  user: {
    id: "123e4567-e89b-12d3-a456-426614174000",
    email: "student@example.com",
  },
  availableTypes: ["tutorial", "explanation", "how_to_guide", "reference"],
  availableTags: ["math", "software", "ai", "physics"],
}

export default function StudentNewRequest() {
  const router = useRouter()

  const handleSubmit = (formData: any) => {
    console.log("Submit form:", formData)
    // In a real application, you would make an API call here
    router.push("/student-home")
  }

  return (
    <div className="min-h-screen bg-white">
      <UserHeader email={mockData.user.email} userType="Student" />
      <main className="container mx-auto py-8 px-4">
        <h1 className="text-2xl font-bold mb-6">New Request</h1>
        <NewRequestForm
          availableTypes={mockData.availableTypes}
          availableTags={mockData.availableTags}
          onSubmit={handleSubmit}
        />
      </main>
    </div>
  )
}

