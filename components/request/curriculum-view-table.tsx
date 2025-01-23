"use client"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import type { CurriculumNode } from "@/types/request"

interface CurriculumViewTableProps {
  nodes: CurriculumNode[]
}

export default function CurriculumViewTable({ nodes }: CurriculumViewTableProps) {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Curriculum</h2>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Source</TableHead>
            <TableHead>URL</TableHead>
            <TableHead>Start Time</TableHead>
            <TableHead>End Time</TableHead>
            <TableHead>Level</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {nodes.map((node) => (
            <TableRow key={node.id}>
              <TableCell>{node.source.title}</TableCell>
              <TableCell>
                <a
                  href={node.source.URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-500 hover:underline"
                >
                  {node.source.URL}
                </a>
              </TableCell>
              <TableCell>{node.start_time}</TableCell>
              <TableCell>{node.end_time}</TableCell>
              <TableCell>{node.level}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
} 