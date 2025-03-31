"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ModelData } from "@/types/model"
import { PageHeader } from "./PageHeader"
import { FilterSection } from "./FilterSection"
import { ComparisonTable } from "./ComparisonTable"
import { CardView } from "./CardView"
import { CapabilitiesLegend } from "./CapabilitiesLegend"
import { ImportantNotes } from "./ImportantNotes"
import { ModelWithDetails } from "@/lib/supabase/database.types"

interface PricingPageClientProps {
  initialModels: ModelWithDetails[]
}

export function PricingPageClient({ initialModels }: Readonly<PricingPageClientProps>) {
  const [searchQuery, setSearchQuery] = useState("")
  const [providerFilter, setProviderFilter] = useState("all")
  const [capabilityFilter, setCapabilityFilter] = useState("all")
  const [showLegacy, setShowLegacy] = useState(false)
  const [showPopularOnly, setShowPopularOnly] = useState(true)

  // Filter models based on search query and filters
  const filteredModels = initialModels.filter((model) => {
    const matchesSearch =
      model.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      model.provider.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesProvider =
      providerFilter === "all" ||
      model.provider === providerFilter ||
      model.alternativeProviders.some((p) => p.provider_name === providerFilter)
    const matchesCapability = capabilityFilter === "all" || 
      model.capabilities.some(cap => cap.name === capabilityFilter)
    const matchesLegacy = showLegacy || !model.legacy
    const matchesPopular = !showPopularOnly || model.popular

    return matchesSearch && matchesProvider && matchesCapability && matchesLegacy && matchesPopular
  })

  // Get unique providers for filter dropdown
  const providers = [
    "all",
    ...new Set([
      ...initialModels.map((model) => model.provider),
      ...initialModels.flatMap((model) => model.alternativeProviders.map((p) => p.provider_name)),
    ]),
  ]

  // Get unique capabilities for filter dropdown
  const capabilities = [
    "all", 
    ...new Set(initialModels.flatMap(model => 
      model.capabilities.map(cap => cap.name)
    ))
  ]

  // Transform to ModelData for the child components
  const mappedModels = filteredModels.map(model => ({
    name: model.name,
    provider: model.provider,
    logoUrl: model.logo_url,
    capabilities: model.capabilities.map(c => c.name),
    inputPrice: model.input_price.toString(),
    outputPrice: model.output_price.toString(),
    popular: model.popular,
    legacy: model.legacy,
    alternativeProviders: model.alternativeProviders.map(p => ({
      name: p.provider_name,
      inputPrice: p.input_price.toString(),
      outputPrice: p.output_price.toString()
    }))
  }))

  return (
    <div className="container mx-auto py-8 px-4">
      <PageHeader />

      <FilterSection
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        providerFilter={providerFilter}
        setProviderFilter={setProviderFilter}
        capabilityFilter={capabilityFilter}
        setCapabilityFilter={setCapabilityFilter}
        providers={providers}
        capabilities={capabilities}
        showLegacy={showLegacy}
        setShowLegacy={setShowLegacy}
        showPopularOnly={showPopularOnly}
        setShowPopularOnly={setShowPopularOnly}
      />

      <Tabs defaultValue="comparison" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-8">
          <TabsTrigger value="comparison">Comparison Table</TabsTrigger>
          <TabsTrigger value="cards">Card View</TabsTrigger>
        </TabsList>

        <TabsContent value="comparison" className="w-full overflow-auto">
          <ComparisonTable models={mappedModels} />
        </TabsContent>

        <TabsContent value="cards" className="w-full">
          <CardView models={mappedModels} />
        </TabsContent>
      </Tabs>

      <CapabilitiesLegend />
      <ImportantNotes />
    </div>
  )
} 