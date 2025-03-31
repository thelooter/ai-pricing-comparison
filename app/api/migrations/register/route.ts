import { NextResponse } from 'next/server'
import { checkAdminAccess } from '@/lib/admin'
import { registerMigration } from '@/lib/migrations'
import path from 'path'

export async function POST(request: Request) {
  try {
    // Check if the user is an admin
    const { isAuthorized, error, status } = await checkAdminAccess()
    
    if (!isAuthorized) {
      return NextResponse.json({ success: false, error }, { status })
    }

    // Get the migration name from the request
    const requestData = await request.json()
    if (!requestData.migrationName) {
      return NextResponse.json({ 
        success: false, 
        error: 'Migration name is required' 
      }, { status: 400 })
    }
    
    // Extract the base name without .sql extension if provided
    const migrationName = requestData.migrationName.endsWith('.sql')
      ? path.basename(requestData.migrationName, '.sql')
      : requestData.migrationName
    
    // Register the migration as applied
    const success = await registerMigration(
      migrationName, 
      'success', 
      undefined
    )
    
    if (success) {
      return NextResponse.json({
        success: true,
        message: `Migration "${migrationName}" has been registered as applied`
      })
    } else {
      return NextResponse.json({
        success: false,
        error: 'Failed to register migration. Check server logs for details.'
      }, { status: 500 })
    }
  } catch (error) {
    console.error('Error registering migration:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'An unexpected error occurred while registering the migration' 
    }, { status: 500 })
  }
} 