import { NextRequest, NextResponse } from 'next/server'
import { sendWelcomeEmail, sendAssignmentNotification } from '@/lib/email'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { type, email, ...data } = body

    if (type === 'welcome') {
      const { name, role } = data
      const success = await sendWelcomeEmail(email, name, role)
      return NextResponse.json({ success, type: 'welcome' })
    }
    
    if (type === 'assignment') {
      const { officerName, reportDetails } = data
      const success = await sendAssignmentNotification(email, officerName, reportDetails)
      return NextResponse.json({ success, type: 'assignment' })
    }

    return NextResponse.json({ error: 'Invalid email type' }, { status: 400 })
    
  } catch (error) {
    console.error('Email test error:', error)
    return NextResponse.json({ 
      error: 'Failed to send test email',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}