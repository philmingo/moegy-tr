import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import jwt from 'jsonwebtoken'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

async function getAuthenticatedUser() {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('auth-token')

    if (!token) {
      return null
    }

    const decoded = jwt.verify(token.value, process.env.JWT_SECRET || 'your-secret-key') as any
    return decoded
  } catch (error) {
    return null
  }
}

// GET - Get all users' AI usage (admin only)
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser()
    
    if (!user || user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      )
    }

    const today = new Date().toISOString().split('T')[0]

    const { data, error } = await supabase
      .from('sms1_ai_usage')
      .select(`
        questions_asked,
        date,
        sms1_users (
          full_name,
          email,
          role
        )
      `)
      .eq('date', today)
      .order('questions_asked', { ascending: false })

    if (error) {
      console.error('Error fetching all usage:', error)
      return NextResponse.json(
        { error: 'Failed to fetch usage data' },
        { status: 500 }
      )
    }

    return NextResponse.json({ usage: data || [] })

  } catch (error) {
    console.error('Admin usage API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch usage data' },
      { status: 500 }
    )
  }
}

// DELETE - Reset specific user's usage (admin only)
export async function DELETE(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser()
    
    if (!user || user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const targetUserId = searchParams.get('userId')

    if (!targetUserId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    const today = new Date().toISOString().split('T')[0]

    const { error } = await supabase
      .from('sms1_ai_usage')
      .delete()
      .eq('user_id', targetUserId)
      .eq('date', today)

    if (error) {
      console.error('Error resetting user usage:', error)
      return NextResponse.json(
        { error: 'Failed to reset user usage' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: 'User usage reset successfully'
    })

  } catch (error) {
    console.error('Reset user usage error:', error)
    return NextResponse.json(
      { error: 'Failed to reset user usage' },
      { status: 500 }
    )
  }
}