// Load environment variables first
import './load-env'

import { supabase } from '@/lib/supabase'
import { client } from '@/lib/langsmith'
import { runAIWorkflow } from '@/lib/workflows/ai-runner'

interface EvaluationResult {
  requestId: string
  speedMs: number
  accuracyScore: number // 0-1 scale
  error?: string
}

async function evaluateRequest(requestId: string): Promise<EvaluationResult> {
  const startTime = Date.now()
  
  try {
    // Run the workflow
    await runAIWorkflow(requestId)
    
    // Get the run from LangSmith
    const runsIterator = client.listRuns({
      filter: `name LIKE workflow_${requestId}%`,
      limit: 1
    })
    
    // Get first run
    const firstRun = await runsIterator[Symbol.asyncIterator]().next()
    if (!firstRun.value) {
      throw new Error('No LangSmith run found')
    }
    
    const run = firstRun.value
    const endTime = Date.now()
    
    // Calculate metrics
    const speedMs = endTime - startTime
    
    // For now, we'll use a simple accuracy score based on whether all nodes completed
    // In a production system, this would be replaced with human evaluation
    const accuracyScore = run.outputs?.success ? 1 : 0
    
    return {
      requestId,
      speedMs,
      accuracyScore
    }
  } catch (error) {
    return {
      requestId,
      speedMs: Date.now() - startTime,
      accuracyScore: 0,
      error: String(error)
    }
  }
}

async function main() {
  // Get our test cases from the database
  const { data: testRequests, error } = await supabase
    .from('requests')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(20)
  
  if (error || !testRequests) {
    console.error('Failed to load test requests:', error)
    process.exit(1)
  }
  
  console.log(`Running evaluation on ${testRequests.length} test cases...`)
  
  const results: EvaluationResult[] = []
  for (const request of testRequests) {
    console.log(`\nEvaluating request ${request.id}...`)
    const result = await evaluateRequest(request.id)
    results.push(result)
    
    console.log(`Speed: ${result.speedMs}ms`)
    console.log(`Accuracy: ${result.accuracyScore * 100}%`)
    if (result.error) {
      console.log(`Error: ${result.error}`)
    }
  }
  
  // Calculate aggregate metrics
  const avgSpeed = results.reduce((sum, r) => sum + r.speedMs, 0) / results.length
  const avgAccuracy = results.reduce((sum, r) => sum + r.accuracyScore, 0) / results.length
  const errorRate = results.filter(r => r.error).length / results.length
  
  console.log('\n=== Final Results ===')
  console.log(`Average Speed: ${avgSpeed.toFixed(2)}ms`)
  console.log(`Average Accuracy: ${(avgAccuracy * 100).toFixed(2)}%`)
  console.log(`Error Rate: ${(errorRate * 100).toFixed(2)}%`)
}

main().catch(console.error) 