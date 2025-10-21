import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
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

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthenticatedUser()
    
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Only allow admin and senior_officer roles to update officers
    if (!['admin', 'senior_officer'].includes(user.role)) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    const { id } = await params
    const body = await request.json()
    const { full_name, position, role, is_approved, password } = body

    // Validate role permissions
    if (role === 'admin' && user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Only admins can assign admin role' },
        { status: 403 }
      )
    }

    const updateData: any = {}
    if (full_name !== undefined) updateData.full_name = full_name
    if (position !== undefined) updateData.position = position
    if (role !== undefined) updateData.role = role
    if (is_approved !== undefined) updateData.is_approved = is_approved
    if (password) {
      updateData.password_hash = await bcrypt.hash(password, 12)
    }
    
    updateData.updated_at = new Date().toISOString()

    const { error } = await supabase
      .from('sms1_users')
      .update(updateData)
      .eq('id', id)

    if (error) {
      console.error('Error updating officer:', error)
      return NextResponse.json(
        { error: 'Failed to update officer' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: 'Officer updated successfully'
    })

  } catch (error) {
    console.error('Error in update officer API:', error)
    return NextResponse.json(
      { error: 'Failed to update officer' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthenticatedUser()
    
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Only allow admin role to delete officers
    if (user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Only admins can delete officers' },
        { status: 403 }
      )
    }

    const { id } = await params

    // Prevent self-deletion
    if (id === user.userId) {
      return NextResponse.json(
        { error: 'Cannot delete your own account' },
        { status: 400 }
      )
    }

    const { error } = await supabase
      .from('sms1_users')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting officer:', error)
      return NextResponse.json(
        { error: 'Failed to delete officer' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: 'Officer deleted successfully'
    })

  } catch (error) {
    console.error('Error in delete officer API:', error)
    return NextResponse.json(
      { error: 'Failed to delete officer' },
      { status: 500 }
    )
  }
}