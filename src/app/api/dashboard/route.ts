import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import jwt from 'jsonwebtoken'
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

async function getAuthenticatedUser() {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('auth-token')

    if (!token) {
      return null
    }

    const decoded = jwt.verify(token.value, process.env.JWT_SECRET || 'your-secret-key') as any
    return decoded
  } catch (error) {
    return null
  }
}

export async function GET() {
  try {
    const user = await getAuthenticatedUser()
    
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Get statistics from the reports table
    const { data: stats, error: statsError } = await supabase
      .rpc('get_dashboard_stats')

    let dashboardStats
    if (statsError || !stats) {
      // Fallback: manually count if RPC function doesn't exist
      const { data: allReports, error: reportsError } = await supabase
        .from('sms1_reports')
        .select('status')

      if (reportsError) {
        console.error('Error fetching reports for stats:', reportsError)
        return NextResponse.json(
          { error: 'Failed to fetch dashboard statistics' },
          { status: 500 }
        )
      }

      const totalReports = allReports.length
      const openReports = allReports.filter(r => r.status === 'open').length
      const inProgressReports = allReports.filter(r => r.status === 'in_progress').length
      const closedReports = allReports.filter(r => r.status === 'closed').length

      dashboardStats = {
        totalReports,
        openReports,
        inProgressReports,
        closedReports
      }
    } else {
      dashboardStats = stats
    }

    // Get recent reports (last 5)
    const { data: recentReports, error: recentError } = await supabase
      .from('sms1_reports')
      .select(`
        id,
        reference_number,
        status,
        description,
        created_at,
        sms_schools (
          name
        )
      `)
      .order('created_at', { ascending: false })
      .limit(5)

    if (recentError) {
      console.error('Error fetching recent reports:', recentError)
      return NextResponse.json(
        { error: 'Failed to fetch recent reports' },
        { status: 500 }
      )
    }

    // Transform recent reports to match expected format
    const transformedReports = (recentReports || []).map(report => {
      const timeAgo = getTimeAgo(new Date(report.created_at))
      
      return {
        id: report.id,
        ref: report.reference_number,
        status: formatStatus(report.status),
        description: report.description?.substring(0, 100) + (report.description?.length > 100 ? '...' : ''),
        school: (report.sms_schools as any)?.name || 'Unknown School',
        time: timeAgo
      }
    })

    return NextResponse.json({
      stats: dashboardStats,
      recentReports: transformedReports
    })

  } catch (error) {
    console.error('Error in dashboard API:', error)
    return NextResponse.json(
      { error: 'Failed to fetch dashboard data' },
      { status: 500 }
    )
  }
}

function formatStatus(status: string): string {
  switch (status) {
    case 'open':
      return 'Open'
    case 'in_progress':
      return 'In Progress'
    case 'closed':
      return 'Closed'
    default:
      return status
  }
}

function getTimeAgo(date: Date): string {
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / (1000 * 60))
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffMins < 60) {
    return diffMins <= 1 ? 'Just now' : `${diffMins} minutes ago`
  } else if (diffHours < 24) {
    return diffHours === 1 ? '1 hour ago' : `${diffHours} hours ago`
  } else {
    return diffDays === 1 ? '1 day ago' : `${diffDays} days ago`
  }
}