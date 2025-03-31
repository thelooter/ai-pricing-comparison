import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { applyMigrations, applySpecificMigration } from '@/lib/migrations'
import { checkAdminAccess } from '@/lib/admin'

export async function POST(request: Request) {
  try {
    // Use our safe admin check function
    const { isAuthorized, error, status } = await checkAdminAccess()
    
    if (!isAuthorized) {
      return NextResponse.json({ success: false, error }, { status })
    }

    // Check if a specific migration was requested
    let requestData = {}
    try {
      requestData = await request.json()
    } catch (error) {
      // If no body was provided, just run all migrations
    }

    // If a specific migration was requested, run just that one
    if (requestData && 'migrationName' in requestData) {
      const migrationName = requestData.migrationName as string
      const result = await applySpecificMigration(migrationName)
      return NextResponse.json(result)
    }
    
    // Otherwise, apply all pending migrations
    const result = await applyMigrations()
    
    return NextResponse.json(result)
  } catch (error) {
    console.error('Error running migrations:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'An unexpected error occurred while running migrations' 
    }, { status: 500 })
  }
} 