import { createClient } from '@supabase/supabase-js'
import { client as langsmith } from '@/lib/langsmith'
import { runAIWorkflow } from '@/lib/workflows/ai-runner'
import dotenv from 'dotenv'

dotenv.config()

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// Test case IDs from our seed data
const TEST_CASE_IDS = [
  '00000000-0000-0000-0000-000000000601', // software tutorial
  '00000000-0000-0000-0000-000000000602', // software tutorial
  '00000000-0000-0000-0000-000000000603', // ai explanation
  '00000000-0000-0000-0000-000000000604', // math how_to_guide
  '00000000-0000-0000-0000-000000000605', // software reference
  '00000000-0000-0000-0000-000000000606', // software tutorial
  '00000000-0000-0000-0000-000000000607', // ai explanation
  '00000000-0000-0000-0000-000000000608', // math how_to_guide
  '00000000-0000-0000-0000-000000000609', // software reference
  '00000000-0000-0000-0000-000000000610', // software tutorial
  '00000000-0000-0000-0000-000000000611', // ai explanation
  '00000000-0000-0000-0000-000000000612', // math how_to_guide
  '00000000-0000-0000-0000-000000000613', // software reference
  '00000000-0000-0000-0000-000000000614', // software tutorial
  '00000000-0000-0000-0000-000000000615', // ai explanation
  '00000000-0000-0000-0000-000000000616', // math how_to_guide
  '00000000-0000-0000-0000-000000000617', // software reference
  '00000000-0000-0000-0000-000000000618', // software tutorial
  '00000000-0000-0000-0000-000000000619', // ai explanation
  '00000000-0000-0000-0000-000000000620'  // math how_to_guide
]

interface EvaluationResult {
  requestId: string
  tag: string
  contentType: string
  timing: {
    totalDuration: number
    nodeTimings: Record<string, { duration: number }>
  }
  curriculum: {
    nodeCount: number
    maxDepth: number
    topics: string[]
  }
  error?: string
}

async function evaluateRequest(requestId: string): Promise<EvaluationResult> {
  const startTime = Date.now()
  
  try {
    // Run the workflow
    await runAIWorkflow(requestId)
    
    // Get the resulting curriculum
    const { data: curriculum } = await supabase
      .from('curriculums')
      .select(`
        id,
        curriculum_nodes (
          id,
          level,
          source:sources (
            title
          )
        )
      `)
      .eq('request_id', requestId)
      .single()

    // Get the original request
    const { data: request } = await supabase
      .from('requests')
      .select('tag, content_type')
      .eq('id', requestId)
      .single()

    if (!curriculum || !request) {
      throw new Error('Failed to fetch curriculum or request data')
    }

    // Calculate metrics
    const nodes = curriculum.curriculum_nodes || []
    const maxDepth = Math.max(...nodes.map(n => n.level))
    const topics = nodes.map(n => n.source?.title || 'Unknown').filter(Boolean)

    return {
      requestId,
      tag: request.tag,
      contentType: request.content_type,
      timing: {
        totalDuration: Date.now() - startTime,
        nodeTimings: {} // This will be populated by LangSmith
      },
      curriculum: {
        nodeCount: nodes.length,
        maxDepth,
        topics
      }
    }
  } catch (error) {
    return {
      requestId,
      tag: 'unknown',
      contentType: 'unknown',
      timing: {
        totalDuration: Date.now() - startTime,
        nodeTimings: {}
      },
      curriculum: {
        nodeCount: 0,
        maxDepth: 0,
        topics: []
      },
      error: error instanceof Error ? error.message : String(error)
    }
  }
}

async function main() {
  console.log('Starting AI workflow evaluation...')
  const results: EvaluationResult[] = []

  for (const requestId of TEST_CASE_IDS) {
    console.log(`\nEvaluating request ${requestId}...`)
    const result = await evaluateRequest(requestId)
    results.push(result)
    
    // Log results to LangSmith
    await langsmith.createRun({
      name: `evaluation_${requestId}`,
      run_type: "eval",
      inputs: {
        requestId,
        tag: result.tag,
        contentType: result.contentType
      },
      outputs: {
        timing: result.timing,
        curriculum: result.curriculum,
        error: result.error
      }
    })

    // Print results
    console.log('Result:', {
      requestId,
      tag: result.tag,
      contentType: result.contentType,
      duration: `${result.timing.totalDuration}ms`,
      nodeCount: result.curriculum.nodeCount,
      maxDepth: result.curriculum.maxDepth,
      error: result.error
    })
  }

  // Calculate and print summary statistics
  const successful = results.filter(r => !r.error)
  const failed = results.filter(r => r.error)
  
  const avgDuration = successful.reduce((sum, r) => sum + r.timing.totalDuration, 0) / successful.length
  const avgNodes = successful.reduce((sum, r) => sum + r.curriculum.nodeCount, 0) / successful.length
  const avgDepth = successful.reduce((sum, r) => sum + r.curriculum.maxDepth, 0) / successful.length

  console.log('\nSummary:')
  console.log(`Total test cases: ${results.length}`)
  console.log(`Successful: ${successful.length}`)
  console.log(`Failed: ${failed.length}`)
  console.log(`Average duration: ${avgDuration.toFixed(2)}ms`)
  console.log(`Average nodes per curriculum: ${avgNodes.toFixed(2)}`)
  console.log(`Average tree depth: ${avgDepth.toFixed(2)}`)

  // Log summary to LangSmith
  await langsmith.createRun({
    name: "evaluation_summary",
    run_type: "eval",
    inputs: {
      totalCases: results.length
    },
    outputs: {
      successRate: successful.length / results.length,
      avgDuration,
      avgNodes,
      avgDepth,
      failedCases: failed.map(r => ({
        requestId: r.requestId,
        error: r.error
      }))
    }
  })
}

main().catch(console.error) 