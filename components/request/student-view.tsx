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

interface StudentViewProps {
  request: Request
  currentUser: {
    id: string
    role: "student"
    email: string
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

      {/* Show chat for all states except not_accepted */}
      {status !== "not_accepted" && (
        <Chat
          request={request}
          currentUser={currentUser}
        />
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