import { Client } from 'langsmith'
import type { RunnableConfig } from "@langchain/core/runnables"

// Create LangSmith client
export const client = new Client({
  apiUrl: process.env.LANGSMITH_ENDPOINT,
  apiKey: process.env.LANGSMITH_API_KEY
})

// Interface for node timing metrics
interface NodeTimings {
  startTime: number
  endTime?: number
  duration?: number
}

// Define our node function type
export type NodeFn = (state: Record<string, any>, config?: RunnableConfig) => Promise<Record<string, any>>

// Class to track metrics for a workflow run
export class WorkflowMetrics {
  private startTime: number
  private nodeTimings: Record<string, NodeTimings> = {}
  private requestId: string

  constructor(requestId: string) {
    this.startTime = Date.now()
    this.requestId = requestId
  }

  onNodeStart(nodeName: string) {
    this.nodeTimings[nodeName] = {
      startTime: Date.now()
    }
  }

  onNodeEnd(nodeName: string) {
    const timing = this.nodeTimings[nodeName]
    if (timing) {
      timing.endTime = Date.now()
      timing.duration = timing.endTime - timing.startTime
    }
  }

  async logMetrics(success: boolean) {
    const endTime = Date.now()
    const totalDuration = endTime - this.startTime

    await client.createRun({
      name: `workflow_${this.requestId}`,
      run_type: "chain",
      inputs: { requestId: this.requestId },
      outputs: {
        success,
        totalDuration,
        nodeTimings: this.nodeTimings
      },
      project_name: process.env.LANGSMITH_PROJECT
    })
  }
}

// Higher-order function to trace node execution
export function traceNode(nodeName: string) {
  return function<T extends NodeFn>(node: T): T {
    return (async (state: Record<string, any>, config?: RunnableConfig) => {
      const metrics = state.__metrics as WorkflowMetrics
      if (metrics) {
        metrics.onNodeStart(nodeName)
        try {
          const result = await node(state, config)
          metrics.onNodeEnd(nodeName)
          return result
        } catch (error) {
          metrics.onNodeEnd(nodeName)
          throw error
        }
      }
      return node(state, config)
    }) as T
  }
} 