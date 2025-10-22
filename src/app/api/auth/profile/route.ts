import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import { passwordOperations } from '@/lib/auth'
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

async function getAuthenticatedUser(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('auth-token')

    if (!token) {
      return null
    }
    
    const decoded = jwt.verify(token.value, process.env.JWT_SECRET || 'your-secret-key') as any
    return decoded
  } catch (error) {
    console.error('Auth error:', error)
    return null
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request)
    
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Fetch user profile from database
    const { data: userProfile, error } = await supabase
      .from('sms1_users')
      .select('*')
      .eq('id', user.userId)
      .single()
    
    if (error || !userProfile) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      profile: {
        id: userProfile.id,
        email: userProfile.email,
        fullName: userProfile.full_name,
        position: userProfile.position,
        role: userProfile.role,
        isApproved: userProfile.is_approved,
        isVerified: userProfile.is_verified,
        createdAt: userProfile.created_at
      }
    })
  } catch (error) {
    console.error('Error fetching profile:', error)
    return NextResponse.json(
      { error: 'Failed to fetch profile' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request)
    
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { fullName, position, currentPassword, newPassword } = body

    // Validate required fields
    if (!fullName || !position) {
      return NextResponse.json(
        { error: 'Full name and position are required' },
        { status: 400 }
      )
    }

    // Fetch current user profile from database
    const { data: userProfile, error: fetchError } = await supabase
      .from('sms1_users')
      .select('*')
      .eq('id', user.userId)
      .single()
    
    if (fetchError || !userProfile) {
      console.error('Database error:', fetchError)
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Prepare update data
    const updateData: any = {
      full_name: fullName,
      position: position,
      updated_at: new Date().toISOString()
    }

    // If changing password, validate current password and new password
    if (newPassword) {
      if (!currentPassword) {
        return NextResponse.json(
          { error: 'Current password is required to change password' },
          { status: 400 }
        )
      }

      const isCurrentPasswordValid = await bcrypt.compare(currentPassword, userProfile.password_hash)
      if (!isCurrentPasswordValid) {
        return NextResponse.json(
          { error: 'Current password is incorrect' },
          { status: 400 }
        )
      }

      const passwordValidation = passwordOperations.validate(newPassword)
      if (!passwordValidation.isValid) {
        return NextResponse.json(
          { error: 'New password does not meet requirements', details: passwordValidation.errors },
          { status: 400 }
        )
      }

      // Hash new password
      const newPasswordHash = await passwordOperations.hash(newPassword)
      updateData.password_hash = newPasswordHash
    }

    // Update user profile in database
    const { data: updatedProfile, error: updateError } = await supabase
      .from('sms1_users')
      .update(updateData)
      .eq('id', user.userId)
      .select('*')
      .single()

    if (updateError) {
      console.error('Update error:', updateError)
      return NextResponse.json(
        { error: 'Failed to update profile' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: 'Profile updated successfully',
      profile: {
        id: updatedProfile.id,
        email: updatedProfile.email,
        fullName: updatedProfile.full_name,
        position: updatedProfile.position,
        role: updatedProfile.role,
        isApproved: updatedProfile.is_approved,
        isVerified: updatedProfile.is_verified,
        createdAt: updatedProfile.created_at
      }
    })
  } catch (error) {
    console.error('Error updating profile:', error)
    return NextResponse.json(
      { error: 'Failed to update profile' },
      { status: 500 }
    )
  }
}