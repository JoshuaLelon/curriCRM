import type { Request, RequestStatus } from "@/types/request"

export function getRequestStatus(request: Request): RequestStatus {
  if (request.finished_at) return "finished"
  if (request.started_at) return "in_progress"
  if (request.accepted_at) return "not_started"
  return "not_accepted"
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