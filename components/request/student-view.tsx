"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { useSupabase } from "@/components/providers/supabase-provider"
import type { Request } from "@/types/request"
import { getRequestStatus } from "@/utils/request-status"
import { canDeleteRequest } from "@/utils/request-permissions"
import RequestDetails from "./request-details"
import Chat from "./chat"
import CurriculumViewTable from "./curriculum-view-table"

interface StudentViewProps {
  request: Request
  currentUser: {
    id: string
    role: "student"
  }
  onRequestUpdate: (updates: Partial<Request>) => void
  onRequestDelete: () => void
}

export default function StudentView({
  request,
  currentUser,
  onRequestUpdate,
  onRequestDelete,
}: StudentViewProps) {
  const status = getRequestStatus(request)
  const canDelete = canDeleteRequest(request, currentUser)

  return (
    <div className="space-y-6">
      <RequestDetails
        request={request}
        currentUser={currentUser}
        onUpdate={onRequestUpdate}
      />

      {/* Show chat for not_started and in_progress states */}
      {(status === "not_started" || status === "in_progress") && (
        <Chat
          request={request}
          currentUser={currentUser}
        />
      )}

      {/* Show chat history for finished state */}
      {status === "finished" && (
        <>
          <Chat
            request={request}
            currentUser={currentUser}
          />
          <CurriculumViewTable
            nodes={request.curriculum?.curriculum_nodes || []}
          />
        </>
      )}

      {/* Show delete button only in not_accepted state */}
      {canDelete && (
        <div className="flex justify-end">
          <Button
            variant="destructive"
            onClick={onRequestDelete}
          >
            Delete Request
          </Button>
        </div>
      )}
    </div>
  )
} 