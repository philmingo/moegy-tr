import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { token } = body

    if (!token) {
      return NextResponse.json(
        { error: 'Reset token is required' },
        { status: 400 }
      )
    }

    const supabase = createAdminClient()

    // Check if token exists and is valid
    const { data: tokenData, error } = await supabase
      .from('sms1_otp_codes')
      .select('*')
      .eq('code', token)
      .is('used_at', null)
      .gt('expires_at', new Date().toISOString())
      .single()

    if (error || !tokenData) {
      return NextResponse.json(
        { error: 'Invalid or expired reset token' },
        { status: 400 }
      )
    }

    // Type assertion for token data
    const token_data = tokenData as any

    // Token is valid
    return NextResponse.json({
      message: 'Valid reset token',
      email: token_data.email
    })

  } catch (error) {
    console.error('Token validation error:', error)
    return NextResponse.json(
      { error: 'An error occurred while validating the token' },
      { status: 500 }
    )
  }
}