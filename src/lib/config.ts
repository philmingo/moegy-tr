// Environment variables configuration
export const env = {
  // Supabase Configuration
  SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  
  // SendGrid Configuration
  SENDGRID_API_KEY: process.env.SENDGRID_API_KEY || '',
  SENDGRID_FROM_EMAIL: process.env.SENDGRID_FROM_EMAIL || 'noreply@moe.gov.gy',
  
  // Gemini AI Configuration
  GEMINI_API_KEY: process.env.GEMINI_API_KEY || '',
  
  // JWT Configuration
  JWT_SECRET: process.env.JWT_SECRET || 'your-jwt-secret-here',
  
  // App Configuration
  APP_URL: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  
  // Email Configuration
  OTP_EXPIRY_MINUTES: 5,
  
  // Default Admin
  DEFAULT_ADMIN_EMAIL: 'phil.mingo@moe.gov.gy',
  DEFAULT_ADMIN_PASSWORD: 'Admin@123456789',
}

// Validate required environment variables
export function validateEnv() {
  const required = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
    'SENDGRID_API_KEY',
    'GEMINI_API_KEY',
    'JWT_SECRET'
  ]
  
  const missing = required.filter(key => !process.env[key])
  
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`)
  }
}