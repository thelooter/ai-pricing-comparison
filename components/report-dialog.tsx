"use client"

import React, { useState } from "react"
import { useToast } from "@/components/ui/use-toast"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { AlertTriangleIcon, CircleOffIcon } from "lucide-react"

interface ReportDialogProps {
  type: "missing" | "incorrect"
  triggerLabel?: string
  modelName?: string
}

export function ReportDialog({ type, triggerLabel, modelName }: Readonly<ReportDialogProps>) {
  const { toast } = useToast()
  const [open, setOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    modelName: modelName ?? "",
    details: "",
    contactEmail: ""
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const response = await fetch("/api/reports", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type,
          modelName: formData.modelName,
          details: formData.details,
          contactEmail: formData.contactEmail,
        }),
      })

      if (response.ok) {
        toast({
          title: "Report submitted",
          description: "Thank you for your feedback. We'll review your report shortly.",
        })
        setOpen(false)
        // Reset form
        setFormData({
          modelName: modelName ?? "",
          details: "",
          contactEmail: ""
        })
      } else {
        const error = await response.json()
        throw new Error(error.message || "Failed to submit report")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Something went wrong",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const title = type === "missing"
    ? "Report Missing Model/Data"
    : "Report Incorrect/Outdated Data"

  const description = type === "missing"
    ? "Help us improve by reporting AI models or data that are missing from our database."
    : "Report information that is incorrect or outdated so we can keep our data accurate."

  const icon = type === "missing"
    ? <CircleOffIcon className="h-5 w-5" />
    : <AlertTriangleIcon className="h-5 w-5" />

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2 cursor-pointer">
          {icon}
          {triggerLabel ?? (type === "missing" ? "Report Missing" : "Report Incorrect")}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>{description}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="modelName">Model Name</Label>
              <Input
                id="modelName"
                name="modelName"
                placeholder={type === "missing" ? "Name of the missing model" : "Name of the model with issues"}
                value={formData.modelName}
                onChange={handleChange}
                required={type === "incorrect"}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="details">Details</Label>
              <Textarea
                id="details"
                name="details"
                placeholder={
                  type === "missing"
                    ? "Please provide details about the missing model or data"
                    : "Please describe what information is incorrect or outdated"
                }
                className="min-h-[100px]"
                value={formData.details}
                onChange={handleChange}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="contactEmail">Contact Email (Optional)</Label>
              <Input
                id="contactEmail"
                name="contactEmail"
                type="email"
                placeholder="your@email.com"
                value={formData.contactEmail}
                onChange={handleChange}
              />
              <p className="text-xs text-muted-foreground">
                We'll only use this to follow up on your report if needed.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Submitting..." : "Submit Report"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
