"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { useSupabase } from "@/components/providers/supabase-provider"
import RequestsTable from "@/components/requests-table"
import ExpertSummaryTable from "@/components/home/expert-summary-table"
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

  console.log('AdminHome received initialRequests:', initialRequests)
  console.log('AdminHome received initialExperts:', initialExperts)
  console.log('AdminHome current requests:', requests)
  console.log('AdminHome current experts:', experts)

  const handleRequestClick = (request: Request) => {
    router.push(`/request/${request.id}`)
  }

  const handleExpertChange = async (requestId: string, expertId: string) => {
    try {
      // If expertId is empty string, we're unassigning the expert
      const updateData = expertId === "" ? 
        { expert_id: null } : 
        { expert_id: experts.find((e) => e.id.toString() === expertId)?.id }

      // If we're assigning an expert and couldn't find them, return
      if (expertId !== "" && !updateData.expert_id) return

      const { error } = await supabase
        .from("requests")
        .update(updateData)
        .eq("id", requestId)

      if (error) throw error

      // Refresh the requests data
      const { data: requestsData, error: requestsError } = await supabase
        .from("requests")
        .select(`
          *,
          source:sources(*),
          student:profiles!requests_student_id_fkey(
            id,
            email,
            specialty,
            is_admin
          ),
          expert:profiles!requests_expert_id_fkey(
            id,
            email,
            specialty,
            is_admin
          ),
          curriculum:curriculums!curriculums_request_id_fkey (
            *,
            curriculum_nodes (*)
          )
        `)
      if (requestsError) throw requestsError
      setRequests(requestsData)
    } catch (err) {
      console.error("Failed to update expert:", err)
      alert(`Failed to update expert: ${err instanceof Error ? err.message : 'Unknown error'}`)
    }
  }

  const handleDeleteRequest = async (requestId: string) => {
    try {
      const { error } = await supabase.from("requests").delete().eq("id", requestId)
      if (error) throw error

      // Refresh the requests data
      const { data: requestsData, error: requestsError } = await supabase
        .from("requests")
        .select(`
          *,
          source:sources(*),
          student:profiles!requests_student_id_fkey(
            id,
            email,
            specialty,
            is_admin
          ),
          expert:profiles!requests_expert_id_fkey(
            id,
            email,
            specialty,
            is_admin
          )
        `)
      if (requestsError) throw requestsError
      setRequests(requestsData)
    } catch (err) {
      console.error("Failed to delete request:", err)
      alert("Failed to delete request")
    }
  }

  return (
    <div className="space-y-8">
      <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
        <div className="p-6">
          <h2 className="text-lg font-semibold mb-4">Expert Ticket Workload</h2>
          <ExpertSummaryTable experts={experts} requests={requests} />
        </div>
      </div>
      
      <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
        <div className="p-6">
          <h2 className="text-lg font-semibold mb-4">All Requests</h2>
          <RequestsTable
            requests={requests}
            experts={experts}
            onRequestClick={handleRequestClick}
            onExpertChange={handleExpertChange}
            onDeleteRequest={handleDeleteRequest}
            isAdmin={true}
          />
        </div>
      </div>
    </div>
  )
} 