import { NextRequest, NextResponse } from 'next/server'
import { emailOperations, passwordOperations, sessionOperations } from '@/lib/auth'
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

    // TODO: Get user from database using Supabase
    // For now, create mock user for development
    
    // Mock default admin user for development
    if (normalizedEmail === 'phil.mingo@moe.gov.gy' && password === 'Admin@123456789') {
      const mockUser = {
        id: '00000000-0000-0000-0000-000000000001',
        email: normalizedEmail,
        full_name: 'Philip Mingo',
        role: 'admin' as const,
        is_approved: true,
        is_verified: true
      }

      // Create session
      const session = sessionOperations.createSession(mockUser)
      
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
    }

    // TODO: Verify password with database hash
    // TODO: Check if user is approved and verified

    return NextResponse.json(
      { error: 'Invalid credentials or account not approved' },
      { status: 401 }
    )

  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'An error occurred during login' },
      { status: 500 }
    )
  }
}