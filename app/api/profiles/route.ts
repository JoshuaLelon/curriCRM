import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

// GET /api/profiles
export async function GET(request: NextRequest) {
  const supabase = createRouteHandlerClient({ cookies })
  const searchParams = request.nextUrl.searchParams
  const userId = searchParams.get('userId')
  const email = searchParams.get('email')

  let query = supabase.from('profiles').select(`
    *,
    requests_as_student:requests!requests_student_id_fkey (
      id,
      created_at,
      accepted_at,
      started_at,
      finished_at,
      content_type,
      tag
    ),
    requests_as_expert:requests!requests_expert_id_fkey (
      id,
      created_at,
      accepted_at,
      started_at,
      finished_at,
      content_type,
      tag
    )
  `)

  if (userId) {
    query = query.eq('user_id', userId)
  }
  if (email) {
    query = query.eq('email', email)
  }

  const { data, error } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json({ data })
}

// POST /api/profiles
export async function POST(request: NextRequest) {
  const supabase = createRouteHandlerClient({ cookies })
  const body = await request.json()

  const { data, error } = await supabase
    .from('profiles')
    .insert([body])
    .select()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json({ data })
}

// PATCH /api/profiles/[id]
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createRouteHandlerClient({ cookies })
  const body = await request.json()

  const { data, error } = await supabase
    .from('profiles')
    .update(body)
    .eq('id', params.id)
    .select()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json({ data })
} 