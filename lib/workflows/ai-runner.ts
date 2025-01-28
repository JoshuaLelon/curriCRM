import { StateGraph } from '@langchain/langgraph'
import { supabase } from '@/lib/supabase'
import { WorkflowAnnotation } from './types'
import {
  gatherContextNode,
  planNode,
  resourceSearchNode,
  buildCurriculumNode,
} from './ai-nodes'

export async function runAIWorkflow(requestId: string) {
  console.log(`[AI Runner] Starting workflow for request ${requestId}`)
  
  try {
    // 1) Assemble the state graph
    console.log(`[AI Runner] Assembling state graph for request ${requestId}`)
    const workflow = new StateGraph(WorkflowAnnotation)
      // Add nodes with progress tracking wrappers
      .addNode('gatherContext', async (state) => {
        await announceProgress(requestId, 'gatherContext')
        const result = await gatherContextNode(state)
        return result
      })
      .addNode('plan', async (state) => {
        await announceProgress(requestId, 'plan')
        const result = await planNode(state)
        return result
      })
      .addNode('resourceSearch', async (state) => {
        await announceProgress(requestId, 'resourceSearch')
        const result = await resourceSearchNode(state)
        return result
      })
      .addNode('build', async (state) => {
        await announceProgress(requestId, 'build')
        const result = await buildCurriculumNode(state)
        return result
      })
      // Edges define the order of steps
      .addEdge('__start__', 'gatherContext')
      .addEdge('gatherContext', 'plan')
      .addEdge('plan', 'resourceSearch')
      .addEdge('resourceSearch', 'build')
      .addEdge('build', '__end__')

    console.log(`[AI Runner] Compiling graph for request ${requestId}`)
    const graphApp = workflow.compile()

    // Run the graph from the start
    console.log(`[AI Runner] Invoking workflow for request ${requestId}`)
    const initialState = { requestId }
    await graphApp.invoke(initialState)

    // Mark request as finished in the DB
    console.log(`[AI Runner] Marking request ${requestId} as finished`)
    await supabase
      .from('requests')
      .update({ finished_at: new Date().toISOString() })
      .eq('id', requestId)
    
    console.log(`[AI Runner] Workflow completed successfully for request ${requestId}`)
  } catch (error) {
    console.error(`[AI Runner] Error in workflow for request ${requestId}:`, error)
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

  const step = stepMap[nodeName] ?? 0
  console.log(`[AI Runner] Broadcasting progress for request ${requestId}: Step ${step}/4 (${nodeName})`)
  
  try {
    await supabase.channel(`request_${requestId}_updates`).send({
      type: 'broadcast',
      event: 'progress',
      payload: {
        step,
        totalSteps: 4,
      },
    })
  } catch (error) {
    console.error(`[AI Runner] Error broadcasting progress for request ${requestId}:`, error)
  }
} 