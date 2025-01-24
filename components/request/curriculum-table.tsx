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
}

function EditableRow({ node, onUpdateNode, onUpdateSource }: EditableRowProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({
    title: node.source.title,
    url: node.source.url,
    startTime: node.start_time.toString(),
    endTime: node.end_time.toString(),
    level: node.level.toString(),
  })

  const handleSubmit = () => {
    onUpdateSource({
      title: formData.title,
      url: formData.url,
    })
    onUpdateNode({
      start_time: parseInt(formData.startTime),
      end_time: parseInt(formData.endTime),
      level: parseInt(formData.level),
    })
    setIsEditing(false)
  }

  if (isEditing) {
    return (
      <TableRow>
        <TableCell>
          <Input
            value={formData.title}
            onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
          />
        </TableCell>
        <TableCell>
          <Input
            value={formData.url}
            onChange={(e) => setFormData((prev) => ({ ...prev, url: e.target.value }))}
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
          <Input
            type="number"
            value={formData.level}
            onChange={(e) => setFormData((prev) => ({ ...prev, level: e.target.value }))}
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
      <TableCell>{node.source.title}</TableCell>
      <TableCell>{node.source.url}</TableCell>
      <TableCell>{node.start_time}</TableCell>
      <TableCell>{node.end_time}</TableCell>
      <TableCell>{node.level}</TableCell>
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
  const nodes = request.curriculum?.curriculum_nodes || []

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
            <TableHead>Source</TableHead>
            <TableHead>URL</TableHead>
            <TableHead>Start Time</TableHead>
            <TableHead>End Time</TableHead>
            <TableHead>Level</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {nodes.map((node) => (
            canEdit ? (
              <EditableRow
                key={node.id}
                node={node}
                onUpdateNode={(updates) => onUpdateNode?.(node.id, updates)}
                onUpdateSource={(updates) => onUpdateSource?.(node.source.id, updates)}
              />
            ) : (
              <TableRow key={node.id}>
                <TableCell>{node.source.title}</TableCell>
                <TableCell>{node.source.url}</TableCell>
                <TableCell>{node.start_time}</TableCell>
                <TableCell>{node.end_time}</TableCell>
                <TableCell>{node.level}</TableCell>
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