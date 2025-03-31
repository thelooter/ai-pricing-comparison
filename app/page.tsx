import { getModels } from "@/lib/actions"
import type { ModelWithDetails } from "@/lib/supabase/database.types"
import PricingPage from "@/components/pricing-page"

export default async function Home() {
  let models: ModelWithDetails[] = []
  try {
    models = await getModels()
  } catch (error) {
    console.error("Error fetching models:", error)
  }

  return <PricingPage initialModels={models} />
}

