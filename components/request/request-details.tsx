"use client"

import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { useSupabase } from "@/components/providers/supabase-provider"
import type { Request, Source, Tag, ContentType } from "@/types/request"
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

const availableTypes: ContentType[] = ["tutorial", "explanation", "how_to_guide", "reference"]
const availableTags: Tag[] = ["math", "software", "ai"]

export default function RequestDetails({
  request: initialRequest,
  currentUser,
  experts,
  onUpdate,
  onExpertAssign
}: RequestDetailsProps) {
  const { supabase } = useSupabase()
  const [request, setRequest] = useState(initialRequest)
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({
    sourceName: initialRequest.source?.title || "",
    sourceUrl: initialRequest.source?.url || "",
    tag: initialRequest.tag as Tag,
    type: initialRequest.content_type as ContentType,
  })

  // Update local state when initialRequest changes
  useEffect(() => {
    setRequest(initialRequest)
    setFormData({
      sourceName: initialRequest.source?.title || "",
      sourceUrl: initialRequest.source?.url || "",
      tag: initialRequest.tag as Tag,
      type: initialRequest.content_type as ContentType,
    })
  }, [initialRequest])

  const status = getRequestStatus(request)
  const canEdit = canEditRequestDetails(request, currentUser)
  const canAssign = canAssignExpert(request, currentUser)

  // Set up real-time subscription
  useEffect(() => {
    console.log(`[Request Details] Setting up realtime subscription for request ${request.id}`)
    
    const channel = supabase
      .channel(`request_${request.id}_details`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'requests',
          filter: `id=eq.${request.id}`,
        },
        async (payload) => {
          console.log(`[Request Details] Received update for request ${request.id}:`, payload)
          
          // Fetch the complete request data with all relations
          const { data, error } = await supabase
            .from('requests')
            .select(`
              *,
              source:sources(*),
              student:profiles!requests_student_id_fkey(
                id,
                email,
                specialty,
                is_admin
              ),
              expert:profiles!requests_expert_id_fkey(
                id,
                user_id,
                email,
                specialty,
                is_admin
              ),
              curriculum:curriculums!curriculums_request_id_fkey (
                *,
                curriculum_nodes (*)
              )
            `)
            .eq('id', request.id)
            .single()

          if (error) {
            console.error(`[Request Details] Error fetching updated request:`, error)
            return
          }

          console.log(`[Request Details] Setting updated request data:`, data)
          setRequest(data)
        }
      )
      .subscribe((status) => {
        console.log(`[Request Details] Subscription status for request ${request.id}:`, status)
      })

    return () => {
      console.log(`[Request Details] Cleaning up subscription for request ${request.id}`)
      supabase.removeChannel(channel)
    }
  }, [request.id, supabase])

  // Debug logging
  useEffect(() => {
    console.log('[Request Details] State updated:', {
      requestId: request.id,
      expertId: request.expert_id,
      expertEmail: request.expert?.email,
      status,
      currentUserId: currentUser.id
    })
  }, [request, status, currentUser.id])

  useEffect(() => {
    if (canAssign && experts) {
      console.log('[Request Details] Expert assignment section state:', {
        canAssign,
        hasExperts: !!experts,
        expertsLength: experts.length,
        currentUser
      })
    }
  }, [canAssign, experts, currentUser])

  console.log('[Request Details] Render state:', {
    status,
    canEdit,
    canAssign,
    currentUser,
    experts: experts?.length
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!onUpdate) return

    onUpdate({
      tag: formData.tag,
      content_type: formData.type,
      source: {
        ...request.source,
        title: formData.sourceName,
        url: formData.sourceUrl,
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
          <Select value={formData.tag} onValueChange={(value) => setFormData((prev) => ({ ...prev, tag: value as Tag }))}>
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
          <Select value={formData.type} onValueChange={(value) => setFormData((prev) => ({ ...prev, type: value as ContentType }))}>
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
          <div>
            {request.source?.url ? (
              <a
                href={request.source.url}
                className="text-blue-600 hover:underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                {request.source.url}
              </a>
            ) : (
              "No URL"
            )}
          </div>
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
              value={(() => {
                // If expert is the current admin (AI case), return currentUser.id
                if (request.expert?.id?.toString() === currentUser.id) {
                  return currentUser.id
                }
                // If there's an expert assigned, return their id
                if (request.expert_id) {
                  return request.expert_id.toString()
                }
                // Otherwise return "none"
                return "none"
              })()}
              onValueChange={(value) => {
                console.log('[Request Details] Dropdown changed:', {
                  oldValue: request.expert_id?.toString() || "none",
                  newValue: value,
                  currentUser,
                  onExpertAssign: !!onExpertAssign
                })
                onExpertAssign?.(value === "none" ? "" : value)
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select an expert">
                  {(() => {
                    if (request.expert?.id?.toString() === currentUser.id) {
                      return "AI (Assigned to Self)"
                    }
                    if (request.expert?.email) {
                      return request.expert.email
                    }
                    return "None"
                  })()}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                <SelectItem value={currentUser.id}>
                  {request.expert?.id?.toString() === currentUser.id ? "AI (Assigned to Self)" : "AI (Assign to Self)"}
                </SelectItem>
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