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

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser()
    
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Only allow admin and senior_officer roles to access officer lists
    if (!['admin', 'senior_officer'].includes(user.role)) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const searchQuery = searchParams.get('q')
    const roleFilter = searchParams.get('role')

    let query = supabase
      .from('sms1_users')
      .select('id, full_name, email, position, role')
      .eq('is_approved', true)
      .in('role', ['officer', 'senior_officer', 'admin'])
      .order('full_name')

    // Apply search filter if provided
    if (searchQuery) {
      query = query.or(`full_name.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%,position.ilike.%${searchQuery}%`)
    }

    // Apply role filter if provided
    if (roleFilter && ['officer', 'senior_officer', 'admin'].includes(roleFilter)) {
      query = query.eq('role', roleFilter)
    }

    const { data: officers, error } = await query.limit(50)

    if (error) {
      console.error('Error fetching officers:', error)
      return NextResponse.json(
        { error: 'Failed to fetch officers' },
        { status: 500 }
      )
    }

    // Transform data to match expected format
    const transformedOfficers = (officers || []).map(officer => ({
      id: officer.id,
      name: officer.full_name || officer.email?.split('@')[0] || 'Unknown',
      title: getOfficerTitle(officer.role),
      position: officer.position || getDefaultPosition(officer.role),
      email: officer.email,
      role: officer.role
    }))

    return NextResponse.json({
      officers: transformedOfficers
    })

  } catch (error) {
    console.error('Error in officers API:', error)
    return NextResponse.json(
      { error: 'Failed to fetch officers' },
      { status: 500 }
    )
  }
}

function getOfficerTitle(role: string): string {
  switch (role) {
    case 'admin':
      return 'System Administrator'
    case 'senior_officer':
      return 'Senior Education Officer'
    case 'officer':
      return 'Education Officer'
    default:
      return 'Education Staff'
  }
}

function getDefaultPosition(role: string): string {
  switch (role) {
    case 'admin':
      return 'Administrator'
    case 'senior_officer':
      return 'Senior Officer'
    case 'officer':
      return 'Field Officer'
    default:
      return 'Staff'
  }
}