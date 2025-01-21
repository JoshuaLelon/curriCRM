"use client"

import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

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

interface CurriculumTableProps {
  nodes: CurriculumNode[]
  onAddRow: () => void
  onSubmit: () => void
  onHome: () => void
  onLevelChange: (nodeId: string, newLevel: number) => void
}

export default function CurriculumTable({ nodes, onAddRow, onSubmit, onHome, onLevelChange }: CurriculumTableProps) {
  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`
  }

  return (
    <div className="space-y-4">
      <h2 className="font-medium">Curriculum:</h2>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Level</TableHead>
              <TableHead>Source</TableHead>
              <TableHead>URL</TableHead>
              <TableHead>Start</TableHead>
              <TableHead>End</TableHead>
              <TableHead>Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {nodes.map((node) => (
              <TableRow key={node.id}>
                <TableCell>
                  <Select
                    value={node.level.toString()}
                    onValueChange={(value) => onLevelChange(node.id, Number.parseInt(value))}
                  >
                    <SelectTrigger className="w-[100px]">
                      <SelectValue placeholder="Level" />
                    </SelectTrigger>
                    <SelectContent>
                      {[0, 1, 2, 3, 4, 5].map((level) => (
                        <SelectItem key={level} value={level.toString()}>
                          {level}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell>{node.source.title}</TableCell>
                <TableCell>
                  <a href={node.source.url} className="text-blue-600 hover:underline">
                    {node.source.url}
                  </a>
                </TableCell>
                <TableCell>{formatTime(node.startTime)}</TableCell>
                <TableCell>{formatTime(node.endTime)}</TableCell>
                <TableCell>
                  <Button variant="destructive" size="sm" onClick={() => console.log("Delete node:", node.id)}>
                    Delete
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <Button variant="outline" onClick={onAddRow} className="w-full">
        Add Another Row
      </Button>
    </div>
  )
}

