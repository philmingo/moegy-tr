import { NextRequest, NextResponse } from 'next/server'

// Mock officers data with the new position field
const mockOfficers = [
  {
    id: 'officer1',
    name: 'John Martinez',
    email: 'j.martinez@moe.gov.gy',
    position: 'Education Officer',
    role: 'officer',
    isApproved: true,
    isVerified: true
  },
  {
    id: 'officer2', 
    name: 'Maria Thompson',
    email: 'm.thompson@moe.gov.gy',
    position: 'Senior Education Officer',
    role: 'officer',
    isApproved: true,
    isVerified: true
  },
  {
    id: 'officer3',
    name: 'David Singh',
    email: 'd.singh@moe.gov.gy',
    position: 'District Education Officer',
    role: 'officer',
    isApproved: true,
    isVerified: true
  },
  {
    id: 'officer4',
    name: 'Sarah Williams',
    email: 's.williams@moe.gov.gy',
    position: 'Regional Education Officer',
    role: 'officer',
    isApproved: true,
    isVerified: true
  },
  {
    id: 'officer5',
    name: 'Mark Johnson',
    email: 'm.johnson@moe.gov.gy',
    position: 'Education Supervisor',
    role: 'officer',
    isApproved: true,
    isVerified: true
  },
  {
    id: 'admin1',
    name: 'Phil Mingo',
    email: 'phil.mingo@moe.gov.gy',
    position: 'System Administrator',
    role: 'admin',
    isApproved: true,
    isVerified: true
  }
]

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')?.toLowerCase() || ''
    const roleFilter = searchParams.get('role') || 'all'
    
    let filteredOfficers = mockOfficers
    
    // Filter by role if specified
    if (roleFilter !== 'all') {
      filteredOfficers = filteredOfficers.filter(officer => officer.role === roleFilter)
    }
    
    // Filter by search query (name or position)
    if (query) {
      filteredOfficers = filteredOfficers.filter(officer => 
        officer.name.toLowerCase().includes(query) ||
        officer.position.toLowerCase().includes(query) ||
        officer.email.toLowerCase().includes(query)
      )
    }
    
    // Only return approved and verified officers
    const availableOfficers = filteredOfficers.filter(officer => 
      officer.isApproved && officer.isVerified
    )
    
    return NextResponse.json({
      officers: availableOfficers.map(officer => ({
        id: officer.id,
        name: officer.name,
        email: officer.email,
        position: officer.position,
        role: officer.role
      }))
    })
  } catch (error) {
    console.error('Error fetching officers:', error)
    return NextResponse.json(
      { error: 'Failed to fetch officers' },
      { status: 500 }
    )
  }
}