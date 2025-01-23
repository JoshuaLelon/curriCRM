"use client"

import { useEffect, useRef, useState } from "react"
import type { Message } from "@/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface ChatProps {
  messages: Message[]
  currentUserEmail: string
  requestId: string
  onMessageSent: () => void
}

export default function Chat({ messages, currentUserEmail, requestId, onMessageSent }: ChatProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [newMessage, setNewMessage] = useState("")
  const [sending, setSending] = useState(false)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const handleSend = async () => {
    if (!newMessage.trim()) return

    try {
      setSending(true)
      const response = await fetch("/api/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content: newMessage,
          request_id: requestId,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to send message")
      }

      setNewMessage("")
      onMessageSent()
    } catch (error) {
      console.error("Error sending message:", error)
      alert("Failed to send message")
    } finally {
      setSending(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="bg-white rounded-lg shadow p-4 space-y-4">
      <div className="space-y-4 max-h-96 overflow-y-auto">
        {messages.map((message) => {
          const isCurrentUser = message.sender?.email === currentUserEmail
          return (
            <div
              key={message.id}
              className={`flex ${isCurrentUser ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[70%] rounded-lg p-3 ${
                  isCurrentUser ? "bg-blue-500 text-white" : "bg-gray-100"
                }`}
              >
                <div className="text-sm font-medium mb-1">
                  {message.sender?.email || "Unknown"}
                </div>
                <div>{message.content}</div>
                <div className="text-xs mt-1 opacity-70">
                  {new Date(message.created_at).toLocaleString()}
                </div>
              </div>
            </div>
          )
        })}
        <div ref={messagesEndRef} />
      </div>
      <div className="flex gap-2">
        <Input
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Type a message..."
          disabled={sending}
        />
        <Button
          onClick={handleSend}
          disabled={sending || !newMessage.trim()}
          className="bg-[#7C8CFF] hover:bg-[#666ECC] text-white"
        >
          {sending ? "Sending..." : "Send"}
        </Button>
      </div>
    </div>
  )
}

