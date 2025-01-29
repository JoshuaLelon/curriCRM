"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import type { CurriculumNode, Source } from "@/types"

interface CurriculumTableProps {
  nodes: CurriculumNode[]
  onAddRow: () => void
  onSubmit: () => void
  onHome: () => void
  onLevelChange: (nodeId: string, newLevel: number) => void
  onNodeUpdate: (nodeId: string, updates: Partial<CurriculumNode>) => void
  onSourceUpdate: (sourceId: string, updates: Partial<Source>) => void
}

export default function CurriculumTable({
  nodes,
  onAddRow,
  onSubmit,
  onHome,
  onLevelChange,
  onNodeUpdate,
  onSourceUpdate,
}: CurriculumTableProps) {
  const [editingNode, setEditingNode] = useState<string | null>(null)
  const [editValues, setEditValues] = useState<{
    title: string
    URL: string
    startTime: number
    endTime: number
  }>({
    title: "",
    URL: "",
    startTime: 0,
    endTime: 0,
  })

  const handleEdit = (node: CurriculumNode) => {
    setEditingNode(node.id)
    setEditValues({
      title: node.source?.title || "",
      URL: node.source?.URL || "",
      startTime: node.start_time,
      endTime: node.end_time,
    })
  }

  const handleSave = async (node: CurriculumNode) => {
    try {
      // Update source if it exists
      if (node.source) {
        await onSourceUpdate(node.source.id, {
          title: editValues.title,
          URL: editValues.URL,
        })
      }

      // Update node
      await onNodeUpdate(node.id, {
        start_time: editValues.startTime,
        end_time: editValues.endTime,
      })

      setEditingNode(null)
    } catch (error) {
      console.error("Error updating curriculum node:", error)
      alert("Failed to update curriculum node")
    }
  }

  return (
    <div className="space-y-4">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Source</TableHead>
              <TableHead>Start Time</TableHead>
              <TableHead>End Time</TableHead>
              <TableHead>Level</TableHead>
              <TableHead>Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {nodes.map((node) => (
              <TableRow key={node.id}>
                <TableCell>
                  {editingNode === node.id ? (
                    <div className="space-y-2">
                      <Input
                        value={editValues.title}
                        onChange={(e) =>
                          setEditValues({ ...editValues, title: e.target.value })
                        }
                        placeholder="Source title"
                      />
                      <Input
                        value={editValues.URL}
                        onChange={(e) =>
                          setEditValues({ ...editValues, URL: e.target.value })
                        }
                        placeholder="Source URL"
                      />
                    </div>
                  ) : (
                    <a
                      href={node.source?.URL}
                      className="text-blue-600 hover:underline"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {node.source?.title}
                    </a>
                  )}
                </TableCell>
                <TableCell>
                  {editingNode === node.id ? (
                    <Input
                      type="number"
                      value={editValues.startTime}
                      onChange={(e) =>
                        setEditValues({
                          ...editValues,
                          startTime: parseInt(e.target.value) || 0,
                        })
                      }
                    />
                  ) : (
                    formatTime(node.start_time)
                  )}
                </TableCell>
                <TableCell>
                  {editingNode === node.id ? (
                    <Input
                      type="number"
                      value={editValues.endTime}
                      onChange={(e) =>
                        setEditValues({
                          ...editValues,
                          endTime: parseInt(e.target.value) || 0,
                        })
                      }
                    />
                  ) : (
                    formatTime(node.end_time)
                  )}
                </TableCell>
                <TableCell>
                  <Input
                    type="number"
                    min={0}
                    max={10}
                    value={node.level}
                    onChange={(e) => onLevelChange(node.id, parseInt(e.target.value) || 0)}
                    className="w-20"
                  />
                </TableCell>
                <TableCell>
                  {editingNode === node.id ? (
                    <Button onClick={() => handleSave(node)}>Save</Button>
                  ) : (
                    <Button onClick={() => handleEdit(node)}>Edit</Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <div className="flex justify-end gap-4">
        <Button variant="outline" onClick={onHome}>
          Home
        </Button>
        <Button onClick={onAddRow} className="bg-[#7C8CFF] hover:bg-[#666ECC] text-white">
          Add Row
        </Button>
        <Button onClick={onSubmit} className="bg-[#7C8CFF] hover:bg-[#666ECC] text-white">
          Submit
        </Button>
      </div>
    </div>
  )
}

function formatTime(seconds: number): string {
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`
}

