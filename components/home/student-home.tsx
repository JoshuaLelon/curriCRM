"use client"

import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import StudentRequestsTable from "@/components/student-requests-table"
import type { Request } from "@/types"

interface StudentHomeProps {
  requests: Request[]
  email: string
}

export default function StudentHome({ requests, email }: StudentHomeProps) {
  return (
    <div className="space-y-6">
      <StudentRequestsTable requests={requests} />
      <div className="flex justify-center">
        <Link href="/student-new-request" passHref>
          <Button className="bg-[#7C8CFF] hover:bg-[#666ECC] text-white">New Request</Button>
        </Link>
      </div>
    </div>
  )
} 