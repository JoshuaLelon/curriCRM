'use client'

import LoginPage from "@/components/login-page"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function StudentLoginPage() {
  return (
    <>
      <LoginPage
        userType="student"
        alternateLogins={["admin", "expert"]}
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