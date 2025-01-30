import { createServerSupabaseClient } from '@/utils/supabase/server'
import { ChatOpenAI } from '@langchain/openai'
import { HumanMessage } from '@langchain/core/messages'
import { RunnableConfig } from '@langchain/core/runnables'
import { traceNode, NodeFn } from '@/lib/langsmith'
import { WorkflowState, WorkflowStateUpdate } from './types'
import { tavily } from "@tavily/core";

// 1) gatherContextNode
export const gatherContextNode = traceNode('gatherContext')(async (state: Record<string, any>): Promise<WorkflowStateUpdate> => {
  try {
    const supabase = createServerSupabaseClient()
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
    const supabase = createServerSupabaseClient()
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

interface TavilyResult {
  title: string;
  url: string;
  content: string;
  score: number;
}

interface YouTubeResource {
  title: string;
  url: string;
  description: string;
  score: number;
}

// Helper function to delay between API calls
async function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Helper function for exponential backoff
async function retryWithBackoff(fn: () => Promise<any>, maxRetries = 3): Promise<any> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error: any) {
      if (error?.response?.status === 429 && i < maxRetries - 1) {
        const waitTime = Math.min(1000 * Math.pow(2, i), 10000); // Max 10 second wait
        console.log(`Rate limited. Waiting ${waitTime}ms before retry ${i + 1}/${maxRetries}`);
        await delay(waitTime);
        continue;
      }
      throw error;
    }
  }
}

// 3) resourceSearchNode
export const resourceSearchNode = traceNode('resourceSearch')(async (state: Record<string, any>): Promise<WorkflowStateUpdate> => {
  console.log('Starting resourceSearchNode with state:', {
    planItemsCount: state.planItems?.length,
    requestId: state.requestId,
    planItems: state.planItems
  });

  const { planItems = [] } = state;
  const resources: Record<string, any[]> = {};

  if (!planItems.length) {
    console.error('No plan items available');
    throw new Error('No plan items available');
  }

  // Initialize Tavily client
  const apiKey = process.env.TALIVY_API_KEY;
  if (!apiKey) {
    console.error('Tavily API key not found');
    throw new Error('Tavily API key not found');
  }

  console.log('Initializing Tavily client with API key:', apiKey.substring(0, 10) + '...');
  const tvly = tavily({ apiKey });

  // Process each topic
  for (let i = 0; i < planItems.length; i++) {
    const item = planItems[i];
    console.log(`Searching for topic ${i + 1}/${planItems.length}: ${item}`);

    try {
      const searchQuery = `${item} youtube tutorial video`;
      console.log(`Making search query: ${searchQuery}`);

      const response = await tvly.search(searchQuery, {
        searchDepth: "basic",
        maxResults: 3, // Only need 1 result per topic
        includeDomains: ["youtube.com"]
      });

      // Filter for YouTube watch URLs
      const youtubeResults = (response?.results || [])
        .filter((result: TavilyResult) => {
          const isYoutube = result.url.includes('youtube.com/watch?v=');
          if (!isYoutube) {
            console.log(`Skipping non-YouTube result: ${result.url}`);
          }
          return isYoutube;
        })
        .map((result: TavilyResult) => ({
          title: result.title || `Tutorial for ${item}`,
          url: result.url,
          description: result.content || `Video tutorial about ${item}`,
          score: result.score
        }))
        .sort((a: YouTubeResource, b: YouTubeResource) => b.score - a.score);

      if (youtubeResults.length > 0) {
        resources[item] = [youtubeResults[0]];
        console.log(`Found video for ${item}: ${youtubeResults[0].url}`);
      } else {
        // Use fallback if no YouTube results found
        resources[item] = [{
          title: `Tutorial for ${item}`,
          url: `https://youtube.com/watch?v=example-${i}`,
          description: `Video tutorial about ${item}`,
          score: 1
        }];
        console.log(`No YouTube results found for ${item}, using fallback`);
      }

    } catch (error: any) {
      console.error(`Error searching for ${item}:`, error?.response?.data || error);
      // Use fallback for this topic
      resources[item] = [{
        title: `Tutorial for ${item}`,
        url: `https://youtube.com/watch?v=example-${i}`,
        description: `Video tutorial about ${item}`,
        score: 1
      }];
      console.log(`Added fallback resource for ${item} after error`);
    }
  }

  console.log('Final resources object:', {
    itemCount: Object.keys(resources).length,
    items: Object.keys(resources),
    firstResource: Object.values(resources)[0]
  });

  return {
    resources
  };
})

// 4) buildCurriculumNode
export const buildCurriculumNode = traceNode('build')(async (state: Record<string, any>): Promise<WorkflowStateUpdate> => {
  console.log('Starting buildCurriculumNode with state:', {
    planItems: state.planItems,
    resourcesCount: Object.keys(state.resources || {}).length,
    requestId: state.requestId
  });

  const { planItems = [], resources = {}, requestId } = state;

  if (!planItems.length) {
    console.error('No plan items available');
    throw new Error('No plan items available');
  }

  console.log('Resources received:', resources);

  const supabase = createServerSupabaseClient();
  const { data: newCurriculum, error: curriculumError } = await supabase
    .from('curriculums')
    .insert([{ 
      id: crypto.randomUUID(),
      request_id: requestId 
    }])
    .select()
    .single();

  if (curriculumError) {
    console.error('Error creating curriculum:', curriculumError);
    throw curriculumError;
  }

  console.log('Created curriculum:', newCurriculum);

  let lastEndTime = 0;
  for (let i = 0; i < planItems.length; i++) {
    const item = planItems[i];
    const [firstResource] = resources[item] || [];
    
    console.log(`Processing item ${i + 1}/${planItems.length}:`, {
      item,
      hasResource: !!firstResource
    });

    if (!firstResource) {
      console.log(`No resource found for item: ${item}`);
      continue;
    }

    const { data: newSource, error: sourceError } = await supabase
      .from('sources')
      .insert([{ 
        id: crypto.randomUUID(),
        title: firstResource.title, 
        URL: firstResource.url 
      }])
      .select()
      .single();

    if (sourceError) {
      console.error(`Error creating source for ${item}:`, sourceError);
      throw sourceError;
    }

    console.log('Created source:', newSource);

    // Generate realistic-looking time segments (in seconds)
    const segmentLength = Math.floor(Math.random() * 840) + 180; // Random length between 3-17 minutes
    const start_time = lastEndTime;
    const end_time = start_time + segmentLength;
    lastEndTime = end_time;

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
      }]);

    if (nodeError) {
      console.error(`Error creating curriculum node for ${item}:`, nodeError);
      throw nodeError;
    }

    console.log(`Created curriculum node for ${item} with times:`, {
      start_time,
      end_time
    });
  }

  console.log('Finished building curriculum');
  return {};
})

export async function updateRequestStatus(requestId: string, status: string) {
  const supabase = createServerSupabaseClient()
  // ... existing code ...
}
