import { Client } from 'langsmith'
import type { RunnableConfig } from "@langchain/core/runnables"
import type { Run, RunCreate, RunUpdate } from 'langsmith/schemas'
import { v4 as uuidv4 } from 'uuid'
import { trackWorkflowMetrics } from './metrics/track-metrics'

// Create LangSmith client as a singleton
export const client = new Client({
  apiUrl: process.env.LANGSMITH_ENDPOINT,
  apiKey: process.env.LANGSMITH_API_KEY
})

// Interface for node timing metrics
interface NodeTimings {
  startTime: number
  endTime?: number
  duration?: number
  inputs?: any
  outputs?: any
  runId?: string
}

// Define our node function type
export type NodeFn = (state: Record<string, any>, config?: RunnableConfig) => Promise<Record<string, any>>

// Class to track metrics for a workflow run
export class WorkflowMetrics {
  private nodeTimings: Record<string, { start: number; end?: number; runId?: string }> = {}
  private startTime: number
  private requestId: string
  private parentRunId?: string
  private projectName: string

  constructor(requestId: string) {
    this.startTime = Date.now()
    this.requestId = requestId
    this.projectName = process.env.LANGSMITH_PROJECT || 'default'
  }

  // Add getter methods
  getNodeTimings() {
    return this.nodeTimings
  }

  getStartTime() {
    return this.startTime
  }

  getRequestId() {
    return this.requestId
  }

  getProjectName() {
    return this.projectName
  }

  getParentRunId() {
    return this.parentRunId
  }

  async initializeParentRun() {
    try {
      const runId = uuidv4()
      
      // Create the parent run
      await client.createRun({
        id: runId,
        name: 'AI Workflow',
        run_type: 'chain',
        start_time: this.startTime,
        project_name: this.projectName,
        inputs: {
          requestId: this.requestId
        }
      })

      this.parentRunId = runId
      console.log(`Created parent run with ID: ${runId}`)
    } catch (error) {
      console.error('Error creating parent run:', error)
    }
  }

  async onNodeStart(nodeName: string) {
    try {
      const runId = uuidv4()
      this.nodeTimings[nodeName] = {
        start: Date.now(),
        runId
      }

      // Create the child run
      await client.createRun({
        id: runId,
        name: nodeName,
        run_type: 'chain',
        start_time: Date.now(),
        parent_run_id: this.parentRunId,
        project_name: this.projectName,
        inputs: {
          requestId: this.requestId,
          nodeName
        }
      })

      console.log(`Created child run with ID: ${runId} for node ${nodeName}`)
    } catch (error) {
      console.error(`Error in onNodeStart for node ${nodeName}:`, error)
    }
  }

  async onNodeEnd(nodeName: string, outputs?: any) {
    const timing = this.nodeTimings[nodeName]
    if (timing) {
      timing.end = Date.now()

      if (timing.runId) {
        try {
          const runUpdate: RunUpdate = {
            end_time: timing.end,
            outputs: {
              duration: timing.end - timing.start,
              ...outputs
            }
          }

          // If outputs contains an error, mark the run as failed
          if (outputs?.error) {
            runUpdate.error = String(outputs.error)
          }

          await client.updateRun(timing.runId, runUpdate)
          console.log(`Updated child run ${timing.runId} for node ${nodeName}`)
        } catch (error) {
          console.error(`Error updating child run for node ${nodeName}:`, error)
        }
      }
    }
  }

  getNodeDuration(nodeName: string): number | undefined {
    const timing = this.nodeTimings[nodeName]
    if (timing && timing.end) {
      return timing.end - timing.start
    }
    return undefined
  }

  getTotalDuration(): number {
    return Date.now() - this.startTime
  }

  async logMetrics(success: boolean, finalOutputs?: any) {
    if (!this.parentRunId) {
      console.error('No parent run ID available for logging metrics')
      return
    }

    try {
      const endTime = Date.now()
      const metrics = {
        success,
        totalDuration: this.getTotalDuration(),
        nodeTimings: Object.entries(this.nodeTimings).reduce((acc, [nodeName, timing]) => {
          acc[nodeName] = {
            duration: timing.end ? timing.end - timing.start : undefined,
            runId: timing.runId
          }
          return acc
        }, {} as Record<string, { duration?: number; runId?: string }>),
        ...finalOutputs
      }

      // Update the parent run
      await client.updateRun(this.parentRunId, {
        end_time: endTime,
        outputs: metrics
      })

      // Track metrics in CSV
      await trackWorkflowMetrics(metrics)

      console.log(`Updated parent run ${this.parentRunId} with final metrics`)
    } catch (error) {
      console.error('Error updating parent run with metrics:', error)
    }
  }
}

// Higher-order function to trace node execution
export function traceNode(nodeName: string) {
  return function (node: NodeFn): NodeFn {
    return async (state: Record<string, any>, config?: RunnableConfig) => {
      const metrics = state.__metrics as WorkflowMetrics
      if (metrics) {
        await metrics.onNodeStart(nodeName)
        try {
          const result = await node(state, config)
          await metrics.onNodeEnd(nodeName, result)
          return result
        } catch (error) {
          await metrics.onNodeEnd(nodeName, { error: String(error) })
          throw error
        }
      }
      return node(state, config)
    }
  }
} 