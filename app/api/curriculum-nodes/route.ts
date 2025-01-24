import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import type { Database } from '@/types/supabase'

// GET /api/curriculum-nodes
export async function GET(request: NextRequest) {
  try {
    const cookieStore = cookies()
    const supabase = createServerClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
          set(name: string, value: string, options: any) {
            cookieStore.set({ name, value, ...options })
          },
          remove(name: string, options: any) {
            cookieStore.set({ name, value: '', ...options })
          },
        },
      }
    )

    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    if (sessionError || !session) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    const searchParams = new URL(request.url).searchParams
    const curriculumId = searchParams.get('curriculumId')

    if (!curriculumId) {
      return NextResponse.json(
        { error: 'Curriculum ID is required' },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('curriculum_nodes')
      .select(`
        *,
        source:sources (
          id,
          title,
          URL
        )
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
    const cookieStore = cookies()
    const supabase = createServerClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
          set(name: string, value: string, options: any) {
            cookieStore.set({ name, value, ...options })
          },
          remove(name: string, options: any) {
            cookieStore.set({ name, value: '', ...options })
          },
        },
      }
    )

    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    if (sessionError || !session) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    const json = await request.json()

    const { data, error } = await supabase
      .from('curriculum_nodes')
      .insert([json])
      .select()
      .single()

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: 'Failed to create curriculum node' },
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