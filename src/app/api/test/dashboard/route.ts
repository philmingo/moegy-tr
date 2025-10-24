import { NextResponse } from 'next/server'
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

function calculateReportsOverTime(reports: any[]): any[] {
  const last14Days = []
  const now = new Date()
  
  // Generate the last 14 days
  for (let i = 13; i >= 0; i--) {
    const date = new Date(now)
    date.setDate(date.getDate() - i)
    const dateStr = date.toISOString().split('T')[0]
    
    // Count reports for this date
    const reportsForDate = reports.filter(report => {
      const reportDate = new Date(report.created_at).toISOString().split('T')[0]
      return reportDate === dateStr
    }).length
    
    last14Days.push({
      date: dateStr,
      count: reportsForDate,
      label: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    })
  }
  
  return last14Days
}

export async function GET() {
  try {
    // Get all reports for testing (no auth required)
    const { data: allReports, error } = await supabase
      .from('sms1_reports')
      .select(`
        id,
        reference_number,
        status,
        description,
        created_at,
        sms_schools (
          name,
          region_id,
          school_level_id
        )
      `)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching reports:', error)
      return NextResponse.json({ error: 'Failed to fetch reports' }, { status: 500 })
    }

    const reportsOverTime = calculateReportsOverTime(allReports || [])
    
    return NextResponse.json({
      totalReports: allReports?.length || 0,
      reportsOverTime,
      sampleReports: (allReports || []).slice(0, 5).map(r => ({
        id: r.id,
        ref: r.reference_number,
        created: r.created_at,
        status: r.status
      }))
    })

  } catch (error) {
    console.error('Test dashboard error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}