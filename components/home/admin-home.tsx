"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { useSupabase } from "@/components/providers/supabase-provider"
import RequestsTable from "@/components/requests-table"
import type { Request, Profile } from "@/types"

interface AdminHomeProps {
  requests: Request[]
  experts: Profile[]
  email: string
}

export default function AdminHome({ requests: initialRequests, experts: initialExperts, email }: AdminHomeProps) {
  const router = useRouter()
  const { supabase } = useSupabase()
  const [requests, setRequests] = useState<Request[]>(initialRequests)
  const [experts, setExperts] = useState<Profile[]>(initialExperts)

  const handleRequestClick = (request: Request) => {
    router.push(`/request/${request.id}`)
  }

  const handleExpertChange = async (requestId: string, expertId: string) => {
    try {
      const expert = experts.find((e) => e.id.toString() === expertId)
      if (!expert) return

      const { error } = await supabase
        .from("requests")
        .update({ expert_id: expert.id })
        .eq("id", requestId)

      if (error) throw error

      // Note: In a real app, you'd want to refresh the data here
    } catch (err) {
      console.error("Failed to update expert:", err)
      alert("Failed to update expert")
    }
  }

  const handleDeleteRequest = async (requestId: string) => {
    try {
      const { error } = await supabase.from("requests").delete().eq("id", requestId)
      if (error) throw error

      // Note: In a real app, you'd want to refresh the data here
    } catch (err) {
      console.error("Failed to delete request:", err)
      alert("Failed to delete request")
    }
  }

  return (
    <div className="space-y-6">
      <RequestsTable
        requests={requests}
        experts={experts}
        onRequestClick={handleRequestClick}
        onExpertChange={handleExpertChange}
        onDeleteRequest={handleDeleteRequest}
      />
    </div>
  )
} 