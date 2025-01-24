"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { Request } from "@/types/request"
import { getRequestStatus, getStatusLabel } from "@/utils/request-status"

interface RequestsTableProps {
  requests: Request[]
  experts: Array<{ id: number; email: string }>
  onRequestClick: (request: Request) => void
  onExpertChange: (requestId: number, expertId: string) => void
  onDeleteRequest: (requestId: number) => void
}

export default function RequestsTable({
  requests,
  experts,
  onRequestClick,
  onExpertChange,
  onDeleteRequest,
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
            <TableHead>Expert Assigned</TableHead>
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
                <TableCell>{status === "in_progress" ? "14" : "N/A"}</TableCell>
                <TableCell>
                  <span className={`px-2 py-1 rounded ${getStatusColor(status)}`}>
                    {getStatusLabel(status)}
                  </span>
                </TableCell>
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <Select
                    defaultValue={request.expert?.id?.toString()}
                    onValueChange={(value) => onExpertChange(request.id, value)}
                  >
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Select expert" />
                    </SelectTrigger>
                    <SelectContent>
                      {experts.map((expert) => (
                        <SelectItem key={expert.id} value={expert.id.toString()}>
                          {expert.email}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell>
                  <Button
                    variant="destructive"
                    className="h-8 px-3"
                    onClick={(e) => {
                      e.stopPropagation()
                      onDeleteRequest(request.id)
                    }}
                  >
                    Delete
                  </Button>
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}

