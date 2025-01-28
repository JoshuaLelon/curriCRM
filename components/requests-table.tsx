"use client"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import type { Request, Profile } from "@/types"
import { getRequestStatus, getStatusLabel } from "@/utils/request-status"

interface RequestsTableProps {
  requests: Request[]
  experts?: Profile[]
  onRequestClick: (request: Request) => void
  onExpertChange?: (requestId: string, expertId: string) => void
  onDeleteRequest?: (requestId: string) => void
  showPositionInLine?: boolean
  isAdmin?: boolean
  currentUser?: Profile
}

export default function RequestsTable({
  requests,
  experts,
  onRequestClick,
  onExpertChange,
  onDeleteRequest,
  showPositionInLine = false,
  isAdmin = false,
  currentUser
}: RequestsTableProps) {
  const getTimeElapsed = (dateString: string) => {
    const created = new Date(dateString)
    const now = new Date()
    const diffDays = Math.floor((now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24))
    return `${diffDays} days`
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "in_progress":
        return "bg-yellow-200"
      case "finished":
        return "bg-green-200"
      case "not_accepted":
        return "bg-black text-white"
      case "not_started":
        return "bg-blue-200"
      default:
        return "bg-gray-200"
    }
  }

  const getStatusOrder = (status: string): number => {
    switch (status) {
      case "not_accepted": return 0
      case "not_started": return 1
      case "in_progress": return 2
      case "finished": return 3
      default: return 4
    }
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Source</TableHead>
            <TableHead>Tag</TableHead>
            <TableHead>Request Type</TableHead>
            <TableHead>Time Elapsed</TableHead>
            {showPositionInLine && <TableHead>Position in Line</TableHead>}
            <TableHead>Status</TableHead>
            {(onExpertChange || onDeleteRequest) && (
              <TableHead>{isAdmin ? "Expert Assigned" : "Actions"}</TableHead>
            )}
          </TableRow>
        </TableHeader>
        <TableBody>
          {[...requests]
            .sort((a, b) => {
              const statusA = getRequestStatus(a)
              const statusB = getRequestStatus(b)
              return getStatusOrder(statusA) - getStatusOrder(statusB)
            })
            .map((request) => {
            const status = getRequestStatus(request)
            return (
              <TableRow
                key={request.id}
                className="cursor-pointer hover:bg-gray-100"
                onClick={() => onRequestClick(request)}
              >
                <TableCell className="font-medium">
                  {request.source ? (
                    <a
                      href={request.source.url}
                      className="text-blue-600 hover:underline"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {request.source.title}
                    </a>
                  ) : (
                    "No source"
                  )}
                </TableCell>
                <TableCell className="capitalize">{request.tag}</TableCell>
                <TableCell className="capitalize">{request.content_type.replace("_", " ")}</TableCell>
                <TableCell>{getTimeElapsed(request.created_at)}</TableCell>
                {showPositionInLine && (
                  <TableCell>{status === "in_progress" ? "14" : "N/A"}</TableCell>
                )}
                <TableCell>
                  <span className={`px-2 py-1 rounded ${getStatusColor(status)}`}>
                    {getStatusLabel(status)}
                  </span>
                </TableCell>
                {(onExpertChange || onDeleteRequest) && (
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <div className="flex gap-2">
                      {onExpertChange && experts && (
                        <select
                          className="border rounded px-2 py-1"
                          value={request.expert_id?.toString() || ""}
                          onChange={(e) => onExpertChange(request.id, e.target.value)}
                        >
                          <option value="">Select Expert</option>
                          {isAdmin && <option value={currentUser?.id}>AI (Assign to Self)</option>}
                          {experts.map((expert) => (
                            <option key={expert.id} value={expert.id}>
                              {expert.email}
                            </option>
                          ))}
                        </select>
                      )}
                      {onDeleteRequest && (
                        <button
                          className="text-red-600 hover:text-red-800"
                          onClick={() => onDeleteRequest(request.id)}
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </TableCell>
                )}
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}

