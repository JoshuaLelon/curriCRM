"use client"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

interface CurriculumNode {
  id: string
  source: {
    id: string
    title: string
    url: string
  }
  startTime: number
  endTime: number
  level: number
  index: number
}

interface CurriculumViewTableProps {
  nodes: CurriculumNode[]
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
                <a href={node.source.url} className="text-blue-600 hover:underline">
                  {node.source.url}
                </a>
              </TableCell>
              <TableCell>{formatTime(node.startTime)}</TableCell>
              <TableCell>{formatTime(node.endTime)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

