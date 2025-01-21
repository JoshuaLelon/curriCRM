"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface Message {
  id: string
  sender: {
    id: string
    email: string
  }
  content: string
  created_at: string
}

interface ChatProps {
  messages: Message[]
  currentUserEmail: string
}

export default function Chat({ messages, currentUserEmail }: ChatProps) {
  const [newMessage, setNewMessage] = useState("")

  const handleSend = () => {
    if (!newMessage.trim()) return
    console.log("Sending message:", newMessage)
    setNewMessage("")
  }

  return (
    <div className="bg-[#E6F4FF] rounded-lg p-4 space-y-4">
      <h2 className="font-medium">Chat with the expert assigned</h2>
      <div className="space-y-2 max-h-[200px] overflow-y-auto">
        {messages.map((message) => (
          <div key={message.id} className="flex gap-2">
            <div className="text-sm font-medium">{message.sender.email}:</div>
            <div className="text-sm">{message.content}</div>
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <Input
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type your message..."
          className="flex-1"
        />
        <Button onClick={handleSend} className="bg-[#7C8CFF] hover:bg-[#666ECC] text-white">
          Send
        </Button>
      </div>
    </div>
  )
}

