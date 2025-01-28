import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import type { Database } from '@/types/supabase'

// GET /api/requests
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

    // Get the user's profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', session.user.id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      )
    }

    // Get requests based on role
    let query = supabase.from('requests').select(`
      *,
      source:sources (
        id,
        title,
        URL
      ),
      student:profiles!requests_student_id_fkey (
        id,
        email,
        specialty
      ),
      expert:profiles!requests_expert_id_fkey (
        id,
        email,
        specialty
      )
    `)

    if (profile.specialty) {
      // Expert: show requests assigned to them or unassigned matching their specialty
      query = query
        .or(`expert_id.eq.${profile.id},and(expert_id.is.null,tag.eq.${profile.specialty})`)
    } else {
      // Student: only show their own requests
      query = query.eq('student_id', profile.id)
    }

    const { data, error } = await query.order('created_at', { ascending: false })

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch requests' },
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

// POST /api/requests
export async function POST(request: NextRequest) {
  try {
    const cookieStore = cookies()
    const authHeader = request.headers.get('Authorization')
    const isServiceRole = authHeader?.startsWith('Bearer') && authHeader.split(' ')[1] === process.env.SUPABASE_SERVICE_ROLE_KEY

    const supabase = createServerClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      isServiceRole ? process.env.SUPABASE_SERVICE_ROLE_KEY! : process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
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

    let profile
    if (!isServiceRole) {
      // For normal users, check session and get profile
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      if (sessionError || !session) {
        return NextResponse.json(
          { error: 'Not authenticated' },
          { status: 401 }
        )
      }

      // Get the user's profile
      const { data: userProfile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', session.user.id)
        .single()

      if (profileError || !userProfile) {
        return NextResponse.json(
          { error: 'Profile not found' },
          { status: 404 }
        )
      }
      profile = userProfile
    } else {
      // For service role, use the AI profile
      const { data: aiProfile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', 9999)
        .single()

      if (profileError || !aiProfile) {
        return NextResponse.json(
          { error: 'AI profile not found' },
          { status: 404 }
        )
      }
      profile = aiProfile
    }

    const json = await request.json()

    // Create request
    const { data, error } = await supabase
      .from('requests')
      .insert([{
        ...json,
        student_id: profile.id
      }])
      .select()
      .single()

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: 'Failed to create request' },
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

// PATCH /api/requests/[id]
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

  const { error } = await supabase
    .from('requests')
    .delete()
    .eq('id', params.id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json({ success: true })
} 