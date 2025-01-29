import { Request } from "@/types/request"
import { Database } from "@/types/supabase"

type User = Database["public"]["Tables"]["profiles"]["Row"]

export function isAIHandledRequest(request: Request, user: User) {
  console.log('[Permissions] isAIHandledRequest check:', { request, user })
  
  // If the request has no expert_id, it's not handled by anyone
  if (!request.expert_id) {
    return false
  }

  // Convert IDs to strings for comparison
  const userId = String(user.id)
  const expertId = String(request.expert_id)
  const isAssignedToUser = userId === expertId

  console.log('[Permissions] Assignment check:', {
    userId,
    expertId,
    isAssignedToUser
  })

  return isAssignedToUser
} 
