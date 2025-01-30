import { createServerSupabaseClient } from '@/utils/supabase/server'
import { StateGraph, MemorySaver, Annotation } from '@langchain/langgraph'
import { WorkflowMetrics } from '@/lib/langsmith'
import { v4 as uuidv4 } from 'uuid'
import {
  gatherContextNode,
  planNode,
  resourceSearchNode,
  buildCurriculumNode,
} from './ai-nodes'

// Shape of the shared state for our workflow:
const WorkflowAnnotation = Annotation.Root({
  requestId: Annotation<string>(),
  context: Annotation<any>(),
  planItems: Annotation<string[]>(),
  resources: Annotation<Record<string, { title: string; url: string }[]>>(),
  __metrics: Annotation<WorkflowMetrics>()
})

export interface WorkflowResult {
  __metrics: {
    nodeTimings: Record<string, { start: number; end?: number; runId?: string }>
    startTime: number
    requestId: string
    projectName: string
    parentRunId?: string
  }
  context?: any
  planItems?: string[]
  resources?: Record<string, { title: string; url: string }[]>
  success: boolean
}

// Helper function to add delay
async function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

export async function runAIWorkflow(requestId: string): Promise<WorkflowResult> {
  const supabase = createServerSupabaseClient()
  // Initialize metrics
  const metrics = new WorkflowMetrics(requestId)
  await metrics.initializeParentRun()

  try {
    // Set started_at when workflow begins
    await supabase
      .from('requests')
      .update({ started_at: new Date().toISOString() })
      .eq('id', requestId)

    // 1) Assemble the state graph
    const workflow = new StateGraph(WorkflowAnnotation)
      .addNode('gatherContext', async (state, config) => {
        console.log(`[AI Runner] Starting gatherContext for request ${requestId}`)
        await announceProgress(requestId, 'gatherContext')
        const result = await gatherContextNode(state, config)
        console.log(`[AI Runner] Completed gatherContext for request ${requestId}`)
        return result
      })
      .addNode('plan', async (state, config) => {
        console.log(`[AI Runner] Starting plan for request ${requestId}`)
        await announceProgress(requestId, 'plan')
        const result = await planNode(state, config)
        console.log(`[AI Runner] Completed plan for request ${requestId}`)
        return result
      })
      .addNode('resourceSearch', async (state, config) => {
        console.log(`[AI Runner] Starting resourceSearch for request ${requestId}`)
        await announceProgress(requestId, 'resourceSearch')
        const result = await resourceSearchNode(state, config)
        console.log(`[AI Runner] Completed resourceSearch for request ${requestId}`)
        return result
      })
      .addNode('build', async (state, config) => {
        console.log(`[AI Runner] Starting build for request ${requestId}`)
        await announceProgress(requestId, 'build')
        const result = await buildCurriculumNode(state, config)
        console.log(`[AI Runner] Completed build for request ${requestId}`)
        return result
      })
      // Edges define the order of steps
      .addEdge('__start__', 'gatherContext')
      .addEdge('gatherContext', 'plan')
      .addEdge('plan', 'resourceSearch')
      .addEdge('resourceSearch', 'build')
      .addEdge('build', '__end__')

    const graphApp = workflow.compile({ 
      checkpointer: new MemorySaver() 
    })

    // 2) Run the graph from the start with metrics
    const initialState = { requestId, __metrics: metrics }
    const config = {
      configurable: {
        thread_id: uuidv4() // Add thread_id for MemorySaver
      }
    }
    const result = await graphApp.invoke(initialState, config)

    // 3) Mark request as finished in the DB
    await supabase
      .from('requests')
      .update({ finished_at: new Date().toISOString() })
      .eq('id', requestId)

    // 4) Log final metrics
    await metrics.logMetrics(true, result)

    // 5) Return the final state
    return {
      ...result,
      __metrics: {
        nodeTimings: metrics.getNodeTimings(),
        startTime: metrics.getStartTime(),
        requestId: metrics.getRequestId(),
        projectName: metrics.getProjectName(),
        parentRunId: metrics.getParentRunId()
      },
      success: true
    }
  } catch (error) {
    console.error('Workflow error:', error)
    await metrics.logMetrics(false, { error: String(error) })
    throw error
  }
}

// Helper function to broadcast progress
async function announceProgress(requestId: string, nodeName: string) {
  console.log(`[AI Runner] Broadcasting progress for request ${requestId}: ${nodeName}`)
  
  const stepMap: Record<string, number> = {
    gatherContext: 1,
    plan: 2,
    resourceSearch: 3,
    build: 4
  }

  const step = stepMap[nodeName] || 1
  const totalSteps = 4
  
  try {
    const supabase = createServerSupabaseClient()
    const channel = supabase.channel(`request_${requestId}_updates`)
    
    await channel.subscribe()
    
    await channel.send({
      type: 'broadcast',
      event: 'progress',
      payload: {
        step,
        totalSteps,
        stage: nodeName
      }
    })

    // Keep channel open briefly to ensure message delivery
    await new Promise(resolve => setTimeout(resolve, 100))
    
    await channel.unsubscribe()
  } catch (error) {
    console.error(`[AI Runner] Error broadcasting progress:`, error)
  }
}