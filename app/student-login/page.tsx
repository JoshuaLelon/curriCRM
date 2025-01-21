import LoginPage from "@/components/login-page"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { useState } from "react"

export default function StudentLoginPage() {
  const [showNotification, setShowNotification] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setShowNotification(true)
    setTimeout(() => setShowNotification(false), 3000)
  }

  return (
    <>
      <LoginPage
        userType="student"
        alternateLogins={["admin", "expert"]}
        onSubmit={handleSubmit}
        showNotification={showNotification}
      />
      <div className="mt-4">
        <Link href="/admin-login">
          <Button variant="secondary" className="bg-[#7C8CFF] hover:bg-[#666ECC] text-white">
            Admin Login
          </Button>
        </Link>
        <Link href="/expert-login">
          <Button variant="secondary" className="bg-[#7C8CFF] hover:bg-[#666ECC] text-white">
            Expert Login
          </Button>
        </Link>
      </div>
    </>
  )
}

