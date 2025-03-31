import { getModels, getCapabilities } from "@/lib/actions"
import AdminPanel from "@/components/admin/admin-panel"
import SeedDatabaseForm from "@/components/admin/seed-database-form"
import RunMigrationsButton from "@/components/admin/run-migrations-button"
import { requireAdmin } from "@/lib/admin"

export default async function AdminPage() {
  // Check admin authorization - will redirect if unauthorized
  await requireAdmin()

  // Get models and capabilities for the admin panel
  const [models, capabilities] = await Promise.all([
    getModels(),
    getCapabilities()
  ])

  return (
    <div className="container mx-auto py-8 px-4">
      <AdminPanel models={models} capabilities={capabilities} />

      {/* Admin Tools Section - only visible if no models exist */}
      {models.length === 0 && (
        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-4">Admin Tools</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-6 border rounded-lg bg-muted/20">
              <h3 className="text-lg font-medium mb-4">Seed Database</h3>
              <p className="mb-4">Your database appears to be empty. Would you like to seed it with initial data?</p>
              <SeedDatabaseForm />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

