"use client"

import { useState, useEffect } from "react"
import type { ModelWithDetails, Capability } from "@/lib/supabase/database.types"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { PlusIcon, PencilIcon, TrashIcon, LogOutIcon, HomeIcon, SettingsIcon, AlertTriangleIcon, DatabaseIcon } from "lucide-react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import ModelForm from "./model-form"
import { useToast } from "@/components/ui/use-toast"

interface AdminPanelProps {
  models: ModelWithDetails[]
  capabilities: Capability[]
}

export default function AdminPanel({ models: initialModels, capabilities: initialCapabilities }: AdminPanelProps) {
  const [models, setModels] = useState<ModelWithDetails[]>(initialModels)
  const [editingModel, setEditingModel] = useState<ModelWithDetails | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [capabilities] = useState<Capability[]>(initialCapabilities)
  const router = useRouter()
  const supabase = createClient()
  const { toast } = useToast()

  // Initialize storage bucket when admin panel loads
  useEffect(() => {
    const initStorage = async () => {
      try {
        const response = await fetch('/api/storage/init', {
          method: 'POST',
        })
        
        const data = await response.json()
        
        if (!data.success && data.warning) {
          toast({
            title: "Storage Setup Required",
            description: data.warning,
            variant: "destructive",
          })
        } else if (!data.bucketExists) {
          toast({
            title: "Storage Setup Required",
            description: "The 'model-logos' bucket needs to be created in Supabase. Image uploads won't work without this.",
            variant: "destructive",
          })
        }
      } catch (error) {
        console.error('Error initializing storage:', error)
        toast({
          title: "Storage Setup Error",
          description: "Unable to check storage bucket status. File uploads may not work correctly.",
          variant: "destructive",
        })
      }
    }

    initStorage()
  }, [])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push("/")
    router.refresh()
  }

  const handleEdit = (model: ModelWithDetails) => {
    setEditingModel(model)
    setIsCreating(false)
  }

  const handleCreate = () => {
    setEditingModel(null)
    setIsCreating(true)
  }

  const handleDelete = async (modelId: number) => {
    if (confirm("Are you sure you want to delete this model?")) {
      const formData = new FormData()
      formData.append('modelId', modelId.toString())
      
      const result = await fetch('/api/models/delete', {
        method: 'POST',
        body: formData,
      }).then(res => res.json())

      if (result.success) {
        setModels(models.filter((model) => model.id !== modelId))
      } else {
        alert(`Error deleting model: ${result.error}`)
      }
    }
  }

  const handleCancel = () => {
    setEditingModel(null)
    setIsCreating(false)
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Admin Panel</h1>
        <div className="flex gap-2">
          <Link href="/admin/reports">
            <Button variant="outline" size="sm" className="flex items-center gap-1">
              <AlertTriangleIcon className="h-4 w-4" />
              Manage Reports
            </Button>
          </Link>
          <Link href="/admin/capabilities">
            <Button variant="outline" size="sm" className="flex items-center gap-1">
              <SettingsIcon className="h-4 w-4" />
              Manage Capabilities
            </Button>
          </Link>
          <Link href="/admin/migrations">
            <Button variant="outline" size="sm" className="flex items-center gap-1">
              <DatabaseIcon className="h-4 w-4" />
              Migrations
            </Button>
          </Link>
          <Link href="/">
            <Button variant="outline" size="sm" className="flex items-center gap-1">
              <HomeIcon className="h-4 w-4" />
              Home
            </Button>
          </Link>
          <Button variant="outline" size="sm" className="flex items-center gap-1" onClick={handleSignOut}>
            <LogOutIcon className="h-4 w-4" />
            Sign Out
          </Button>
        </div>
      </div>

      {isCreating || editingModel ? (
        <Card>
          <CardHeader>
            <CardTitle>{isCreating ? "Create New Model" : "Edit Model"}</CardTitle>
            <CardDescription>
              {isCreating ? "Add a new AI model to the pricing comparison" : `Editing ${editingModel?.name}`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ModelForm
              model={editingModel}
              capabilities={capabilities}
              onCancel={handleCancel}
            />
          </CardContent>
        </Card>
      ) : (
        <>
          <Button onClick={handleCreate} className="flex items-center gap-1">
            <PlusIcon className="h-4 w-4" />
            Add New Model
          </Button>

          <Card>
            <CardHeader>
              <CardTitle>Manage AI Models</CardTitle>
              <CardDescription>View, edit, and delete AI models in the pricing comparison</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="table" className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-4">
                  <TabsTrigger value="table">Table View</TabsTrigger>
                  <TabsTrigger value="cards">Card View</TabsTrigger>
                </TabsList>

                <TabsContent value="table">
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Provider</TableHead>
                          <TableHead>Capabilities</TableHead>
                          <TableHead>Input Price</TableHead>
                          <TableHead>Output Price</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {models.length > 0 ? (
                          models.map((model) => (
                            <TableRow key={model.id}>
                              <TableCell className="font-medium">{model.name}</TableCell>
                              <TableCell>{model.provider}</TableCell>
                              <TableCell>
                                <div className="flex flex-wrap gap-1">
                                  {model.capabilities.map((cap) => (
                                    <Badge key={cap.id} variant="outline">
                                      {cap.name}
                                    </Badge>
                                  ))}
                                </div>
                              </TableCell>
                              <TableCell>{model.input_price}</TableCell>
                              <TableCell>{model.output_price}</TableCell>
                              <TableCell>
                                <div className="flex gap-2">
                                  <Button variant="outline" size="icon" onClick={() => handleEdit(model)}>
                                    <PencilIcon className="h-4 w-4" />
                                    <span className="sr-only">Edit</span>
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="icon"
                                    className="text-destructive hover:bg-destructive/10"
                                    onClick={() => handleDelete(model.id)}
                                  >
                                    <TrashIcon className="h-4 w-4" />
                                    <span className="sr-only">Delete</span>
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={6} className="text-center py-8">
                              No models found. Click "Add New Model" to create one.
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </TabsContent>

                <TabsContent value="cards">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {models.length > 0 ? (
                      models.map((model) => (
                        <Card key={model.id} className="overflow-hidden">
                          <CardHeader className="pb-2">
                            <div className="flex justify-between items-start">
                              <CardTitle className="text-lg">{model.name}</CardTitle>
                              <Badge>{model.provider}</Badge>
                            </div>
                          </CardHeader>
                          <CardContent className="pb-2">
                            <div className="flex flex-wrap gap-1 mb-2">
                              {model.capabilities.map((cap) => (
                                <Badge key={cap.id} variant="outline">
                                  {cap.name}
                                </Badge>
                              ))}
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-sm mb-2">
                              <div>
                                <span className="text-muted-foreground">Input:</span>{" "}
                                <span className="font-medium">{model.input_price}</span>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Output:</span>{" "}
                                <span className="font-medium">{model.output_price}</span>
                              </div>
                            </div>
                            {model.alternativeProviders.length > 0 && (
                              <div className="text-xs text-muted-foreground mt-2">
                                {model.alternativeProviders.length} alternative provider(s)
                              </div>
                            )}
                          </CardContent>
                          <div className="flex border-t p-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="flex-1 flex items-center justify-center gap-1"
                              onClick={() => handleEdit(model)}
                            >
                              <PencilIcon className="h-3 w-3" />
                              Edit
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="flex-1 flex items-center justify-center gap-1 text-destructive hover:bg-destructive/10"
                              onClick={() => handleDelete(model.id)}
                            >
                              <TrashIcon className="h-3 w-3" />
                              Delete
                            </Button>
                          </div>
                        </Card>
                      ))
                    ) : (
                      <div className="col-span-full text-center py-8">
                        No models found. Click "Add New Model" to create one.
                      </div>
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}

