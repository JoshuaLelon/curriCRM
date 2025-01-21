"use client"

import React, { useState } from "react"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")

  async function handleLogin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setMessage("")
    setError("")
    try {
      const formData = new FormData()
      formData.set("email", email)

      const res = await fetch("/api/auth/magic-link", {
        method: "POST",
        body: formData,
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Login failed")
      }
      setMessage("Check your email for the magic link!")
    } catch (err: any) {
      setError(err.message)
    }
  }

  return (
    <div className="flex flex-col items-center gap-4 p-4">
      <h1 className="text-xl font-bold">Magic Link Login</h1>
      <form onSubmit={handleLogin} className="flex flex-col gap-2 w-full max-w-sm">
        <input
          className="border p-2"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email address"
        />
        <button className="bg-blue-600 text-white py-2 px-4 rounded" type="submit">
          Send Magic Link
        </button>
      </form>
      {message && <p className="text-green-600">{message}</p>}
      {error && <p className="text-red-600">{error}</p>}
    </div>
  )
}