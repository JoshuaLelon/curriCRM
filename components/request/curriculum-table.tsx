"use client"

import { useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { Request, CurriculumNode, Source } from "@/types/request"
import { canEditCurriculum, canSubmitRequest } from "@/utils/request-permissions"

interface CurriculumTableProps {
  request: Request
  currentUser: {
    id: string
    role: "student" | "expert" | "admin"
  }
  onAddNode?: () => void
  onUpdateNode?: (nodeId: string, updates: Partial<CurriculumNode>) => void
  onUpdateSource?: (sourceId: string, updates: Partial<Source>) => void
  onSubmit?: () => void
}

interface EditableRowProps {
  node: CurriculumNode
  onUpdateNode: (updates: Partial<CurriculumNode>) => void
  onUpdateSource: (updates: Partial<Source>) => void
  index: number
}

function EditableRow({ node, onUpdateNode, onUpdateSource, index }: EditableRowProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({
    title: node.source?.title || "",
    URL: node.source?.URL || "",
    startTime: node.start_time.toString(),
    endTime: node.end_time.toString(),
  })

  const handleSubmit = () => {
    onUpdateSource({
      title: formData.title,
      URL: formData.URL,
    })
    onUpdateNode({
      start_time: parseInt(formData.startTime),
      end_time: parseInt(formData.endTime),
    })
    setIsEditing(false)
  }

  if (isEditing) {
    return (
      <TableRow>
        <TableCell>{index + 1}</TableCell>
        <TableCell>
          <Input
            value={formData.title}
            onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
          />
        </TableCell>
        <TableCell>
          <Input
            value={formData.URL}
            onChange={(e) => setFormData((prev) => ({ ...prev, URL: e.target.value }))}
          />
        </TableCell>
        <TableCell>
          <Input
            type="number"
            value={formData.startTime}
            onChange={(e) => setFormData((prev) => ({ ...prev, startTime: e.target.value }))}
          />
        </TableCell>
        <TableCell>
          <Input
            type="number"
            value={formData.endTime}
            onChange={(e) => setFormData((prev) => ({ ...prev, endTime: e.target.value }))}
          />
        </TableCell>
        <TableCell>
          <div className="flex gap-2">
            <Button size="sm" onClick={handleSubmit}>Save</Button>
            <Button size="sm" variant="outline" onClick={() => setIsEditing(false)}>Cancel</Button>
          </div>
        </TableCell>
      </TableRow>
    )
  }

  return (
    <TableRow>
      <TableCell>{index + 1}</TableCell>
      <TableCell>{node.source?.title || "Untitled"}</TableCell>
      <TableCell>{node.source?.URL || "No URL"}</TableCell>
      <TableCell>{node.start_time}</TableCell>
      <TableCell>{node.end_time}</TableCell>
      <TableCell>
        <Button size="sm" variant="outline" onClick={() => setIsEditing(true)}>
          Edit
        </Button>
      </TableCell>
    </TableRow>
  )
}

export default function CurriculumTable({
  request,
  currentUser,
  onAddNode,
  onUpdateNode,
  onUpdateSource,
  onSubmit,
}: CurriculumTableProps) {
  const canEdit = canEditCurriculum(request, currentUser)
  const canSubmit = canSubmitRequest(request, currentUser)
  const nodes = [...(request.curriculum?.curriculum_nodes || [])].sort(
    (a, b) => b.index_in_curriculum - a.index_in_curriculum
  )

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">Curriculum</h2>
        {canEdit && (
          <Button onClick={onAddNode}>Add Source</Button>
        )}
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Item #</TableHead>
            <TableHead>Source</TableHead>
            <TableHead>URL</TableHead>
            <TableHead>Start Time</TableHead>
            <TableHead>End Time</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {nodes.map((node, index) => (
            canEdit ? (
              <EditableRow
                key={node.id}
                node={node}
                index={index}
                onUpdateNode={(updates) => onUpdateNode?.(node.id, updates)}
                onUpdateSource={(updates) => node.source && onUpdateSource?.(node.source.id, updates)}
              />
            ) : (
              <TableRow key={node.id}>
                <TableCell>{index + 1}</TableCell>
                <TableCell>{node.source?.title || "Untitled"}</TableCell>
                <TableCell>{node.source?.URL || "No URL"}</TableCell>
                <TableCell>{node.start_time}</TableCell>
                <TableCell>{node.end_time}</TableCell>
                <TableCell></TableCell>
              </TableRow>
            )
          ))}
        </TableBody>
      </Table>

      {canSubmit && (
        <div className="flex justify-end">
          <Button onClick={onSubmit}>Submit Curriculum</Button>
        </div>
      )}
    </div>
  )
} 