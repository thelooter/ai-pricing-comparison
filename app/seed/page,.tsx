'use server'

import { seedDatabase } from "@/lib/actions"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function SeedPage() {
  return (
    <div className="container mx-auto py-12 px-4">
      <div className="max-w-md mx-auto bg-card p-8 rounded-lg shadow-md border">
        <h1 className="text-2xl font-bold mb-6">Seed Database</h1>

        <p className="mb-6 text-muted-foreground">
          This will populate your database with sample AI model pricing data. This action should only be performed once
          on a new database.
        </p>

        <form action={async () => {
          const result = await seedDatabase();
          // Handle the result if needed
        }} className="space-y-4">
          <Button type="submit" className="w-full">
            Seed Database
          </Button>

          <div className="text-center">
            <Link href="/admin" className="text-sm text-primary hover:underline">
              Return to Admin Panel
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}

