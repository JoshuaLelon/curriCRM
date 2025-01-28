import { StateGraph, MemorySaver } from '@langchain/langgraph'
import { supabase } from '@/lib/supabase'
import { WorkflowAnnotation } from './types'
import {
  gatherContextNode,
  planNode,
  resourceSearchNode,
  buildCurriculumNode,
} from './ai-nodes'

// Create the workflow graph
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

export async function runAIWorkflow(requestId: string) {
  const graphApp = workflow.compile()

  // Run the graph from the start and track progress
  let currentStep = 0
  const stepMap: Record<string, number> = {
    gatherContext: 1,
    plan: 2,
    resourceSearch: 3,
    build: 4,
  }

  try {
    // Announce start
    await announceProgress(requestId, 'gatherContext')

    // Run workflow
    const result = await graphApp.invoke({ requestId })
    console.log('Workflow result:', result)

    // Mark request as finished in the DB
    await supabase
      .from('requests')
      .update({ finished_at: new Date().toISOString() })
      .eq('id', requestId)
  } catch (error) {
    console.error('Workflow error:', error)
    // Try to get more details about the error
    if (error instanceof Error) {
      console.error('Error stack:', error.stack)
      if ('cause' in error) {
        console.error('Error cause:', error.cause)
      }
    }
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