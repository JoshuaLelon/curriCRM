"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import RequestsTable from "./requests-table"
import { useRouter } from "next/navigation"
import type { Request } from "@/types/request"
import { getRequestStatus } from "@/utils/request-status"

interface StudentRequestsTableProps {
  requests: Request[]
}

export default function StudentRequestsTable({ requests }: StudentRequestsTableProps) {
  const router = useRouter()
  const [isDeleting, setIsDeleting] = useState<number | null>(null)

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

  const renderActions = (request: Request) => {
    const status = getRequestStatus(request)
    if (status !== "not_accepted") return null

    return (
      <Button
        variant="destructive"
        size="sm"
        onClick={(e) => handleDelete(request.id, e)}
        disabled={isDeleting === request.id}
      >
        {isDeleting === request.id ? "Deleting..." : "Delete"}
      </Button>
    )
  }

  return (
    <RequestsTable
      requests={requests}
      onRequestClick={handleRequestClick}
      actions={renderActions}
    />
  )
}

