"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

interface Request {
  id: string
  student: { email: string }
  source: { title: string; URL: string }
  status: string
  type: string
  tag: string
  created_at: string
}

export function useExpertRequests(initialRequests: Request[]) {
  const [requests, setRequests] = useState<Request[]>(initialRequests)
  const router = useRouter()

  const handleRequestClick = (request: Request) => {
    router.push(`/request/${request.id}`)
  }

  const handleAdvance = (requestId: string) => {
    console.log("Advance request:", requestId)
    setRequests((prevRequests) =>
      prevRequests.map((req) =>
        req.id === requestId ? { ...req, status: req.status === "not_started" ? "in_progress" : "finished" } : req,
      ),
    )
  }

  return { requests, handleRequestClick, handleAdvance }
}

