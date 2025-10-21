import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-here'

export interface JWTPayload {
  userId: string
  email: string
  role: 'officer' | 'senior_officer' | 'admin'
  isApproved: boolean
}

// JWT operations
export const jwtOperations = {
  // Generate JWT token
  sign(payload: JWTPayload): string {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' })
  },

  // Verify and decode JWT token
  verify(token: string): JWTPayload | null {
    try {
      return jwt.verify(token, JWT_SECRET) as JWTPayload
    } catch (error) {
      return null
    }
  }
}

// Password operations
export const passwordOperations = {
  // Hash password
  async hash(password: string): Promise<string> {
    return bcrypt.hash(password, 12)
  },

  // Verify password
  async verify(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash)
  },

  // Validate password strength
  validate(password: string): { isValid: boolean; errors: string[] } {
    const errors: string[] = []
    
    if (password.length < 12) {
      errors.push('Password must be at least 12 characters long')
    }
    
    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter')
    }
    
    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter')
    }
    
    if (!/[0-9]/.test(password)) {
      errors.push('Password must contain at least one number')
    }
    
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push('Password must contain at least one special character')
    }
    
    return {
      isValid: errors.length === 0,
      errors
    }
  }
}

// Email validation
export const emailOperations = {
  // Validate MOE email format
  validateMoeEmail(email: string): boolean {
    const moeEmailRegex = /^[^@]+@moe\.gov\.gy$/i
    return moeEmailRegex.test(email)
  },

  // Normalize email (lowercase, trim)
  normalize(email: string): string {
    return email.toLowerCase().trim()
  }
}

// OTP operations
export const otpHelpers = {
  // Generate 6-digit OTP code
  generate(): string {
    return Math.floor(100000 + Math.random() * 900000).toString()
  },

  // Check if OTP is expired
  isExpired(expiresAt: string): boolean {
    return new Date() > new Date(expiresAt)
  }
}

// Session operations
export const sessionOperations = {
  // Create session data for cookies
  createSession(user: any) {
    const payload: JWTPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
      isApproved: user.is_approved
    }
    
    return {
      token: jwtOperations.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        role: user.role,
        isApproved: user.is_approved
      }
    }
  },

  // Verify session token
  verifySession(token: string) {
    return jwtOperations.verify(token)
  }
}