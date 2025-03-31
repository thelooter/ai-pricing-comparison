"use server"

import {createClient} from "@/lib/supabase/server"
import {revalidatePath} from "next/cache"
import {redirect} from "next/navigation"
import type {Capability, ModelWithDetails} from "@/lib/supabase/database.types"
import {createServerClient} from '@supabase/ssr'
import {cookies} from 'next/headers'

// Update the getModels function to handle the new RLS policies
export async function getModels(): Promise<ModelWithDetails[]> {
  const supabase = await createClient()

  try {
    // Fetch models
    const { data: models, error: modelsError } = await supabase.from("models").select("*").order("name")

    if (modelsError) {
      console.error("Error fetching models:", modelsError)
      return []
    }

    if (!models || models.length === 0) {
      return []
    }

    // Fetch capabilities
    const { data: capabilities, error: capabilitiesError } = await supabase.from("capabilities").select("*")

    if (capabilitiesError) {
      console.error("Error fetching capabilities:", capabilitiesError)
      return models.map((model) => ({
        ...model,
        capabilities: [],
        alternativeProviders: [],
      }))
    }

    // Fetch model_capabilities
    const { data: modelCapabilities, error: modelCapabilitiesError } = await supabase
      .from("model_capabilities")
      .select("*")

    if (modelCapabilitiesError) {
      console.error("Error fetching model capabilities:", modelCapabilitiesError)
      return models.map((model) => ({
        ...model,
        capabilities: [],
        alternativeProviders: [],
      }))
    }

    // Fetch alternative providers
    const { data: alternativeProviders, error: alternativeProvidersError } = await supabase
      .from("alternative_providers")
      .select("*")

    if (alternativeProvidersError) {
      console.error("Error fetching alternative providers:", alternativeProvidersError)
      return models.map((model) => ({
        ...model,
        capabilities: capabilities || [],
        alternativeProviders: [],
      }))
    }

    // Combine data
    return models.map((model) => {
      // Get capabilities for this model
      const modelCapabilityIds = (modelCapabilities || [])
          .filter((mc) => mc.model_id === model.id)
          .map((mc) => mc.capability_id)

      const modelCapabilitiesData = (capabilities || []).filter((cap) => modelCapabilityIds.includes(cap.id))

      // Get alternative providers for this model
      const modelAlternativeProviders = (alternativeProviders || []).filter((ap) => ap.model_id === model.id)

      return {
        ...model,
        capabilities: modelCapabilitiesData,
        alternativeProviders: modelAlternativeProviders,
      }
    })
  } catch (error) {
    console.error("Unexpected error in getModels:", error)
    return []
  }
}

// Fetch all capabilities
export async function getCapabilities(): Promise<Capability[]> {
  const supabase = await createClient()

  const { data, error } = await supabase.from("capabilities").select("*").order("name")

  if (error) {
    console.error("Error fetching capabilities:", error)
    return []
  }

  return data
}

// Create a new capability
export async function createCapability(formData: FormData) {
  const supabase = await createClient()

  try {
    const name = formData.get("name") as string

    if (!name) {
      return { success: false, error: "Capability name is required" }
    }

    const { error } = await supabase.from("capabilities").insert({ name })

    if (error) {
      return { success: false, error: error.message }
    }

    revalidatePath("/admin/capabilities")
    return { success: true }
  } catch (error) {
    console.error("Error creating capability:", error)
    return { success: false, error: "An unexpected error occurred" }
  }
}

// Delete a capability
export async function deleteCapability(id: number) {
  const supabase = await createClient()

  try {
    // Check if capability is in use
    const { count, error: checkError } = await supabase
      .from("model_capabilities")
      .select("*", { count: "exact", head: true })
      .eq("capability_id", id)

    if (checkError) {
      return { success: false, error: checkError.message }
    }

    if (count && count > 0) {
      return {
        success: false,
        error: "This capability is in use by one or more models and cannot be deleted",
      }
    }

    const { error } = await supabase.from("capabilities").delete().eq("id", id)

    if (error) {
      return { success: false, error: error.message }
    }

    revalidatePath("/admin/capabilities")
    return { success: true }
  } catch (error) {
    console.error("Error deleting capability:", error)
    return { success: false, error: "An unexpected error occurred" }
  }
}

// Create a new model
export async function createModel(formData: FormData) {
  const supabase = await createClient()

  // Extract model data
  const name = formData.get("name") as string
  const provider = formData.get("provider") as string
  const logoFile = formData.get("logo") as File
  const inputPrice = formData.get("inputPrice") as string
  const outputPrice = formData.get("outputPrice") as string
  const popular = formData.get("popular") !== null
  const legacy = formData.get("legacy") !== null
  const capabilityIds = formData.getAll("capabilities") as string[]

  // Alternative providers data
  const altProviderNames = formData.getAll("altProviderName") as string[]
  const altInputPrices = formData.getAll("altInputPrice") as string[]
  const altOutputPrices = formData.getAll("altOutputPrice") as string[]

  // Handle logo upload if a file was provided
  let logoUrl = null
  if (logoFile && logoFile.size > 0) {
    try {
      // Make sure logo filename is unique
      const fileExt = logoFile.name.split('.').pop()
      const fileName = `${name.replace(/\s+/g, '-').toLowerCase()}-${Date.now()}.${fileExt}`

      // Upload file to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase
        .storage
        .from('model-logos')
        .upload(fileName, logoFile, {
          cacheControl: '3600',
          upsert: true
        })

      if (uploadError) {
        console.error("Error uploading logo:", uploadError)
      } else if (uploadData) {
        // Get public URL for the uploaded file
        const { data: urlData } = supabase
          .storage
          .from('model-logos')
          .getPublicUrl(fileName)

        logoUrl = urlData.publicUrl
      }
    } catch (error) {
      console.error("Error processing logo upload:", error)
    }
  }

  // Insert model
  const { data: modelData, error: modelError } = await supabase
    .from("models")
    .insert({
      name,
      provider,
      logo_url: logoUrl,
      input_price: inputPrice,
      output_price: outputPrice,
      popular,
      legacy,
    })
    .select()

  if (modelError) {
    console.error("Error creating model:", modelError)
    return { success: false, error: modelError.message }
  }

  const modelId = modelData[0].id

  // Insert model capabilities
  if (capabilityIds.length > 0) {
    const modelCapabilitiesData = capabilityIds.map((capId) => ({
      model_id: modelId,
      capability_id: Number.parseInt(capId),
    }))

    const { error: mcError } = await supabase.from("model_capabilities").insert(modelCapabilitiesData)

    if (mcError) {
      console.error("Error adding model capabilities:", mcError)
      return { success: false, error: mcError.message }
    }
  }

  // Insert alternative providers
  if (altProviderNames.length > 0) {
    const alternativeProvidersData = altProviderNames
      .map((name, index) => {
        if (!name) return null

        return {
          model_id: modelId,
          provider_name: name,
          input_price: altInputPrices[index] || "",
          output_price: altOutputPrices[index] || "",
        }
      })
      .filter(Boolean)

    if (alternativeProvidersData.length > 0) {
      const { error: apError } = await supabase.from("alternative_providers").insert(alternativeProvidersData)

      if (apError) {
        console.error("Error adding alternative providers:", apError)
        return { success: false, error: apError.message }
      }
    }
  }

  revalidatePath("/admin")
  revalidatePath("/")

  // Return success instead of redirecting directly
  return { success: true, redirectTo: "/admin" }
}

// Update an existing model
export async function updateModel(modelId: number, formData: FormData) {
  const supabase = await createClient()

  // Extract model data
  const name = formData.get("name") as string
  const provider = formData.get("provider") as string
  const logoFile = formData.get("logo") as File
  const keepExistingLogo = formData.get("keepExistingLogo") === "true"
  const inputPrice = formData.get("inputPrice") as string
  const outputPrice = formData.get("outputPrice") as string
  const popular = formData.get("popular") !== null
  const legacy = formData.get("legacy") !== null
  const capabilityIds = formData.getAll("capabilities") as string[]

  // Alternative providers data
  const altProviderIds = formData.getAll("altProviderId") as string[]
  const altProviderNames = formData.getAll("altProviderName") as string[]
  const altInputPrices = formData.getAll("altInputPrice") as string[]
  const altOutputPrices = formData.getAll("altOutputPrice") as string[]

  // Get current model to check existing logo
  const { data: existingModel } = await supabase
    .from("models")
    .select("logo_url")
    .eq("id", modelId)
    .single()

  // Handle logo upload if a file was provided
  let logoUrl = null

  if (logoFile && logoFile.size > 0) {
    try {
      // Make sure logo filename is unique
      const fileExt = logoFile.name.split('.').pop()
      const fileName = `${name.replace(/\s+/g, '-').toLowerCase()}-${Date.now()}.${fileExt}`

      // Upload file to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase
        .storage
        .from('model-logos')
        .upload(fileName, logoFile, {
          cacheControl: '3600',
          upsert: true
        })

      if (uploadError) {
        console.error("Error uploading logo:", uploadError)
      } else if (uploadData) {
        // Get public URL for the uploaded file
        const { data: urlData } = supabase
          .storage
          .from('model-logos')
          .getPublicUrl(fileName)

        logoUrl = urlData.publicUrl

        // Delete old logo file if it exists and was uploaded to our storage
        if (existingModel?.logo_url && existingModel.logo_url.includes('model-logos')) {
          try {
            // Extract the file path from the URL
            const oldPath = existingModel.logo_url.split('model-logos/')[1]
            if (oldPath) {
              await supabase.storage.from('model-logos').remove([oldPath])
            }
          } catch (err) {
            console.error("Error removing old logo:", err)
          }
        }
      }
    } catch (error) {
      console.error("Error processing logo upload:", error)
    }
  } else if (keepExistingLogo && existingModel?.logo_url) {
    // Keep the existing logo
    logoUrl = existingModel.logo_url
  }

  // Update model
  const { error: modelError } = await supabase
    .from("models")
    .update({
      name,
      provider,
      logo_url: logoUrl,
      input_price: inputPrice,
      output_price: outputPrice,
      popular,
      legacy,
    })
    .eq("id", modelId)

  if (modelError) {
    console.error("Error updating model:", modelError)
    return { success: false, error: modelError.message }
  }

  // Delete existing model capabilities and then insert new ones
  try {
    // First delete all existing capabilities in a transaction
    const { error: deleteCapError } = await supabase
      .from("model_capabilities")
      .delete()
      .eq("model_id", modelId)

    if (deleteCapError) throw deleteCapError;

    // Wait a brief moment to ensure delete has completed
    await new Promise(resolve => setTimeout(resolve, 100));

    // Then insert new capabilities if any are selected
    if (capabilityIds.length > 0) {
      const modelCapabilitiesData = capabilityIds.map((capId) => ({
        model_id: modelId,
        capability_id: Number.parseInt(capId),
      }))

      const { error: mcError } = await supabase
        .from("model_capabilities")
        .insert(modelCapabilitiesData)

      if (mcError) throw mcError;
    }
  } catch (capError) {
    console.error("Error managing model capabilities:", capError)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return { success: false, error: `Failed to update model capabilities: ${(capError as any).message || capError}` }
  }

  // Handle alternative providers
  // First, get existing providers to determine which to update/delete
  const { data: existingProviders, error: existingProvidersError } = await supabase
    .from("alternative_providers")
    .select("*")
    .eq("model_id", modelId)

  if (existingProvidersError) {
    console.error("Error fetching existing providers:", existingProvidersError)
    return { success: false, error: existingProvidersError.message }
  }

  // Process alternative providers
  const providersToUpdate = []
  const providersToCreate = []
  const existingProviderIds = existingProviders.map((p) => p.id.toString())

  for (let i = 0; i < altProviderNames.length; i++) {
    const name = altProviderNames[i]
    if (!name) continue

    const id = altProviderIds[i]
    const inputPrice = altInputPrices[i] || ""
    const outputPrice = altOutputPrices[i] || ""

    if (id && existingProviderIds.includes(id)) {
      // Update existing provider
      providersToUpdate.push({
        id: Number.parseInt(id),
        provider_name: name,
        input_price: inputPrice,
        output_price: outputPrice,
      })
    } else {
      // Create new provider
      providersToCreate.push({
        model_id: modelId,
        provider_name: name,
        input_price: inputPrice,
        output_price: outputPrice,
      })
    }
  }

  // Delete providers that are no longer in the form
  const providersToKeep = altProviderIds.filter((id) => id).map((id) => Number.parseInt(id))
  const providersToDelete = existingProviders.filter((p) => !providersToKeep.includes(p.id)).map((p) => p.id)

  if (providersToDelete.length > 0) {
    const { error: deleteProvError } = await supabase.from("alternative_providers").delete().in("id", providersToDelete)

    if (deleteProvError) {
      console.error("Error deleting providers:", deleteProvError)
      return { success: false, error: deleteProvError.message }
    }
  }

  // Update existing providers
  for (const provider of providersToUpdate) {
    const { error: updateProvError } = await supabase
      .from("alternative_providers")
      .update({
        provider_name: provider.provider_name,
        input_price: provider.input_price,
        output_price: provider.output_price,
      })
      .eq("id", provider.id)

    if (updateProvError) {
      console.error("Error updating provider:", updateProvError)
      return { success: false, error: updateProvError.message }
    }
  }

  // Create new providers
  if (providersToCreate.length > 0) {
    const { error: createProvError } = await supabase.from("alternative_providers").insert(providersToCreate)

    if (createProvError) {
      console.error("Error creating providers:", createProvError)
      return { success: false, error: createProvError.message }
    }
  }

  revalidatePath("/admin")
  revalidatePath("/")
  return { success: true, redirectTo: "/admin" }
}

// Delete a model
export async function deleteModel(modelId: number) {
  const supabase = await createClient()

  // Get the model's logo URL before deleting
  const { data: model } = await supabase
    .from("models")
    .select("logo_url")
    .eq("id", modelId)
    .single()

  // Delete the model (cascade will handle related records)
  const { error } = await supabase.from("models").delete().eq("id", modelId)

  if (error) {
    console.error("Error deleting model:", error)
    return { success: false, error: error.message }
  }

  // If the model had a logo stored in our bucket, delete it
  if (model?.logo_url && model.logo_url.includes('model-logos')) {
    try {
      // Extract the file path from the URL
      const logoPath = model.logo_url.split('model-logos/')[1]
      if (logoPath) {
        await supabase.storage.from('model-logos').remove([logoPath])
      }
    } catch (err) {
      console.error("Error removing logo file:", err)
      // Continue with the function, as the model itself has been deleted successfully
    }
  }

  revalidatePath("/admin")
  revalidatePath("/")
  return { success: true }
}

// Check if user is an admin
export async function checkIsAdmin() {
  const supabase = await createClient()

  try {
    // Get the current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return false
    }

    // Check if user is in admin_users table
    const { data, error } = await supabase.from("admin_users").select("is_admin").eq("user_id", user.id).single()

    if (error) {
      console.error("Error checking admin status:", error)
      return false
    }

    return data?.is_admin || false
  } catch (error) {
    console.error("Unexpected error in checkIsAdmin:", error)
    return false
  }
}

// Seed the database with initial data
export async function seedDatabase() {
  const supabase = await createClient()

  // Check if we already have models
  const { data: existingModels, error: checkError } = await supabase.from("models").select("id").limit(1)

  if (checkError) {
    return { success: false, error: checkError.message }
  }

  // If we already have models, don't seed
  if (existingModels.length > 0) {
    return { success: false, error: "Database already has data" }
  }

  // Get capabilities
  const { data: capabilities, error: capError } = await supabase.from("capabilities").select("id, name")

  if (capError) {
    return { success: false, error: capError.message }
  }

  // Create a map of capability names to IDs
  const capabilityMap = capabilities.reduce(
    (map, cap) => {
      map[cap.name] = cap.id
      return map
    },
    {} as Record<string, number>,
  )

  // Seed models
  const models = [
    {
      name: "GPT-4o",
      provider: "OpenAI",
      input_price: 10.00,
      output_price: 30.00,
      capabilities: ["Text", "Image Input", "Object Generation", "Tool Usage"],
      alternativeProviders: [
        { provider_name: "Azure", input_price: 10.00, output_price: 30.00 },
      ],
    },
    {
      name: "GPT-4o-mini",
      provider: "OpenAI",
      input_price: 2.00,
      output_price: 6.00,
      capabilities: ["Text", "Image Input", "Object Generation", "Tool Usage"],
      alternativeProviders: [
        { provider_name: "Azure", input_price: 2.00, output_price: 6.00 },
      ],
    },
    {
      name: "Claude 3.5 Sonnet",
      provider: "Anthropic",
      input_price: 3.00,
      output_price: 15.00,
      capabilities: ["Text", "Image Input", "Object Generation", "Tool Usage"],
      alternativeProviders: [
        { provider_name: "Amazon Bedrock", input_price: 3.50, output_price: 15.50 },
        { provider_name: "OpenRouter", input_price: 3.20, output_price: 15.20 },
      ],
    },
    {
      name: "Llama 3.1 70B",
      provider: "Meta",
      input_price: 1.00,
      output_price: 2.00,
      capabilities: ["Text", "Object Generation", "Tool Usage"],
      alternativeProviders: [
        { provider_name: "Groq", input_price: 0.70, output_price: 1.70 },
        { provider_name: "DeepInfra", input_price: 0.90, output_price: 1.80 },
        { provider_name: "OpenRouter", input_price: 0.80, output_price: 1.90 },
      ],
    },
    {
      name: "Gemini 1.5 Pro",
      provider: "Google",
      input_price: 7.00,
      output_price: 21.00,
      capabilities: ["Text", "Image Input", "Object Generation", "Tool Usage"],
      alternativeProviders: [
        { provider_name: "Google Vertex AI", input_price: 7.00, output_price: 21.00 },
      ],
    },
    {
      name: "DeepSeek R1",
      provider: "DeepSeek",
      input_price: 2.50,
      output_price: 7.50,
      capabilities: ["Text", "Object Generation", "Tool Usage"],
      alternativeProviders: [
        { provider_name: "Fireworks", input_price: 2.70, output_price: 7.70 },
        { provider_name: "Groq", input_price: 2.20, output_price: 7.20 },
      ],
    },
    {
      name: "Mistral Large",
      provider: "Mistral",
      input_price: 2.00,
      output_price: 6.00,
      capabilities: ["Text", "Object Generation", "Tool Usage"],
      alternativeProviders: [
        { provider_name: "OpenRouter", input_price: 2.10, output_price: 6.10 },
        { provider_name: "Amazon Bedrock", input_price: 2.20, output_price: 6.20 },
      ],
    },
  ]

  // Insert models one by one
  for (const model of models) {
    // Insert model
    const { data: modelData, error: modelError } = await supabase
      .from("models")
      .insert({
        name: model.name,
        provider: model.provider,
        input_price: model.input_price,
        output_price: model.output_price,
      })
      .select()

    if (modelError) {
      console.error("Error seeding model:", modelError)
      continue
    }

    const modelId = modelData[0].id

    // Insert model capabilities
    const modelCapabilities = model.capabilities.map((cap) => ({
      model_id: modelId,
      capability_id: capabilityMap[cap],
    }))

    const { error: mcError } = await supabase.from("model_capabilities").insert(modelCapabilities)

    if (mcError) {
      console.error("Error seeding model capabilities:", mcError)
    }

    // Insert alternative providers
    const alternativeProviders = model.alternativeProviders.map((ap) => ({
      model_id: modelId,
      provider_name: ap.provider_name,
      input_price: ap.input_price,
      output_price: ap.output_price,
    }))

    const { error: apError } = await supabase.from("alternative_providers").insert(alternativeProviders)

    if (apError) {
      console.error("Error seeding alternative providers:", apError)
    }
  }

  revalidatePath("/admin")
  revalidatePath("/")
  return { success: true }
}

export async function signInWithPassword(formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        },
      },
    }
  )

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    redirect('/admin/login?error=' + encodeURIComponent(error.message))
  }

  redirect('/admin')
}

export async function signInWithGitHub() {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        },
      },
    }
  )

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'github',
    options: {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
    },
  })

  if (error) {
    redirect('/admin/login?error=' + encodeURIComponent(error.message))
  }

  redirect(data.url)
}

