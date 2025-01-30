"use client"

import { useEffect, useState } from "react"
import { Request } from "@/types/request"
import { getRequestStatus } from "@/utils/request-status"
import { isAIHandledRequest } from "@/utils/request-permissions"
import { useSupabase } from "@/components/providers/supabase-provider"
import RequestDetails from "./request-details"
import Chat from "./chat"
import CurriculumView from "./curriculum-view"
import { AIProgress } from "./ai-progress"

interface AdminViewProps {
  request: Request
  currentUser: {
    id: string
    role: "admin"
    email: string
  }
  experts: Array<{ id: string; email: string }>
  onExpertAssign: (expertId: string) => void
}

export default function AdminView({
  request: initialRequest,
  currentUser,
  experts,
  onExpertAssign,
}: AdminViewProps) {
  const { supabase } = useSupabase()
  const [request, setRequest] = useState<Request>(initialRequest)
  const [isLoading, setIsLoading] = useState(false)
  
  // Set up realtime subscription
  useEffect(() => {
    console.log('[Admin View] Setting up realtime subscription')
    const channel = supabase
      .channel(`request_${request.id}_updates`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'requests',
          filter: `id=eq.${request.id}`,
        },
        async (payload) => {
          console.log('[Admin View] Received request update:', payload)
          const updatedRequest = payload.new as Request
          
          // If request is finished, fetch complete data
          if (updatedRequest.finished_at && !request.finished_at) {
            console.log('[Admin View] Request finished, fetching complete data')
            setIsLoading(true)
            const { data } = await supabase
              .from('requests')
              .select(`
                *,
                curriculum:curriculums (
                  id,
                  curriculum_nodes (
                    id,
                    level,
                    index_in_curriculum,
                    start_time,
                    end_time,
                    source:sources (
                      id,
                      title,
                      URL
                    )
                  )
                )
              `)
              .eq('id', request.id)
              .single()
            
            if (data) {
              console.log('[Admin View] Fetched latest request data:', data)
              setRequest(data)
            }
            setIsLoading(false)
          } else {
            setRequest(prev => ({ ...prev, ...updatedRequest }))
          }
        }
      )
      .subscribe()

    console.log('[Admin View] Subscription status:', channel.state)

    return () => {
      console.log('[Admin View] Cleaning up subscription')
      channel.unsubscribe()
      console.log('[Admin View] Subscription status:', channel.state)
    }
  }, [supabase, request.id])

  const status = getRequestStatus(request)
  const isAIProcessing = request.started_at && !request.finished_at && isAIHandledRequest(request, currentUser)
  
  console.log('[Admin View] Status:', status)
  console.log('[Admin View] Expert ID:', request.expert_id)
  console.log('[Admin View] Current User ID:', currentUser.id)
  console.log('[Admin View] Is AI Processing:', isAIProcessing)
  console.log('[Admin View] Checks:', {
    hasCurriculum: !!request.curriculum,
    hasStartedAt: !!request.started_at,
    isAIHandled: isAIHandledRequest(request, currentUser),
    isFinished: !!request.finished_at,
    expertId: request.expert_id,
    userId: currentUser.id
  })
  
  return (
    <div className="space-y-6">
      {/* Show request details with expert assignment UI in not_accepted/not_started states */}
      <RequestDetails
        request={request}
        currentUser={currentUser}
        experts={experts}
        onExpertAssign={onExpertAssign}
      />

      {/* Show AI progress when curriculum is being generated */}
      {isAIProcessing && (
        <AIProgress requestId={request.id} />
      )}

      {/* Show chat history for all states except not_accepted */}
      {status !== "not_accepted" && (
        <Chat
          request={request}
          currentUser={currentUser}
        />
      )}

      {/* Show curriculum in finished state */}
      {(status === "finished" || request.curriculum) && !isLoading && (
        <CurriculumView
          nodes={request.curriculum?.curriculum_nodes || []}
        />
      )}
    </div>
  )
} 