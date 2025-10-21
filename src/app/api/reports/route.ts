import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const region = searchParams.get('region')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')

    // TODO: Get reports from Supabase with filters
    // For now, return mock data

    const allMockReports = [
      {
        id: '1',
        referenceNumber: 'EDU20241001',
        school: { name: 'Georgetown Primary School', code: 'GPS001', region: { name: 'Region 4 - Demerara-Mahaica' } },
        grade: 'Grade 5',
        teacherName: 'Ms. Sarah Johnson',
        subject: 'Mathematics',
        reporterType: 'parent',
        description: 'Teacher has been absent for 3 consecutive days without notice. Students are being left unattended.',
        status: 'open',
        priority: 'high',
        createdAt: '2024-10-21T08:30:00Z',
        updatedAt: '2024-10-21T08:30:00Z'
      },
      {
        id: '2', 
        referenceNumber: 'EDU20241002',
        school: { name: "Queen's College", code: 'QC001', region: { name: 'Region 4 - Demerara-Mahaica' } },
        grade: 'Form 4A',
        teacherName: 'Mr. David Williams',
        subject: 'Physics',
        reporterType: 'student',
        description: 'Physics teacher frequently arrives late and leaves early. Missing important class time.',
        status: 'in_progress',
        priority: 'medium',
        createdAt: '2024-10-20T14:15:00Z',
        updatedAt: '2024-10-21T09:45:00Z'
      },
      {
        id: '3',
        referenceNumber: 'EDU20241003', 
        school: { name: 'New Amsterdam Secondary School', code: 'NASS001', region: { name: 'Region 6 - East Berbice-Corentyne' } },
        grade: 'Form 2B',
        teacherName: 'Mrs. Patricia Singh',
        subject: 'English Literature',
        reporterType: 'other',
        description: 'English teacher has not shown up for the past week. No substitute provided.',
        status: 'closed',
        priority: 'high',
        createdAt: '2024-10-18T10:00:00Z',
        updatedAt: '2024-10-21T16:30:00Z'
      },
      {
        id: '4',
        referenceNumber: 'EDU20241004',
        school: { name: 'Mackenzie High School', code: 'MHS001', region: { name: 'Region 10 - Upper Demerara-Berbice' } },
        grade: 'Form 5',
        teacherName: 'Mr. Anthony Brown',
        subject: 'Chemistry',
        reporterType: 'parent',
        description: 'Chemistry teacher often cancels classes or assigns non-teaching activities.',
        status: 'open',
        priority: 'medium',
        createdAt: '2024-10-19T11:20:00Z',
        updatedAt: '2024-10-19T11:20:00Z'
      },
      {
        id: '5',
        referenceNumber: 'EDU20241005',
        school: { name: 'St. Margaret\'s Primary School', code: 'SMPS001', region: { name: 'Region 4 - Demerara-Mahaica' } },
        grade: 'Grade 3',
        teacherName: 'Ms. Jennifer Adams',
        subject: 'Social Studies',
        reporterType: 'student',
        description: 'Teacher frequently uses phone during class and does not teach properly.',
        status: 'in_progress', 
        priority: 'low',
        createdAt: '2024-10-17T13:45:00Z',
        updatedAt: '2024-10-20T10:15:00Z'
      }
    ]

    // Filter by status if provided
    let filteredReports = allMockReports
    if (status) {
      filteredReports = filteredReports.filter(report => report.status === status)
    }

    // Apply pagination
    const paginatedReports = filteredReports.slice(offset, offset + limit)
    
    return NextResponse.json({
      reports: paginatedReports,
      total: filteredReports.length,
      hasMore: offset + limit < filteredReports.length
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