import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'
import { emailOperations } from '@/lib/auth'
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
        message: 'If an account with this email exists, a password reset link has been sent.'
      })
    }

    // Type assertion for user object
    const userData = user as any

    // Check if user is verified and approved
    if (!userData.is_verified) {
      console.log('Password reset requested for unverified user:', normalizedEmail)
      return NextResponse.json({
        message: 'If an account with this email exists, a password reset link has been sent.'
      })
    }

    if (!userData.is_approved) {
      console.log('Password reset requested for unapproved user:', normalizedEmail)
      return NextResponse.json({
        message: 'If an account with this email exists, a password reset link has been sent.'
      })
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex')
    const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000) // 1 hour from now

    // Store reset token in database (we'll use otp_codes table for this)
    const { error: tokenError } = await supabase
      .from('sms1_otp_codes')
      .insert({
        email: normalizedEmail,
        code: resetToken,
        expires_at: resetTokenExpiry.toISOString(),
        used_at: null
      } as any)

    if (tokenError) {
      console.error('Error storing reset token:', tokenError)
      return NextResponse.json(
        { error: 'Failed to generate reset token' },
        { status: 500 }
      )
    }

    // TODO: Send email with reset link
    // For now, we'll log the reset link for development
    const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/admin/reset-password?token=${resetToken}`
    console.log(`Password reset link for ${normalizedEmail}: ${resetUrl}`)

    // In production, you would send an email here using SendGrid
    /*
    const emailData = {
      to: normalizedEmail,
      from: process.env.SENDGRID_FROM_EMAIL,
      subject: 'Password Reset - EduAlert System',
      html: `
        <h2>Password Reset Request</h2>
        <p>Hello ${user.full_name},</p>
        <p>You requested a password reset for your EduAlert account.</p>
        <p><a href="${resetUrl}">Click here to reset your password</a></p>
        <p>This link will expire in 1 hour for security reasons.</p>
        <p>If you did not request this reset, please ignore this email.</p>
        <p>Best regards,<br>EduAlert System</p>
      `
    }
    
    await sendEmail(emailData)
    */

    return NextResponse.json({
      message: 'If an account with this email exists, a password reset link has been sent.',
      // Development only - remove in production
      resetUrl: process.env.NODE_ENV === 'development' ? resetUrl : undefined
    })

  } catch (error) {
    console.error('Forgot password error:', error)
    return NextResponse.json(
      { error: 'An error occurred while processing your request' },
      { status: 500 }
    )
  }
}