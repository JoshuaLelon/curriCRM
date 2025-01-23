import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

// GET /api/messages
export async function GET(request: Request) {
  try {
    const searchParams = new URL(request.url).searchParams
    const requestId = searchParams.get("requestId")

    if (!requestId) {
      return NextResponse.json(
        { error: "Request ID is required" },
        { status: 400 }
      )
    }

    const supabase = createRouteHandlerClient({ cookies })

    const { data, error } = await supabase
      .from("messages")
      .select(`
        *,
        sender:profiles(*)
      `)
      .eq("request_id", requestId)
      .order("created_at", { ascending: true })

    if (error) {
      console.error("Database error:", error)
      return NextResponse.json(
        { error: "Failed to fetch messages" },
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

// POST /api/messages
export async function POST(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const json = await request.json()

    // Get current user's profile
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError) throw userError

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    // Get user's profile ID
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id")
      .eq("user_id", user.id)
      .single()
    if (profileError) throw profileError

    // Create message
    const { data, error } = await supabase
      .from("messages")
      .insert([{
        content: json.content,
        request_id: json.request_id,
        sender_id: profile.id
      }])
      .select(`
        *,
        sender:profiles(*)
      `)

    if (error) {
      console.error("Database error:", error)
      return NextResponse.json(
        { error: "Failed to create message" },
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

// PATCH /api/messages/[id]
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createRouteHandlerClient({ cookies })
  const body = await request.json()

  const { data, error } = await supabase
    .from('messages')
    .update(body)
    .eq('id', params.id)
    .select()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json({ data })
} 