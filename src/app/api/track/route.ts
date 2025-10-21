import { NextRequest, NextResponse } from 'next/server'

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

    // TODO: Get report from Supabase based on reference number
    // For now, return mock data

    const mockResults: Record<string, any> = {
      'EDU20241001': {
        referenceNumber: 'EDU20241001',
        status: 'open',
        priority: 'high',
        school: 'Georgetown Primary School',
        region: 'Region 4 - Demerara-Mahaica',
        createdAt: '2024-10-21T08:30:00Z',
        officerNotified: {
          name: 'John Martinez',
          title: 'Education Officer',
          notifiedAt: '2024-10-21T08:45:00Z'
        }
      },
      'EDU20241002': {
        referenceNumber: 'EDU20241002',
        status: 'in_progress',
        priority: 'medium',
        school: "Queen's College",
        region: 'Region 4 - Demerara-Mahaica',
        createdAt: '2024-10-20T14:15:00Z',
        officerNotified: {
          name: 'Maria Thompson',
          title: 'Senior Education Officer',
          notifiedAt: '2024-10-20T14:30:00Z'
        }
      },
      'EDU20241003': {
        referenceNumber: 'EDU20241003',
        status: 'closed',
        priority: 'high',
        school: 'New Amsterdam Secondary School',
        region: 'Region 6 - East Berbice-Corentyne',
        createdAt: '2024-10-18T10:00:00Z',
        officerNotified: {
          name: 'David Wilson',
          title: 'Education Officer',
          notifiedAt: '2024-10-18T10:15:00Z'
        }
      }
    }

    const result = mockResults[referenceNumber.toUpperCase()]
    
    if (!result) {
      return NextResponse.json(
        { error: 'Reference number not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ report: result })

  } catch (error) {
    console.error('Tracking lookup error:', error)
    return NextResponse.json(
      { error: 'An error occurred while looking up the report' },
      { status: 500 }
    )
  }
}