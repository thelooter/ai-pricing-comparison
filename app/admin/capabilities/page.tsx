'use server'
import { checkIsAdmin, getCapabilities } from "@/lib/actions"
import { redirect } from "next/navigation"
import CapabilitiesManager from "@/components/admin/capabilities-manager"

export default async function CapabilitiesPage() {
  // Check if user is admin
  const isAdmin = await checkIsAdmin()

  if (!isAdmin) {
    redirect("/admin/login")
  }

  // Get capabilities
  const capabilities = await getCapabilities()

  return (
    <div className="container mx-auto py-8 px-4">
      <CapabilitiesManager capabilities={capabilities} />
    </div>
  )
}

