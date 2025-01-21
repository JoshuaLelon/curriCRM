"use client"

import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import Link from "next/link"
import { useRouter } from "next/navigation"

interface Request {
  id: string
  source: {
    title: string
    url: string
  }
  status: string
  type: string
  tag: string
  created_at: string
}

interface StudentRequestsTableProps {
  requests: Request[]
}

export default function StudentRequestsTable({ requests }: StudentRequestsTableProps) {
  const router = useRouter()
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
      default:
        return "bg-gray-200"
    }
  }

  const handleDelete = (requestId: string) => {
    console.log("Delete request:", requestId)
    // In a real application, you would make an API call here
    // and then update the state to remove the deleted request
  }

  const handleRequestClick = (request: Request) => {
    if (request.status === "finished") {
      router.push(`/student-request/${request.id}/finished`)
    } else if (request.status === "not_accepted") {
      router.push("/student-new-request")
    } else {
      router.push(`/student-request/${request.id}/in-progress`)
    }
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
                onClick={() => handleRequestClick(request)}
              >
                <TableCell className="font-medium">
                  <a href={request.source.url} className="text-blue-600 hover:underline">
                    {request.source.title}
                  </a>
                </TableCell>
                <TableCell className="capitalize">{request.tag}</TableCell>
                <TableCell className="capitalize">{request.type}</TableCell>
                <TableCell>{getTimeElapsed(request.created_at)}</TableCell>
                <TableCell>{request.status === "in_progress" ? "14" : "N/A"}</TableCell>
                <TableCell>
                  <span className={`px-2 py-1 rounded ${getStatusColor(request.status)}`}>
                    {request.status.replace("_", " ")}
                  </span>
                </TableCell>
                <TableCell>
                  <Button variant="destructive" size="sm" onClick={() => handleDelete(request.id)}>
                    Delete
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

