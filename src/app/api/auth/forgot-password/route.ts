import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'
import { emailOperations } from '@/lib/auth'
import { sendPasswordResetCode } from '@/lib/email'
import crypto from 'crypto'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email } = body

    // Validate required fields
    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    const normalizedEmail = emailOperations.normalize(email)

    // Validate email domain
    if (!emailOperations.validateMoeEmail(normalizedEmail)) {
      return NextResponse.json(
        { error: 'Please use a valid @moe.gov.gy email address' },
        { status: 400 }
      )
    }

    const supabase = createAdminClient()

    // Check if user exists
    const { data: user, error: userError } = await supabase
      .from('sms1_users')
      .select('id, email, full_name, is_verified, is_approved')
      .eq('email', normalizedEmail)
      .is('deleted_at', null)
      .single()

    // Always return success message for security (don't reveal if email exists)
    if (userError || !user) {
      console.log('Password reset requested for non-existent email:', normalizedEmail)
      return NextResponse.json({
        message: 'If an account with this email exists, a password reset code has been sent.'
      })
    }

    // Type assertion for user object
    const userData = user as any

    // Check if user is verified and approved
    if (!userData.is_verified) {
      console.log('Password reset requested for unverified user:', normalizedEmail)
      return NextResponse.json({
        message: 'If an account with this email exists, a password reset code has been sent.'
      })
    }

    if (!userData.is_approved) {
      console.log('Password reset requested for unapproved user:', normalizedEmail)
      return NextResponse.json({
        message: 'If an account with this email exists, a password reset code has been sent.'
      })
    }

    // Generate 6-digit reset code
    const resetCode = Math.floor(100000 + Math.random() * 900000).toString()
    const resetCodeExpiry = new Date(Date.now() + 15 * 60 * 1000) // 15 minutes from now

    // Delete any existing unused reset codes for this email
    await supabase
      .from('sms1_otp_codes')
      .delete()
      .eq('email', normalizedEmail)
      .is('used_at', null)

    // Store reset code in database
    const { error: tokenError } = await supabase
      .from('sms1_otp_codes')
      .insert({
        email: normalizedEmail,
        code: resetCode,
        expires_at: resetCodeExpiry.toISOString(),
        used_at: null
      } as any)

    if (tokenError) {
      console.error('Error storing reset code:', tokenError)
      return NextResponse.json(
        { error: 'Failed to generate reset code' },
        { status: 500 }
      )
    }

    // Send email with reset code
    try {
      const emailSent = await sendPasswordResetCode(
        normalizedEmail, 
        resetCode, 
        userData.full_name
      )

      if (!emailSent) {
        console.error('Failed to send password reset email')
        // Don't reveal email sending failure to user for security
      }
    } catch (emailError) {
      console.error('Error sending password reset email:', emailError)
      // Don't reveal email sending failure to user for security
    }

    // For development, log the reset code
    if (process.env.NODE_ENV === 'development') {
      console.log(`Password reset code for ${normalizedEmail}: ${resetCode}`)
    }

    return NextResponse.json({
      message: 'If an account with this email exists, a password reset code has been sent.',
      // Development only - remove in production
      resetCode: process.env.NODE_ENV === 'development' ? resetCode : undefined
    })

  } catch (error) {
    console.error('Forgot password error:', error)
    return NextResponse.json(
      { error: 'An error occurred while processing your request' },
      { status: 500 }
    )
  }
}