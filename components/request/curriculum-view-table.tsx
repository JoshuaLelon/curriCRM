"use client"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import type { CurriculumNode } from "@/types/request"

interface CurriculumViewTableProps {
  nodes: CurriculumNode[]
}

export default function CurriculumViewTable({ nodes }: CurriculumViewTableProps) {
  // Sort nodes by index_in_curriculum in reverse order to show dependencies first
  const sortedNodes = [...nodes].sort((a, b) => b.index_in_curriculum - a.index_in_curriculum)

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Curriculum</h2>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Item #</TableHead>
            <TableHead>Source</TableHead>
            <TableHead>URL</TableHead>
            <TableHead>Start Time</TableHead>
            <TableHead>End Time</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedNodes.map((node, index) => (
            <TableRow key={node.id}>
              <TableCell>{index + 1}</TableCell>
              <TableCell>{node.source?.title || "Untitled"}</TableCell>
              <TableCell>
                {node.source?.URL ? (
                  <a
                    href={node.source.URL}
                    className="text-blue-600 hover:underline"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {node.source.URL}
                  </a>
                ) : (
                  "No URL"
                )}
              </TableCell>
              <TableCell>{node.start_time}</TableCell>
              <TableCell>{node.end_time}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
} 