import fs from 'fs'
import path from 'path'
import { createClient } from '@/lib/supabase/server'

/**
 * Check if a migration has already been applied
 */
export async function checkMigrationApplied(migrationName: string): Promise<boolean> {
  const supabase = await createClient()
  
  // Check if the migrations table exists first
  try {
    const { error: tableCheckError } = await supabase
      .from('migrations')
      .select('id')
      .limit(1)
      
    if (tableCheckError) {
      // Migrations table doesn't exist yet
      return false
    }
  
    // Check if this specific migration has been applied
    const { data, error } = await supabase
      .from('migrations')
      .select('id')
      .eq('name', migrationName)
      .eq('status', 'success')
      .limit(1)
    
    if (error) {
      console.error("Error checking migration status:", error)
      return false
    }
    
    return data.length > 0
  } catch (error) {
    console.error("Error checking migration status:", error)
    return false
  }
}

/**
 * Register a migration as applied
 */
export async function registerMigration(
  migrationName: string, 
  status: 'success' | 'failed' = 'success', 
  errorMessage?: string
): Promise<boolean> {
  const supabase = await createClient()
  
  try {
    // Check if the migrations table exists
    const { error: tableCheckError } = await supabase
      .from('migrations')
      .select('id')
      .limit(1)
    
    if (tableCheckError) {
      console.error("Migrations table doesn't exist:", tableCheckError)
      return false
    }
    
    // Get the current user
    const { data: { user } } = await supabase.auth.getUser()
    
    // Add the migration record
    const { error } = await supabase
      .from('migrations')
      .insert({
        name: migrationName,
        applied_by: user?.id,
        status,
        error_message: errorMessage
      })
    
    if (error) {
      console.error("Error registering migration:", error)
      return false
    }
    
    return true
  } catch (error) {
    console.error("Error registering migration:", error)
    return false
  }
}

/**
 * Apply all migrations from the migrations directory
 */
export async function applyMigrations() {
  try {
    const supabase = await createClient()
    const migrationsDir = path.join(process.cwd(), 'migrations')
    
    if (!fs.existsSync(migrationsDir)) {
      console.error('Migrations directory not found')
      return { success: false, error: 'Migrations directory not found' }
    }

    // Get all SQL files in the migrations directory
    const migrationFiles = fs
      .readdirSync(migrationsDir)
      .filter(file => file.endsWith('.sql'))
      .sort() // Ensure files are processed in alphabetical order
    
    if (migrationFiles.length === 0) {
      console.warn('No migration files found')
      return { success: true, message: 'No migration files found' }
    }
    
    const appliedMigrations = []
    const skippedMigrations = []
    const failedMigrations = []
    
    // Always run the fix_admin_policies migration first if it exists
    const fixPoliciesIndex = migrationFiles.findIndex(file => file.includes('fix_admin_policies'));
    if (fixPoliciesIndex > 0) {
      // If it's not already first, move it to the front
      const fixPoliciesFile = migrationFiles.splice(fixPoliciesIndex, 1)[0];
      migrationFiles.unshift(fixPoliciesFile);
    }
    
    // Apply each migration
    for (const file of migrationFiles) {
      // Skip migrations tracking system itself and function creation
      if (file === 'create_migrations_table.sql' || file === 'create_exec_sql_function.sql' || file === 'create_simple_exec_sql.sql') {
        skippedMigrations.push({ file, reason: 'system migration' })
        continue
      }
      
      const migrationName = path.basename(file, '.sql')
      
      // Check if already applied
      try {
        const isApplied = await checkMigrationApplied(migrationName)
        if (isApplied) {
          skippedMigrations.push({ file, reason: 'already applied' })
          continue
        }
      } catch (error) {
        console.error(`Error checking if migration ${migrationName} is applied:`, error)
        // Continue anyway since we can't be sure if it's applied
      }
      
      // Execute the migration
      const filePath = path.join(migrationsDir, file)
      const sql = fs.readFileSync(filePath, 'utf8')
      
      console.log(`Applying migration: ${file}`)
      
      try {
        // Execute the SQL
        const { error } = await supabase.rpc('exec_sql', { sql })
        
        if (error) {
          console.error(`Error applying migration ${file}:`, error)
          try {
            await registerMigration(migrationName, 'failed', error.message)
          } catch (registrationError) {
            console.error(`Failed to register migration status:`, registrationError)
          }
          
          failedMigrations.push({
            file,
            error: error.message
          })
          
          // Continue with other migrations instead of stopping
          continue
        }
        
        // Register the successful migration
        try {
          await registerMigration(migrationName, 'success')
        } catch (registrationError) {
          console.error(`Failed to register successful migration:`, registrationError)
        }
        
        appliedMigrations.push(file)
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        console.error(`Error applying migration ${file}:`, error)
        
        try {
          await registerMigration(migrationName, 'failed', errorMessage)
        } catch (registrationError) {
          console.error(`Failed to register migration status:`, registrationError)
        }
        
        failedMigrations.push({
          file,
          error: errorMessage
        })
        
        // Continue with other migrations instead of stopping
        continue
      }
    }
    
    if (failedMigrations.length > 0) {
      return { 
        success: false, 
        error: `${failedMigrations.length} migrations failed. See details for more information.`,
        failedMigrations,
        appliedMigrations,
        skippedMigrations
      }
    }
    
    return { 
      success: true, 
      message: `Applied ${appliedMigrations.length} migrations successfully. Skipped ${skippedMigrations.length} migrations.`,
      appliedMigrations,
      skippedMigrations
    }
  } catch (error) {
    console.error('Error applying migrations:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

// Migration to add popular and legacy fields to models table
export async function addModelFeaturesFields() {
  const supabase = await createClient()
  const migrationName = 'add_model_features_fields'
  
  // Check if already applied
  const isApplied = await checkMigrationApplied(migrationName)
  if (isApplied) {
    return { success: true, message: 'Migration already applied' }
  }
  
  try {
    // Try using the exec_sql RPC function
    const { error } = await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE public.models 
        ADD COLUMN IF NOT EXISTS popular BOOLEAN DEFAULT FALSE,
        ADD COLUMN IF NOT EXISTS legacy BOOLEAN DEFAULT FALSE;
      `
    })
    
    if (error) {
      console.error("RPC migration error:", error)
      
      // Fallback to direct SQL if the RPC function fails or doesn't exist
      // This might be allowed depending on your Supabase permissions
      const { error: directError } = await supabase
        .from('models')
        .update({ popular: false })
        .eq('id', -1) // Dummy update to force refresh schema cache
      
      if (directError && directError.message.includes("popular")) {
        // The column doesn't exist yet, so we need to tell the user to add it manually
        return { 
          success: false, 
          error: "Unable to add columns. Please add 'popular' and 'legacy' BOOLEAN columns to your models table manually in the Supabase dashboard."
        }
      }
    }
    
    // Register the migration
    await registerMigration(migrationName, 'success')
    return { success: true }
  } catch (error) {
    console.error("Migration error:", error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error while adding model feature fields'
    await registerMigration(migrationName, 'failed', errorMessage)
    return { 
      success: false, 
      error: errorMessage
    }
  }
}

/**
 * Apply a specific migration by name
 */
export async function applySpecificMigration(migrationName: string) {
  try {
    const supabase = await createClient()
    const migrationsDir = path.join(process.cwd(), 'migrations')
    
    if (!fs.existsSync(migrationsDir)) {
      console.error('Migrations directory not found')
      return { success: false, error: 'Migrations directory not found' }
    }

    // Check if this is a system migration
    if (
      migrationName === 'create_migrations_table' || 
      migrationName === 'create_exec_sql_function' || 
      migrationName === 'create_simple_exec_sql'
    ) {
      return { 
        success: false, 
        error: `Cannot apply system migration '${migrationName}' directly. Please use the dedicated system setup instead.` 
      }
    }
    
    // Handle case where filename is given instead of migration name
    let actualName = migrationName
    if (migrationName.endsWith('.sql')) {
      actualName = path.basename(migrationName, '.sql')
    }
    
    // Check if migration already applied
    const isApplied = await checkMigrationApplied(actualName)
    if (isApplied) {
      return { 
        success: true, 
        message: `Migration '${actualName}' has already been applied.`,
        alreadyApplied: true
      }
    }
    
    // Look for the migration file 
    let filePath = ''
    const possibleFiles = [
      `${actualName}.sql`,
      `${actualName}`.padStart(4, '0') + '.sql',
      ...Array.from({ length: 9 }, (_, i) => `${i + 1}`.padStart(4, '0') + `_${actualName}.sql`)
    ]
    
    for (const fileName of possibleFiles) {
      const potentialPath = path.join(migrationsDir, fileName)
      if (fs.existsSync(potentialPath)) {
        filePath = potentialPath
        break
      }
    }
    
    if (!filePath) {
      return { 
        success: false, 
        error: `Migration file for '${actualName}' not found` 
      }
    }
    
    // Execute the migration
    const sql = fs.readFileSync(filePath, 'utf8')
    console.log(`Applying migration: ${actualName}`)
    
    try {
      // Execute the SQL
      const { error } = await supabase.rpc('exec_sql', { sql })
      
      if (error) {
        console.error(`Error applying migration ${actualName}:`, error)
        await registerMigration(actualName, 'failed', error.message)
        return { 
          success: false, 
          error: `Error applying migration ${actualName}: ${error.message}`,
          migrationName: actualName
        }
      }
      
      // Register the successful migration
      await registerMigration(actualName, 'success')
      return { 
        success: true, 
        message: `Successfully applied migration '${actualName}'`,
        migrationName: actualName
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      console.error(`Error applying migration ${actualName}:`, error)
      await registerMigration(actualName, 'failed', errorMessage)
      return { 
        success: false, 
        error: `Error applying migration ${actualName}: ${errorMessage}`,
        migrationName: actualName
      }
    }
  } catch (error) {
    console.error('Error applying migration:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
} 