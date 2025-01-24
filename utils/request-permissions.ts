import type { Request, RequestStatus, UserRole } from "@/types/request"

interface User {
  id: string | number
  role: UserRole
}

export function canEditRequestDetails(request: Request, user: User): boolean {
  if (user.role !== "student" || user.id !== request.student_id) return false
  return !request.started_at // Can edit in not_accepted or not_started states
}

export function canDeleteRequest(request: Request, user: User): boolean {
  if (user.role !== "student" || user.id !== request.student_id) return false
  return !request.accepted_at // Can only delete in not_accepted state
}

export function canEditCurriculum(request: Request, user: User): boolean {
  if (user.role !== "expert") return false
  if (request.expert_id !== user.id) return false
  if (request.finished_at) return false
  return !!request.accepted_at // Can edit in not_started or in_progress states
}

export function canAssignExpert(request: Request, user: User): boolean {
  if (user.role !== "admin") return false
  return !request.started_at // Can assign in not_accepted or not_started states
}

export function canChat(request: Request, user: User): boolean {
  // Can only send messages in not_started or in_progress states
  if (!request.accepted_at || request.finished_at) return false
  
  // Must be the student or expert assigned to the request
  const userId = typeof user.id === 'string' ? parseInt(user.id) : user.id
  if (user.role === "student" && userId === request.student_id) return true
  if (user.role === "expert" && userId === request.expert_id) return true
  
  return false
}

export function canSubmitRequest(request: Request, user: User): boolean {
  if (user.role !== "expert") return false
  const userId = typeof user.id === 'string' ? parseInt(user.id) : user.id
  if (request.expert_id !== userId) return false
  if (!request.started_at || request.finished_at) return false
  return true // Can submit in in_progress state
}

export function canViewChat(request: Request, user: User): boolean {
  // Only requirement is that request has been accepted
  return !!request.accepted_at
} 