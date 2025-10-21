import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
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

    // Only allow admin and senior_officer roles to manage officers
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
      .select(`
        id,
        full_name,
        email,
        position,
        role,
        is_approved,
        is_verified,
        created_at,
        sms1_officer_subscriptions (count)
      `)
      .order('created_at', { ascending: false })

    // Apply search filter if provided
    if (searchQuery) {
      query = query.or(`full_name.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%,position.ilike.%${searchQuery}%`)
    }

    // Apply role filter if provided
    if (roleFilter && ['officer', 'senior_officer', 'admin'].includes(roleFilter)) {
      query = query.eq('role', roleFilter)
    }

    const { data: officers, error } = await query.limit(100)

    if (error) {
      console.error('Error fetching officers:', error)
      return NextResponse.json(
        { error: 'Failed to fetch officers' },
        { status: 500 }
      )
    }

    // Transform data to include subscription count
    const transformedOfficers = (officers || []).map(officer => ({
      ...officer,
      subscription_count: officer.sms1_officer_subscriptions?.length || 0
    }))

    return NextResponse.json({
      officers: transformedOfficers
    })

  } catch (error) {
    console.error('Error in officers management API:', error)
    return NextResponse.json(
      { error: 'Failed to fetch officers' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser()
    
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Only allow admin and senior_officer roles to add officers
    if (!['admin', 'senior_officer'].includes(user.role)) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { full_name, email, position, role, password } = body

    // Validate required fields
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    // Validate email format
    if (!email.endsWith('@moe.gov.gy')) {
      return NextResponse.json(
        { error: 'Email must be a @moe.gov.gy address' },
        { status: 400 }
      )
    }

    // Validate role permissions
    if (role === 'admin' && user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Only admins can create other admins' },
        { status: 403 }
      )
    }

    // Check if user already exists
    const { data: existingUser } = await supabase
      .from('sms1_users')
      .select('id')
      .eq('email', email)
      .single()

    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 400 }
      )
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12)

    // Create user
    const { data: newUser, error } = await supabase
      .from('sms1_users')
      .insert([
        {
          full_name: full_name || null,
          email: email,
          position: position || null,
          role: role || 'officer',
          password_hash: hashedPassword,
          is_approved: true, // Auto-approve since created by admin/senior officer
          is_verified: true,
          created_at: new Date().toISOString()
        }
      ])
      .select()
      .single()

    if (error) {
      console.error('Error creating officer:', error)
      return NextResponse.json(
        { error: 'Failed to create officer' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: 'Officer created successfully',
      officer: newUser
    })

  } catch (error) {
    console.error('Error in create officer API:', error)
    return NextResponse.json(
      { error: 'Failed to create officer' },
      { status: 500 }
    )
  }
}