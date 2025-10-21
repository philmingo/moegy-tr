import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import jwt from 'jsonwebtoken'
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

async function fetchRegions() {
  try {
    const { data, error } = await supabase
      .from('sms_regions')
      .select('id, name')
      .order('name')

    if (error) throw error
    return data
  } catch (error) {
    console.error('Error fetching regions:', error)
    return []
  }
}

async function fetchSchoolLevels() {
  try {
    const { data, error } = await supabase
      .from('sms_school_levels')
      .select('id, name')
      .order('name')

    if (error) throw error
    return data
  } catch (error) {
    console.error('Error fetching school levels:', error)
    return []
  }
}

async function getAuthenticatedUser(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('auth-token')

    if (!token) {
      return null
    }

    const decoded = jwt.verify(token.value, process.env.JWT_SECRET || 'your-secret-key') as any
    return decoded
  } catch (error) {
    return null
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request)
    
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    console.log('Authenticated user for subscriptions:', user) // Debug log

    // Fetch available regions and school levels from database
    const [regions, schoolLevels] = await Promise.all([
      fetchRegions(),
      fetchSchoolLevels()
    ])

    // Fetch user's current subscriptions from database
    const { data: userSubscriptions, error: subscriptionsError } = await supabase
      .from('sms1_officer_subscriptions')
      .select(`
        region_id,
        school_level_id,
        sms_regions!region_id (
          id,
          name
        ),
        sms_school_levels!school_level_id (
          id,
          name
        )
      `)
      .eq('officer_email', user.email)

    if (subscriptionsError) {
      console.error('Error fetching user subscriptions:', subscriptionsError)
      // Return empty subscriptions but still provide available options
      return NextResponse.json({
        subscriptions: [],
        availableRegions: regions,
        availableSchoolLevels: schoolLevels
      })
    }

    // Convert subscription data to expected format
    const subscriptionsWithDetails = (userSubscriptions || []).map((sub: any) => ({
      regionId: sub.region_id,
      regionName: sub.sms_regions?.name || 'Unknown Region',
      schoolLevelId: sub.school_level_id,
      schoolLevelName: sub.sms_school_levels?.name || 'Unknown Level'
    }))

    return NextResponse.json({
      subscriptions: subscriptionsWithDetails,
      availableRegions: regions,
      availableSchoolLevels: schoolLevels
    })
  } catch (error) {
    console.error('Error fetching subscriptions:', error)
    return NextResponse.json(
      { error: 'Failed to fetch subscriptions' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request)
    
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { subscriptions } = body

    if (!Array.isArray(subscriptions)) {
      return NextResponse.json(
        { error: 'Subscriptions must be an array' },
        { status: 400 }
      )
    }

    // Fetch available regions and school levels for validation
    const [regions, schoolLevels] = await Promise.all([
      fetchRegions(),
      fetchSchoolLevels()
    ])

    // Validate subscription data
    for (const sub of subscriptions) {
      if (!sub.regionId || !sub.schoolLevelId) {
        return NextResponse.json(
          { error: 'Each subscription must have regionId and schoolLevelId' },
          { status: 400 }
        )
      }
      
      const regionExists = regions.find((r: any) => r.id === sub.regionId)
      const schoolLevelExists = schoolLevels.find((sl: any) => sl.id === sub.schoolLevelId)
      
      if (!regionExists || !schoolLevelExists) {
        return NextResponse.json(
          { error: 'Invalid region or school level ID' },
          { status: 400 }
        )
      }
    }

    // Delete existing subscriptions for this user
    const { error: deleteError } = await supabase
      .from('sms1_officer_subscriptions')
      .delete()
      .eq('officer_email', user.email)

    if (deleteError) {
      console.error('Error deleting existing subscriptions:', deleteError)
      return NextResponse.json(
        { error: 'Failed to update subscriptions' },
        { status: 500 }
      )
    }

    // Insert new subscriptions if any provided
    if (subscriptions.length > 0) {
      const subscriptionsToInsert = subscriptions.map((sub: any) => ({
        officer_email: user.email,
        region_id: sub.regionId,
        school_level_id: sub.schoolLevelId,
        created_at: new Date().toISOString()
      }))

      const { error: insertError } = await supabase
        .from('sms1_officer_subscriptions')
        .insert(subscriptionsToInsert)

      if (insertError) {
        console.error('Error inserting new subscriptions:', insertError)
        return NextResponse.json(
          { error: 'Failed to update subscriptions' },
          { status: 500 }
        )
      }
    }

    // Return the updated subscriptions with names
    const subscriptionsWithDetails = subscriptions.map((sub: any) => {
      const region = regions.find((r: any) => r.id === sub.regionId)
      const schoolLevel = schoolLevels.find((sl: any) => sl.id === sub.schoolLevelId)
      
      return {
        regionId: sub.regionId,
        regionName: region?.name || 'Unknown Region',
        schoolLevelId: sub.schoolLevelId,
        schoolLevelName: schoolLevel?.name || 'Unknown Level'
      }
    })

    return NextResponse.json({
      message: 'Subscriptions updated successfully',
      subscriptions: subscriptionsWithDetails
    })
  } catch (error) {
    console.error('Error updating subscriptions:', error)
    return NextResponse.json(
      { error: 'Failed to update subscriptions' },
      { status: 500 }
    )
  }
}