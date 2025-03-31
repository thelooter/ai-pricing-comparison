"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

interface Migration {
  name: string
  file: string
  description: string
  createdAt: string
  isApplied: boolean
}

export default function MigrationsSetup() {
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null)
  const [sqlContent, setSqlContent] = useState<{ name: string; sql: string }[] | null>(null)

  const setupMigrations = async () => {
    setIsLoading(true)
    setMessage(null)
    setSqlContent(null)
    
    try {
      const response = await fetch('/api/migrations/setup', {
        method: 'POST',
      })
      
      const result = await response.json()
      
      if (result.success) {
        setMessage({ 
          text: result.existed 
            ? 'Migration system is already set up!' 
            : 'Migration system set up successfully!', 
          type: 'success' 
        })
      } else if (result.setupNeeded) {
        setMessage({ 
          text: 'Manual setup required. Please run the SQL commands below in your Supabase SQL Editor.', 
          type: 'error' 
        })
        setSqlContent(result.sql)
      } else {
        setMessage({ text: `Error: ${result.error}`, type: 'error' })
      }
    } catch (error) {
      setMessage({ text: 'An unexpected error occurred.', type: 'error' })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-lg font-medium mb-2">Migrations System Setup</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Set up the migrations tracking system. This is required before running any migrations.
        </p>
      </div>

      <div className="space-y-6">
        <div className="space-y-4">
          <Button 
            onClick={setupMigrations}
            disabled={isLoading}
            className="w-full"
          >
            {isLoading ? 'Setting up...' : 'Setup Migration System'}
          </Button>
          
          {message && (
            <div className={`p-4 rounded-md ${message.type === 'success' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'}`}>
              {message.text}
            </div>
          )}
        </div>
      </div>

      {sqlContent && (
        <Card className="p-4 mt-4 border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-900">
          <h4 className="font-medium mb-2">Manual SQL Execution Required</h4>
          <p className="text-sm mb-2">Please run the following SQL commands in your Supabase SQL Editor:</p>
          {sqlContent.map((sql, index) => (
            <div key={index} className="mt-4">
              <h5 className="text-sm font-medium mb-1">{sql.name}:</h5>
              <pre className="bg-gray-100 dark:bg-gray-800 p-3 text-xs rounded overflow-x-auto">
                {sql.sql}
              </pre>
            </div>
          ))}
        </Card>
      )}
    </div>
  )
} 