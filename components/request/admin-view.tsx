"use client"

import { Request } from "@/types/request"
import { getRequestStatus } from "@/utils/request-status"
import RequestDetails from "./request-details"
import Chat from "./chat"
import CurriculumView from "./curriculum-view"
import RequestProgressView from "./request-progress-view"

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
  request,
  currentUser,
  experts,
  onExpertAssign,
}: AdminViewProps) {
  const status = getRequestStatus(request)
  const isAIProcessing = request.accepted_at && 
    !request.finished_at && 
    request.expert_id && 
    request.expert_id.toString() === currentUser.id
  
  console.log('[Admin View] Status:', status)
  console.log('[Admin View] Expert ID:', request.expert_id)
  console.log('[Admin View] Current User ID:', currentUser.id)
  console.log('[Admin View] Is AI Processing:', isAIProcessing)
  
  return (
    <div className="space-y-4">
      {/* Show request details with expert assignment UI in not_accepted/not_started states */}
      <RequestDetails
        request={request}
        currentUser={currentUser}
        experts={experts}
        onExpertAssign={onExpertAssign}
      />

      {/* Show progress view when AI is processing */}
      {isAIProcessing && (
        <RequestProgressView request={request} />
      )}

      {/* Show chat history for all states except not_accepted */}
      {status !== "not_accepted" && (
        <Chat
          request={request}
          currentUser={currentUser}
        />
      )}

      {/* Show curriculum in finished state */}
      {status === "finished" && (
        <CurriculumView
          nodes={request.curriculum?.curriculum_nodes || []}
        />
      )}
    </div>
  )
} 