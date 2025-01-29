import { NextResponse } from 'next/server'
import { runAIWorkflow } from '@/lib/workflows/ai-runner'

export async function POST(
  request: Request,
  { params }: { params: { requestId: string } }
) {
  console.log(`[AI Request API] Starting workflow for request ${params.requestId}`)
  console.log(`[AI Request API] Request headers:`, Object.fromEntries(request.headers.entries()))
  
  try {
    // Validate request ID
    if (!params.requestId) {
      console.error('[AI Request API] Missing requestId parameter')
      return NextResponse.json(
        { success: false, error: 'Missing requestId parameter' },
        { status: 400 }
      )
    }

    console.log(`[AI Request API] Calling runAIWorkflow for request ${params.requestId}`)
    await runAIWorkflow(params.requestId)
    
    console.log(`[AI Request API] Workflow completed successfully for request ${params.requestId}`)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error(`[AI Request API] Error processing request ${params.requestId}:`, error)
    
    if (error instanceof Error) {
      console.error(`[AI Request API] Error details for request ${params.requestId}:`, {
        name: error.name,
        message: error.message,
        stack: error.stack
      })
    }
    
    // Format the error message properly
    let errorMessage: string
    if (error instanceof Error) {
      errorMessage = error.message
    } else if (error && typeof error === 'object') {
      try {
        errorMessage = JSON.stringify(error)
      } catch {
        errorMessage = String(error)
      }
    } else {
      errorMessage = String(error)
    }
        
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    )
  }
} 