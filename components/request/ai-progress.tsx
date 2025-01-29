"use client"

import { useEffect, useState } from "react"
import { useSupabase } from "@/components/providers/supabase-provider"
import { Progress } from "@/components/ui/progress"
import { CheckCircle2, Circle, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface AIProgressProps {
  requestId: string
}

type Stage = {
  name: string
  label: string
  description: string
}

const STAGES: Stage[] = [
  {
    name: "gatherContext",
    label: "Gathering Context",
    description: "Analyzing your request and requirements"
  },
  {
    name: "plan",
    label: "Planning",
    description: "Creating a personalized learning plan"
  },
  {
    name: "resourceSearch",
    label: "Finding Resources",
    description: "Searching for the best learning materials"
  },
  {
    name: "build",
    label: "Building Curriculum",
    description: "Structuring your learning path"
  }
]

export default function AIProgress({ requestId }: AIProgressProps) {
  const { supabase } = useSupabase()
  const [currentStage, setCurrentStage] = useState<string>("gatherContext")
  const [isComplete, setIsComplete] = useState(false)
  const [startTime] = useState<number>(Date.now())
  const [totalTime, setTotalTime] = useState<number>(0)

  useEffect(() => {
    console.log(`[AI Progress] Setting up channel for request ${requestId}`)
    const channel = supabase.channel(`request_${requestId}_updates`)
    
    channel
      .on('broadcast', { event: 'progress' }, (payload) => {
        console.log(`[AI Progress] Received broadcast event:`, {
          type: payload.type,
          event: payload.event,
          payload: payload.payload
        })

        const { step, totalSteps } = payload.payload
        console.log(`[AI Progress] Processing step ${step}/${totalSteps}`)

        // Map step number back to stage name
        const stepToStage: Record<number, string> = {
          1: 'gatherContext',
          2: 'plan',
          3: 'resourceSearch',
          4: 'build'
        }
        const stageName = stepToStage[step] || 'gatherContext'
        console.log(`[AI Progress] Setting stage to: ${stageName}`)
        setCurrentStage(stageName)

        if (step === totalSteps) {
          console.log('[AI Progress] Final stage reached, will mark as complete soon')
          // Calculate total time
          const timeInSeconds = (Date.now() - startTime) / 1000
          setTotalTime(timeInSeconds)
          // Wait a bit before marking as complete to show the final stage
          setTimeout(() => {
            console.log('[AI Progress] Marking as complete')
            setIsComplete(true)
          }, 1000)
        }
      })
      .subscribe((status) => {
        console.log(`[AI Progress] Channel subscription status:`, status)
      })

    // Reset states when component mounts
    console.log('[AI Progress] Resetting states on mount')
    setCurrentStage("gatherContext")
    setIsComplete(false)

    return () => {
      console.log(`[AI Progress] Cleaning up channel for request ${requestId}`)
      supabase.removeChannel(channel)
    }
  }, [requestId, supabase, startTime])

  const currentStageIndex = STAGES.findIndex(s => s.name === currentStage)
  const progress = isComplete ? 100 : Math.round(((currentStageIndex + 1) / STAGES.length) * 100)

  console.log(`[AI Progress] Current stage: ${currentStage}, progress: ${progress}%`)

  return (
    <div className="space-y-6 rounded-lg border bg-card p-6">
      <div className="space-y-2">
        <h3 className="font-semibold">
          {isComplete 
            ? `Curriculum Generated (${totalTime.toFixed(1)}s)`
            : "Generating Your Curriculum"}
        </h3>
        <Progress value={progress} className="h-2" />
      </div>

      <div className="space-y-4">
        {STAGES.map((stage, index) => {
          const isActive = stage.name === currentStage
          const isStageComplete = isComplete || index < currentStageIndex
          
          return (
            <div 
              key={stage.name}
              className={cn(
                "flex items-start gap-3 transition-colors",
                isActive && "text-primary",
                !isActive && !isStageComplete && "text-muted-foreground"
              )}
            >
              {isStageComplete ? (
                <CheckCircle2 className="h-5 w-5 flex-shrink-0 text-primary" />
              ) : isActive ? (
                <Loader2 className="h-5 w-5 flex-shrink-0 animate-spin" />
              ) : (
                <Circle className="h-5 w-5 flex-shrink-0" />
              )}
              <div>
                <div className="font-medium">{stage.label}</div>
                <div className="text-sm text-muted-foreground">
                  {stage.description}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
} 
