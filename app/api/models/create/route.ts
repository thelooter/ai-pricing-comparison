import { NextResponse } from 'next/server'
import { createModel } from '@/lib/actions'
import { validateAdminRequest } from '@/lib/admin'

export async function POST(request: Request) {
  try {
    // Check admin authorization
    const authError = await validateAdminRequest()
    if (authError) return authError

    const formData = await request.formData()
    const result = await createModel(formData)
    
    if (result.success && result.redirectTo) {
      // Return a JSON response with the redirect URL
      return NextResponse.json({ success: true, redirectTo: result.redirectTo })
    }
    
    return NextResponse.json(result)
  } catch (error) {
    console.error('Error creating model:', error)
    return NextResponse.json(
      { success: false, error: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
} 