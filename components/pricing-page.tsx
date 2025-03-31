import { PricingPageClient } from "./pricing/PricingPageClient"
import { ModelWithDetails } from "@/lib/supabase/database.types"

export default function PricingPage({ initialModels }: { initialModels: ModelWithDetails[] }) {
  return <PricingPageClient initialModels={initialModels} />
}

