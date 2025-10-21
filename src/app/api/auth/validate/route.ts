import { NextRequest, NextResponse } from 'next/server'
import { sessionOperations } from '@/lib/auth'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('auth-token')?.value

    if (!token) {
      return NextResponse.json(
        { error: 'No authentication token found' },
        { status: 401 }
      )
    }

    // Validate the session token
    const payload = sessionOperations.verifySession(token)
    
    if (!payload) {
      return NextResponse.json(
        { error: 'Invalid or expired session' },
        { status: 401 }
      )
    }

    return NextResponse.json({
      message: 'Valid session',
      email: payload.email,
      user: {
        id: payload.userId,
        email: payload.email,
        role: payload.role,
        is_approved: payload.isApproved
      }
    })

  } catch (error) {
    console.error('Session validation error:', error)
    return NextResponse.json(
      { error: 'Session validation failed' },
      { status: 401 }
    )
  }
}