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

interface OfficerSubscription {
  region_id: string
  school_level_id: string
}

interface ReportAssignment {
  report_id: string
}

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

async function getAccessibleReportIds(userId: string, role: string) {
  if (role !== 'officer') {
    return null // No filtering needed
  }

  const accessibleReportIds = new Set<string>()

  // Get reports assigned directly to this officer
  const { data: assignments } = await supabase
    .from('sms1_report_assignments')
    .select('report_id')
    .eq('officer_id', userId)
    .is('removed_at', null)

  if (assignments) {
    assignments.forEach(assignment => {
      accessibleReportIds.add((assignment as ReportAssignment).report_id)
    })
  }

  // Get officer's subscriptions
  const { data: subscriptions } = await supabase
    .from('sms1_officer_subscriptions')
    .select('region_id, school_level_id')
    .eq('officer_id', userId)
    .is('deleted_at', null)

  if (subscriptions && subscriptions.length > 0) {
    // Create individual queries for each subscription combination
    const subscriptionPromises = (subscriptions as OfficerSubscription[]).map(async (sub) => {
      const { data } = await supabase
        .from('sms1_reports')
        .select('id')
        .eq('sms_schools.region_id', sub.region_id)
        .eq('sms_schools.school_level_id', sub.school_level_id)
      
      return data || []
    })

    // Execute all subscription queries in parallel
    const subscriptionResults = await Promise.all(subscriptionPromises)
    
    // Add all matching report IDs
    subscriptionResults.forEach(reports => {
      (reports as { id: string }[]).forEach(report => {
        accessibleReportIds.add(report.id)
      })
    })
  }

  return accessibleReportIds.size > 0 ? Array.from(accessibleReportIds) : []
}

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
    const user = await getAuthenticatedUser()
    
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Build a single optimized query that gets all needed data at once
    let reportsQuery = supabase
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

    // Apply role-based filtering only for officers
    if (user.role === 'officer') {
      // Get accessible report IDs efficiently
      const accessibleReportIds = await getAccessibleReportIds(user.userId, user.role)
      
      if (accessibleReportIds && accessibleReportIds.length > 0) {
        reportsQuery = reportsQuery.in('id', accessibleReportIds)
      } else {
        // No accessible reports - return empty results quickly
        return NextResponse.json({
          stats: {
            totalReports: 0,
            openReports: 0,
            inProgressReports: 0,
            closedReports: 0
          },
          quickMetrics: {
            assignedToMe: 0,
            highPriorityOpen: 0,
            avgOpenDays: 0,
            totalOpen: 0
          },
          recentReports: []
        })
      }
    }

    const { data: allReports, error: reportsError } = await reportsQuery

    if (reportsError) {
      console.error('Error fetching reports:', reportsError)
      return NextResponse.json(
        { error: 'Failed to fetch dashboard data' },
        { status: 500 }
      )
    }

    // Calculate basic stats from the single query result
    const totalReports = allReports?.length || 0
    const openReports = allReports?.filter(r => r.status === 'open').length || 0
    const inProgressReports = allReports?.filter(r => r.status === 'in_progress').length || 0
    const closedReports = allReports?.filter(r => r.status === 'closed').length || 0

    const dashboardStats = {
      totalReports,
      openReports,
      inProgressReports,
      closedReports
    }

    // Calculate quick metrics
    let assignedToMe = 0
    let highPriorityOpen = 0

    // Get reports assigned directly to this user
    if (user.role === 'officer') {
      const { data: assignments } = await supabase
        .from('sms1_report_assignments')
        .select('report_id')
        .eq('officer_id', user.userId)
        .is('removed_at', null)

      assignedToMe = assignments?.length || 0
    } else {
      // For admins and senior officers, show all open reports as "assigned to me"
      assignedToMe = openReports
    }

    // Get high priority open reports
    const { data: highPriorityReports } = await supabase
      .from('sms1_reports')
      .select('id')
      .eq('status', 'open')
      .eq('priority', 'high')

    if (user.role === 'officer') {
      // Filter high priority reports by accessibility for officers
      const accessibleReportIds = await getAccessibleReportIds(user.userId, user.role)
      if (accessibleReportIds && accessibleReportIds.length > 0) {
        highPriorityOpen = highPriorityReports?.filter(r => 
          accessibleReportIds.includes(r.id)
        ).length || 0
      }
    } else {
      highPriorityOpen = highPriorityReports?.length || 0
    }

    // Calculate average days open for open reports
    let avgOpenDays = 0
    if (openReports > 0) {
      const openReportsData = allReports?.filter(r => r.status === 'open') || []
      const totalDays = openReportsData.reduce((sum, report) => {
        const created = new Date(report.created_at)
        const now = new Date()
        const days = Math.ceil((now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24))
        return sum + days
      }, 0)
      avgOpenDays = Math.round(totalDays / openReports)
    }

    const quickMetrics = {
      assignedToMe,
      highPriorityOpen,
      avgOpenDays,
      totalOpen: openReports
    }

    // Transform recent reports (limit to 5 most recent)
    const recentReports = (allReports || []).slice(0, 5).map(report => {
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

    // Calculate reports over time (last 14 days)
    const reportsOverTime = calculateReportsOverTime(allReports || [])

    return NextResponse.json({
      stats: dashboardStats,
      quickMetrics,
      recentReports,
      reportsOverTime
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