"use client"

import type { Request } from "@/types/request"
import { getRequestStatus } from "@/utils/request-status"
import RequestDetails from "./request-details"
import Chat from "./chat"
import CurriculumViewTable from "./curriculum-view-table"

interface AdminViewProps {
  request: Request
  currentUser: {
    id: string
    role: "admin"
  }
  experts: Array<{ id: string; email: string }>
  onExpertAssign: (expertId: string) => void
}

export default function AdminView({
  request,
  currentUser,
  experts,
  onExpertAssign,
}: AdminViewProps) {
  const status = getRequestStatus(request)

  return (
    <div className="space-y-6">
      {/* Always show request details with expert assignment UI in not_accepted/not_started states */}
      <RequestDetails
        request={request}
        currentUser={currentUser}
        experts={experts}
        onExpertAssign={onExpertAssign}
      />

      {/* Show chat history for all states except not_accepted */}
      {status !== "not_accepted" && (
        <Chat
          request={request}
          currentUser={currentUser}
        />
      )}

      {/* Show curriculum in finished state */}
      {status === "finished" && (
        <CurriculumViewTable
          nodes={request.curriculum?.curriculum_nodes || []}
        />
      )}
    </div>
  )
} 