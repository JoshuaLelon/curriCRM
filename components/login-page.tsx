"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface LoginPageProps {
  userType: "admin" | "expert" | "student"
  alternateLogins: string[]
}

export default function LoginPage({ userType, alternateLogins }: LoginPageProps) {
  const [email, setEmail] = useState("")
  const [showNotification, setShowNotification] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setShowNotification(true)
    setTimeout(() => setShowNotification(false), 3000)
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <h1 className="text-2xl font-semibold mb-8">Welcome to Curricrm</h1>

      <div className="w-full max-w-sm bg-[#E6F4FF] p-6 rounded-lg">
        <h2 className="text-xl font-medium text-center mb-4">
          {userType.charAt(0).toUpperCase() + userType.slice(1)} Login
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            type="email"
            placeholder="name@org.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="bg-white"
          />

          <Button type="submit" className="w-full bg-[#7C8CFF] hover:bg-[#666ECC] text-white">
            Send Link
          </Button>
        </form>
      </div>

      {showNotification && (
        <div className="mt-4 text-green-600 bg-green-50 px-4 py-2 rounded">Link sent to your email</div>
      )}

      <div className="mt-6 space-x-4">
        {alternateLogins.map((loginType) => (
          <Link key={loginType} href={`/${loginType}-login`}>
            <Button variant="secondary" className="bg-[#7C8CFF] hover:bg-[#666ECC] text-white">
              {loginType.charAt(0).toUpperCase() + loginType.slice(1)} Login
            </Button>
          </Link>
        ))}
      </div>
    </div>
  )
}

