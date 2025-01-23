"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import type { Message, Request } from "@/types/request"
import { canChat, canViewChat } from "@/utils/request-permissions"

interface ChatProps {
  request: Request
  currentUser: {
    id: string
    role: "student" | "expert" | "admin"
  }
  onMessageSent?: () => void
}

export default function Chat({ request, currentUser, onMessageSent }: ChatProps) {
  const [message, setMessage] = useState("")
  const [sending, setSending] = useState(false)
  const supabase = createClientComponentClient()

  const canSendMessages = canChat(request, currentUser)
  const canView = canViewChat(request, currentUser)

  if (!canView) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!message.trim() || sending) return

    try {
      setSending(true)
      const { error } = await supabase.from("messages").insert([
        {
          content: message.trim(),
          request_id: request.id,
          sender_id: currentUser.id,
        },
      ])

      if (error) throw error

      setMessage("")
      onMessageSent?.()
    } catch (err) {
      console.error("Error sending message:", err)
      alert("Failed to send message")
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="border rounded-lg p-4 h-96 overflow-y-auto space-y-4">
        {request.messages?.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${
              msg.sender.id === currentUser.id ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`max-w-[80%] rounded-lg p-3 ${
                msg.sender.id === currentUser.id
                  ? "bg-blue-500 text-white"
                  : "bg-gray-100"
              }`}
            >
              <div className="text-xs opacity-75 mb-1">
                {msg.sender.email.split("@")[0]}
              </div>
              <div className="break-words">{msg.content}</div>
            </div>
          </div>
        ))}
      </div>

      {canSendMessages && (
        <form onSubmit={handleSubmit} className="flex gap-2">
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 min-h-[80px]"
          />
          <Button
            type="submit"
            disabled={sending || !message.trim()}
            className="self-end"
          >
            Send
          </Button>
        </form>
      )}
    </div>
  )
} 