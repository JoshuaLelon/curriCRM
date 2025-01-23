"use client"

import { useRouter } from "next/navigation"
import ExpertRequestsTable from "@/components/expert-requests-table"
import type { Request } from "@/types"

interface ExpertHomeProps {
  requests: Request[]
  email: string
}

export default function ExpertHome({ requests, email }: ExpertHomeProps) {
  const router = useRouter()

  const handleRequestClick = (request: Request) => {
    router.push(`/request/${request.id}`)
  }

  const handleAdvance = async (requestId: string) => {
    try {
      const response = await fetch(`/api/requests/${requestId}/advance`, {
        method: "POST",
      })
      if (!response.ok) throw new Error("Failed to advance request")
      router.refresh()
    } catch (error) {
      console.error("Error advancing request:", error)
      alert("Failed to advance request")
    }
  }

  return (
    <div className="space-y-6">
      <ExpertRequestsTable
        requests={requests}
        onRequestClick={handleRequestClick}
        onAdvance={handleAdvance}
      />
    </div>
  )
} 