"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Check, X, Clock, ChevronDown, ChevronUp, AlertCircle, PlayCircle, Plus, ListChecks, CheckCircle2 } from "lucide-react"
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select"

interface Migration {
  id: number
  name: string
  applied_at: string
  applied_by: string | null
  status: string
  error_message: string | null
}

interface AvailableMigration {
  name: string
  description: string
  alreadyApplied: boolean
}

interface MigrationResult {
  success: boolean
  message?: string
  error?: string
  appliedMigrations?: string[]
  skippedMigrations?: { file: string; reason: string }[]
}

export default function RunMigrationsButton() {
  const [isLoading, setIsLoading] = useState(false)
  const [runningMigration, setRunningMigration] = useState<string | null>(null)
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null)
  const [showManual, setShowManual] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const [migrationHistory, setMigrationHistory] = useState<Migration[]>([])
  const [loadingHistory, setLoadingHistory] = useState(false)
  const [migrationResult, setMigrationResult] = useState<MigrationResult | null>(null)
  const [availableMigrations, setAvailableMigrations] = useState<AvailableMigration[]>([])
  const [isLoadingAvailable, setIsLoadingAvailable] = useState(false)
  const [showManualRegistration, setShowManualRegistration] = useState(false)
  const [selectedMigration, setSelectedMigration] = useState<string>('')
  const [registeringMigration, setRegisteringMigration] = useState(false)

  useEffect(() => {
    fetchAvailableMigrations()
  }, [])

  const fetchAvailableMigrations = async () => {
    setIsLoadingAvailable(true)
    try {
      const response = await fetch('/api/migrations/available')
      const result = await response.json()
      
      if (result.success) {
        setAvailableMigrations(result.migrations)
      } else {
        console.error('Failed to fetch migrations:', result.error)
      }
    } catch (error) {
      console.error('Error fetching migrations:', error)
    } finally {
      setIsLoadingAvailable(false)
    }
  }

  const handleRunMigrations = async () => {
    setIsLoading(true)
    setMessage(null)
    setShowManual(false)
    setMigrationResult(null)
    
    try {
      const response = await fetch('/api/migrations/run', {
        method: 'POST',
      })
      
      const result = await response.json()
      setMigrationResult(result)
      
      if (result.success) {
        let msg = 'Migration completed successfully!';
        if (result.message) {
          msg = result.message;
        }
        
        setMessage({ text: msg, type: 'success' })
        // Refresh migration history and available migrations
        fetchMigrationHistory()
        fetchAvailableMigrations()
      } else {
        setMessage({ text: `Error running migration: ${result.error}`, type: 'error' })
        setShowManual(true)
      }
    } catch (error) {
      console.error('Error running migration:', error)
      setMessage({ text: 'An unexpected error occurred while running the migration.', type: 'error' })
      setShowManual(true)
    } finally {
      setIsLoading(false)
    }
  }

  const handleRunSingleMigration = async (migrationName: string) => {
    setRunningMigration(migrationName)
    setMessage(null)
    setShowManual(false)
    setMigrationResult(null)
    
    try {
      // Extract the base name without .sql extension for the API
      const baseName = migrationName.endsWith('.sql') 
        ? migrationName.substring(0, migrationName.length - 4) 
        : migrationName;
      
      const response = await fetch('/api/migrations/run', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ migrationName: baseName }),
      })
      
      const result = await response.json()
      
      if (result.success) {
        setMessage({ text: result.message || `Migration ${migrationName} applied successfully!`, type: 'success' })
        // Refresh migration history and available migrations
        fetchMigrationHistory()
        fetchAvailableMigrations()
      } else {
        setMessage({ text: `Error: ${result.error}`, type: 'error' })
        setShowManual(true)
      }
    } catch (error) {
      console.error('Error running migration:', error)
      setMessage({ text: 'An unexpected error occurred.', type: 'error' })
      setShowManual(true)
    } finally {
      setRunningMigration(null)
    }
  }

  const fetchMigrationHistory = async () => {
    setLoadingHistory(true)
    try {
      const response = await fetch('/api/migrations/history')
      if (response.ok) {
        const data = await response.json()
        if (data.success && data.migrations) {
          setMigrationHistory(data.migrations)
        } else {
          console.error('Error fetching migration history:', data.error)
        }
      }
    } catch (error) {
      console.error('Error fetching migration history:', error)
    } finally {
      setLoadingHistory(false)
    }
  }

  useEffect(() => {
    if (showHistory) {
      fetchMigrationHistory()
    }
  }, [showHistory])

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleString()
  }

  const handleRegisterMigration = async () => {
    if (!selectedMigration) return
    
    setRegisteringMigration(true)
    
    try {
      const response = await fetch('/api/migrations/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ migrationName: selectedMigration }),
      })
      
      const result = await response.json()
      
      if (result.success) {
        setMessage({ text: result.message || `Migration ${selectedMigration} registered as applied`, type: 'success' })
        // Refresh migration history and available migrations
        fetchMigrationHistory()
        fetchAvailableMigrations()
        setSelectedMigration('')
        setShowManualRegistration(false)
      } else {
        setMessage({ text: `Error: ${result.error}`, type: 'error' })
      }
    } catch (error) {
      console.error('Error registering migration:', error)
      setMessage({ text: 'An unexpected error occurred.', type: 'error' })
    } finally {
      setRegisteringMigration(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <Button 
          onClick={handleRunMigrations}
          disabled={isLoading || !!runningMigration}
          className="w-full"
        >
          {isLoading ? 'Running Migrations...' : 'Run All Pending Migrations'}
        </Button>
        
        {message && (
          <div className={`p-4 rounded-md ${message.type === 'success' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'}`}>
            {message.text}
          </div>
        )}
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-medium">Available Migrations</h3>
        
        {isLoadingAvailable ? (
          <div className="text-center py-8">Loading migrations...</div>
        ) : availableMigrations.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">No migrations available</div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Migration</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {availableMigrations.map((migration) => (
                  <TableRow key={migration.name}>
                    <TableCell className="font-mono text-xs">
                      {migration.name}
                    </TableCell>
                    <TableCell>{migration.description}</TableCell>
                    <TableCell>
                      {migration.alreadyApplied ? (
                        <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 flex items-center gap-1">
                          <Check className="h-3 w-3" />
                          Applied
                        </Badge>
                      ) : (
                        <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" />
                          Pending
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {!migration.alreadyApplied && (
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={!!runningMigration}
                          onClick={() => handleRunSingleMigration(migration.name)}
                          className="flex items-center gap-1"
                        >
                          {runningMigration === migration.name ? (
                            <>Running...</>
                          ) : (
                            <>
                              <PlayCircle className="h-3 w-3" />
                              Run
                            </>
                          )}
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        <div className="flex justify-center">
          <Button 
            onClick={fetchAvailableMigrations}
            variant="outline"
            size="sm"
          >
            Refresh Migrations
          </Button>
        </div>
      </div>

      {migrationResult && (
        <Card className="p-4 overflow-hidden">
          <h4 className="font-medium mb-2">Migration Result</h4>
          
          {migrationResult.appliedMigrations && migrationResult.appliedMigrations.length > 0 && (
            <div className="mb-4">
              <h5 className="text-sm font-medium mb-1">Applied Migrations:</h5>
              <ul className="text-sm list-disc ml-5 space-y-1">
                {migrationResult.appliedMigrations.map((file, index) => (
                  <li key={index} className="text-green-600 dark:text-green-400">
                    {file}
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          {migrationResult.skippedMigrations && migrationResult.skippedMigrations.length > 0 && (
            <div>
              <h5 className="text-sm font-medium mb-1">Skipped Migrations:</h5>
              <ul className="text-sm list-disc ml-5 space-y-1">
                {migrationResult.skippedMigrations.map((item, index) => (
                  <li key={index} className="text-gray-600 dark:text-gray-400">
                    {item.file} <span className="text-gray-500">({item.reason})</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </Card>
      )}

      <div className="mt-6 flex justify-between items-center">
        <Button 
          variant="outline" 
          className="flex items-center gap-1"
          onClick={() => setShowHistory(!showHistory)}
        >
          <ListChecks className="h-4 w-4" />
          {showHistory ? "Hide Migration History" : "Show Migration History"}
        </Button>
        
        <Button 
          variant="outline" 
          className="flex items-center gap-1"
          onClick={() => setShowManualRegistration(!showManualRegistration)}
        >
          <CheckCircle2 className="h-4 w-4" />
          {showManualRegistration ? "Cancel" : "Register Manual Migration"}
        </Button>
      </div>

      {showManualRegistration && (
        <Card className="p-4">
          <h3 className="text-lg font-medium mb-4">Register Manually Applied Migration</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Use this form to register a migration that you applied manually through the Supabase SQL Editor or other means.
          </p>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Select Migration
              </label>
              <Select 
                value={selectedMigration} 
                onValueChange={setSelectedMigration}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a migration" />
                </SelectTrigger>
                <SelectContent>
                  {availableMigrations
                    .filter(m => !m.alreadyApplied)
                    .map((migration) => (
                      <SelectItem key={migration.name} value={migration.name}>
                        {migration.name} - {migration.description}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            
            <Button 
              onClick={handleRegisterMigration} 
              disabled={!selectedMigration || registeringMigration}
              className="w-full"
            >
              {registeringMigration ? 'Registering...' : 'Register as Applied'}
            </Button>
          </div>
        </Card>
      )}

      {showHistory && (
        <Card className="overflow-hidden">
          {loadingHistory ? (
            <div className="p-4 text-center">Loading migration history...</div>
          ) : migrationHistory.length === 0 ? (
            <div className="p-4 text-center">No migration history found</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Migration</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Applied At</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {migrationHistory.map((migration) => (
                  <TableRow key={migration.id}>
                    <TableCell className="font-medium">{migration.name}</TableCell>
                    <TableCell>
                      {migration.status === 'success' ? (
                        <Badge variant="outline" className="bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400 flex items-center gap-1">
                          <Check className="h-3 w-3" /> Success
                        </Badge>
                      ) : migration.status === 'failed' ? (
                        <Badge variant="outline" className="bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400 flex items-center gap-1">
                          <X className="h-3 w-3" /> Failed
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400 flex items-center gap-1">
                          <Clock className="h-3 w-3" /> {migration.status}
                        </Badge>
                      )}
                      {migration.error_message && (
                        <div className="mt-1 text-xs text-red-600 dark:text-red-400">
                          {migration.error_message}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>{formatDate(migration.applied_at)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Card>
      )}

      {showManual && (
        <Card className="p-4 mt-4 border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-900">
          <h4 className="font-medium mb-2">Manual Migration Instructions</h4>
          <p className="text-sm mb-2 flex items-center gap-1">
            <AlertCircle className="h-4 w-4 text-amber-600" />
            If automatic migration fails, you may need to run migrations manually:
          </p>
          <ol className="text-sm list-decimal ml-5 space-y-2">
            <li>Go to your Supabase dashboard</li>
            <li>Click on "SQL Editor" in the left sidebar</li>
            <li>Create a new query</li>
            <li>Paste the migration SQL for the failing migration</li>
            <li>Execute the query</li>
          </ol>
          <p className="text-sm mt-2">For model features migration, run:</p>
          <pre className="bg-gray-100 dark:bg-gray-800 p-2 mt-1 text-xs rounded overflow-x-auto">
            ALTER TABLE public.models 
            ADD COLUMN IF NOT EXISTS popular BOOLEAN DEFAULT FALSE,
            ADD COLUMN IF NOT EXISTS legacy BOOLEAN DEFAULT FALSE;
          </pre>
        </Card>
      )}
    </div>
  )
} 