import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import MigrationsSetup from "@/components/admin/migrations-setup"
import RunMigrationsButton from "@/components/admin/run-migrations-button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function MigrationsAdminPage() {
  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-6">Database Migrations</h1>
      
      <Tabs defaultValue="setup" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-8">
          <TabsTrigger value="setup">System Setup</TabsTrigger>
          <TabsTrigger value="migrations">Run Migrations</TabsTrigger>
        </TabsList>
        
        <TabsContent value="setup">
          <Card>
            <CardHeader>
              <CardTitle>Migrations System Setup</CardTitle>
              <CardDescription>
                Set up the migrations tracking system. This is required before running migrations.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <MigrationsSetup />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="migrations">
          <Card>
            <CardHeader>
              <CardTitle>Run Migrations</CardTitle>
              <CardDescription>
                Apply database migrations to update your schema.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <RunMigrationsButton />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
} 