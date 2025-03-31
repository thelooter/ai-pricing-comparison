import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { type, modelName, details, contactEmail } = await request.json()

    // Validate required fields
    if (!type || !modelName || !details) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    // Validate report type
    if (!["missing", "incorrect"].includes(type)) {
      return NextResponse.json(
        { error: "Invalid report type" },
        { status: 400 }
      )
    }

    const { data: { user } } = await supabase.auth.getUser()
    
    // Insert into reports table
    const { error } = await supabase
      .from("reports")
      .insert({
        type,
        model_name: modelName,
        details,
        contact_email: contactEmail || user?.email,
        user_id: user?.id || null,
        status: "pending",
        created_at: new Date().toISOString()
      })

    if (error) {
      console.error("Error submitting report:", error)
      return NextResponse.json(
        { error: "Failed to submit report" }, 
        { status: 500 }
      )
    }

    return NextResponse.json(
      { message: "Report submitted successfully" }, 
      { status: 201 }
    )
  } catch (error) {
    console.error("Error submitting report:", error)
    return NextResponse.json(
      { error: "Internal server error" }, 
      { status: 500 }
    )
  }
} 