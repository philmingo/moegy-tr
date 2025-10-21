import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'
import { passwordOperations } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { token, password } = body

    if (!token || !password) {
      return NextResponse.json(
        { error: 'Reset token and new password are required' },
        { status: 400 }
      )
    }

    // Validate password strength
    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters long' },
        { status: 400 }
      )
    }

    const supabase = createAdminClient()

    // Validate token and get associated email
    const { data: tokenData, error: tokenError } = await supabase
      .from('sms1_otp_codes')
      .select('*')
      .eq('code', token)
      .is('used_at', null)
      .gt('expires_at', new Date().toISOString())
      .single()

    if (tokenError || !tokenData) {
      return NextResponse.json(
        { error: 'Invalid or expired reset token' },
        { status: 400 }
      )
    }

    // Type assertion for token data
    const token_data = tokenData as any

    // Hash the new password
    const hashedPassword = await passwordOperations.hash(password)

    // Update user's password using type assertion to bypass type issues
    const { error: updateError } = await (supabase as any)
      .from('sms1_users')
      .update({ 
        password_hash: hashedPassword,
        updated_at: new Date().toISOString()
      })
      .eq('email', token_data.email)

    if (updateError) {
      console.error('Error updating password:', updateError)
      return NextResponse.json(
        { error: 'Failed to update password' },
        { status: 500 }
      )
    }

    // Mark token as used
    const { error: markUsedError } = await (supabase as any)
      .from('sms1_otp_codes')
      .update({ 
        used_at: new Date().toISOString() 
      })
      .eq('code', token)

    if (markUsedError) {
      console.error('Error marking token as used:', markUsedError)
      // Don't fail the request if this fails, password was already updated
    }

    return NextResponse.json({
      message: 'Password reset successfully'
    })

  } catch (error) {
    console.error('Password reset error:', error)
    return NextResponse.json(
      { error: 'An error occurred while resetting the password' },
      { status: 500 }
    )
  }
}