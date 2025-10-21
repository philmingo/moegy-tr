import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import { passwordOperations } from '@/lib/auth'

// Mock user data (in real app, this would be from database)
const mockUsers = [
  {
    id: 'admin1',
    email: 'phil.mingo@moe.gov.gy',
    passwordHash: '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewreZhh8YJrHiFPa', // Admin@123456789
    fullName: 'Phil Mingo',
    position: 'System Administrator',
    role: 'admin',
    isApproved: true,
    isVerified: true,
    createdAt: '2024-01-01T00:00:00Z'
  },
  {
    id: 'officer1',
    email: 'j.martinez@moe.gov.gy',
    passwordHash: '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewreZhh8YJrHiFPa',
    fullName: 'John Martinez',
    position: 'Education Officer',
    role: 'officer',
    isApproved: true,
    isVerified: true,
    createdAt: '2024-01-01T00:00:00Z'
  }
]

async function getAuthenticatedUser(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('auth-token')

    console.log('Cookie found:', !!token) // Debug log

    if (!token) {
      return null
    }

    console.log('Token value:', token.value.substring(0, 20) + '...') // Debug log (partial)
    
    const decoded = jwt.verify(token.value, process.env.JWT_SECRET || 'your-secret-key') as any
    console.log('Decoded token:', decoded) // Debug log
    return decoded
  } catch (error) {
    console.error('Auth error:', error) // Debug log
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

    console.log('Authenticated user:', user) // Debug log
    
    const userProfile = mockUsers.find(u => u.email === user.email)
    
    if (!userProfile) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      profile: {
        id: userProfile.id,
        email: userProfile.email,
        fullName: userProfile.fullName,
        position: userProfile.position,
        role: userProfile.role,
        isApproved: userProfile.isApproved,
        isVerified: userProfile.isVerified,
        createdAt: userProfile.createdAt
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

    const userProfile = mockUsers.find(u => u.email === user.email)
    
    if (!userProfile) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // If changing password, validate current password and new password
    if (newPassword) {
      if (!currentPassword) {
        return NextResponse.json(
          { error: 'Current password is required to change password' },
          { status: 400 }
        )
      }

      const isCurrentPasswordValid = await bcrypt.compare(currentPassword, userProfile.passwordHash)
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
      userProfile.passwordHash = newPasswordHash
    }

    // Update user profile
    userProfile.fullName = fullName
    userProfile.position = position

    return NextResponse.json({
      message: 'Profile updated successfully',
      profile: {
        id: userProfile.id,
        email: userProfile.email,
        fullName: userProfile.fullName,
        position: userProfile.position,
        role: userProfile.role,
        isApproved: userProfile.isApproved,
        isVerified: userProfile.isVerified,
        createdAt: userProfile.createdAt
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