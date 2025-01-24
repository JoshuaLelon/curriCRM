import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

// GET /api/sources
export async function GET(request: NextRequest) {
  try {
    const searchParams = new URL(request.url).searchParams
    const createdBy = searchParams.get('createdBy')

    const supabase = createRouteHandlerClient({ cookies })

    let query = supabase
      .from('sources')
      .select('*')
      .order('created_at', { ascending: false })

    if (createdBy) {
      query = query.eq('created_by', createdBy)
    }

    const { data, error } = await query

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch sources' },
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

// POST /api/sources
export async function POST(request: NextRequest) {
  try {
    console.log('POST /api/sources - Starting request handling')
    
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ 
      cookies: () => cookieStore 
    })

    // Get the session directly
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError || !session) {
      console.error('Session error:', sessionError)
      return NextResponse.json(
        { error: sessionError?.message || "Not authenticated" },
        { status: 401 }
      )
    }

    console.log('Session found:', {
      user_id: session.user.id,
      role: session.user.role
    })

    const json = await request.json()
    console.log('Request body:', json)

    // Get profile ID using the session user
    console.log('Getting profile for user:', session.user.id)
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id, user_id")
      .eq("user_id", session.user.id)
      .single()
    
    console.log('Profile lookup result:', { profile, error: profileError })

    if (profileError || !profile) {
      console.error('Profile error:', profileError)
      return NextResponse.json(
        { error: "Profile not found" },
        { status: 404 }
      )
    }

    // Create source
    console.log('Creating source with profile:', profile.id)
    const { data, error } = await supabase
      .from("sources")
      .insert([{
        ...json,
        created_by: profile.id
      }])
      .select()
      .single()
    
    console.log('Source creation result:', {
      success: !!data && !error,
      data: data,
      error: error
    })

    if (error) {
      console.error("Source creation error:", error)
      return NextResponse.json(
        { error: "Failed to create source: " + error.message },
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

// PATCH /api/sources/[id]
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
        { error: 'Source ID is required' },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('sources')
      .update(updateData)
      .eq('id', id)
      .select()

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: 'Failed to update source' },
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