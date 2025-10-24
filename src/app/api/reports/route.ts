import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'
import { cookies } from 'next/headers'
import { jwtOperations } from '@/lib/auth'

// Function to trigger AI analysis of a new report
async function triggerReportAnalysis(reportId: string): Promise<void> {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/reports/analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ reportId }),
    })

    if (!response.ok) {
      throw new Error(`Analysis API returned ${response.status}`)
    }

    const result = await response.json()
    console.log(`Report ${reportId} analysis result:`, result.action)
  } catch (error) {
    console.error(`Failed to analyze report ${reportId}:`, error)
  }
}

interface DatabaseReport {
  id: string
  reference_number: string
  grade: string
  teacher_name: string
  subject: string
  reporter_type: string
  description: string
  status: string
  priority: string
  created_at: string
  updated_at: string
  sms_schools: {
    name: string
    code: string
    school_level_id: string
    sms_regions: {
      id: string
      name: string
    }
  }
}

interface OfficerSubscription {
  region_id: string
  school_level_id: string
}

interface ReportAssignment {
  report_id: string
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const priority = searchParams.get('priority')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Get user authentication
    const cookieStore = await cookies()
    const authToken = cookieStore.get('auth-token')?.value

    if (!authToken) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const userData = jwtOperations.verify(authToken)
    if (!userData) {
      return NextResponse.json(
        { error: 'Invalid authentication' },
        { status: 401 }
      )
    }

    const supabase = createAdminClient()

    // Build the base query
    let query = supabase
      .from('sms1_reports')
      .select(`
        id,
        reference_number,
        grade,
        teacher_name,
        subject,
        reporter_type,
        description,
        status,
        priority,
        created_at,
        updated_at,
        sms_schools!inner (
          name,
          code,
          school_level_id,
          sms_regions!inner (
            id,
            name
          )
        )
      `)
      .order('created_at', { ascending: false })

    // Apply role-based filtering
    if (userData.role === 'officer') {
      // For officers, get all report IDs they should have access to
      const accessibleReportIds = new Set<string>()

      // Get reports assigned directly to this officer
      const { data: assignments, error: assignError } = await supabase
        .from('sms1_report_assignments')
        .select('report_id')
        .eq('officer_id', userData.userId)
        .is('removed_at', null)

      if (assignError) {
        console.error('Error fetching assignments:', assignError)
        return NextResponse.json(
          { error: 'Failed to fetch user assignments' },
          { status: 500 }
        )
      }

      // Add assigned report IDs
      if (assignments) {
        assignments.forEach(assignment => {
          accessibleReportIds.add((assignment as ReportAssignment).report_id)
        })
      }

      // Get officer's subscriptions (region + school level combinations)
      const { data: subscriptions, error: subError } = await supabase
        .from('sms1_officer_subscriptions')
        .select('region_id, school_level_id')
        .eq('officer_id', userData.userId)
        .is('deleted_at', null)

      if (subError) {
        console.error('Error fetching subscriptions:', subError)
        return NextResponse.json(
          { error: 'Failed to fetch user subscriptions' },
          { status: 500 }
        )
      }

      // Get reports that match subscriptions
      if (subscriptions && subscriptions.length > 0) {
        for (const subscription of subscriptions as OfficerSubscription[]) {
          const { data: matchingReports, error: matchError } = await supabase
            .from('sms1_reports')
            .select('id')
            .eq('sms_schools.region_id', subscription.region_id)
            .eq('sms_schools.school_level_id', subscription.school_level_id)

          if (!matchError && matchingReports) {
            (matchingReports as { id: string }[]).forEach(report => {
              accessibleReportIds.add(report.id)
            })
          }
        }
      }

      // If no accessible reports, return empty result
      if (accessibleReportIds.size === 0) {
        return NextResponse.json({
          reports: [],
          total: 0,
          hasMore: false
        })
      }

      // Filter query to only accessible reports
      query = query.in('id', Array.from(accessibleReportIds))
    }
    // For senior_officer and admin roles, show all reports (no additional filtering)

    // Apply additional filters
    if (status) {
      query = query.eq('status', status)
    }
    if (priority) {
      query = query.eq('priority', priority)
    }

    // Get total count for pagination with same filters
    let countQuery = supabase
      .from('sms1_reports')
      .select('*', { count: 'exact', head: true })

    // Apply same role-based filtering to count query
    if (userData.role === 'officer') {
      // Use the same accessible report IDs for counting
      const accessibleReportIds = new Set<string>()

      // Get assignments
      const { data: assignments } = await supabase
        .from('sms1_report_assignments')
        .select('report_id')
        .eq('officer_id', userData.userId)
        .is('removed_at', null)

      if (assignments) {
        assignments.forEach(assignment => {
          accessibleReportIds.add((assignment as ReportAssignment).report_id)
        })
      }

      // Get subscriptions
      const { data: subscriptions } = await supabase
        .from('sms1_officer_subscriptions')
        .select('region_id, school_level_id')
        .eq('officer_id', userData.userId)
        .is('deleted_at', null)

      if (subscriptions && subscriptions.length > 0) {
        for (const subscription of subscriptions as OfficerSubscription[]) {
          const { data: matchingReports } = await supabase
            .from('sms1_reports')
            .select('id')
            .eq('sms_schools.region_id', subscription.region_id)
            .eq('sms_schools.school_level_id', subscription.school_level_id)

          if (matchingReports) {
            (matchingReports as { id: string }[]).forEach(report => {
              accessibleReportIds.add(report.id)
            })
          }
        }
      }

      if (accessibleReportIds.size > 0) {
        countQuery = countQuery.in('id', Array.from(accessibleReportIds))
      } else {
        // No accessible reports
        countQuery = countQuery.eq('id', 'no-reports-match')
      }
    }

    // Apply same additional filters to count query
    if (status) {
      countQuery = countQuery.eq('status', status)
    }
    if (priority) {
      countQuery = countQuery.eq('priority', priority)
    }

    const { count } = await countQuery

    // Apply pagination
    query = query.range(offset, offset + limit - 1)

    const { data: reports, error } = await query

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch reports' },
        { status: 500 }
      )
    }

    // Transform the data to match the frontend interface
    const transformedReports = (reports as DatabaseReport[])?.map(report => ({
      id: report.id,
      referenceNumber: report.reference_number,
      school: {
        name: report.sms_schools.name,
        code: report.sms_schools.code,
        region: {
          name: report.sms_schools.sms_regions.name
        }
      },
      grade: report.grade,
      teacherName: report.teacher_name,
      subject: report.subject,
      reporterType: report.reporter_type,
      description: report.description,
      status: report.status,
      priority: report.priority,
      createdAt: report.created_at,
      updatedAt: report.updated_at
    })) || []

    return NextResponse.json({
      reports: transformedReports,
      total: count || 0,
      hasMore: offset + limit < (count || 0)
    })

  } catch (error) {
    console.error('Reports fetch error:', error)
    return NextResponse.json(
      { error: 'An error occurred while fetching reports' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      regionId,
      schoolId,
      grade,
      teacherName,
      subject,
      reporterType,
      description
    } = body

    // Validate required fields
    const requiredFields = {
      regionId: 'Region',
      schoolId: 'School',
      grade: 'Grade',
      teacherName: 'Teacher Name',
      subject: 'Subject',
      reporterType: 'Reporter Type',
      description: 'Description'
    }

    for (const [field, label] of Object.entries(requiredFields)) {
      if (!body[field]) {
        return NextResponse.json(
          { error: `${label} is required` },
          { status: 400 }
        )
      }
    }

    // Generate reference number using database function
    const supabase = createAdminClient()
    
    // Insert the report into the database
    const { data: newReport, error: insertError } = await supabase
      .from('sms1_reports')
      .insert({
        reference_number: `EDU${new Date().getFullYear()}${String(Math.floor(Math.random() * 9000) + 1000)}`,
        school_id: schoolId,
        grade,
        teacher_name: teacherName,
        subject,
        reporter_type: reporterType as 'student' | 'parent' | 'other',
        description,
        status: 'open' as const,
        priority: 'medium' as const
      } as any)
      .select('*')
      .single()

    if (insertError) {
      console.error('Database error creating report:', insertError)
      return NextResponse.json(
        { error: 'Failed to create report in database' },
        { status: 500 }
      )
    }

    // Type assertion for the returned report
    const report = newReport as any

    // Trigger AI analysis for the new report (async, don't block response)
    triggerReportAnalysis(report.id).catch((error: any) => {
      console.error('Failed to trigger AI analysis:', error)
    })

    return NextResponse.json({
      message: 'Report submitted successfully',
      referenceNumber: report.reference_number,
      report: {
        id: report.id,
        referenceNumber: report.reference_number,
        schoolId: report.school_id,
        grade: report.grade,
        teacherName: report.teacher_name,
        subject: report.subject,
        reporterType: report.reporter_type,
        description: report.description,
        status: report.status,
        priority: report.priority,
        createdAt: report.created_at
      }
    })

  } catch (error) {
    console.error('Report submission error:', error)
    return NextResponse.json(
      { error: 'An error occurred while submitting the report' },
      { status: 500 }
    )
  }
}