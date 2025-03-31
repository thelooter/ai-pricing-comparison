import { NextResponse } from 'next/server'
import { deleteModel } from '@/lib/actions'

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const modelId = parseInt(formData.get('modelId') as string)

    if (!modelId) {
      return NextResponse.json({ success: false, error: 'Model ID is required' }, { status: 400 })
    }

    const result = await deleteModel(modelId)
    return NextResponse.json(result)
  } catch (error) {
    console.error('Error deleting model:', error)
    return NextResponse.json(
      { success: false, error: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
} 