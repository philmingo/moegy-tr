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

export async function GET() {
  try {
    // Test database connectivity
    const { data: regions, error: regionsError } = await supabase
      .from('sms_regions')
      .select('id, name')
      .limit(5)

    const { data: schoolLevels, error: schoolLevelsError } = await supabase
      .from('sms_school_levels')
      .select('id, name')
      .limit(5)

    const { data: subscriptions, error: subscriptionsError } = await supabase
      .from('sms1_officer_subscriptions')
      .select('*')
      .limit(5)

    return NextResponse.json({
      regions: {
        data: regions,
        error: regionsError
      },
      schoolLevels: {
        data: schoolLevels,
        error: schoolLevelsError
      },
      subscriptions: {
        data: subscriptions,
        error: subscriptionsError
      }
    })
  } catch (error) {
    console.error('Test error:', error)
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 })
  }
}