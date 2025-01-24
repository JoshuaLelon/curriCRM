import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

// GET /api/requests
export async function GET(request: NextRequest) {
  try {
    const searchParams = new URL(request.url).searchParams
    const expertId = searchParams.get("expertId")
    const studentId = searchParams.get("studentId")

    console.log('GET /api/requests - Query params:', { expertId, studentId })

    if (!expertId && !studentId) {
      return NextResponse.json(
        { error: "Either expertId or studentId is required" },
        { status: 400 }
      )
    }

    const supabase = createRouteHandlerClient({ cookies })

    // Get requests based on the provided ID
    console.log('Building request query...')
    const query = supabase
      .from("requests")
      .select(`
        *,
        source:sources(*),
        student:profiles!requests_student_id_fkey(*),
        expert:profiles!requests_expert_id_fkey(*)
      `)
      .order("created_at", { ascending: false })

    if (expertId) {
      console.log('Filtering by expert_id:', expertId)
      query.eq("expert_id", expertId)
    } else if (studentId) {
      console.log('Filtering by student_id:', studentId)
      query.eq("student_id", studentId)
    }

    const { data, error } = await query

    if (error) {
      console.error("Database error:", error)
      return NextResponse.json(
        { error: "Failed to fetch requests" },
        { status: 500 }
      )
    }

    console.log('Request data:', data)
    console.log('Source data for each request:', data?.map(r => ({ 
      request_id: r.id, 
      source_id: r.source_id, 
      source: r.source 
    })))

    return NextResponse.json({ data })
  } catch (error) {
    console.error("Error processing request:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// POST /api/requests
export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const json = await request.json()

    const { data, error } = await supabase
      .from("requests")
      .insert([json])
      .select(`
        *,
        source:sources(*),
        student:profiles!requests_student_id_fkey(*),
        expert:profiles!requests_expert_id_fkey(*)
      `)

    if (error) {
      console.error("Database error:", error)
      return NextResponse.json(
        { error: "Failed to create request" },
        { status: 500 }
      )
    }

    return NextResponse.json({ data: data[0] })
  } catch (error) {
    console.error("Error processing request:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// PATCH /api/requests/[id]
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
        { error: "Request ID is required" },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from("requests")
      .update(updateData)
      .eq("id", id)
      .select(`
        *,
        source:sources(*),
        student:profiles!requests_student_id_fkey(*),
        expert:profiles!requests_expert_id_fkey(*)
      `)

    if (error) {
      console.error("Database error:", error)
      return NextResponse.json(
        { error: "Failed to update request" },
        { status: 500 }
      )
    }

    return NextResponse.json({ data: data[0] })
  } catch (error) {
    console.error("Error processing request:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// DELETE /api/requests/[id]
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createRouteHandlerClient({ cookies })

  const { error } = await supabase
    .from('requests')
    .delete()
    .eq('id', params.id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json({ success: true })
} 