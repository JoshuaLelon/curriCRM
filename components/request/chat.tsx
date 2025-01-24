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
    email: string
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
    canViewChat: canViewChat(request, currentUser),
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
      .channel(`request_${request.id}_messages`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `request_id=eq.${request.id}`,
        },
        async (payload) => {
          console.log("New message received:", payload)
          // Fetch the complete message with sender info
          const { data: messageData, error: messageError } = await supabase
            .from("messages")
            .select(`
              *,
              sender:profiles(*)
            `)
            .eq("id", payload.new.id)
            .single()

          if (messageError) {
            console.error("Error fetching new message:", messageError)
            return
          }

          setMessages((prev) => [...prev, messageData])
        }
      )
      .subscribe((status) => {
        console.log("Subscription status:", status)
      })

    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase, request.id, currentUser.id, request.expert, request.student])

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" })
    }
  }, [messages])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim()) return

    try {
      const messageData = {
        content: newMessage.trim(),
        request_id: request.id,
        sender_id: currentUser.id
      }

      const { error } = await supabase
        .from("messages")
        .insert(messageData)
        .select()

      if (error) {
        console.error("Error sending message:", error)
        throw error
      }

      setNewMessage("")
      onMessageSent?.()
    } catch (err) {
      console.error("Error sending message:", err)
      alert("Failed to send message")
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  if (!canViewChat(request, currentUser)) {
    return <div className="text-gray-500">Chat is not available</div>
  }

  return (
    <div className="space-y-4">
      <div className="border rounded-lg p-4 h-96 overflow-y-auto space-y-4">
        {messages.map((msg) => {
          const isCurrentUser = String(msg.sender_id) === String(currentUser.id)
          console.log('Message comparison:', {
            msg_sender_id: msg.sender_id,
            msg_sender_id_type: typeof msg.sender_id,
            currentUser_id: currentUser.id,
            currentUser_id_type: typeof currentUser.id,
            isCurrentUser
          })
          return (
            <div
              key={msg.id}
              className={`flex ${
                isCurrentUser ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`max-w-[80%] p-3 rounded-lg ${
                  isCurrentUser
                    ? "bg-blue-500 text-white"
                    : "bg-gray-100"
                }`}
              >
                <div className="text-sm font-medium mb-1">
                  {msg.sender?.email?.split("@")[0]}
                </div>
                <div>{msg.content}</div>
              </div>
            </div>
          )
        })}
        <div ref={messagesEndRef} />
      </div>

      {canSendMessages && (
        <form onSubmit={handleSubmit} className="flex gap-2">
          <Textarea
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={handleKeyPress}
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