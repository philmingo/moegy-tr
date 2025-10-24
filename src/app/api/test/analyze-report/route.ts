import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

export async function POST(request: NextRequest) {
  try {
    const { reportId } = await request.json()

    if (!reportId) {
      return NextResponse.json(
        { error: 'Report ID is required' },
        { status: 400 }
      )
    }

    // Trigger analysis
    const analysisResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/reports/analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ reportId }),
    })

    if (!analysisResponse.ok) {
      throw new Error(`Analysis failed with status ${analysisResponse.status}`)
    }

    const result = await analysisResponse.json()

    return NextResponse.json({
      success: true,
      result
    })

  } catch (error) {
    console.error('Manual trigger error:', error)
    return NextResponse.json(
      { error: 'Failed to trigger analysis' },
      { status: 500 }
    )
  }
}