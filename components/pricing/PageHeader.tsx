import Link from "next/link"
import { ShieldIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "../theme-toggle"
import { ReportDialog } from "../report-dialog"

export function PageHeader() {
  return (
    <>
      <div className="flex justify-between items-center mb-8">
        <div className="flex-1"></div>
        <div className="flex-1 text-center">
          <h1 className="text-4xl font-bold">AI Model Pricing Comparison</h1>
        </div>
        <div className="flex-1 flex justify-end gap-4">
          <ThemeToggle />
          <Link href="/admin">
            <Button variant="outline" size="icon" className="rounded-full cursor-pointer" title="Admin Panel">
              <ShieldIcon className="h-[1.2rem] w-[1.2rem]" />
              <span className="sr-only">Admin Panel</span>
            </Button>
          </Link>
        </div>
      </div>

      <p className="text-lg text-muted-foreground max-w-2xl mx-auto text-center mb-8">
        Compare pricing across different AI models and providers to find the best option for your needs. Prices are
        shown per 1 million tokens.
      </p>

      <div className="flex justify-center gap-4 mb-8">
        <ReportDialog type="missing" triggerLabel="Report Missing Model" />
        <ReportDialog type="incorrect" triggerLabel="Report Incorrect Data" />
      </div>
    </>
  )
}
