import { NextRequest, NextResponse } from 'next/server'
import { emailOperations, passwordOperations, otpHelpers } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password, fullName, position } = body

    // Validate required fields
    if (!email || !password || !fullName || !position) {
      return NextResponse.json(
        { error: 'Email, password, full name, and position are required' },
        { status: 400 }
      )
    }

    // Validate email format
    if (!emailOperations.validateMoeEmail(email)) {
      return NextResponse.json(
        { error: 'Only @moe.gov.gy email addresses are allowed' },
        { status: 400 }
      )
    }

    // Validate password strength
    const passwordValidation = passwordOperations.validate(password)
    if (!passwordValidation.isValid) {
      return NextResponse.json(
        { error: 'Password does not meet requirements', details: passwordValidation.errors },
        { status: 400 }
      )
    }

    const normalizedEmail = emailOperations.normalize(email)

    // TODO: Check if user already exists using Supabase
    // For now, we'll create a mock response

    // Hash password
    const passwordHash = await passwordOperations.hash(password)

    // Generate OTP
    const otpCode = otpHelpers.generate()

    // TODO: Store user and OTP in database
    // TODO: Send OTP email via SendGrid

    return NextResponse.json({
      message: 'Registration initiated. Please check your email for verification code.',
      email: normalizedEmail,
      // In production, don't return the OTP code
      otpCode: process.env.NODE_ENV === 'development' ? otpCode : undefined
    })

  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json(
      { error: 'An error occurred during registration' },
      { status: 500 }
    )
  }
}