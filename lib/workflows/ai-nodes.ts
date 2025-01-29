import { supabase } from '@/lib/supabase'
import { ChatOpenAI } from '@langchain/openai'
import { HumanMessage } from '@langchain/core/messages'
import { RunnableConfig } from '@langchain/core/runnables'
import type { WorkflowState, WorkflowStateUpdate } from './types'
import crypto from 'crypto'

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
    return { ...state, context: data }
  } catch (error) {
    console.error(`[AI Node: gatherContext] Error for request ${state.requestId}:`, error)
    throw error
  }
}

// 2) planNode
export const planNode: NodeFunction = async (state) => {
  console.log(`[AI Node: plan] Starting for request ${state.requestId}`)
  const tag = state.context?.tag || 'GeneralTopic'
  const contentType = state.context?.content_type || 'tutorial'
  console.log(`[AI Node: plan] Planning for tag: ${tag}, content type: ${contentType}`)
  
  try {
    const model = new ChatOpenAI({ 
      modelName: 'gpt-4',
      temperature: 0 
    })
    
    console.log(`[AI Node: plan] Calling GPT-4 for request ${state.requestId}`)
    const response = await model.invoke([
      new HumanMessage(`Create a detailed learning plan for ${tag} as a ${contentType}. 
      Break it down into 5-10 key topics that would help someone learn this subject effectively.
      Format each topic as a clear, concise phrase.
      Each topic should be on a new line.
      Do not include numbers or bullet points.`),
    ])
    
    const planText = response.content
    const planItems = typeof planText === 'string' 
      ? planText
          .split('\n')
          .map(item => item.trim())
          .filter(Boolean)
      : []

    console.log(`[AI Node: plan] Generated ${planItems.length} plan items:`, planItems)
    return { ...state, planItems }
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
    console.log(`[AI Node: resourceSearch] Processing ${planItems.length} items for request ${state.requestId}:`, planItems)
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

    console.log(`[AI Node: resourceSearch] Found resources for ${Object.keys(resources).length} items:`, resources)
    return { ...state, resources }
  } catch (error) {
    console.error(`[AI Node: resourceSearch] Error for request ${state.requestId}:`, error)
    throw error
  }
}

// 4) buildCurriculumNode
export const buildCurriculumNode: NodeFunction = async (state) => {
  console.log(`[AI Node: buildCurriculum] Starting for request ${state.requestId}`)
  const { planItems = [], resources = {} } = state
  
  try {
    console.log(`[AI Node: buildCurriculum] State received:`, { planItems, resourceCount: Object.keys(resources).length })
    const curriculumId = crypto.randomUUID()
    console.log(`[AI Node: buildCurriculum] Creating curriculum ${curriculumId} for request ${state.requestId} with ${planItems.length} items`)
    
    // Create curriculum
    const { data: curriculum, error: curriculumError } = await supabase
      .from('curriculums')
      .insert([{ 
        id: curriculumId,
        request_id: state.requestId 
      }])
      .select()
      .single()
    
    if (curriculumError) {
      console.error(`[AI Node: buildCurriculum] Error creating curriculum for request ${state.requestId}:`, curriculumError)
      throw curriculumError
    }
    
    console.log(`[AI Node: buildCurriculum] Created curriculum ${curriculum.id} for request ${state.requestId}`)

    // Create curriculum nodes
    const nodes = planItems.map((item, index) => ({
      id: crypto.randomUUID(),
      curriculum_id: curriculum.id,
      source_id: null, // Will be set after source creation
      level: index,
      index_in_curriculum: index,
      start_time: 0,
      end_time: 0
    }))

    console.log(`[AI Node: buildCurriculum] Creating ${nodes.length} curriculum nodes for curriculum ${curriculum.id}:`, nodes)
    
    // First create all nodes
    const { error: nodesError } = await supabase
      .from('curriculum_nodes')
      .insert(nodes)
    
    if (nodesError) {
      console.error(`[AI Node: buildCurriculum] Error creating nodes for curriculum ${curriculum.id}:`, nodesError)
      throw nodesError
    }

    // Then create sources and update nodes with source IDs
    for (let i = 0; i < nodes.length; i++) {
      const item = planItems[i]
      const [firstResource] = resources[item] || []
      if (!firstResource) continue

      // Create source
      const { data: source, error: sourceError } = await supabase
        .from('sources')
        .insert([{ 
          title: firstResource.title, 
          URL: firstResource.url 
        }])
        .select()
        .single()
      
      if (sourceError) {
        console.error(`[AI Node: buildCurriculum] Error creating source for item ${i}:`, sourceError)
        throw sourceError
      }

      // Update node with source ID
      const { error: nodeError } = await supabase
        .from('curriculum_nodes')
        .update({ source_id: source.id })
        .eq('id', nodes[i].id)

      if (nodeError) {
        console.error(`[AI Node: buildCurriculum] Error updating node ${nodes[i].id} with source:`, nodeError)
        throw nodeError
      }
    }

    console.log(`[AI Node: buildCurriculum] Successfully created curriculum structure for request ${state.requestId}`)
    return { ...state }
  } catch (error) {
    console.error(`[AI Node: buildCurriculum] Error for request ${state.requestId}:`, error)
    throw error
  }
} 