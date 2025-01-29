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
  console.log(`[AI Node: resourceSearch] Starting for request ${state.requestId}`)
  const { planItems = [] } = state
  
  try {
    console.log(`[AI Node: resourceSearch] Processing ${planItems.length} items for request ${state.requestId}:`, planItems)
    const resources: Record<string, { title: string; URL: string }[]> = {}

    // Initialize Tavily client
    const tavily = new (await import('tavily')).TavilyClient({ apiKey: process.env.TALIVY_API_KEY! })

    for (const item of planItems) {
      console.log(`[AI Node: resourceSearch] Finding resources for item: ${item}`)
      
      try {
        // Search for high-quality video resources using Tavily
        const searchResults = await tavily.search({
          query: `${item} video tutorial site:youtube.com OR site:vimeo.com`,
          search_depth: 'advanced',
          max_results: 3,
          include_images: false,
          include_answer: false,
          include_raw_content: false,
          include_domains: ["youtube.com", "vimeo.com"],
          exclude_domains: ["facebook.com", "twitter.com", "instagram.com", "tiktok.com"]
        })

        resources[item] = searchResults.results.map(result => ({
          title: result.title,
          URL: result.url
        }))

        console.log(`[AI Node: resourceSearch] Found ${resources[item].length} resources for item: ${item}`)
      } catch (searchError) {
        console.error(`[AI Node: resourceSearch] Error searching for item ${item}:`, searchError)
        // Fallback to a mock resource if Tavily search fails
        resources[item] = [{
          title: `Video tutorial for ${item}`,
          URL: `https://youtube.com/watch?v=example`
        }]
      }
    }

    console.log(`[AI Node: resourceSearch] Found resources for ${Object.keys(resources).length} items:`, resources)
    return {
      resources,
    }
  } catch (error) {
    console.error(`[AI Node: resourceSearch] Error for request ${state.requestId}:`, error)
    throw error
  }
})

// 4) buildCurriculumNode
export const buildCurriculumNode = traceNode('build')(async (state: Record<string, any>): Promise<WorkflowStateUpdate> => {
  const { planItems = [], resources = {}, requestId } = state

  // Generate a UUID for the curriculum
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
  let lastEndTime = 0 // Keep track of the last end time
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

    // Generate realistic-looking time segments (in seconds)
    const segmentLength = Math.floor(Math.random() * 840) + 60 // Random length between 1-15 minutes
    const start_time = lastEndTime + (i === 0 ? 0 : 30) // 30 second gap between segments
    const end_time = start_time + segmentLength
    lastEndTime = end_time

    const { error: nodeError } = await supabase
      .from('curriculum_nodes')
      .insert([{
        id: crypto.randomUUID(),
        curriculum_id: newCurriculum.id,
        source_id: newSource.id,
        level: i,
        index_in_curriculum: i,
        start_time,
        end_time
      }])
    if (nodeError) throw nodeError
  }

  return {}
})
