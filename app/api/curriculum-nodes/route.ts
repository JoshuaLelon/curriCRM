import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

// GET /api/curriculum-nodes
export async function GET(request: NextRequest) {
  try {
    const searchParams = new URL(request.url).searchParams
    const curriculumId = searchParams.get('curriculumId')

    if (!curriculumId) {
      return NextResponse.json(
        { error: 'Curriculum ID is required' },
        { status: 400 }
      )
    }

    const supabase = createRouteHandlerClient({ cookies })

    const { data, error } = await supabase
      .from('curriculum_nodes')
      .select(`
        *,
        source:sources(*)
      `)
      .eq('curriculum_id', curriculumId)
      .order('index_in_curriculum', { ascending: true })

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch curriculum nodes' },
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

// POST /api/curriculum-nodes
export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const json = await request.json()

    // Create source first if needed
    let sourceId = json.source_id
    if (!sourceId && json.source) {
      const { data: source, error: sourceError } = await supabase
        .from('sources')
        .insert([{
          title: json.source.title,
          url: json.source.url,
          created_by: json.source.created_by
        }])
        .select()
        .single()

      if (sourceError) throw sourceError
      sourceId = source.id
    }

    // Create curriculum node
    const { data, error } = await supabase
      .from('curriculum_nodes')
      .insert([{
        curriculum_id: json.curriculum_id,
        source_id: sourceId,
        start_time: json.start_time,
        end_time: json.end_time,
        level: json.level,
        index_in_curriculum: json.index_in_curriculum
      }])
      .select(`
        *,
        source:sources(*)
      `)

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: 'Failed to create curriculum node' },
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

// PATCH /api/curriculum-nodes/[id]
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const json = await request.json()
    const { id, source, ...updateData } = json

    // Update source if needed
    if (source) {
      const { error: sourceError } = await supabase
        .from('sources')
        .update({
          title: source.title,
          url: source.url
        })
        .eq('id', source.id)

      if (sourceError) throw sourceError
    }

    // Update curriculum node
    const { data, error } = await supabase
      .from('curriculum_nodes')
      .update(updateData)
      .eq('id', id)
      .select(`
        *,
        source:sources(*)
      `)

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: 'Failed to update curriculum node' },
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
        { error: 'Node ID is required' },
        { status: 400 }
      )
    }

    const supabase = createRouteHandlerClient({ cookies })

    const { error } = await supabase
      .from('curriculum_nodes')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: 'Failed to delete curriculum node' },
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