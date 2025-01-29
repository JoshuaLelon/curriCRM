import { StateGraph } from '@langchain/langgraph'
import { supabase } from '@/lib/supabase'
import { graphState, WorkflowState } from './types'
import {
  gatherContextNode,
  planNode,
  resourceSearchNode,
  buildCurriculumNode,
} from './ai-nodes'

async function announceProgress(requestId: string, step: string, current: number, total: number) {
  console.log(`[AI Runner] Broadcasting progress for request ${requestId}: Step ${current}/${total} (${step})`)
  // Add your progress broadcast logic here
}

export async function runAIWorkflow(requestId: string) {
  console.log(`[AI Runner] Starting workflow for request ${requestId}`)
  
  try {
    // Set started_at when workflow begins
    console.log(`[AI Runner] Setting started_at for request ${requestId}`)
    const { error: startError } = await supabase
      .from('requests')
      .update({ started_at: new Date().toISOString() })
      .eq('id', requestId)
    
    if (startError) {
      console.error(`[AI Runner] Error setting started_at for request ${requestId}:`, startError)
      throw startError
    }

    // 1) Assemble the state graph
    console.log(`[AI Runner] Assembling state graph for request ${requestId}`)
    const workflow = new StateGraph({
      channels: graphState
    })
      // Add nodes with progress tracking wrappers
      .addNode('gatherContext', async (state) => {
        console.log(`[AI Runner] Executing gatherContext node for request ${requestId}, input state:`, state)
        await announceProgress(requestId, 'gatherContext', 1, 4)
        const result = await gatherContextNode(state)
        console.log(`[AI Runner] Completed gatherContext node for request ${requestId}, result:`, result)
        return result
      })
      .addNode('plan', async (state) => {
        console.log(`[AI Runner] Executing plan node for request ${requestId}, input state:`, state)
        await announceProgress(requestId, 'plan', 2, 4)
        const result = await planNode(state)
        console.log(`[AI Runner] Completed plan node for request ${requestId}, result:`, result)
        return result
      })
      .addNode('resourceSearch', async (state) => {
        console.log(`[AI Runner] Executing resourceSearch node for request ${requestId}, input state:`, state)
        await announceProgress(requestId, 'resourceSearch', 3, 4)
        const result = await resourceSearchNode(state)
        console.log(`[AI Runner] Completed resourceSearch node for request ${requestId}, result:`, result)
        return result
      })
      .addNode('build', async (state) => {
        console.log(`[AI Runner] Executing build node for request ${requestId}, input state:`, state)
        await announceProgress(requestId, 'build', 4, 4)
        const result = await buildCurriculumNode(state)
        console.log(`[AI Runner] Completed build node for request ${requestId}, result:`, result)
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
    const initialState = { 
      requestId,
      context: null,
      planItems: [],
      resources: {}
    }

    try {
      const finalState = await graphApp.invoke(initialState);
      console.log(`[AI Runner] Workflow execution completed with final state:`, finalState);
      
      // Mark request as finished in the DB
      console.log(`[AI Runner] Marking request ${requestId} as finished`)
      const { error: finishError } = await supabase
        .from('requests')
        .update({ finished_at: new Date().toISOString() })
        .eq('id', requestId)
      
      if (finishError) {
        console.error(`[AI Runner] Error setting finished_at for request ${requestId}:`, finishError)
        throw finishError
      }
      
      console.log(`[AI Runner] Workflow completed successfully for request ${requestId}`)
    } catch (error) {
      throw error
    }
  } catch (error) {
    console.error(`[AI Runner] Error in workflow for request ${requestId}:`, error)
    if (error instanceof Error) {
      console.error(`[AI Runner] Error details for request ${requestId}:`, {
        name: error.name,
        message: error.message,
        stack: error.stack
      })
    }
    throw error
  }
} 