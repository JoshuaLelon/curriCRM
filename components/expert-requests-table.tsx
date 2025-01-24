"use client"

import RequestsTable from "./requests-table"
import type { Request } from "@/types/request"
import { useRouter } from "next/navigation"

interface ExpertRequestsTableProps {
  requests: Request[]
}

export default function ExpertRequestsTable({ requests }: ExpertRequestsTableProps) {
  const router = useRouter()

  const handleRequestClick = (request: Request) => {
    router.push(`/request/${request.id}`)
  }

  return (
    <RequestsTable
      requests={requests}
      onRequestClick={handleRequestClick}
      showPositionInLine={true}
    />
  )
}

