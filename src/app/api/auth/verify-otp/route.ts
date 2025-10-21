import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, code } = body

    // Validate required fields
    if (!email || !code) {
      return NextResponse.json(
        { error: 'Email and verification code are required' },
        { status: 400 }
      )
    }

    // TODO: Verify OTP code using Supabase
    // For now, return success for development
    
    if (process.env.NODE_ENV === 'development') {
      // Accept any 6-digit code in development
      if (code.length === 6 && /^\d+$/.test(code)) {
        return NextResponse.json({
          message: 'Email verified successfully. Your registration is pending admin approval.',
          isVerified: true
        })
      }
    }

    return NextResponse.json(
      { error: 'Invalid or expired verification code' },
      { status: 400 }
    )

  } catch (error) {
    console.error('Verification error:', error)
    return NextResponse.json(
      { error: 'An error occurred during verification' },
      { status: 500 }
    )
  }
}