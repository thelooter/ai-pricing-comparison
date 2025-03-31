"use client"

import type React from "react"

import { useState } from "react"
import type { Capability } from "@/lib/supabase/database.types"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { PlusIcon, TrashIcon, HomeIcon, ArrowLeftIcon } from "lucide-react"
import Link from "next/link"
import { createCapability, deleteCapability } from "@/lib/actions"
import { useToast } from "@/components/ui/use-toast"

interface CapabilitiesManagerProps {
  capabilities: Capability[]
}

export default function CapabilitiesManager({ capabilities: initialCapabilities }: CapabilitiesManagerProps) {
  const [capabilities, setCapabilities] = useState<Capability[]>(initialCapabilities)
  const [newCapabilityName, setNewCapabilityName] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const formData = new FormData()
      formData.append("name", newCapabilityName)

      const result = await createCapability(formData)

      if (result.success) {
        // Optimistically update the UI
        setCapabilities([
          ...capabilities,
          {
            id: Math.max(...capabilities.map((c) => c.id), 0) + 1,
            name: newCapabilityName,
            created_at: new Date().toISOString(),
          },
        ])
        setNewCapabilityName("")
        toast({
          title: "Capability created",
          description: "The capability has been created successfully.",
        })
      } else {
        toast({
          title: "Error",
          description: result.error || "An error occurred while creating the capability.",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this capability?")) {
      return
    }

    try {
      const result = await deleteCapability(id)

      if (result.success) {
        // Optimistically update the UI
        setCapabilities(capabilities.filter((c) => c.id !== id))
        toast({
          title: "Capability deleted",
          description: "The capability has been deleted successfully.",
        })
      } else {
        toast({
          title: "Error",
          description: result.error || "An error occurred while deleting the capability.",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred.",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Manage Capabilities</h1>
        <div className="flex gap-2">
          <Link href="/admin">
            <Button variant="outline" size="sm" className="flex items-center gap-1">
              <ArrowLeftIcon className="h-4 w-4" />
              Back to Admin
            </Button>
          </Link>
          <Link href="/">
            <Button variant="outline" size="sm" className="flex items-center gap-1">
              <HomeIcon className="h-4 w-4" />
              Home
            </Button>
          </Link>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Add New Capability</CardTitle>
          <CardDescription>Add a new capability that can be assigned to AI models</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={async (formData: FormData) => {
            setIsSubmitting(true)
            try {
              const result = await createCapability(formData)
              if (result.success) {
                // Optimistically update the UI
                setCapabilities([
                  ...capabilities,
                  {
                    id: Math.max(...capabilities.map((c) => c.id), 0) + 1,
                    name: formData.get("name") as string,
                    created_at: new Date().toISOString(),
                  },
                ])
                setNewCapabilityName("")
                toast({
                  title: "Capability created",
                  description: "The capability has been created successfully.",
                })
              } else {
                toast({
                  title: "Error",
                  description: result.error || "An error occurred while creating the capability.",
                  variant: "destructive",
                })
              }
            } catch (error) {
              toast({
                title: "Error",
                description: "An unexpected error occurred.",
                variant: "destructive",
              })
            } finally {
              setIsSubmitting(false)
            }
          }} className="flex gap-2 items-end">
            <div className="space-y-2 flex-1">
              <Label htmlFor="name">Capability Name</Label>
              <Input
                id="name"
                name="name"
                value={newCapabilityName}
                onChange={(e) => setNewCapabilityName(e.target.value)}
                placeholder="e.g., Image Generation"
                required
              />
            </div>
            <Button type="submit" disabled={isSubmitting || !newCapabilityName.trim()}>
              <PlusIcon className="h-4 w-4 mr-1" />
              Add Capability
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Existing Capabilities</CardTitle>
          <CardDescription>View and manage existing capabilities</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Created At</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {capabilities.length > 0 ? (
                  capabilities.map((capability) => (
                    <TableRow key={capability.id}>
                      <TableCell>{capability.id}</TableCell>
                      <TableCell className="font-medium">{capability.name}</TableCell>
                      <TableCell>{new Date(capability.created_at).toLocaleString()}</TableCell>
                      <TableCell>
                        <form action={async () => {
                          if (!confirm("Are you sure you want to delete this capability?")) {
                            return
                          }
                          try {
                            const result = await deleteCapability(capability.id)
                            if (result.success) {
                              // Optimistically update the UI
                              setCapabilities(capabilities.filter((c) => c.id !== capability.id))
                              toast({
                                title: "Capability deleted",
                                description: "The capability has been deleted successfully.",
                              })
                            } else {
                              toast({
                                title: "Error",
                                description: result.error || "An error occurred while deleting the capability.",
                                variant: "destructive",
                              })
                            }
                          } catch (error) {
                            toast({
                              title: "Error",
                              description: "An unexpected error occurred.",
                              variant: "destructive",
                            })
                          }
                        }}>
                          <Button
                            type="submit"
                            variant="outline"
                            size="icon"
                            className="text-destructive hover:bg-destructive/10"
                          >
                            <TrashIcon className="h-4 w-4" />
                            <span className="sr-only">Delete</span>
                          </Button>
                        </form>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8">
                      No capabilities found. Add one using the form above.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

