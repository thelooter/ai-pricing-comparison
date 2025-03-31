import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ModelData } from "@/types/model"
import Image from "next/image"

interface CardViewProps {
  models: ModelData[]
}

export function CardView({ models }: CardViewProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {models.length > 0 ? (
        models.map((model, index) => (
          <Card key={index} className="h-full">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  {model.logoUrl ? (
                    <div className="relative h-10 w-10 overflow-hidden rounded-md">
                      <Image 
                        src={model.logoUrl} 
                        alt={`${model.name} logo`}
                        fill
                        className="object-contain"
                      />
                    </div>
                  ) : (
                    <div className="h-10 w-10 bg-muted rounded-md flex items-center justify-center">
                      <span className="text-sm font-bold">{model.name.substring(0, 2).toUpperCase()}</span>
                    </div>
                  )}
                  <CardTitle>{model.name}</CardTitle>
                </div>
                <Badge>{model.provider}</Badge>
              </div>
              <div className="flex flex-wrap gap-1 mt-2">
                {model.capabilities.map((capability, i) => (
                  <Badge key={i} variant="outline">
                    {capability}
                  </Badge>
                ))}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center border-b pb-2">
                  <span className="text-muted-foreground">Input Price:</span>
                  <span className="font-medium">{model.inputPrice}</span>
                </div>
                <div className="flex justify-between items-center border-b pb-2">
                  <span className="text-muted-foreground">Output Price:</span>
                  <span className="font-medium">{model.outputPrice}</span>
                </div>

                {model.alternativeProviders.length > 0 && (
                  <div className="pt-2">
                    <h4 className="text-sm font-medium mb-2">Also available on:</h4>
                    <div className="space-y-2">
                      {model.alternativeProviders.map((provider, i) => (
                        <div key={i} className="flex justify-between text-sm">
                          <span>{provider.name}</span>
                          <span className="text-muted-foreground">
                            {provider.inputPrice} / {provider.outputPrice}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))
      ) : (
        <div className="col-span-3 text-center py-8">
          No models match your search criteria
        </div>
      )}
    </div>
  )
} 