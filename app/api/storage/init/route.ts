import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function POST() {
  try {
    const supabase = await createClient()
    
    // Check if the user is an admin
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    const { data: adminUser } = await supabase
      .from("admin_users")
      .select("is_admin")
      .eq("user_id", user.id)
      .single()
      
    if (!adminUser?.is_admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    // Check if the model-logos bucket exists
    try {
      const { data: buckets } = await supabase.storage.listBuckets()
      const bucketExists = buckets?.some(bucket => bucket.name === 'model-logos')
      
      if (!bucketExists) {
        // The bucket doesn't exist - we should inform the admin to create it manually
        // since RLS policies prevent bucket creation via the client API
        return NextResponse.json({ 
          success: false, 
          warning: "The 'model-logos' bucket does not exist. Please create it manually in the Supabase dashboard.",
          bucketExists: false
        }, { status: 200 })
      }
      
      return NextResponse.json({ 
        success: true,
        bucketExists: true
      })
    } catch (error) {
      console.error("Error checking bucket:", error)
      return NextResponse.json({ 
        success: false, 
        warning: "Unable to check storage bucket. File uploads may not work correctly.", 
        bucketExists: false
      }, { status: 200 })
    }
  } catch (error) {
    console.error("Error initializing storage:", error)
    return NextResponse.json({ 
      success: false, 
      warning: "Storage initialization error. File uploads may not work correctly."
    }, { status: 200 })
  }
} 