import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  const supabase = await createClient()
  
  // Check if user has admin permission (optional)
  const { data: { user } } = await supabase.auth.getUser()
  
  try {
    // Try to select from reports table to check if it exists
    const { error: selectError } = await supabase
      .from('reports')
      .select('id')
      .limit(1)
    
    if (selectError) {
      return NextResponse.json(
        { 
          error: "Reports table does not exist", 
          message: "Please run the migration script first", 
          details: selectError 
        },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { message: "Reports table exists and is ready to use" },
      { status: 200 }
    )
  } catch (error) {
    console.error("Error checking reports table:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
} 