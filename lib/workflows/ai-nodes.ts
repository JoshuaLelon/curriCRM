import { supabase } from '@/lib/supabase'
import { ChatOpenAI } from '@langchain/openai'
import { HumanMessage } from '@langchain/core/messages'
import { RunnableConfig } from '@langchain/core/runnables'
import type { WorkflowState, WorkflowStateUpdate } from './types'

type NodeFunction = (state: WorkflowState, config?: RunnableConfig) => Promise<WorkflowStateUpdate>

// 1) gatherContextNode
export const gatherContextNode: NodeFunction = async (state) => {
  const { data, error } = await supabase
    .from('requests')
    .select('*')
    .eq('id', state.requestId)
    .single()
  if (error || !data) throw new Error('Unable to load request context')

  return {
    context: data,
  }
}

// 2) planNode
export const planNode: NodeFunction = async (state) => {
  const tag = state.context?.tag || 'GeneralTopic'
  const model = new ChatOpenAI({ 
    modelName: 'gpt-4',
    temperature: 0 
  })
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

  return {
    planItems,
  }
}

// 3) resourceSearchNode
export const resourceSearchNode: NodeFunction = async (state) => {
  const { planItems = [] } = state
  const resources: Record<string, { title: string; url: string }[]> = {}

  for (const item of planItems) {
    resources[item] = [
      {
        title: `Mock resource for ${item}`,
        url: `https://example.com/${encodeURIComponent(item)}`
      }
    ]
  }

  return {
    resources,
  }
}

// 4) buildCurriculumNode
export const buildCurriculumNode: NodeFunction = async (state) => {
  const { planItems = [], resources = {}, requestId } = state

  // Create a new row in 'curriculums'
  const { data: newCurriculum, error: curriculumError } = await supabase
    .from('curriculums')
    .insert([{ 
      id: crypto.randomUUID(),
      request_id: requestId 
    }])
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
      .insert([{ 
        id: crypto.randomUUID(),
        title: firstResource.title, 
        URL: firstResource.url 
      }])
      .select()
      .single()
    if (sourceError) throw sourceError

    const { error: nodeError } = await supabase
      .from('curriculum_nodes')
      .insert([{
        id: crypto.randomUUID(),
        curriculum_id: newCurriculum.id,
        source_id: newSource.id,
        level: i,
        index_in_curriculum: i,
      }])
    if (nodeError) throw nodeError
  }

  return {}
} 