import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { code } = body

    if (!code) {
      return NextResponse.json(
        { error: 'Reset code is required' },
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

    const supabase = createAdminClient()

    // Check if code exists and is valid
    const { data: codeData, error } = await supabase
      .from('sms1_otp_codes')
      .select('*')
      .eq('code', code)
      .is('used_at', null)
      .gt('expires_at', new Date().toISOString())
      .single()

    if (error || !codeData) {
      return NextResponse.json(
        { error: 'Invalid or expired reset code' },
        { status: 400 }
      )
    }

    // Type assertion for code data
    const code_data = codeData as any

    // Code is valid
    return NextResponse.json({
      message: 'Valid reset code',
      email: code_data.email,
      codeId: code_data.id
    })

  } catch (error) {
    console.error('Code validation error:', error)
    return NextResponse.json(
      { error: 'An error occurred while validating the code' },
      { status: 500 }
    )
  }
}