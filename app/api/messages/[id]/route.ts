import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const cookieStore = cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
          set(name: string, value: string, options: any) {
            cookieStore.set(name, value, options)
          },
          remove(name: string, options: any) {
            cookieStore.set(name, '', options)
          },
        },
      }
    )

    const { data, error } = await supabase
      .from("messages")
      .select(`
        *,
        sender:profiles(*)
      `)
      .eq("id", params.id)
      .single()

    if (error) {
      console.error("Database error:", error)
      return NextResponse.json(
        { error: "Failed to fetch message" },
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

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const cookieStore = cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
          set(name: string, value: string, options: any) {
            cookieStore.set(name, value, options)
          },
          remove(name: string, options: any) {
            cookieStore.set(name, '', options)
          },
        },
      }
    )
    const json = await request.json()

    const { data, error } = await supabase
      .from("messages")
      .update(json)
      .eq("id", params.id)
      .select(`
        *,
        sender:profiles(*)
      `)
      .single()

    if (error) {
      console.error("Database error:", error)
      return NextResponse.json(
        { error: "Failed to update message" },
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

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const cookieStore = cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
          set(name: string, value: string, options: any) {
            cookieStore.set(name, value, options)
          },
          remove(name: string, options: any) {
            cookieStore.set(name, '', options)
          },
        },
      }
    )

    const { error } = await supabase
      .from("messages")
      .delete()
      .eq("id", params.id)

    if (error) {
      console.error("Database error:", error)
      return NextResponse.json(
        { error: "Failed to delete message" },
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