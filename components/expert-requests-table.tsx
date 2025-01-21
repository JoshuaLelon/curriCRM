import type React from "react"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

interface Request {
  id: string
  student: { email: string }
  source: { title: string; url: string }
  status: string
  type: string
  tag: string
  created_at: string
}

interface ExpertRequestsTableProps {
  requests: Request[]
  onRequestClick: (request: Request) => void
  onAdvance: (requestId: string) => void
}

export default function ExpertRequestsTable({ requests, onRequestClick, onAdvance }: ExpertRequestsTableProps) {
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
      default:
        return "bg-gray-200"
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
            <TableHead>Position in Line</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {requests.map((request) => (
            <TableRow
              key={request.id}
              className="cursor-pointer hover:bg-gray-100"
              onClick={() => onRequestClick(request)}
            >
              <TableCell className="font-medium">
                <a
                  href={request.source.url}
                  className="text-blue-600 hover:underline"
                  onClick={(e) => e.stopPropagation()}
                >
                  {request.source.title}
                </a>
              </TableCell>
              <TableCell className="capitalize">{request.tag}</TableCell>
              <TableCell className="capitalize">{request.type}</TableCell>
              <TableCell>{getTimeElapsed(request.created_at)}</TableCell>
              <TableCell>{request.status === "in_progress" ? "14" : "7"}</TableCell>
              <TableCell>
                <span className={`px-2 py-1 rounded ${getStatusColor(request.status)}`}>{request.status}</span>
              </TableCell>
              <TableCell>
                <Button
                  variant="secondary"
                  className="h-8 px-3 bg-gray-200 hover:bg-gray-300"
                  onClick={(e: React.MouseEvent) => {
                    e.stopPropagation()
                    onAdvance(request.id)
                  }}
                >
                  Advance
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

