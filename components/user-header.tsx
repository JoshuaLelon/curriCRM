import Link from "next/link"
import { Button } from "@/components/ui/button"

interface UserHeaderProps {
  email: string
  userType: string
}

export default function UserHeader({ email, userType }: UserHeaderProps) {
  return (
    <div className="w-full bg-[#E6F4FF] p-4 flex justify-end items-center space-x-4">
      <span className="text-sm">{email}</span>
      <span className="text-sm">{userType}</span>
      <Link href="/student-login">
        <Button variant="secondary" className="bg-[#7C8CFF] hover:bg-[#666ECC] text-white text-sm h-8">
          Log Out
        </Button>
      </Link>
    </div>
  )
}

