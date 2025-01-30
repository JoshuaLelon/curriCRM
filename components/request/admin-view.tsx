"use client"

import { useEffect, useState, useCallback } from "react"
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
  const [isAIComplete, setIsAIComplete] = useState(false)
  
  // Function to fetch latest request data
  const fetchLatestRequest = useCallback(async () => {
    console.log('[Admin View] Fetching latest request data')
    setIsLoading(true)
    try {
      const { data, error } = await supabase
        .from('requests')
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
          curriculum:curriculums(
            *,
            curriculum_nodes(
              *,
              source:sources(*)
            )
          )
        `)
        .eq('id', request.id)
        .single()
      
      if (error) {
        console.error('[Admin View] Error fetching request data:', error)
        return
      }
      
      if (data) {
        console.log('[Admin View] Fetched latest request data:', {
          requestId: data.id,
          hasCurriculum: !!data.curriculum?.[0],
          curriculumId: data.curriculum?.[0]?.id,
          nodeCount: data.curriculum?.[0]?.curriculum_nodes?.length,
          nodes: data.curriculum?.[0]?.curriculum_nodes
        })
        
        // Transform the data to match expected format
        const transformedData = {
          ...data,
          curriculum: data.curriculum?.[0] || null
        }
        setRequest(transformedData)
      }
    } catch (error) {
      console.error('[Admin View] Error fetching request data:', error)
    } finally {
      setIsLoading(false)
    }
  }, [supabase, request.id])
  
  // Set up realtime subscription for both requests and curriculum_nodes
  useEffect(() => {
    console.log('[Admin View] Setting up realtime subscriptions')
    const requestChannel = supabase
      .channel(`request_${request.id}_updates`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'requests',
          filter: `id=eq.${request.id}`,
        },
        async (payload) => {
          console.log('[Admin View] Received request update:', payload)
          const updatedRequest = payload.new as Request
          
          // If request is finished or curriculum changes, fetch complete data
          if (updatedRequest.finished_at && !request.finished_at) {
            await fetchLatestRequest()
          } else {
            setRequest(prev => ({ ...prev, ...updatedRequest }))
          }
        }
      )
      .subscribe()

    // Add subscription for curriculum_nodes if we have a curriculum
    let curriculumChannel: ReturnType<typeof supabase.channel> | undefined
    if (request.curriculum?.id) {
      curriculumChannel = supabase
        .channel(`curriculum_${request.curriculum.id}_updates`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'curriculum_nodes',
            filter: `curriculum_id=eq.${request.curriculum.id}`,
          },
          async () => {
            console.log('[Admin View] Received curriculum_nodes update, fetching latest data')
            await fetchLatestRequest()
          }
        )
        .subscribe()
    }

    return () => {
      console.log('[Admin View] Cleaning up subscriptions')
      requestChannel.unsubscribe()
      if (curriculumChannel) {
        curriculumChannel.unsubscribe()
      }
    }
  }, [supabase, request.id, request.curriculum?.id, request.finished_at, fetchLatestRequest])

  // Fetch latest data when AI completes
  useEffect(() => {
    if (isAIComplete) {
      console.log('[Admin View] AI completed, fetching latest data')
      fetchLatestRequest()
    }
  }, [isAIComplete, fetchLatestRequest])

  const status = getRequestStatus(request)
  const isAIProcessing = request.started_at && !request.finished_at && isAIHandledRequest(request, currentUser) && !isAIComplete

  // Debug logging
  useEffect(() => {
    if (request.curriculum?.curriculum_nodes) {
      console.log('[Admin View] Curriculum data available:', {
        nodeCount: request.curriculum.curriculum_nodes.length,
        nodes: request.curriculum.curriculum_nodes
      })
    }
  }, [request.curriculum?.curriculum_nodes])

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
        <AIProgress 
          requestId={request.id} 
          onComplete={() => {
            console.log('[Admin View] AI Progress complete')
            setIsAIComplete(true)
          }}
        />
      )}

      {/* Show curriculum when ready */}
      {!isAIProcessing && request.curriculum?.curriculum_nodes && (
        <CurriculumView
          nodes={request.curriculum.curriculum_nodes}
        />
      )}

      {/* Show chat history for all states except not_accepted */}
      {status !== "not_accepted" && (
        <Chat
          request={request}
          currentUser={currentUser}
        />
      )}
    </div>
  )
} 