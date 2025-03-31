import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ModelData } from "@/types/model"
import { formatPrice, parsePrice } from "@/lib/utils"

interface ComparisonTableProps {
  models: ModelData[]
}

export function ComparisonTable({ models }: ComparisonTableProps) {
  // Function to extract price number and reformat without unit
  const displayPrice = (formattedPrice: string) => {
    const priceValue = parsePrice(formattedPrice);
    if (priceValue !== null) {
      return formatPrice(priceValue, { includeUnit: false });
    }
    return formattedPrice;
  };

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="min-w-[180px]">Model</TableHead>
          <TableHead>Primary Provider</TableHead>
          <TableHead>Capabilities</TableHead>
          <TableHead className="text-right">Input Price<br /><span className="text-xs text-muted-foreground">/ 1M Tokens</span></TableHead>
          <TableHead className="text-right">Output Price<br /><span className="text-xs text-muted-foreground">/ 1M Tokens</span></TableHead>
          <TableHead>Alternative Providers</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {models.length > 0 ? (
          models.map((model, index) => (
            <TableRow key={index}>
              <TableCell className="font-medium">{model.name}</TableCell>
              <TableCell>{model.provider}</TableCell>
              <TableCell>
                <div className="flex flex-wrap gap-1">
                  {model.capabilities.map((capability, i) => (
                    <Badge key={i} variant="outline">
                      {capability}
                    </Badge>
                  ))}
                </div>
              </TableCell>
              <TableCell className="text-right">{displayPrice(model.inputPrice)}</TableCell>
              <TableCell className="text-right">{displayPrice(model.outputPrice)}</TableCell>
              <TableCell>
                {model.alternativeProviders.length > 0 ? (
                  <div className="flex flex-col gap-1">
                    {model.alternativeProviders.map((provider, i) => (
                      <div key={i} className="text-sm">
                        {provider.name}:{" "}
                        <span className="text-muted-foreground">
                          {displayPrice(provider.inputPrice)} / {displayPrice(provider.outputPrice)}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <span className="text-muted-foreground">None</span>
                )}
              </TableCell>
            </TableRow>
          ))
        ) : (
          <TableRow>
            <TableCell colSpan={6} className="text-center py-8">
              No models match your search criteria
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  )
} 