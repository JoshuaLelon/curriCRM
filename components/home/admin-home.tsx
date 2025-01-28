"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { useSupabase } from "@/components/providers/supabase-provider"
import RequestsTable from "@/components/requests-table"
import ExpertSummaryTable from "@/components/home/expert-summary-table"
import type { Request, Profile } from "@/types"
import { RealtimePostgresChangesPayload } from '@supabase/supabase-js'

interface RequestPayload {
  id: string
  expert_id: string | null
  [key: string]: any
}

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

  // Set up real-time subscription
  useEffect(() => {
    // Helper function to refresh requests
    const refreshRequests = async () => {
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
            user_id,
            email,
            specialty,
            is_admin
          ),
          curriculum:curriculums!curriculums_request_id_fkey (
            *,
            curriculum_nodes (*)
          )
        `)
      
      if (requestsError) {
        console.error('Error refreshing requests:', requestsError)
        return
      }

      setRequests(requestsData)
    }

    const channel = supabase
      .channel('request_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'requests'
        },
        () => {
          console.log('Request change detected, refreshing data...')
          refreshRequests()
        }
      )
      .subscribe()

    // Cleanup subscription on unmount
    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase])

  console.log('AdminHome received initialRequests:', initialRequests)
  console.log('AdminHome received initialExperts:', initialExperts)
  console.log('AdminHome current requests:', requests)
  console.log('AdminHome current experts:', experts)

  const handleRequestClick = (request: Request) => {
    router.push(`/request/${request.id}`)
  }

  const handleExpertChange = async (requestId: string, expertId: string) => {
    try {
      console.log('handleExpertChange called with:', { requestId, expertId })
      
      // Get the current admin's profile
      const adminProfile = experts.find(e => e.email === email)
      if (!adminProfile) {
        console.log('Could not find admin profile with email:', email)
        return
      }

      // Check if this is an AI assignment (admin assigning to self)
      const isAIAssignment = expertId === adminProfile.user_id

      // If expertId is empty string, we're unassigning the expert
      const updateData = expertId === "" ? 
        { expert_id: null } : 
        { expert_id: isAIAssignment ? adminProfile.id : experts.find((e) => e.user_id === expertId)?.id }

      console.log('Found expert data:', { updateData, experts, expertId, isAIAssignment })

      // If we're assigning an expert and couldn't find them, return early
      if (expertId !== "" && !updateData.expert_id) {
        console.log('Could not find expert profile')
        return
      }

      console.log('Updating request with data:', updateData)
      const { error } = await supabase
        .from("requests")
        .update({
          ...updateData,
          accepted_at: isAIAssignment ? new Date().toISOString() : null
        })
        .eq("id", requestId)

      if (error) throw error

      // If this is an AI assignment, trigger the AI workflow
      if (isAIAssignment) {
        console.log('Triggering AI workflow for request:', requestId)
        const aiResponse = await fetch(`/api/ai/requests/${requestId}`, { 
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          }
        })
        if (!aiResponse.ok) {
          throw new Error('Failed to trigger AI workflow')
        }
      }

      // Refresh the requests data with expert profile info
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
            user_id,
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
            currentUser={experts.find(e => e.email === email)}
          />
        </div>
      </div>
    </div>
  )
} 