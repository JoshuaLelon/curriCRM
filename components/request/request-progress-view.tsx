"use client"

import { useEffect, useState } from "react"
import { Progress } from "@/components/ui/progress"
import { useSupabase } from "@/components/providers/supabase-provider"
import type { Request } from "@/types/request"

interface RequestProgressViewProps {
  request: Request
}

interface ProgressUpdate {
  step: number
  totalSteps: number
}

const STEP_MESSAGES = {
  1: "Gathering context...",
  2: "Planning curriculum...",
  3: "Finding resources...",
  4: "Building curriculum...",
}

export default function RequestProgressView({ request }: RequestProgressViewProps) {
  const { supabase } = useSupabase()
  const [progress, setProgress] = useState<ProgressUpdate>({ step: 0, totalSteps: 4 })

  useEffect(() => {
    console.log(`[Progress View] Setting up realtime subscription for request ${request.id}`)
    
    const channel = supabase.channel(`request_${request.id}_updates`)
    
    channel
      .on('broadcast', { event: 'progress' }, (payload) => {
        console.log(`[Progress View] Received progress update for request ${request.id}:`, payload)
        const { step, totalSteps } = payload.payload
        setProgress({ step, totalSteps })
      })
      .subscribe((status) => {
        console.log(`[Progress View] Subscription status for request ${request.id}:`, status)
      })

    return () => {
      console.log(`[Progress View] Cleaning up subscription for request ${request.id}`)
      channel.unsubscribe()
    }
  }, [request.id, supabase])

  const progressPercentage = (progress.step / progress.totalSteps) * 100

  console.log(`[Progress View] Rendering progress for request ${request.id}: Step ${progress.step}/${progress.totalSteps}`)

  return (
    <div className="space-y-4 p-4 bg-[#E6F4FF] rounded-lg">
      <div className="flex justify-between items-center">
        <h3 className="text-sm font-medium">AI Processing Progress</h3>
        <span className="text-sm text-muted-foreground">
          Step {progress.step} of {progress.totalSteps}
        </span>
      </div>
      
      <Progress value={progressPercentage} className="h-2" />
      
      <div className="text-sm text-muted-foreground">
        {STEP_MESSAGES[progress.step as keyof typeof STEP_MESSAGES] || "Initializing..."}
      </div>
    </div>
  )
} 