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

export function isAIHandledRequest(request: Request, user: User): boolean {
  console.log('[Permissions] isAIHandledRequest check:', {
    request: {
      id: request.id,
      expert_id: request.expert_id,
      accepted_at: request.accepted_at,
      started_at: request.started_at,
      finished_at: request.finished_at
    },
    user: {
      id: user.id,
      role: user.role
    }
  })

  if (user.role !== "admin") {
    console.log('[Permissions] Not an admin')
    return false
  }

  // Convert both IDs to strings for comparison
  const userId = user.id?.toString()
  const expertId = request.expert_id?.toString()
  
  console.log('[Permissions] Assignment check:', {
    userId,
    expertId,
    isAssignedToUser: userId === expertId
  })

  return userId === expertId
}

export function canEditCurriculum(request: Request, user: User): boolean {
  if (user.role !== "expert" && !isAIHandledRequest(request, user)) return false
  const userId = typeof user.id === 'string' ? parseInt(user.id) : user.id
  if (request.expert_id !== userId) return false
  if (request.finished_at) return false
  return !!request.accepted_at // Can edit in not_started or in_progress states
}

export function canAssignExpert(request: Request, user: User): boolean {
  console.log('[Permissions] canAssignExpert check:', {
    userRole: user.role,
    requestStarted: !!request.started_at,
    request,
    user
  })
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