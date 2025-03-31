import { InfoIcon } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface CapabilityItem {
  name: string
  description: string
}

export function CapabilitiesLegend() {
  const capabilities: CapabilityItem[] = [
    {
      name: "Text",
      description: "Ability to understand and generate human-like text for various tasks including content creation, chatbots, and creative writing."
    },
    {
      name: "Image Input",
      description: "Can analyze and understand images provided as input, enabling visual reasoning and image-based responses."
    },
    {
      name: "Object Generation",
      description: "Creates structured data objects like JSON or specific data formats based on requirements or context."
    },
    {
      name: "Tool Usage",
      description: "Ability to interact with external tools and APIs, execute functions, and integrate with other systems programmatically."
    },
    {
      name: "Audio Processing",
      description: "Can work with audio inputs and outputs, including speech recognition, transcription, and audio content analysis."
    },
    {
      name: "Video Processing",
      description: "Analyzes video content to extract information, describe scenes, and understand temporal visual data."
    },
    {
      name: "Code Generation",
      description: "Generates and completes code snippets in various programming languages based on descriptions or initial code."
    }
  ]

  return (
    <Card className="mt-8">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <InfoIcon className="h-5 w-5" />
          Capabilities Legend
        </CardTitle>
        <CardDescription>Understanding what each AI model capability means</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {capabilities.map((capability, index) => (
            <div key={index} className="border rounded-md p-4 space-y-2 transition-all duration-200 hover:bg-accent hover:shadow-md hover:border-primary/20">
              <div className="flex items-center gap-2">
                <Badge variant="outline">{capability.name}</Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                {capability.description}
              </p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
} 