import { supabase } from '@/lib/supabase'
import { ChatOpenAI } from '@langchain/openai'
import { HumanMessage } from '@langchain/core/messages'
import { RunnableConfig } from '@langchain/core/runnables'
import type { WorkflowState, WorkflowStateUpdate } from './types'

type NodeFunction = (state: WorkflowState, config?: RunnableConfig) => Promise<WorkflowStateUpdate>

// 1) gatherContextNode
export const gatherContextNode: NodeFunction = async (state) => {
  console.log(`[AI Node: gatherContext] Starting for request ${state.requestId}`)
  
  try {
    const { data, error } = await supabase
      .from('requests')
      .select('*')
      .eq('id', state.requestId)
      .single()
    
    if (error) {
      console.error(`[AI Node: gatherContext] Database error for request ${state.requestId}:`, error)
      throw new Error('Unable to load request context')
    }
    if (!data) {
      console.error(`[AI Node: gatherContext] No data found for request ${state.requestId}`)
      throw new Error('Request not found')
    }

    console.log(`[AI Node: gatherContext] Successfully loaded context for request ${state.requestId}`)
    return { context: data }
  } catch (error) {
    console.error(`[AI Node: gatherContext] Error for request ${state.requestId}:`, error)
    throw error
  }
}

// 2) planNode
export const planNode: NodeFunction = async (state) => {
  console.log(`[AI Node: plan] Starting for request ${state.requestId}`)
  const tag = state.context?.tag || 'GeneralTopic'
  console.log(`[AI Node: plan] Planning for tag: ${tag}`)
  
  try {
    const model = new ChatOpenAI({ 
      modelName: 'gpt-4',
      temperature: 0 
    })
    
    console.log(`[AI Node: plan] Calling GPT-4 for request ${state.requestId}`)
    const response = await model.invoke([
      new HumanMessage(`Outline sub-topics needed to learn about "${tag}". One per line.`),
    ])
    
    const planText = response.content
    const planItems = typeof planText === 'string' 
      ? planText
          .split('\n')
          .map(item => item.trim())
          .filter(Boolean)
      : []

    console.log(`[AI Node: plan] Generated ${planItems.length} plan items for request ${state.requestId}`)
    return { planItems }
  } catch (error) {
    console.error(`[AI Node: plan] Error for request ${state.requestId}:`, error)
    throw error
  }
}

// 3) resourceSearchNode
export const resourceSearchNode: NodeFunction = async (state) => {
  console.log(`[AI Node: resourceSearch] Starting for request ${state.requestId}`)
  const { planItems = [] } = state
  
  try {
    console.log(`[AI Node: resourceSearch] Processing ${planItems.length} items for request ${state.requestId}`)
    const resources: Record<string, { title: string; url: string }[]> = {}

    for (const item of planItems) {
      console.log(`[AI Node: resourceSearch] Finding resources for item: ${item}`)
      resources[item] = [
        {
          title: `Mock resource for ${item}`,
          url: `https://example.com/${encodeURIComponent(item)}`
        }
      ]
    }

    console.log(`[AI Node: resourceSearch] Found resources for ${Object.keys(resources).length} items`)
    return { resources }
  } catch (error) {
    console.error(`[AI Node: resourceSearch] Error for request ${state.requestId}:`, error)
    throw error
  }
}

// 4) buildCurriculumNode
export const buildCurriculumNode: NodeFunction = async (state) => {
  console.log(`[AI Node: build] Starting for request ${state.requestId}`)
  const { planItems = [], resources = {}, requestId } = state

  try {
    // Create a new row in 'curriculums'
    console.log(`[AI Node: build] Creating curriculum for request ${requestId}`)
    const curriculumId = crypto.randomUUID()
    const { data: newCurriculum, error: curriculumError } = await supabase
      .from('curriculums')
      .insert([{ 
        id: curriculumId,
        request_id: requestId 
      }])
      .select()
      .single()
    
    if (curriculumError) {
      console.error(`[AI Node: build] Error creating curriculum:`, curriculumError)
      throw curriculumError
    }
    console.log(`[AI Node: build] Created curriculum ${curriculumId}`)

    // For each plan item, create a source and a curriculum_node
    for (let i = 0; i < planItems.length; i++) {
      const item = planItems[i]
      console.log(`[AI Node: build] Processing item ${i + 1}/${planItems.length}: ${item}`)
      
      const [firstResource] = resources[item] || []
      if (!firstResource) {
        console.log(`[AI Node: build] No resource found for item: ${item}, skipping`)
        continue
      }

      // Create source
      const sourceId = crypto.randomUUID()
      const { data: newSource, error: sourceError } = await supabase
        .from('sources')
        .insert([{ 
          id: sourceId,
          title: firstResource.title, 
          URL: firstResource.url 
        }])
        .select()
        .single()
      
      if (sourceError) {
        console.error(`[AI Node: build] Error creating source:`, sourceError)
        throw sourceError
      }
      console.log(`[AI Node: build] Created source ${sourceId}`)

      // Create curriculum node
      const nodeId = crypto.randomUUID()
      const { error: nodeError } = await supabase
        .from('curriculum_nodes')
        .insert([{
          id: nodeId,
          curriculum_id: newCurriculum.id,
          source_id: newSource.id,
          level: i,
          index_in_curriculum: i,
        }])
      
      if (nodeError) {
        console.error(`[AI Node: build] Error creating curriculum node:`, nodeError)
        throw nodeError
      }
      console.log(`[AI Node: build] Created curriculum node ${nodeId}`)
    }

    console.log(`[AI Node: build] Successfully built curriculum for request ${requestId}`)
    return {}
  } catch (error) {
    console.error(`[AI Node: build] Error for request ${state.requestId}:`, error)
    throw error
  }
} 