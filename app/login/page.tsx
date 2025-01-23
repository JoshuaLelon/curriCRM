'use client'

import LoginPage from "@/components/login-page"

export default function UnifiedLoginPage() {
  return (
    <LoginPage
      userType="user"
      alternateLogins={[]}
    />
  )
}