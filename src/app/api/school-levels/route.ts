import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'

export async function GET() {
  try {
    const supabase = createAdminClient()
    
    // Get school levels from the database
    const { data: schoolLevels, error } = await supabase
      .from('sms_school_levels')
      .select('id, name')
      .is('deleted_at', null)
      .order('name')

    if (error) {
      console.error('Database error fetching school levels:', error)
      return NextResponse.json(
        { error: 'Failed to fetch school levels from database' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      schoolLevels: schoolLevels || []
    })

  } catch (error) {
    console.error('School levels API error:', error)
    return NextResponse.json(
      { error: 'An error occurred while fetching school levels' },
      { status: 500 }
    )
  }
}