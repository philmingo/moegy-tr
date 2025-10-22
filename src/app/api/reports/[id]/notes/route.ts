import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { jwtOperations } from '@/lib/auth'

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

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: reportId } = await params
    const body = await request.json()
    const { content } = body

    // Validate content
    if (!content || content.trim().length === 0) {
      return NextResponse.json(
        { error: 'Note content is required' },
        { status: 400 }
      )
    }

    // Get user from authentication
    const cookieStore = await cookies()
    const authToken = cookieStore.get('auth-token')?.value

    if (!authToken) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const userData = jwtOperations.verify(authToken)
    if (!userData) {
      return NextResponse.json(
        { error: 'Invalid authentication' },
        { status: 401 }
      )
    }

    // Verify report exists
    const { data: report, error: reportError } = await supabase
      .from('sms1_reports')
      .select('id')
      .eq('id', reportId)
      .single()

    if (reportError || !report) {
      return NextResponse.json(
        { error: 'Report not found' },
        { status: 404 }
      )
    }

    // Get user details
    const { data: user, error: userError } = await supabase
      .from('sms1_users')
      .select('id, full_name, position, role')
      .eq('id', userData.userId)
      .single()

    if (userError || !user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Create the note
    const { data: note, error: noteError } = await supabase
      .from('sms1_report_comments')
      .insert({
        report_id: reportId,
        user_id: userData.userId,
        comment: content.trim(),
        created_at: new Date().toISOString()
      })
      .select(`
        id,
        comment,
        created_at,
        user_id,
        sms1_users (
          id,
          full_name,
          position,
          role
        )
      `)
      .single()

    if (noteError) {
      console.error('Error creating note:', noteError)
      return NextResponse.json(
        { error: 'Failed to create note' },
        { status: 500 }
      )
    }

    // Format the response to match the expected structure
    const noteUser = Array.isArray(note.sms1_users) ? note.sms1_users[0] : note.sms1_users;
    const formattedNote = {
      id: note.id,
      content: note.comment,
      createdAt: note.created_at,
      officer: {
        name: noteUser?.full_name || user.full_name || 'Unknown User',
        title: noteUser?.position || user.position || 'Unknown Position'
      }
    }

    return NextResponse.json({
      message: 'Note created successfully',
      note: formattedNote
    })

  } catch (error) {
    console.error('Error in notes API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}