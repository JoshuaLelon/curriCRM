"use client"

import { useEffect, useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { useSupabase } from "@/components/providers/supabase-provider"
import type { Message, Request, UserRole } from "@/types/request"
import { canChat, canViewChat } from "@/utils/request-permissions"

interface ChatProps {
  request: Request
  currentUser: {
    id: string | number
    role: UserRole
  }
  onMessageSent?: () => void
}

export default function Chat({ request, currentUser, onMessageSent }: ChatProps) {
  const router = useRouter()
  const { supabase } = useSupabase()
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [loading, setLoading] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const canSendMessages = canChat(request, currentUser)
  console.log('Chat debug:', {
    canSendMessages,
    request: {
      id: request.id,
      accepted_at: request.accepted_at,
      started_at: request.started_at,
      finished_at: request.finished_at,
      student_id: request.student_id,
      expert_id: request.expert_id
    },
    currentUser
  })

  useEffect(() => {
    const fetchMessages = async () => {
      const { data, error } = await supabase
        .from("messages")
        .select(`
          *,
          sender:profiles(*)
        `)
        .eq("request_id", request.id)
        .order("created_at", { ascending: true })

      if (data) {
        setMessages(data)
      } else if (error) {
        console.error("Error fetching messages:", error)
      }
      setLoading(false)
    }

    fetchMessages()

    // Subscribe to new messages
    const channel = supabase
      .channel(`request_${request.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `request_id=eq.${request.id}`,
        },
        (payload) => {
          const newMessage = payload.new as Message
          setMessages((prev) => [...prev, newMessage])
        }
      )
      .subscribe()

    return () => {
      channel.unsubscribe()
    }
  }, [supabase, request.id])

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" })
    }
  }, [messages])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim()) return

    try {
      const { error } = await supabase.from("messages").insert([
        {
          content: newMessage.trim(),
          request_id: request.id,
          sender_id: typeof currentUser.id === 'string' ? parseInt(currentUser.id) : currentUser.id,
        },
      ])

      if (error) throw error

      setNewMessage("")
      onMessageSent?.()
    } catch (err) {
      console.error("Error sending message:", err)
      alert("Failed to send message")
    }
  }

  if (!canViewChat(request, currentUser)) {
    return <div className="text-gray-500">Chat is not available</div>
  }

  return (
    <div className="space-y-4">
      <div className="border rounded-lg p-4 h-96 overflow-y-auto space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${
              msg.sender?.id === currentUser.id ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`max-w-[80%] p-3 rounded-lg ${
                msg.sender?.id === currentUser.id
                  ? "bg-blue-500 text-white"
                  : "bg-gray-100"
              }`}
            >
              <div className="text-sm font-medium mb-1">
                {msg.sender?.email.split("@")[0]}
              </div>
              <div>{msg.content}</div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {canSendMessages && (
        <form onSubmit={handleSubmit} className="flex gap-2">
          <Textarea
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 min-h-[80px]"
          />
          <Button
            type="submit"
            disabled={!newMessage.trim()}
            className="self-end"
          >
            Send
          </Button>
        </form>
      )}
    </div>
  )
} 