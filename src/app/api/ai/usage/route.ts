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

// GET - Get current usage info
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser()
    
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Check if user has permission (admin or senior_officer only)
    if (user.role !== 'admin' && user.role !== 'senior_officer') {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      )
    }

    const today = new Date().toISOString().split('T')[0]
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    tomorrow.setHours(0, 0, 0, 0)

    try {
      // Add timeout and better error handling for database query
      const queryPromise = supabase
        .from('sms1_ai_usage')
        .select('questions_asked')
        .eq('user_id', user.userId)
        .eq('date', today)
        .single()

      // Add timeout to prevent hanging
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Database query timeout')), 5000)
      )

      const { data, error } = await Promise.race([queryPromise, timeoutPromise]) as any

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
        console.error('Error fetching usage:', {
          message: error.message,
          details: error.details || error.hint || 'No additional details',
          hint: error.hint || '',
          code: error.code || ''
        })
        
        // Return default values instead of failing
        return NextResponse.json({
          questionsUsed: 0,
          dailyLimit: 10,
          resetsAt: tomorrow.toISOString()
        })
      }

      const questionsUsed = data?.questions_asked || 0
      const dailyLimit = 10

      return NextResponse.json({
        questionsUsed,
        dailyLimit,
        resetsAt: tomorrow.toISOString()
      })
    } catch (dbError) {
      console.error('Database connection error:', dbError)
      
      // Return default values if database is unavailable
      return NextResponse.json({
        questionsUsed: 0,
        dailyLimit: 10,
        resetsAt: tomorrow.toISOString()
      })
    }

  } catch (error) {
    console.error('Usage API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch usage information' },
      { status: 500 }
    )
  }
}

// DELETE - Reset usage (admin only)
export async function DELETE(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser()
    
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Only admins can reset usage
    if (user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      )
    }

    const today = new Date().toISOString().split('T')[0]

    const { error } = await supabase
      .from('sms1_ai_usage')
      .delete()
      .eq('user_id', user.userId)
      .eq('date', today)

    if (error) {
      console.error('Error resetting usage:', error)
      return NextResponse.json(
        { error: 'Failed to reset usage' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: 'Usage reset successfully',
      questionsUsed: 0,
      dailyLimit: 10
    })

  } catch (error) {
    console.error('Reset usage error:', error)
    return NextResponse.json(
      { error: 'Failed to reset usage' },
      { status: 500 }
    )
  }
}