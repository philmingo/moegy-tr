import { NextRequest, NextResponse } from 'next/server'
import { emailOperations, passwordOperations, sessionOperations } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password } = body

    // Validate required fields
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    const normalizedEmail = emailOperations.normalize(email)

    // Get user from database
    const supabase = createAdminClient()
    const { data: user, error } = await supabase
      .from('sms1_users')
      .select('*')
      .eq('email', normalizedEmail)
      .is('deleted_at', null)
      .single()

    if (error || !user) {
      console.error('User lookup error:', error)
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      )
    }

    // Type assertion for user object
    const authenticatedUser = user as any

    // Verify password
    const isValidPassword = await passwordOperations.verify(password, authenticatedUser.password_hash)
    
    if (!isValidPassword) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      )
    }

    // Check if user is approved and verified
    if (!authenticatedUser.is_approved) {
      return NextResponse.json(
        { error: 'Your account is pending approval. Please contact an administrator.' },
        { status: 403 }
      )
    }

    if (!authenticatedUser.is_verified) {
      return NextResponse.json(
        { error: 'Please verify your email address before logging in.' },
        { status: 403 }
      )
    }

    // Create session
    const session = sessionOperations.createSession({
      id: authenticatedUser.id,
      email: authenticatedUser.email,
      full_name: authenticatedUser.full_name,
      role: authenticatedUser.role,
      is_approved: authenticatedUser.is_approved,
      is_verified: authenticatedUser.is_verified
    })
    
    // Set HTTP-only cookie
    const cookieStore = await cookies()
    cookieStore.set('auth-token', session.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 // 24 hours
    })

    return NextResponse.json({
      message: 'Login successful',
      user: session.user
    })

  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'An error occurred during login' },
      { status: 500 }
    )
  }
}