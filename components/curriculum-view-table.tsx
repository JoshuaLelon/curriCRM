"use client"

import { type CurriculumNode as RequestCurriculumNode } from "@/types/request"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

interface CurriculumViewTableProps {
  nodes: RequestCurriculumNode[]
}

export default function CurriculumViewTable({ nodes }: CurriculumViewTableProps) {
  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Source</TableHead>
            <TableHead>URL</TableHead>
            <TableHead>Start</TableHead>
            <TableHead>End</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {nodes.map((node, index) => (
            <TableRow key={node.id}>
              <TableCell>{`Source ${String.fromCharCode(65 + index)}`}</TableCell>
              <TableCell>
                {node.source && (
                  <a href={node.source.url} className="text-blue-600 hover:underline">
                    {node.source.url}
                  </a>
                )}
              </TableCell>
              <TableCell>{formatTime(node.start_time)}</TableCell>
              <TableCell>{formatTime(node.end_time)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

