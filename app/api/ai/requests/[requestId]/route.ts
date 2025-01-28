import { NextResponse } from 'next/server'
import { runAIWorkflow } from '@/lib/workflows/ai-runner'

export async function POST(
  _request: Request,
  { params }: { params: { requestId: string } }
) {
  try {
    await runAIWorkflow(params.requestId)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('AI workflow error:', error)
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