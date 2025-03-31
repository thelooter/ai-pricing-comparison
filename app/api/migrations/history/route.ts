import { NextResponse } from 'next/server'
import { checkAdminAccess } from '@/lib/admin'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const { isAuthorized, error, status } = await checkAdminAccess()
    
    if (!isAuthorized) {
      return NextResponse.json({ success: false, error }, { status })
    }

    const supabase = await createClient()
    
    // Get all migrations ordered by applied_at
    const { data: migrations, error: migrationsError } = await supabase
      .from('migrations')
      .select('*')
      .order('applied_at', { ascending: false })
    
    if (migrationsError) {
      return NextResponse.json({ 
        success: false, 
        error: migrationsError.message 
      }, { status: 500 })
    }
    
    return NextResponse.json({ 
      success: true, 
      migrations: migrations || [] 
    })
  } catch (error) {
    console.error('Error fetching migration history:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'An unexpected error occurred while fetching migration history' 
    }, { status: 500 })
  }
} 