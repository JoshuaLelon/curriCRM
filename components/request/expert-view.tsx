"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { useSupabase } from "@/components/providers/supabase-provider"
import type { Request, CurriculumNode, Source } from "@/types/request"
import { getRequestStatus } from "@/utils/request-status"
import { canEditCurriculum, canSubmitRequest } from "@/utils/request-permissions"
import RequestDetails from "./request-details"
import Chat from "./chat"
import CurriculumTable from "./curriculum-table"
import CurriculumViewTable from "./curriculum-view-table"

interface ExpertViewProps {
  request: Request
  currentUser: {
    id: string
    role: "expert"
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

  return (
    <div className="space-y-6">
      <RequestDetails
        request={request}
        currentUser={currentUser}
      />

      {/* Show chat for not_started and in_progress states if assigned */}
      {(status === "not_started" || status === "in_progress") && request.expert_id === currentUser.id && (
        <Chat
          request={request}
          currentUser={currentUser}
        />
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
        <>
          <Chat
            request={request}
            currentUser={currentUser}
          />
          <CurriculumViewTable
            nodes={request.curriculum?.curriculum_nodes || []}
          />
        </>
      ) : null}
    </div>
  )
} 