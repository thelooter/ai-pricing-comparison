import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { checkAdminAccess } from '@/lib/admin'
import fs from 'fs'
import path from 'path'

export async function GET() {
  try {
    // Use our safe admin check function
    const { isAuthorized, error, status } = await checkAdminAccess()
    
    if (!isAuthorized) {
      return NextResponse.json({ 
        success: false, 
        error,
        migrations: [] 
      }, { status })
    }

    const supabase = await createClient()
    const migrationsDir = path.join(process.cwd(), 'migrations')
    
    // Read all migration files
    const migrationFiles = fs.readdirSync(migrationsDir)
      .filter(file => file.endsWith('.sql'))
      .filter(file => !file.endsWith('_function.sql')) // Exclude function creation files
      .sort()
    
    // Get already applied migrations from the database
    let appliedMigrations: string[] = []
    
    try {
      const { data: migrationsData, error: migrationsError } = await supabase
        .from('migrations')
        .select('name')
        .eq('status', 'success')
      
      if (!migrationsError && migrationsData) {
        appliedMigrations = migrationsData.map(m => m.name)
      }
    } catch (error) {
      // If migrations table doesn't exist yet, no migrations have been applied
      console.warn('Error fetching applied migrations - migrations table may not exist yet')
    }
    
    // Filter out already applied migrations
    const availableMigrations = migrationFiles
      .filter(file => {
        // Extract base name without .sql extension for comparison
        const migrationName = path.basename(file, '.sql')
        return !appliedMigrations.includes(migrationName)
      })
      .map(file => ({
        name: file,
        description: getMigrationDescription(path.join(migrationsDir, file)),
        alreadyApplied: false
      }))
    
    // Include applied migrations for reference
    const appliedMigrationDetails = migrationFiles
      .filter(file => {
        // Extract base name without .sql extension for comparison
        const migrationName = path.basename(file, '.sql')
        return appliedMigrations.includes(migrationName)
      })
      .map(file => ({
        name: file,
        description: getMigrationDescription(path.join(migrationsDir, file)),
        alreadyApplied: true
      }))
    
    return NextResponse.json({
      success: true,
      migrations: [
        ...availableMigrations,
        ...appliedMigrationDetails
      ]
    })
  } catch (error) {
    console.error('Error fetching available migrations:', error)
    return NextResponse.json({
      success: false,
      error: 'An unexpected error occurred while fetching available migrations',
      migrations: []
    }, { status: 500 })
  }
}

// Helper function to extract description from migration file
function getMigrationDescription(filePath: string): string {
  try {
    const content = fs.readFileSync(filePath, 'utf-8')
    const firstLine = content.split('\n')[0]
    
    if (firstLine.startsWith('--')) {
      return firstLine.substring(2).trim()
    }
    
    return 'No description'
  } catch (error) {
    return 'Error reading description'
  }
} 