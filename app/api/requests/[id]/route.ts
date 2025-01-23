import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

// GET /api/requests/[id]
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createRouteHandlerClient({ cookies })

    const { data, error } = await supabase
      .from('requests')
      .select(`
        *,
        source:sources(*),
        student:profiles!requests_student_id_fkey(*),
        expert:profiles!requests_expert_id_fkey(*),
        curriculum:curriculums (
          *,
          curriculum_nodes (
            *,
            source:sources(*)
          )
        ),
        messages (
          *,
          sender:profiles(*)
        )
      `)
      .eq('id', params.id)
      .single()

    if (error) {
      console.error("Database error:", error)
      return NextResponse.json(
        { error: "Failed to fetch request" },
        { status: 500 }
      )
    }

    return NextResponse.json({ data })
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

    const { data, error } = await supabase
      .from("requests")
      .update(json)
      .eq("id", params.id)
      .select(`
        *,
        source:sources(*),
        student:profiles!requests_student_id_fkey(*),
        expert:profiles!requests_expert_id_fkey(*),
        curriculum:curriculums (
          *,
          curriculum_nodes (
            *,
            source:sources(*)
          )
        ),
        messages (
          *,
          sender:profiles(*)
        )
      `)
      .single()

    if (error) {
      console.error("Database error:", error)
      return NextResponse.json(
        { error: "Failed to update request" },
        { status: 500 }
      )
    }

    return NextResponse.json({ data })
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
  try {
    const supabase = createRouteHandlerClient({ cookies })

    const { error } = await supabase
      .from("requests")
      .delete()
      .eq("id", params.id)

    if (error) {
      console.error("Database error:", error)
      return NextResponse.json(
        { error: "Failed to delete request" },
        { status: 500 }
      )
    }

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    console.error("Error processing request:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
} 