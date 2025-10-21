import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const regionId = searchParams.get('regionId')

    const supabase = createAdminClient()
    
    // Build query to get schools with their region and school level information
    let query = supabase
      .from('sms_schools')
      .select(`
        id,
        name,
        code,
        grade,
        region_id,
        school_level_id,
        sms_regions!inner(
          id,
          name
        ),
        sms_school_levels!inner(
          id,
          name
        )
      `)
      .is('deleted_at', null)
      .order('name')

    // Filter by region if provided
    if (regionId) {
      query = query.eq('region_id', regionId)
    }

    const { data: schools, error } = await query

    if (error) {
      console.error('Database error fetching schools:', error)
      return NextResponse.json(
        { error: 'Failed to fetch schools from database' },
        { status: 500 }
      )
    }

    // Transform the data to match the expected frontend format
    const transformedSchools = schools?.map((school: any) => ({
      id: school.id,
      name: school.name,
      code: school.code,
      grade: school.grade,
      region_id: school.region_id,
      school_level_id: school.school_level_id,
      region: {
        id: school.sms_regions?.id,
        name: school.sms_regions?.name
      },
      school_level: {
        id: school.sms_school_levels?.id,
        name: school.sms_school_levels?.name
      }
    })) || []

    return NextResponse.json({
      schools: transformedSchools
    })

  } catch (error) {
    console.error('Schools API error:', error)
    return NextResponse.json(
      { error: 'An error occurred while fetching schools' },
      { status: 500 }
    )
  }
}