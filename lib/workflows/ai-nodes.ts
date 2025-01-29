import { supabase } from '@/lib/supabase'
import { ChatOpenAI } from '@langchain/openai'
import { HumanMessage } from '@langchain/core/messages'
import { RunnableConfig } from '@langchain/core/runnables'
import { traceNode, NodeFn } from '@/lib/langsmith'
import { WorkflowState, WorkflowStateUpdate } from './types'

// 1) gatherContextNode
export const gatherContextNode = traceNode('gatherContext')(async (state: Record<string, any>): Promise<WorkflowStateUpdate> => {
  try {
    const { data, error } = await supabase
      .from('requests')
      .select('*')
      .eq('id', state.requestId)
      .single()

    if (error) {
      throw new Error(`Failed to load request: ${error.message}`)
    }
    if (!data) {
      throw new Error(`No request found with ID: ${state.requestId}`)
    }

    // Validate required fields
    const requiredFields = ['tag']
    const missingFields = requiredFields.filter(field => !data[field])
    if (missingFields.length > 0) {
      throw new Error(`Request is missing required fields: ${missingFields.join(', ')}`)
    }

    return {
      context: data,
    }
  } catch (error) {
    console.error('Error in gatherContext:', error)
    throw error
  }
})

// 2) planNode
export const planNode = traceNode('plan')(async (state: Record<string, any>): Promise<WorkflowStateUpdate> => {
  try {
    const tag = state.context?.tag || 'GeneralTopic'
    const model = new ChatOpenAI({ 
      temperature: 0,
      modelName: 'gpt-3.5-turbo'
    })

    // Create a traced version of the model
    const tracedModel = model.withConfig({
      tags: ['llm', 'plan'],
      metadata: {
        requestId: state.requestId,
        tag
      }
    })

    const response = await tracedModel.invoke([
      new HumanMessage(`Outline sub-topics needed to learn about "${tag}". One per line.`),
    ])
    const planText = response.content as string
    const planItems = planText
      .split('\n')
      .map((item: string) => item.trim())
      .filter(Boolean)

    return {
      planItems,
    }
  } catch (error) {
    console.error('Error in planNode:', error)
    throw error
  }
})

// 3) resourceSearchNode
export const resourceSearchNode = traceNode('resourceSearch')(async (state: Record<string, any>): Promise<WorkflowStateUpdate> => {
  const { planItems = [] } = state
  const resources: Record<string, { title: string; URL: string }[]> = {}

  for (const item of planItems) {
    resources[item] = [
      {
        title: `Mock resource for ${item}`,
        URL: `https://example.com/${encodeURIComponent(item)}`
      }
    ]
  }

  return {
    resources,
  }
})

// 4) buildCurriculumNode
export const buildCurriculumNode = traceNode('build')(async (state: Record<string, any>): Promise<WorkflowStateUpdate> => {
  const { planItems = [], resources = {}, requestId } = state

  // Create a new row in 'curriculums'
  const { data: newCurriculum, error: curriculumError } = await supabase
    .from('curriculums')
    .insert([{ request_id: requestId }])
    .select()
    .single()
  if (curriculumError) throw curriculumError

  // For each plan item, create a source and a curriculum_node
  for (let i = 0; i < planItems.length; i++) {
    const item = planItems[i]
    const [firstResource] = resources[item] || []
    if (!firstResource) continue

    const { data: newSource, error: sourceError } = await supabase
      .from('sources')
      .insert([{ title: firstResource.title, URL: firstResource.URL }])
      .select()
      .single()
    if (sourceError) throw sourceError

    const { error: nodeError } = await supabase
      .from('curriculum_nodes')
      .insert([{
        curriculum_id: newCurriculum.id,
        source_id: newSource.id,
        level: i,
        index_in_curriculum: i,
      }])
    if (nodeError) throw nodeError
  }

  return {}
})
