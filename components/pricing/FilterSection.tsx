import { FilterIcon, SearchIcon } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"

interface FilterSectionProps {
  searchQuery: string
  setSearchQuery: (query: string) => void
  providerFilter: string
  setProviderFilter: (provider: string) => void
  capabilityFilter: string
  setCapabilityFilter: (capability: string) => void
  providers: string[]
  capabilities: string[]
  showLegacy: boolean
  setShowLegacy: (show: boolean) => void
  showPopularOnly: boolean
  setShowPopularOnly: (show: boolean) => void
}

export function FilterSection({
  searchQuery,
  setSearchQuery,
  providerFilter,
  setProviderFilter,
  capabilityFilter,
  setCapabilityFilter,
  providers,
  capabilities,
  showLegacy,
  setShowLegacy,
  showPopularOnly,
  setShowPopularOnly,
}: FilterSectionProps) {
  return (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FilterIcon className="h-5 w-5" />
          Filter Models
        </CardTitle>
        <CardDescription>Narrow down models based on your specific requirements</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col md:flex-row items-center gap-2">
            <div className="relative w-full">
              <SearchIcon className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search models or providers..."
                className="pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <Select value={providerFilter} onValueChange={setProviderFilter}>
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder="Select Provider" />
              </SelectTrigger>
              <SelectContent>
                {providers.map((provider) => (
                  <SelectItem key={provider} value={provider}>
                    {provider === "all" ? "All Providers" : provider}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={capabilityFilter} onValueChange={setCapabilityFilter}>
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder="Select Capability" />
              </SelectTrigger>
              <SelectContent>
                {capabilities.map((capability) => (
                  <SelectItem key={capability} value={capability}>
                    {capability === "all" ? "All Capabilities" : capability}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col md:flex-row items-center gap-6">
            <div className="flex items-center space-x-2">
              <Switch
                id="popular-only"
                checked={showPopularOnly}
                onCheckedChange={setShowPopularOnly}
              />
              <Label htmlFor="popular-only">Show popular models only</Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch
                id="show-legacy"
                checked={showLegacy}
                onCheckedChange={setShowLegacy}
              />
              <Label htmlFor="show-legacy">Include legacy models</Label>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
} 