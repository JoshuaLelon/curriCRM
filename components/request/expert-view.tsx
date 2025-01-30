"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { useSupabase } from "@/components/providers/supabase-provider"
import type { Request, CurriculumNode, Source } from "@/types/request"
import { getRequestStatus } from "@/utils/request-status"
import { canEditCurriculum, canSubmitRequest, isAIHandledRequest } from "@/utils/request-permissions"
import RequestDetails from "./request-details"
import Chat from "./chat"
import CurriculumTable from "./curriculum-table"
import CurriculumView from "./curriculum-view"
import { AIProgress } from "./ai-progress"

interface ExpertViewProps {
  request: Request
  currentUser: {
    id: string
    role: "expert"
    email: string
  }
  onAddNode: () => void
  onUpdateNode: (nodeId: string, updates: Partial<CurriculumNode>) => void
  onUpdateSource: (sourceId: string, updates: Partial<Source>) => void
  onSubmit: () => void
}

export default function ExpertView({
  request,
  currentUser,
  onAddNode,
  onUpdateNode,
  onUpdateSource,
  onSubmit,
}: ExpertViewProps) {
  const status = getRequestStatus(request)
  const canEdit = canEditCurriculum(request, currentUser)
  const canSubmit = canSubmitRequest(request, currentUser)
  const isAIProcessing = !request.curriculum && 
    request.started_at &&
    isAIHandledRequest(request, currentUser) &&
    !request.finished_at

  console.log('[Expert View] Full request:', request)
  console.log('[Expert View] Full current user:', currentUser)
  console.log('[Expert View] Checks:', {
    hasCurriculum: !!request.curriculum,
    hasStartedAt: !!request.started_at,
    isAIHandled: isAIHandledRequest(request, currentUser),
    isFinished: !!request.finished_at,
    isAIProcessing,
    expertId: request.expert_id,
    userId: currentUser.id
  })

  return (
    <div className="space-y-6">
      <RequestDetails
        request={request}
        currentUser={currentUser}
      />

      {/* Show chat for all states except not_accepted */}
      {status !== "not_accepted" && (
        <Chat
          request={request}
          currentUser={currentUser}
        />
      )}

      {/* Show AI progress when curriculum is being generated */}
      {isAIProcessing && (
        <AIProgress requestId={request.id} />
      )}

      {/* Show editable curriculum table for assigned expert in not_started/in_progress states */}
      {canEdit ? (
        <CurriculumTable
          request={request}
          currentUser={currentUser}
          onAddNode={onAddNode}
          onUpdateNode={onUpdateNode}
          onUpdateSource={onUpdateSource}
          onSubmit={onSubmit}
        />
      ) : status === "finished" ? (
        <CurriculumView
          nodes={request.curriculum?.curriculum_nodes || []}
        />
      ) : null}
    </div>
  )
} 