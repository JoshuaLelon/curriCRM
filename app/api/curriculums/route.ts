import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

// GET /api/curriculums
export async function GET(request: NextRequest) {
  try {
    const searchParams = new URL(request.url).searchParams
    const requestId = searchParams.get('requestId')

    if (!requestId) {
      return NextResponse.json(
        { error: 'Request ID is required' },
        { status: 400 }
      )
    }

    const supabase = createRouteHandlerClient({ cookies })

    const { data, error } = await supabase
      .from('curriculums')
      .select(`
        *,
        curriculum_nodes (
          *,
          source:sources(*)
        )
      `)
      .eq('request_id', requestId)
      .single()

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch curriculum' },
        { status: 500 }
      )
    }

    return NextResponse.json({ data })
  } catch (error) {
    console.error('Error processing request:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/curriculums
export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const json = await request.json()

    // Create curriculum
    const { data, error } = await supabase
      .from('curriculums')
      .insert([{
        request_id: json.request_id
      }])
      .select(`
        *,
        curriculum_nodes (
          *,
          source:sources(*)
        )
      `)

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: 'Failed to create curriculum' },
        { status: 500 }
      )
    }

    return NextResponse.json({ data: data[0] })
  } catch (error) {
    console.error('Error processing request:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PATCH /api/curriculums/[id]
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const json = await request.json()
    const { id, ...updateData } = json

    if (!id) {
      return NextResponse.json(
        { error: 'Curriculum ID is required' },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('curriculums')
      .update(updateData)
      .eq('id', id)
      .select(`
        *,
        curriculum_nodes (
          *,
          source:sources(*)
        )
      `)

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: 'Failed to update curriculum' },
        { status: 500 }
      )
    }

    return NextResponse.json({ data: data[0] })
  } catch (error) {
    console.error('Error processing request:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const searchParams = new URL(request.url).searchParams
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'Curriculum ID is required' },
        { status: 400 }
      )
    }

    const supabase = createRouteHandlerClient({ cookies })

    const { error } = await supabase
      .from('curriculums')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: 'Failed to delete curriculum' },
        { status: 500 }
      )
    }

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    console.error('Error processing request:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 