import { NextResponse } from 'next/server'
import { runAIWorkflow } from '@/lib/workflows/ai-runner'

export async function POST(
  request: Request,
  { params }: { params: { requestId: string } }
) {
  console.log(`[AI Request API] Starting workflow for request ${params.requestId}`)
  
  try {
    console.log(`[AI Request API] Calling runAIWorkflow for request ${params.requestId}`)
    await runAIWorkflow(params.requestId)
    console.log(`[AI Request API] Workflow completed successfully for request ${params.requestId}`)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error(`[AI Request API] Error processing request ${params.requestId}:`, error)
    const errorMessage = error instanceof Error 
      ? error.message 
      : error && typeof error === 'object' && 'toString' in error
        ? error.toString()
        : String(error)
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    )
  }
} 