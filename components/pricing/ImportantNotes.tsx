import { InfoIcon } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export function ImportantNotes() {
  return (
    <Card className="mt-8">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <InfoIcon className="h-5 w-5" />
          Important Notes
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2 list-disc pl-5">
          <li>
            Prices are approximate and may change over time. Always verify current pricing on the provider's website.
          </li>
          <li>Input and output prices are shown per 1 million tokens.</li>
          <li>Some providers may offer volume discounts or special pricing for enterprise customers.</li>
          <li>Additional costs may apply for features like fine-tuning, embeddings, or specialized endpoints.</li>
          <li>Performance and availability may vary across providers for the same model.</li>
        </ul>
      </CardContent>
    </Card>
  )
} 