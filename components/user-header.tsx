"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { useSupabase } from '@/components/providers/supabase-provider'

interface UserHeaderProps {
  email: string
  userType: string
}

export default function UserHeader({ email, userType }: UserHeaderProps) {
  const router = useRouter()
  const { supabase } = useSupabase()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <div className="w-full bg-[#E6F4FF] p-4 flex justify-end items-center space-x-4">
      <span className="text-sm">{email}</span>
      <span className="text-sm">{userType}</span>
      <Button 
        variant="secondary" 
        className="bg-[#7C8CFF] hover:bg-[#666ECC] text-white text-sm h-8"
        onClick={handleLogout}
      >
        Log Out
      </Button>
    </div>
  )
}

