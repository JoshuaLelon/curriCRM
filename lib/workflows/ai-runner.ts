import { supabase } from '@/lib/supabase'
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

export async function runAIWorkflow(requestId: string): Promise<WorkflowResult> {
  // Initialize metrics
  const metrics = new WorkflowMetrics(requestId)
  await metrics.initializeParentRun()

  // 1) Assemble the state graph
  const workflow = new StateGraph(WorkflowAnnotation)
    .addNode('gatherContext', gatherContextNode)
    .addNode('plan', planNode)
    .addNode('resourceSearch', resourceSearchNode)
    .addNode('build', buildCurriculumNode)
    // Edges define the order of steps
    .addEdge('__start__', 'gatherContext')
    .addEdge('gatherContext', 'plan')
    .addEdge('plan', 'resourceSearch')
    .addEdge('resourceSearch', 'build')
    .addEdge('build', '__end__')

  const graphApp = workflow.compile({ 
    checkpointer: new MemorySaver() 
  })

  try {
    // 2) Run the graph from the start with metrics
    const initialState = { requestId, __metrics: metrics }
    const config = {
      configurable: {
        thread_id: uuidv4() // Add thread_id for MemorySaver
      }
    }
    const result = await graphApp.invoke(initialState, config)

    // 3) Broadcast progress
    await announceProgress(requestId, 'build')

    // 4) Mark request as finished in the DB
    await supabase
      .from('requests')
      .update({ finished_at: new Date().toISOString() })
      .eq('id', requestId)

    // 5) Log final metrics
    await metrics.logMetrics(true, result)

    // 6) Return the final state
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
  // Map nodeName => step number. Adjust as needed.
  const stepMap: Record<string, number> = {
    gatherContext: 1,
    plan: 2,
    resourceSearch: 3,
    build: 4,
  }

  await supabase.channel(`request_${requestId}_updates`).send({
    type: 'broadcast',
    event: 'progress',
    payload: {
      step: stepMap[nodeName] ?? 0,
      totalSteps: 4,
    },
  })
} 