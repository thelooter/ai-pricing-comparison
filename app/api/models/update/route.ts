import { NextResponse } from 'next/server'
import { updateModel } from '@/lib/actions'

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const modelId = parseInt(formData.get('modelId') as string)

    if (!modelId) {
      return NextResponse.json({ success: false, error: 'Model ID is required' }, { status: 400 })
    }

    const result = await updateModel(modelId, formData)
    
    if (result.success && result.redirectTo) {
      // Return a JSON response with the redirect URL
      return NextResponse.json({ success: true, redirectTo: result.redirectTo })
    }
    
    return NextResponse.json(result)
  } catch (error) {
    console.error('Error updating model:', error)
    return NextResponse.json(
      { success: false, error: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
} 