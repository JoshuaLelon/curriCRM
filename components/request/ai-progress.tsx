"use client"

import { useEffect, useState } from "react"
import { useSupabase } from "@/components/providers/supabase-provider"
import { Progress } from "@/components/ui/progress"
import { CheckCircle2, Circle, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface AIProgressProps {
  requestId: string
}

export function AIProgress({ requestId }: AIProgressProps) {
  const { supabase } = useSupabase()
  const [stage, setStage] = useState('gatherContext')
  const [progress, setProgress] = useState(0)
  const [isComplete, setIsComplete] = useState(false)
  const [startTime] = useState<number>(Date.now())
  const [totalTime, setTotalTime] = useState<number>(0)
  const [elapsedTime, setElapsedTime] = useState<number>(0)
  const [stageTimes, setStageTimes] = useState<Record<string, number>>({})
  const [stageStartTime, setStageStartTime] = useState<number>(Date.now())
  const [completedStages, setCompletedStages] = useState<string[]>([])

  const stageMap = {
    gatherContext: { label: 'Gathering Context', description: 'Analyzing your request and requirements' },
    plan: { label: 'Planning', description: 'Creating a personalized learning plan' },
    resourceSearch: { label: 'Finding Resources', description: 'Searching for the best learning materials' },
    build: { label: 'Building Curriculum', description: 'Structuring your learning path' }
  }

  // Update elapsed time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedTime(Date.now() - startTime)
    }, 1000)
    return () => clearInterval(timer)
  }, [startTime])

  useEffect(() => {
    console.log(`[AI Progress] Setting up channel for request ${requestId}`)
    
    const channel = supabase.channel(`request_${requestId}_updates`)
    let mounted = true

    // Also listen for request updates to detect completion
    const requestChannel = supabase
      .channel(`request_${requestId}_status`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'requests',
          filter: `id=eq.${requestId}`,
        },
        (payload) => {
          console.log('[AI Progress] Received request update:', payload)
          const updatedRequest = payload.new as any
          
          // If request is finished, mark current stage as complete
          if (updatedRequest.finished_at) {
            console.log('[AI Progress] Request finished, marking current stage as complete')
            const finalStageTime = (Date.now() - stageStartTime) / 1000
            
            setStageTimes(prev => ({
              ...prev,
              [stage]: finalStageTime
            }))
            
            setCompletedStages(prev => {
              if (prev.includes(stage)) return prev
              return [...prev, stage]
            })
            
            setIsComplete(true)
            setTotalTime((Date.now() - startTime) / 1000)
          }
        }
      )

    const handleProgress = (payload: any) => {
      console.log(`[AI Progress] Received progress update:`, payload)
      if (!mounted) return

      const { step, totalSteps, stage: newStage } = payload.payload
      if (typeof step !== 'number' || typeof totalSteps !== 'number') {
        console.warn('[AI Progress] Invalid progress update format:', payload)
        return
      }

      // Calculate progress percentage
      const newProgress = Math.round((step / totalSteps) * 100)
      setProgress(newProgress)

      if (newStage) {
        console.log(`[AI Progress] Stage update: ${newStage}`)
        
        // If we're moving to a new stage, mark the current stage as completed
        if (newStage !== stage) {
          console.log(`[AI Progress] Stage transition: ${stage} -> ${newStage}`)
          const stageTime = (Date.now() - stageStartTime) / 1000
          console.log(`[AI Progress] Recording time for ${stage}: ${stageTime}s`)
          
          // Always update the time for the current stage before moving to next
          setStageTimes(prev => ({
            ...prev,
            [stage]: stageTime
          }))
          
          // Add the current stage to completed stages
          setCompletedStages(prev => {
            if (prev.includes(stage)) return prev
            return [...prev, stage]
          })
          
          // Reset start time for new stage
          setStageStartTime(Date.now())
          setStage(newStage)
        }
      }
    }

    channel
      .on('broadcast', { event: 'progress' }, handleProgress)
      .subscribe((status) => {
        console.log(`[AI Progress] Channel subscription status: ${status}`)
      })

    requestChannel.subscribe((status) => {
      console.log(`[AI Progress] Request channel subscription status: ${status}`)
    })

    return () => {
      mounted = false
      channel.unsubscribe()
      requestChannel.unsubscribe()
    }
  }, [requestId, supabase, stage, startTime, stageStartTime])

  // Helper function to get current elapsed time for active stage
  const getCurrentStageTime = () => {
    return (Date.now() - stageStartTime) / 1000
  }

  const getStageStatus = (stageName: string) => {
    if (completedStages.includes(stageName)) return 'completed'
    if (stageName === stage) return 'current'
    return 'pending'
  }

  const formatTime = (seconds: number) => {
    if (!seconds || isNaN(seconds)) return '--'
    return `${seconds.toFixed(1)}s`
  }

  const getStageTime = (stageName: string) => {
    const status = getStageStatus(stageName)
    if (status === 'pending') return '--'
    if (status === 'current') return formatTime(getCurrentStageTime())
    return formatTime(stageTimes[stageName])
  }

  return (
    <div className="space-y-6 p-4 border rounded-lg">
      <div className="space-y-2">
        <h3 className="text-lg font-medium">Generating Your Curriculum ({progress}%)</h3>
        <Progress value={progress} className="w-full" />
      </div>

      <div className="space-y-4">
        {Object.entries(stageMap).map(([key, { label, description }]) => {
          const status = getStageStatus(key)
          return (
            <div key={key} className="flex items-start gap-4">
              {status === 'completed' ? (
                <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5" />
              ) : status === 'current' ? (
                <Loader2 className="w-5 h-5 text-blue-500 mt-0.5 animate-spin" />
              ) : (
                <Circle className="w-5 h-5 text-gray-300 mt-0.5" />
              )}
              <div className="flex-1">
                <div className="flex justify-between items-center">
                  <p className={cn(
                    "font-medium",
                    status === 'completed' && "text-green-600",
                    status === 'current' && "text-blue-600"
                  )}>{label}</p>
                  <span className="text-sm text-gray-500">
                    {getStageTime(key)}
                  </span>
                </div>
                <p className="text-sm text-gray-500">{description}</p>
              </div>
            </div>
          )
        })}
      </div>

      <div className="text-sm text-gray-500 text-right">
        Total time: {isComplete ? formatTime(totalTime) : formatTime(elapsedTime / 1000)}
      </div>
    </div>
  )
} 
