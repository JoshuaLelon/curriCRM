import type { Request } from "@/types/request"

export type RequestStatus = "not_accepted" | "not_started" | "in_progress" | "finished"

export function getRequestStatus(request: Request): RequestStatus {
  if (request.finished_at) return "finished"
  if (!request.expert_id) return "not_accepted"
  
  // Check for curriculum nodes
  const hasCurriculumNodes = (request.curriculum?.curriculum_nodes?.length ?? 0) > 0
  if (hasCurriculumNodes) return "in_progress"
  
  return "not_started"
}

export function getStatusLabel(status: RequestStatus): string {
  switch (status) {
    case "not_accepted":
      return "Not Accepted"
    case "not_started":
      return "Not Started"
    case "in_progress":
      return "In Progress"
    case "finished":
      return "Finished"
  }
}

export function getTimeElapsed(dateString: string): string {
  const created = new Date(dateString)
  const now = new Date()
  const diffDays = Math.floor((now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24))
  return `${diffDays} days`
}

export function isValidStatusTransition(
  currentStatus: RequestStatus,
  newStatus: RequestStatus,
  hasNodes: boolean
): boolean {
  switch (currentStatus) {
    case "not_accepted":
      return newStatus === "not_started"
    case "not_started":
      // Can only move to in_progress if there are curriculum nodes
      return newStatus === "in_progress" && hasNodes
    case "in_progress":
      return newStatus === "finished"
    case "finished":
      return false // Cannot transition from finished state
    default:
      return false
  }
} 