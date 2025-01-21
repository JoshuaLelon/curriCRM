"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import Link from "next/link"

interface NewRequestFormProps {
  availableTypes: string[]
  availableTags: string[]
  onSubmit: (formData: any) => void
}

export default function NewRequestForm({ availableTypes, availableTags, onSubmit }: NewRequestFormProps) {
  const [formData, setFormData] = useState({
    sourceName: "",
    sourceUrl: "",
    tag: "",
    type: "",
    startTime: "",
    endTime: "",
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 bg-gray-50 p-6 rounded-lg max-w-md mx-auto">
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

      <div>
        <Label htmlFor="startTime">Start Time</Label>
        <Input
          id="startTime"
          type="number"
          min="0"
          value={formData.startTime}
          onChange={(e) => setFormData((prev) => ({ ...prev, startTime: e.target.value }))}
          required
        />
      </div>

      <div>
        <Label htmlFor="endTime">End Time</Label>
        <Input
          id="endTime"
          type="number"
          min="0"
          value={formData.endTime}
          onChange={(e) => setFormData((prev) => ({ ...prev, endTime: e.target.value }))}
          required
        />
      </div>

      <div className="flex justify-center gap-4 pt-4">
        <Link href="/student-home">
          <Button variant="outline">Home</Button>
        </Link>
        <Button type="submit" className="bg-[#7C8CFF] hover:bg-[#666ECC] text-white">
          Submit
        </Button>
      </div>
    </form>
  )
}

