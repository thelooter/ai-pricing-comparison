"use client"

import { useState } from "react"
import type { ModelWithDetails, Capability } from "@/lib/supabase/database.types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Switch } from "@/components/ui/switch"
import { PlusIcon, XIcon, UploadIcon } from "lucide-react"
import Image from "next/image"

interface ModelFormProps {
  model: ModelWithDetails | null
  capabilities: Capability[]
  onCancel: () => void
}

export default function ModelForm({ model, capabilities, onCancel }: ModelFormProps) {
  const [alternativeProviders, setAlternativeProviders] = useState(model?.alternativeProviders || [])
  const [logoPreview, setLogoPreview] = useState<string | null>(model?.logo_url || null)
  const [hasNewLogo, setHasNewLogo] = useState(false)

  const handleAddProvider = () => {
    setAlternativeProviders([
      ...alternativeProviders,
      {
        id: Date.now(),
        model_id: model?.id || 0,
        provider_name: "",
        input_price: 0,
        output_price: 0,
        created_at: new Date().toISOString(),
      },
    ])
  }

  const handleRemoveProvider = (index: number) => {
    setAlternativeProviders(alternativeProviders.filter((_, i) => i !== index))
  }

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setHasNewLogo(true)
      const url = URL.createObjectURL(file)
      setLogoPreview(url)
    }
  }

  const handleRemoveLogo = () => {
    setLogoPreview(null)
    setHasNewLogo(true)
    // Reset the file input
    const fileInput = document.getElementById('logo') as HTMLInputElement
    if (fileInput) fileInput.value = ''
  }

  return (
    <form action={async (formData) => {
      if (model) {
        formData.append('modelId', model.id.toString())
        // Track if we should keep the existing logo
        if (model.logo_url && logoPreview === model.logo_url) {
          formData.append('keepExistingLogo', 'true')
        } else {
          formData.append('keepExistingLogo', 'false')
        }
        const response = await fetch('/api/models/update', {
          method: 'POST',
          body: formData,
        })
        const result = await response.json()
        if (!result.success) {
          alert(`Error updating model: ${result.error}`)
        } else if (result.redirectTo) {
          // Handle redirect from API response
          window.location.href = result.redirectTo
        }
      } else {
        const response = await fetch('/api/models/create', {
          method: 'POST',
          body: formData,
        })
        const result = await response.json()
        if (!result.success) {
          alert(`Error creating model: ${result.error}`)
        } else if (result.redirectTo) {
          // Handle redirect from API response
          window.location.href = result.redirectTo
        }
      }
    }}>
      {model && <input type="hidden" name="modelId" value={model.id} />}
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="name">Model Name</Label>
            <Input id="name" name="name" defaultValue={model?.name || ""} required />
          </div>

          <div className="space-y-2">
            <Label htmlFor="provider">Primary Provider</Label>
            <Input id="provider" name="provider" defaultValue={model?.provider || ""} required />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2 flex flex-col">
            <Label htmlFor="popular" className="mb-2">Popular Model</Label>
            <Switch
              id="popular"
              name="popular"
              value="true"
              defaultChecked={model?.popular || false}
            />
          </div>

          <div className="space-y-2 flex flex-col">
            <Label htmlFor="legacy" className="mb-2">Legacy Model</Label>
            <Switch
              id="legacy"
              name="legacy"
              value="true"
              defaultChecked={model?.legacy || false}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="logo">Logo</Label>
          <div className="flex items-start gap-4">
            <div className="w-24 h-24 border border-input rounded-md flex items-center justify-center overflow-hidden bg-muted relative">
              {logoPreview ? (
                <>
                  <Image 
                    src={logoPreview} 
                    alt="Model logo preview" 
                    className="object-contain"
                    fill
                  />
                  <button 
                    type="button" 
                    onClick={handleRemoveLogo}
                    className="absolute top-1 right-1 bg-background rounded-full p-1 shadow-sm hover:bg-destructive hover:text-destructive-foreground"
                  >
                    <XIcon className="h-3 w-3" />
                  </button>
                </>
              ) : (
                <div className="text-muted-foreground text-xs text-center">
                  No logo
                </div>
              )}
            </div>
            <div className="flex-1 space-y-2">
              <div className="relative">
                <Input 
                  id="logo" 
                  name="logo" 
                  type="file" 
                  accept=".png,.jpg,.jpeg,.svg"
                  onChange={handleLogoChange}
                  className="cursor-pointer"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Upload a PNG, JPG, or SVG file (max 2MB). Recommended size: 100x100px.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="inputPrice">Input Price</Label>
            <Input
              id="inputPrice"
              name="inputPrice"
              defaultValue={model?.input_price || ""}
              placeholder="$X.XX / 1M tokens"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="outputPrice">Output Price</Label>
            <Input
              id="outputPrice"
              name="outputPrice"
              defaultValue={model?.output_price || ""}
              placeholder="$X.XX / 1M tokens"
              required
            />
          </div>
        </div>

        <div className="space-y-3">
          <Label>Capabilities</Label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {capabilities.map((capability) => {
              const isSelected = model?.capabilities.some((c) => c.id === capability.id) || false

              return (
                <div key={capability.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`capability-${capability.id}`}
                    name="capabilities"
                    value={capability.id}
                    defaultChecked={isSelected}
                  />
                  <Label htmlFor={`capability-${capability.id}`} className="text-sm font-normal">
                    {capability.name}
                  </Label>
                </div>
              )
            })}
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <Label>Alternative Providers</Label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddProvider}
              className="flex items-center gap-1"
            >
              <PlusIcon className="h-3 w-3" />
              Add Provider
            </Button>
          </div>

          {alternativeProviders.length === 0 ? (
            <div className="text-sm text-muted-foreground italic">No alternative providers added yet</div>
          ) : (
            <div className="space-y-4">
              {alternativeProviders.map((provider, index) => (
                <div key={provider.id} className="border rounded-md p-3 relative">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute top-2 right-2 h-6 w-6"
                    onClick={() => handleRemoveProvider(index)}
                  >
                    <XIcon className="h-4 w-4" />
                  </Button>

                  <input type="hidden" name="altProviderId" value={provider.id} />

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor={`altProviderName-${index}`}>Provider Name</Label>
                      <Input
                        id={`altProviderName-${index}`}
                        name="altProviderName"
                        defaultValue={provider.provider_name}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={`altInputPrice-${index}`}>Input Price</Label>
                      <Input
                        id={`altInputPrice-${index}`}
                        name="altInputPrice"
                        defaultValue={provider.input_price}
                        placeholder="$X.XX / 1M tokens"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={`altOutputPrice-${index}`}>Output Price</Label>
                      <Input
                        id={`altOutputPrice-${index}`}
                        name="altOutputPrice"
                        defaultValue={provider.output_price}
                        placeholder="$X.XX / 1M tokens"
                        required
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit">{model ? "Update Model" : "Create Model"}</Button>
        </div>
      </div>
    </form>
  )
}

