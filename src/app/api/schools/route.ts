import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const regionId = searchParams.get('regionId')

    // TODO: Get schools from Supabase based on region
    // For now, return mock data with more variety based on region

    const allMockSchools = [
      // Region 1 schools
      { id: '1', name: 'Mabaruma Primary School', code: 'MPS001', school_level: { name: 'Primary' }, region_id: '1' },
      { id: '2', name: 'Port Kaituma Secondary School', code: 'PKSS001', school_level: { name: 'Secondary' }, region_id: '1' },
      { id: '3', name: 'Moruca Nursery School', code: 'MNS001', school_level: { name: 'Nursery' }, region_id: '1' },
      
      // Region 4 schools (Georgetown area)
      { id: '4', name: 'Georgetown Primary School', code: 'GPS001', school_level: { name: 'Primary' }, region_id: '4' },
      { id: '5', name: 'Queen\'s College', code: 'QC001', school_level: { name: 'Secondary' }, region_id: '4' },
      { id: '6', name: 'St. Rose\'s High School', code: 'SRHS001', school_level: { name: 'Secondary' }, region_id: '4' },
      { id: '7', name: 'Brickdam Secondary School', code: 'BSS001', school_level: { name: 'Secondary' }, region_id: '4' },
      { id: '8', name: 'St. Margaret\'s Primary School', code: 'SMPS001', school_level: { name: 'Primary' }, region_id: '4' },
      { id: '9', name: 'Stella Maris Primary School', code: 'SMPS002', school_level: { name: 'Primary' }, region_id: '4' },
      { id: '10', name: 'Happy Hours Nursery School', code: 'HHNS001', school_level: { name: 'Nursery' }, region_id: '4' },
      
      // Region 6 schools
      { id: '11', name: 'New Amsterdam Secondary School', code: 'NASS001', school_level: { name: 'Secondary' }, region_id: '6' },
      { id: '12', name: 'Berbice High School', code: 'BHS001', school_level: { name: 'Secondary' }, region_id: '6' },
      { id: '13', name: 'Canefield Primary School', code: 'CPS001', school_level: { name: 'Primary' }, region_id: '6' },
      
      // Region 10 schools
      { id: '14', name: 'Mackenzie High School', code: 'MHS001', school_level: { name: 'Secondary' }, region_id: '10' },
      { id: '15', name: 'Linden Primary School', code: 'LPS001', school_level: { name: 'Primary' }, region_id: '10' },
      { id: '16', name: 'Wismar Secondary School', code: 'WSS001', school_level: { name: 'Secondary' }, region_id: '10' }
    ]

    // Filter by region if provided
    const filteredSchools = regionId 
      ? allMockSchools.filter(school => school.region_id === regionId)
      : allMockSchools

    return NextResponse.json({
      schools: filteredSchools
    })

  } catch (error) {
    console.error('Schools API error:', error)
    return NextResponse.json(
      { error: 'An error occurred while fetching schools' },
      { status: 500 }
    )
  }
}