import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'

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
    sms_regions: {
      name: string
    }
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const priority = searchParams.get('priority')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')

    const supabase = createAdminClient()

    // Build the query
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
          sms_regions!inner (
            name
          )
        )
      `)
      .order('created_at', { ascending: false })

    // Apply filters
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

    // Apply same filters to count query
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

    // TODO: Auto-assign to officers based on region and school level
    // TODO: Send email notifications

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