"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import type { Request, Source } from "@/types/request"
import { canEditRequestDetails, canAssignExpert } from "@/utils/request-permissions"
import { getRequestStatus, getStatusLabel, getTimeElapsed } from "@/utils/request-status"

interface RequestDetailsProps {
  request: Request
  currentUser: {
    id: string
    role: "student" | "expert" | "admin"
  }
  experts?: Array<{ id: string; email: string }>
  onUpdate?: (updates: Partial<Request>) => void
  onExpertAssign?: (expertId: string) => void
}

const availableTypes = ["tutorial", "explanation", "how_to_guide", "reference"]
const availableTags = ["math", "software", "ai"]

export default function RequestDetails({
  request,
  currentUser,
  experts,
  onUpdate,
  onExpertAssign
}: RequestDetailsProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({
    sourceName: request.source?.title || "",
    sourceUrl: request.source?.URL || "",
    tag: request.tag,
    type: request.content_type,
  })

  const status = getRequestStatus(request)
  const canEdit = canEditRequestDetails(request, currentUser)
  const canAssign = canAssignExpert(request, currentUser)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!onUpdate) return

    onUpdate({
      tag: formData.tag,
      content_type: formData.type,
      source: {
        ...request.source,
        title: formData.sourceName,
        URL: formData.sourceUrl,
      } as Source,
    })
    setIsEditing(false)
  }

  if (isEditing && canEdit) {
    return (
      <form onSubmit={handleSubmit} className="space-y-4 bg-gray-50 p-6 rounded-lg">
        <div>
          <Label htmlFor="sourceName">Source Name</Label>
          <Input
            id="sourceName"
            value={formData.sourceName}
            onChange={(e) => setFormData((prev) => ({ ...prev, sourceName: e.target.value }))}
            required
          />
        </div>

        <div>
          <Label htmlFor="sourceUrl">Source URL</Label>
          <Input
            id="sourceUrl"
            type="url"
            value={formData.sourceUrl}
            onChange={(e) => setFormData((prev) => ({ ...prev, sourceUrl: e.target.value }))}
            required
          />
        </div>

        <div>
          <Label htmlFor="tag">Tag</Label>
          <Select value={formData.tag} onValueChange={(value) => setFormData((prev) => ({ ...prev, tag: value }))}>
            <SelectTrigger>
              <SelectValue placeholder="Select a tag" />
            </SelectTrigger>
            <SelectContent>
              {availableTags.map((tag) => (
                <SelectItem key={tag} value={tag}>
                  {tag.charAt(0).toUpperCase() + tag.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="type">Request Type</Label>
          <Select value={formData.type} onValueChange={(value) => setFormData((prev) => ({ ...prev, type: value }))}>
            <SelectTrigger>
              <SelectValue placeholder="Select a type" />
            </SelectTrigger>
            <SelectContent>
              {availableTypes.map((type) => (
                <SelectItem key={type} value={type}>
                  {type
                    .split("_")
                    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                    .join(" ")}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => setIsEditing(false)}>
            Cancel
          </Button>
          <Button type="submit">Save Changes</Button>
        </div>
      </form>
    )
  }

  return (
    <div className="bg-gray-50 p-6 rounded-lg space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label className="text-gray-500">Source</Label>
          <div>{request.source?.title || "No source"}</div>
        </div>
        <div>
          <Label className="text-gray-500">URL</Label>
          <div>{request.source?.URL || "No URL"}</div>
        </div>
        <div>
          <Label className="text-gray-500">Tag</Label>
          <div>{request.tag.charAt(0).toUpperCase() + request.tag.slice(1)}</div>
        </div>
        <div>
          <Label className="text-gray-500">Request Type</Label>
          <div>
            {request.content_type
              .split("_")
              .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
              .join(" ")}
          </div>
        </div>
        <div>
          <Label className="text-gray-500">Time Elapsed</Label>
          <div>{getTimeElapsed(request.created_at)}</div>
        </div>
        <div>
          <Label className="text-gray-500">Status</Label>
          <div>{getStatusLabel(status)}</div>
        </div>
        <div>
          <Label className="text-gray-500">Expert Assigned</Label>
          <div>{request.expert?.email.split("@")[0] || "Not assigned"}</div>
        </div>
      </div>

      {canEdit && (
        <div className="flex justify-end">
          <Button type="button" onClick={() => setIsEditing(true)}>
            Edit Details
          </Button>
        </div>
      )}

      {canAssign && experts && (
        <div className="mt-4 border-t pt-4">
          <Label htmlFor="expert">Assign Expert</Label>
          <div className="flex gap-2">
            <Select
              value={request.expert_id || ""}
              onValueChange={(value) => onExpertAssign?.(value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select an expert" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">None</SelectItem>
                {experts.map((expert) => (
                  <SelectItem key={expert.id} value={expert.id}>
                    {expert.email}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      )}
    </div>
  )
} 