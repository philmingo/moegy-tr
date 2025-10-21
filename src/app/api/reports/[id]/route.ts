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

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Get specific report from Supabase with all related data
    const { data: report, error } = await supabase
      .from('sms1_reports')
      .select(`
        *,
        sms_schools (
          id,
          name,
          code,
          sms_regions (
            id,
            name
          )
        )
      `)
      .eq('id', id)
      .single()

    if (error) {
      console.error('Error fetching report:', error)
      return NextResponse.json(
        { error: 'Report not found' },
        { status: 404 }
      )
    }

    if (!report) {
      return NextResponse.json(
        { error: 'Report not found' },
        { status: 404 }
      )
    }

    // Transform the data to match the expected frontend format
    const transformedReport = {
      id: report.id,
      referenceNumber: report.reference_number,
      school: {
        name: report.sms_schools?.name || 'Unknown School',
        code: report.sms_schools?.code || 'N/A',
        region: { 
          name: report.sms_schools?.sms_regions?.name || 'Unknown Region' 
        },
        address: 'Address information not available',
        phone: 'Phone information not available'
      },
      grade: report.grade || 'Not specified',
      teacherName: report.teacher_name,
      subject: report.subject || 'Not specified',
      reporterType: report.reporter_type,
      description: report.description,
      status: report.status,
      priority: report.priority,
      createdAt: report.created_at,
      updatedAt: report.updated_at,
      assignedOfficers: report.assigned_officer ? (
        Array.isArray(JSON.parse(report.assigned_officer)) 
          ? JSON.parse(report.assigned_officer) 
          : [JSON.parse(report.assigned_officer)]
      ) : [],
      notes: [], // TODO: Implement notes system if needed
      attachments: [], // TODO: Implement attachments if needed
      timeline: [
        {
          id: '1',
          action: 'Report submitted',
          description: 'Initial report filed',
          timestamp: report.created_at,
          officer: null
        }
      ]
    }

    return NextResponse.json({ report: transformedReport })
  } catch (error) {
    console.error('Error in report details API:', error)
    return NextResponse.json(
      { error: 'Failed to fetch report details' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { status, priority, notes, assignedOfficers, assignedOfficer } = body

    // Build the update object
    const updateData: any = {}
    
    if (status !== undefined) updateData.status = status
    if (priority !== undefined) updateData.priority = priority
    if (assignedOfficers !== undefined) {
      updateData.assigned_officer = assignedOfficers && assignedOfficers.length > 0 ? JSON.stringify(assignedOfficers) : null
    } else if (assignedOfficer !== undefined) {
      // Backward compatibility for single officer assignment
      updateData.assigned_officer = assignedOfficer ? JSON.stringify([assignedOfficer]) : null
    }
    updateData.updated_at = new Date().toISOString()

    // Update report in Supabase
    const { error } = await supabase
      .from('sms1_reports')
      .update(updateData)
      .eq('id', id)

    if (error) {
      console.error('Error updating report:', error)
      return NextResponse.json(
        { error: 'Failed to update report' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Report updated successfully'
    })

  } catch (error) {
    console.error('Report update error:', error)
    return NextResponse.json(
      { error: 'An error occurred while updating the report' },
      { status: 500 }
    )
  }
}