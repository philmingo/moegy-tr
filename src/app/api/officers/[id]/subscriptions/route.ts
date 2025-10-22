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

async function getAuthenticatedUser() {
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

// GET - Fetch officer subscriptions
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthenticatedUser()
    
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Only allow admin and senior_officer roles to manage subscriptions
    if (!['admin', 'senior_officer'].includes(user.role)) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    const { id: officerId } = await params

    // Get officer details
    const { data: officer, error: officerError } = await supabase
      .from('sms1_users')
      .select('id, full_name, email, role')
      .eq('id', officerId)
      .single()

    if (officerError || !officer) {
      return NextResponse.json(
        { error: 'Officer not found' },
        { status: 404 }
      )
    }

    // Get all regions
    const { data: regions, error: regionsError } = await supabase
      .from('sms_regions')
      .select('id, name')
      .order('name')

    if (regionsError) {
      return NextResponse.json(
        { error: 'Failed to fetch regions' },
        { status: 500 }
      )
    }

    // Get all school levels
    const { data: schoolLevels, error: schoolLevelsError } = await supabase
      .from('sms_school_levels')
      .select('id, name')
      .order('name')

    if (schoolLevelsError) {
      return NextResponse.json(
        { error: 'Failed to fetch school levels' },
        { status: 500 }
      )
    }

    // Get officer's current subscriptions
    const { data: subscriptions, error: subscriptionsError } = await supabase
      .from('sms1_officer_subscriptions')
      .select(`
        id,
        region_id,
        school_level_id,
        created_at,
        sms_regions!region_id (
          id,
          name
        ),
        sms_school_levels!school_level_id (
          id,
          name
        )
      `)
      .eq('officer_id', officerId)
      .is('deleted_at', null)

    if (subscriptionsError) {
      return NextResponse.json(
        { error: 'Failed to fetch subscriptions' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      officer,
      regions: regions || [],
      schoolLevels: schoolLevels || [],
      subscriptions: subscriptions || []
    })

  } catch (error) {
    console.error('Error in officer subscriptions API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST - Add new subscription
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthenticatedUser()
    
    if (!user || !['admin', 'senior_officer'].includes(user.role)) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    const { id: officerId } = await params
    const body = await request.json()
    const { regionId, schoolLevelId } = body

    if (!regionId || !schoolLevelId) {
      return NextResponse.json(
        { error: 'Region ID and School Level ID are required' },
        { status: 400 }
      )
    }

    // Validate that region and school level exist
    const { data: region, error: regionError } = await supabase
      .from('sms_regions')
      .select('id')
      .eq('id', regionId)
      .single()

    if (regionError || !region) {
      return NextResponse.json(
        { error: 'Invalid region or school level ID' },
        { status: 400 }
      )
    }

    const { data: schoolLevel, error: schoolLevelError } = await supabase
      .from('sms_school_levels')
      .select('id')
      .eq('id', schoolLevelId)
      .single()

    if (schoolLevelError || !schoolLevel) {
      return NextResponse.json(
        { error: 'Invalid region or school level ID' },
        { status: 400 }
      )
    }

    // Check if subscription already exists
    const { data: existing } = await supabase
      .from('sms1_officer_subscriptions')
      .select('id')
      .eq('officer_id', officerId)
      .eq('region_id', regionId)
      .eq('school_level_id', schoolLevelId)
      .is('deleted_at', null)
      .single()

    if (existing) {
      return NextResponse.json(
        { error: 'Subscription already exists' },
        { status: 400 }
      )
    }

    // Create new subscription
    const { data: newSubscription, error } = await supabase
      .from('sms1_officer_subscriptions')
      .insert({
        officer_id: officerId,
        region_id: regionId,
        school_level_id: schoolLevelId
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating subscription:', error)
      return NextResponse.json(
        { error: 'Failed to create subscription' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: 'Subscription created successfully',
      subscription: newSubscription
    })

  } catch (error) {
    console.error('Error creating subscription:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE - Remove subscription
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthenticatedUser()
    
    if (!user || !['admin', 'senior_officer'].includes(user.role)) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    const { id: officerId } = await params
    const { searchParams } = new URL(request.url)
    const subscriptionId = searchParams.get('subscriptionId')

    if (!subscriptionId) {
      return NextResponse.json(
        { error: 'Subscription ID is required' },
        { status: 400 }
      )
    }

    // Soft delete the subscription
    const { error } = await supabase
      .from('sms1_officer_subscriptions')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', subscriptionId)
      .eq('officer_id', officerId)

    if (error) {
      console.error('Error deleting subscription:', error)
      return NextResponse.json(
        { error: 'Failed to delete subscription' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: 'Subscription removed successfully'
    })

  } catch (error) {
    console.error('Error deleting subscription:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}