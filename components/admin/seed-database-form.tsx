"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { seedDatabase } from "@/lib/actions"

export default function SeedDatabaseForm() {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  // Only show in development
  if (process.env.NODE_ENV !== "development") {
    return null
  }

  const handleSeedDatabase = async () => {
    setIsLoading(true)
    try {
      const result = await seedDatabase()
      
      if (result.success) {
        // Refresh the page to show new data
        router.refresh()
      } else {
        alert(`Error seeding database: ${result.error}`)
      }
    } catch (error) {
      console.error('Error seeding database:', error)
      alert('An unexpected error occurred while seeding the database')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div>
      <Button 
        onClick={handleSeedDatabase}
        disabled={isLoading}
        className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
      >
        {isLoading ? 'Seeding...' : 'Seed Database'}
      </Button>
      <p className="text-sm text-muted-foreground mt-2">
        Note: This feature is only available in development mode.
      </p>
    </div>
  )
} 