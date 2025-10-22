import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'
import { passwordOperations } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { code, password } = body

    if (!code || !password) {
      return NextResponse.json(
        { error: 'Reset code and new password are required' },
        { status: 400 }
      )
    }

    // Validate code format (6 digits)
    if (!/^\d{6}$/.test(code)) {
      return NextResponse.json(
        { error: 'Invalid code format. Please enter a 6-digit code.' },
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

    // Validate code and get associated email
    const { data: codeData, error: codeError } = await supabase
      .from('sms1_otp_codes')
      .select('*')
      .eq('code', code)
      .is('used_at', null)
      .gt('expires_at', new Date().toISOString())
      .single()

    if (codeError || !codeData) {
      return NextResponse.json(
        { error: 'Invalid or expired reset code' },
        { status: 400 }
      )
    }

    // Type assertion for code data
    const code_data = codeData as any

    // Hash the new password
    const hashedPassword = await passwordOperations.hash(password)

    // Update user's password using type assertion to bypass type issues
    const { error: updateError } = await (supabase as any)
      .from('sms1_users')
      .update({ 
        password_hash: hashedPassword,
        updated_at: new Date().toISOString()
      })
      .eq('email', code_data.email)

    if (updateError) {
      console.error('Error updating password:', updateError)
      return NextResponse.json(
        { error: 'Failed to update password' },
        { status: 500 }
      )
    }

    // Mark code as used
    const { error: markUsedError } = await (supabase as any)
      .from('sms1_otp_codes')
      .update({ 
        used_at: new Date().toISOString() 
      })
      .eq('code', code)

    if (markUsedError) {
      console.error('Error marking code as used:', markUsedError)
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