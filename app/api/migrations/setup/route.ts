import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import fs from 'fs'
import path from 'path'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    
    // Check if user is admin
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 })
    }
    
    const { data: adminUser } = await supabase
      .from("admin_users")
      .select("is_admin")
      .eq("user_id", user.id)
      .single()
      
    if (!adminUser?.is_admin) {
      return NextResponse.json({ success: false, error: 'Admin privileges required' }, { status: 403 })
    }

    // Step 1: Setup exec_sql function if it doesn't exist
    const sqlFunctionPath = path.join(process.cwd(), 'migrations', 'create_simple_exec_sql.sql')
    
    if (!fs.existsSync(sqlFunctionPath)) {
      return NextResponse.json({ 
        success: false, 
        error: 'The migration file "create_simple_exec_sql.sql" was not found' 
      }, { status: 404 })
    }
    
    const execSqlFunction = fs.readFileSync(sqlFunctionPath, 'utf8')
    
    // Check if exec_sql function exists
    const testResult = await supabase.rpc('exec_sql', { sql: 'SELECT 1' })
    const needsExecSql = !!testResult.error

    // Step 2: Setup migrations table
    const migrationsTablePath = path.join(process.cwd(), 'migrations', 'create_migrations_table.sql')
    
    if (!fs.existsSync(migrationsTablePath)) {
      return NextResponse.json({ 
        success: false, 
        error: 'The migration file "create_migrations_table.sql" was not found' 
      }, { status: 404 })
    }
    
    const migrationsTableSql = fs.readFileSync(migrationsTablePath, 'utf8')

    // Check if migrations table exists
    const { error: checkError } = await supabase
      .from('migrations')
      .select('id')
      .limit(1)
    
    const needsMigrationsTable = !!checkError

    // Return appropriate response based on what needs to be done
    if (!needsExecSql && !needsMigrationsTable) {
      return NextResponse.json({ 
        success: true, 
        message: 'Both exec_sql function and migrations table already exist',
        existed: true
      })
    }

    return NextResponse.json({ 
      success: false,
      setupNeeded: {
        execSql: needsExecSql,
        migrationsTable: needsMigrationsTable
      },
      instructions: 'Please run the following SQL manually in the Supabase SQL Editor:',
      sql: [
        ...(needsExecSql ? [{ 
          name: 'exec_sql function',
          sql: execSqlFunction 
        }] : []),
        ...(needsMigrationsTable ? [{ 
          name: 'migrations table',
          sql: migrationsTableSql 
        }] : [])
      ]
    })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'An unexpected error occurred' 
    }, { status: 500 })
  }
} 