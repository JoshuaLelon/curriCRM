"use client"

import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { getRequestStatus, getStatusLabel } from "@/utils/request-status"
import type { Request } from "@/types/request"

interface Source {
  id: string
  title: string
  url: string
}

interface StudentRequestsTableProps {
  requests: Request[]
}

export default function StudentRequestsTable({ requests }: StudentRequestsTableProps) {
  const router = useRouter()
  const [isDeleting, setIsDeleting] = useState<number | null>(null)

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

  const handleDelete = async (requestId: number, e: React.MouseEvent) => {
    e.stopPropagation() // Prevent row click
    try {
      setIsDeleting(requestId)
      const response = await fetch(`/api/requests/${requestId}`, {
        method: "DELETE",
      })
      if (!response.ok) throw new Error("Failed to delete request")
      router.refresh() // Refresh the page to get updated data
    } catch (error) {
      console.error("Error deleting request:", error)
      alert("Failed to delete request")
    } finally {
      setIsDeleting(null)
    }
  }

  const handleRequestClick = (request: Request) => {
    router.push(`/request/${request.id}`)
  }

  return (
    <div className="space-y-4">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Source</TableHead>
              <TableHead>Tag</TableHead>
              <TableHead>Request Type</TableHead>
              <TableHead>Time Elapsed</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {requests.map((request) => {
              const status = getRequestStatus(request)
              return (
                <TableRow
                  key={request.id}
                  className="cursor-pointer hover:bg-gray-100"
                  onClick={() => handleRequestClick(request)}
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
                  <TableCell>
                    <span className={`px-2 py-1 rounded ${getStatusColor(status)}`}>
                      {getStatusLabel(status)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={(e) => handleDelete(request.id, e)}
                      disabled={isDeleting === request.id}
                    >
                      {isDeleting === request.id ? "Deleting..." : "Delete"}
                    </Button>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

