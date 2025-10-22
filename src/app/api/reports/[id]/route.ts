import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendAssignmentNotification } from '@/lib/email'

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
        ),
        sms1_report_assignments (
          officer_id,
          assigned_at,
          sms1_users!sms1_report_assignments_officer_id_fkey (
            id,
            full_name,
            email,
            position,
            role
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

    // Get notes for this report
    const { data: notes, error: notesError } = await supabase
      .from('sms1_report_comments')
      .select(`
        id,
        comment,
        created_at,
        user_id,
        sms1_users (
          id,
          full_name,
          position
        )
      `)
      .eq('report_id', id)
      .order('created_at', { ascending: true })

    if (notesError) {
      console.error('Error fetching notes:', notesError)
      // Don't fail the request if notes can't be fetched
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
      assignedOfficers: report.sms1_report_assignments ? report.sms1_report_assignments
        .filter((assignment: any) => !assignment.removed_at) // Only active assignments
        .map((assignment: any) => ({
          id: assignment.sms1_users.id,
          name: assignment.sms1_users.full_name || assignment.sms1_users.email?.split('@')[0] || 'Unknown',
          title: assignment.sms1_users.position || 'Officer',
          position: assignment.sms1_users.position || 'Officer',
          email: assignment.sms1_users.email,
          role: assignment.sms1_users.role,
          assignedAt: assignment.assigned_at
        })) : [],
      notes: notes ? notes.map(note => {
        const user = Array.isArray(note.sms1_users) ? note.sms1_users[0] : note.sms1_users;
        return {
          id: note.id,
          content: note.comment,
          createdAt: note.created_at,
          officer: {
            name: user?.full_name || 'Unknown User',
            title: user?.position || 'Unknown Position'
          }
        };
      }) : [],
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

    // Handle regular report updates (status, priority)
    const updateData: any = {}
    
    if (status !== undefined) updateData.status = status
    if (priority !== undefined) updateData.priority = priority
    updateData.updated_at = new Date().toISOString()

    // Update the report if there are changes
    if (Object.keys(updateData).length > 1) { // More than just updated_at
      const { error: reportError } = await supabase
        .from('sms1_reports')
        .update(updateData)
        .eq('id', id)

      if (reportError) {
        console.error('Supabase error details:', reportError)
        return NextResponse.json(
          { 
            error: 'Failed to update report',
            details: reportError.message,
            code: reportError.code
          },
          { status: 500 }
        )
      }
    }

    // Handle officer assignments separately
    if (assignedOfficers !== undefined) {
      // First, remove all existing assignments for this report
      const { error: removeError } = await supabase
        .from('sms1_report_assignments')
        .delete()
        .eq('report_id', id)
      
      if (removeError) {
        console.error('Error removing existing assignments:', removeError)
        return NextResponse.json(
          { error: 'Failed to update officer assignments', details: removeError.message },
          { status: 500 }
        )
      }

      // Add new assignments if any officers are selected
      if (assignedOfficers && assignedOfficers.length > 0) {
        // TODO: Get the authenticated user ID for assigned_by
        // For now, we'll use a placeholder or the first officer's ID
        const assignments = assignedOfficers.map((officer: any) => ({
          report_id: id,
          officer_id: officer.id,
          assigned_by: officer.id, // Temporary - should be current admin user ID
          assigned_at: new Date().toISOString()
        }))

        const { error: assignError } = await supabase
          .from('sms1_report_assignments')
          .insert(assignments)

        if (assignError) {
          console.error('Error creating assignments:', assignError)
          return NextResponse.json(
            { error: 'Failed to assign officers', details: assignError.message },
            { status: 500 }
          )
        }

        // Send email notifications to assigned officers
        try {
          // Get the current report details for email
          const { data: reportData } = await supabase
            .from('sms1_reports')
            .select(`
              reference_number,
              teacher_name,
              subject,
              description,
              priority,
              sms_schools (
                name
              )
            `)
            .eq('id', id)
            .single()

          if (reportData) {
            // Send email to each assigned officer
            const emailPromises = assignedOfficers.map(async (officer: any) => {
              try {
                await sendAssignmentNotification(
                  officer.email,
                  officer.name,
                  {
                    referenceNumber: reportData.reference_number,
                    school: (reportData.sms_schools as any)?.name || 'Unknown School',
                    teacherName: reportData.teacher_name,
                    subject: reportData.subject,
                    description: reportData.description,
                    priority: reportData.priority
                  }
                )
                console.log(`Assignment notification sent to ${officer.email}`)
              } catch (emailError) {
                console.error(`Failed to send email to ${officer.email}:`, emailError)
                // Don't fail the assignment if email fails
              }
            })

            // Wait for all emails to be sent (but don't block the response)
            Promise.all(emailPromises).catch(error => {
              console.error('Some assignment emails failed:', error)
            })
          }
        } catch (emailError) {
          console.error('Error sending assignment notifications:', emailError)
          // Don't fail the assignment if email fails
        }
      }
    }

    console.log('Report updated successfully')
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