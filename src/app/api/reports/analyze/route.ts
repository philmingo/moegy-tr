import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendReportNotifications } from '@/lib/notifications'

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

async function analyzeReportWithAI(reportData: any): Promise<{ isValid: boolean; reason: string; confidence: number }> {
  try {
    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      throw new Error('Gemini API key not configured')
    }

    const analysisPrompt = `You are an AI assistant for the Guyana Ministry of Education's teacher absence reporting system. 

Please analyze this teacher absence report and determine if it contains meaningful, legitimate information that warrants investigation by education officers.

Report Details:
- School: ${reportData.schoolName}
- Grade: ${reportData.grade}
- Teacher Name: ${reportData.teacherName}
- Subject: ${reportData.subject}
- Reporter Type: ${reportData.reporterType}
- Description: ${reportData.description}

Analyze for:
1. GIBBERISH DETECTION: Does the content appear to be random characters, keyboard mashing, or nonsensical text?
2. MEANINGFUL CONTENT: Does the report contain coherent, actionable information about a teacher absence?
3. LEGITIMATE CONCERN: Is this a genuine educational issue that requires investigation?

Examples of INVALID reports (mark as gibberish):
- Teacher names like "dfdsklfsd", "asdfgh", "random text"
- Descriptions like "df dsfsd sdffsdf", "keyboard mashing", "test test test"
- Subject fields with gibberish like "llfsd fsdlfsdfk"
- Any combination that seems like test data or spam

Examples of VALID reports:
- Real teacher names (even if misspelled): "John Smith", "Mary Johnson"
- Coherent descriptions: "Teacher was absent for 3 days without notice"
- Proper subjects: "Mathematics", "English", "Science"

Be strict about detecting gibberish and test data. If ANY major field contains nonsensical content, mark the entire report as invalid.

Respond with a JSON object containing:
{
  "isValid": true/false,
  "reason": "Clear explanation focusing on whether content is gibberish or legitimate",
  "confidence": 0.1-1.0 (confidence level)
}`

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: analysisPrompt
          }]
        }],
        generationConfig: {
          temperature: 0.1,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 500,
        }
      }),
      signal: AbortSignal.timeout(15000) // 15 second timeout
    })

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status}`)
    }

    const data = await response.json()
    const aiResponse = data.candidates[0].content.parts[0].text

    // Extract JSON from AI response
    const jsonMatch = aiResponse.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error('Invalid AI response format')
    }

    const analysis = JSON.parse(jsonMatch[0])
    
    // Validate response structure
    if (typeof analysis.isValid !== 'boolean' || 
        typeof analysis.reason !== 'string' || 
        typeof analysis.confidence !== 'number') {
      throw new Error('Invalid analysis structure')
    }

    return analysis

  } catch (error) {
    console.error('AI analysis error:', error)
    
    // Default to keeping report open if AI analysis fails - let manual review handle it
    return {
      isValid: true,
      reason: 'AI analysis unavailable - report requires manual review',
      confidence: 0.3
    }
  }
}

async function addSystemComment(reportId: string, comment: string, userId: string | null = null) {
  try {
    const insertData: any = {
      report_id: reportId,
      comment: comment,
      created_at: new Date().toISOString()
    }
    
    // Only add user_id if provided and not 'system'
    if (userId && userId !== 'system') {
      insertData.user_id = userId
    }
    
    const { error } = await supabase
      .from('sms1_report_comments')
      .insert(insertData)

    if (error) {
      console.error('Error adding system comment:', error)
    }
  } catch (error) {
    console.error('Error adding system comment:', error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const { reportId } = await request.json()

    if (!reportId) {
      return NextResponse.json(
        { error: 'Report ID is required' },
        { status: 400 }
      )
    }

    // Get the report details
    const { data: report, error: reportError } = await supabase
      .from('sms1_reports')
      .select(`
        id,
        reference_number,
        grade,
        teacher_name,
        subject,
        reporter_type,
        description,
        status,
        sms_schools (
          name,
          code
        )
      `)
      .eq('id', reportId)
      .single()

    if (reportError || !report) {
      return NextResponse.json(
        { error: 'Report not found' },
        { status: 404 }
      )
    }

    // Only analyze reports that are currently open
    if (report.status !== 'open') {
      return NextResponse.json(
        { error: 'Report is not in open status' },
        { status: 400 }
      )
    }

    // Prepare data for AI analysis
    const reportData = {
      schoolName: (report.sms_schools as any)?.name || 'Unknown School',
      grade: report.grade,
      teacherName: report.teacher_name,
      subject: report.subject,
      reporterType: report.reporter_type,
      description: report.description
    }

    // Analyze with AI
    const analysis = await analyzeReportWithAI(reportData)

    if (!analysis.isValid) {
      // Close the report and add explanation comment
      const { error: updateError } = await supabase
        .from('sms1_reports')
        .update({ 
          status: 'closed',
          closed_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', reportId)

      if (updateError) {
        console.error('Error updating report status:', updateError)
        return NextResponse.json(
          { error: 'Failed to update report status' },
          { status: 500 }
        )
      }

      // Add system comment explaining closure
      await addSystemComment(
        reportId, 
        `🤖 AI ANALYSIS - REPORT AUTOMATICALLY CLOSED\n\n${analysis.reason}\n\nConfidence Level: ${Math.round(analysis.confidence * 100)}%\n\nThis report was determined to contain gibberish or test data. If you believe this was closed in error, please contact an administrator to reopen it.`
      )

      return NextResponse.json({
        action: 'closed',
        reason: analysis.reason,
        confidence: analysis.confidence,
        message: 'Report automatically closed - AI detected gibberish or test data'
      })
    } else {
      // Report is valid - add analysis comment and keep open
      await addSystemComment(
        reportId,
        `✅ AI ANALYSIS - REPORT APPROVED\n\n${analysis.reason}\n\nConfidence Level: ${Math.round(analysis.confidence * 100)}%\n\nThis report has been reviewed and approved for investigation. Notifications have been sent to relevant officers.`
      )

      // Send notifications to relevant officers (async, don't block response)
      sendReportNotifications(reportId).catch((error: any) => {
        console.error('Failed to send notifications:', error)
      })

      return NextResponse.json({
        action: 'approved',
        reason: analysis.reason,
        confidence: analysis.confidence,
        message: 'Report approved for investigation and notifications sent'
      })
    }

  } catch (error) {
    console.error('Error in report analysis:', error)
    return NextResponse.json(
      { error: 'Failed to analyze report' },
      { status: 500 }
    )
  }
}