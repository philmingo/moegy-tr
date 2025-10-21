import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // TODO: Get specific report from Supabase
    // For now, return mock data based on ID

    const mockReports: { [key: string]: any } = {
      '1': {
        id: '1',
        referenceNumber: 'EDU20241001',
        school: { 
          name: 'Georgetown Primary School', 
          code: 'GPS001', 
          region: { name: 'Region 4 - Demerara-Mahaica' },
          address: '123 Main Street, Georgetown',
          phone: '592-225-1234'
        },
        grade: 'Grade 5',
        teacherName: 'Ms. Sarah Johnson',
        subject: 'Mathematics',
        reporterType: 'parent',
        description: 'Teacher has been absent for 3 consecutive days without notice. Students are being left unattended in the classroom with no supervision or learning activities provided.',
        status: 'open',
        priority: 'high',
        createdAt: '2024-10-21T08:30:00Z',
        updatedAt: '2024-10-21T08:30:00Z',
        assignedOfficer: null,
        notes: [],
        attachments: [],
        timeline: [
          {
            id: '1',
            action: 'Report submitted',
            description: 'Initial report filed by parent',
            timestamp: '2024-10-21T08:30:00Z',
            officer: null
          }
        ]
      },
      '2': {
        id: '2',
        referenceNumber: 'EDU20241002', 
        school: { 
          name: "Queen's College", 
          code: 'QC001', 
          region: { name: 'Region 4 - Demerara-Mahaica' },
          address: '456 Brickdam, Georgetown',
          phone: '592-225-5678'
        },
        grade: 'Form 4A',
        teacherName: 'Mr. David Williams',
        subject: 'Physics',
        reporterType: 'student',
        description: 'Physics teacher frequently arrives late and leaves early. Missing important class time. This has been happening for the past 2 weeks.',
        status: 'in_progress',
        priority: 'medium',
        createdAt: '2024-10-20T14:15:00Z',
        updatedAt: '2024-10-21T09:45:00Z',
        assignedOfficer: {
          id: 'off001',
          name: 'John Martinez',
          title: 'Education Officer',
          email: 'j.martinez@moe.gov.gy'
        },
        notes: [
          {
            id: 'note1',
            content: 'Initial investigation started. Contacted school principal.',
            createdAt: '2024-10-21T09:45:00Z',
            officer: {
              name: 'John Martinez',
              title: 'Education Officer'
            }
          }
        ],
        attachments: [],
        timeline: [
          {
            id: '1',
            action: 'Report submitted',
            description: 'Report filed by student',
            timestamp: '2024-10-20T14:15:00Z',
            officer: null
          },
          {
            id: '2', 
            action: 'Assigned to officer',
            description: 'Case assigned to John Martinez',
            timestamp: '2024-10-21T09:00:00Z',
            officer: {
              name: 'System',
              title: 'Auto-assignment'
            }
          },
          {
            id: '3',
            action: 'Investigation started',
            description: 'Officer began preliminary investigation',
            timestamp: '2024-10-21T09:45:00Z',
            officer: {
              name: 'John Martinez', 
              title: 'Education Officer'
            }
          }
        ]
      },
      '3': {
        id: '3',
        referenceNumber: 'EDU20241003',
        school: { 
          name: 'New Amsterdam Secondary School', 
          code: 'NASS001', 
          region: { name: 'Region 6 - East Berbice-Corentyne' },
          address: '789 Strand Road, New Amsterdam',
          phone: '592-333-9876'
        },
        grade: 'Form 2B',
        teacherName: 'Mrs. Patricia Singh',
        subject: 'English Literature',
        reporterType: 'other',
        description: 'English teacher has not shown up for the past week. No substitute provided. Students are missing critical exam preparation.',
        status: 'closed',
        priority: 'high',
        createdAt: '2024-10-18T10:00:00Z',
        updatedAt: '2024-10-21T16:30:00Z',
        assignedOfficer: {
          id: 'off002',
          name: 'Maria Thompson',
          title: 'Senior Education Officer',
          email: 'm.thompson@moe.gov.gy'
        },
        resolution: 'Issue resolved. Teacher was experiencing medical emergency. Substitute teacher assigned and permanent replacement being processed.',
        notes: [
          {
            id: 'note1',
            content: 'Contacted teacher - medical emergency confirmed.',
            createdAt: '2024-10-19T08:30:00Z',
            officer: {
              name: 'Maria Thompson',
              title: 'Senior Education Officer'
            }
          },
          {
            id: 'note2',
            content: 'Temporary substitute arranged. Permanent replacement in process.',
            createdAt: '2024-10-21T16:30:00Z',
            officer: {
              name: 'Maria Thompson',
              title: 'Senior Education Officer'
            }
          }
        ],
        attachments: [],
        timeline: [
          {
            id: '1',
            action: 'Report submitted',
            description: 'Report filed by concerned party',
            timestamp: '2024-10-18T10:00:00Z',
            officer: null
          },
          {
            id: '2',
            action: 'Assigned to officer',
            description: 'Case assigned to Maria Thompson',
            timestamp: '2024-10-18T14:00:00Z',
            officer: {
              name: 'System',
              title: 'Auto-assignment'
            }
          },
          {
            id: '3',
            action: 'Investigation completed',
            description: 'Root cause identified and temporary solution implemented',
            timestamp: '2024-10-19T08:30:00Z',
            officer: {
              name: 'Maria Thompson',
              title: 'Senior Education Officer'
            }
          },
          {
            id: '4',
            action: 'Case closed',
            description: 'Permanent solution in progress, case resolved',
            timestamp: '2024-10-21T16:30:00Z',
            officer: {
              name: 'Maria Thompson',
              title: 'Senior Education Officer'
            }
          }
        ]
      }
    }

    const report = mockReports[id]
    
    if (!report) {
      return NextResponse.json(
        { error: 'Report not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ report })

  } catch (error) {
    console.error('Report fetch error:', error)
    return NextResponse.json(
      { error: 'An error occurred while fetching the report' },
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
    const { status, priority, notes, assignedOfficer } = body

    // TODO: Update report in Supabase
    // For now, return success response

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