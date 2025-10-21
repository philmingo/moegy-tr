import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const referenceNumber = searchParams.get('ref')

    if (!referenceNumber) {
      return NextResponse.json(
        { error: 'Reference number is required' },
        { status: 400 }
      )
    }

    const supabase = createAdminClient()
    
    // Get report from database with related data
    const { data: report, error } = await supabase
      .from('sms1_reports')
      .select(`
        *,
        sms_schools!inner(
          id,
          name,
          code,
          sms_regions!inner(
            id,
            name
          )
        ),
        sms1_report_assignments(
          assigned_at,
          sms1_users!inner(
            id,
            full_name,
            role
          )
        )
      `)
      .eq('reference_number', referenceNumber)
      .single()

    if (error || !report) {
      console.error('Report lookup error:', error)
      return NextResponse.json(
        { error: 'Report not found' },
        { status: 404 }
      )
    }

    // Transform the data for the frontend
    const reportData = report as any
    const school = reportData.sms_schools
    const region = school?.sms_regions
    const assignments = reportData.sms1_report_assignments || []
    
    const result = {
      referenceNumber: reportData.reference_number,
      status: reportData.status,
      priority: reportData.priority,
      school: school?.name,
      region: region?.name,
      createdAt: reportData.created_at,
      officerNotified: assignments.length > 0 ? {
        name: assignments[0].sms1_users?.full_name,
        title: assignments[0].sms1_users?.role === 'admin' ? 'Administrator' : 
              assignments[0].sms1_users?.role === 'senior_officer' ? 'Senior Education Officer' : 
              'Education Officer',
        notifiedAt: assignments[0].assigned_at
      } : null
    }

    return NextResponse.json(result)

  } catch (error) {
    console.error('Track API error:', error)
    return NextResponse.json(
      { error: 'An error occurred while tracking the report' },
      { status: 500 }
    )
  }
}