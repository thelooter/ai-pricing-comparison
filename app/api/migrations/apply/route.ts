import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { applyMigrations } from "@/lib/migrations"

export async function POST(request: Request) {
  try {
    // Check if user is admin
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }
    
    // Check if user is admin
    const { data: adminData } = await supabase
      .from('admins')
      .select('user_id')
      .eq('user_id', user.id)
      .single()
      
    if (!adminData) {
      return NextResponse.json(
        { error: "Forbidden - Admin access required" },
        { status: 403 }
      )
    }
    
    // Apply migrations
    const result = await applyMigrations()
    
    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      )
    }
    
    return NextResponse.json(result, { status: 200 })
  } catch (error) {
    console.error("Error applying migrations:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
} 