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

async function queryDatabase(query: string): Promise<any> {
  try {
    const { data, error } = await supabase.rpc('execute_query', { query_text: query })
    if (error) throw error
    return data
  } catch (error) {
    console.error('Database query error:', error)
    return null
  }
}

async function getReportStatistics(): Promise<string> {
  try {
    // Get reports from last 2 months
    const twoMonthsAgo = new Date()
    twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2)
    
    const { data: recentReports, error } = await supabase
      .from('sms1_reports')
      .select(`
        id,
        reference_number,
        status,
        priority,
        created_at,
        closed_at,
        sms_schools (
          name,
          sms_regions (name),
          sms_school_levels (name)
        )
      `)
      .gte('created_at', twoMonthsAgo.toISOString())
      .order('created_at', { ascending: false })

    if (error) throw error

    const totalReports = recentReports?.length || 0
    if (totalReports === 0) {
      return "No teacher absence reports have been received in the last 2 months."
    }

    // Calculate statistics
    const statusCounts = {
      open: recentReports?.filter(r => r.status === 'open').length || 0,
      in_progress: recentReports?.filter(r => r.status === 'in_progress').length || 0,
      closed: recentReports?.filter(r => r.status === 'closed').length || 0
    }

    const priorityCounts = {
      high: recentReports?.filter(r => r.priority === 'high').length || 0,
      medium: recentReports?.filter(r => r.priority === 'medium').length || 0,
      low: recentReports?.filter(r => r.priority === 'low').length || 0
    }

    // Calculate average resolution time for closed reports
    const closedReports = recentReports?.filter(r => r.status === 'closed' && r.closed_at) || []
    let avgResolutionDays = 0
    if (closedReports.length > 0) {
      const totalDays = closedReports.reduce((sum, report) => {
        const created = new Date(report.created_at)
        const closed = new Date(report.closed_at!)
        const days = Math.ceil((closed.getTime() - created.getTime()) / (1000 * 60 * 60 * 24))
        return sum + days
      }, 0)
      avgResolutionDays = Math.round(totalDays / closedReports.length)
    }

    // Group by regions
    const regionCounts: { [key: string]: number } = {}
    recentReports?.forEach(report => {
      const regionName = (report.sms_schools as any)?.sms_regions?.name || 'Unknown Region'
      regionCounts[regionName] = (regionCounts[regionName] || 0) + 1
    })

    const currentDate = new Date().toLocaleDateString()
    
    return `I've analyzed the teacher absence reports for the last 2 months. Here's what I found:

<strong>📊 Summary Overview</strong>
We received a total of <strong>${totalReports} reports</strong> since ${new Date(twoMonthsAgo).toLocaleDateString()}.

<strong>📋 Current Status Breakdown:</strong>
• <strong>${statusCounts.open}</strong> reports are still open and need attention
• <strong>${statusCounts.in_progress}</strong> reports are currently being worked on  
• <strong>${statusCounts.closed}</strong> reports have been resolved

<strong>⚡ Priority Levels:</strong>
• High priority: <strong>${priorityCounts.high}</strong> reports
• Medium priority: <strong>${priorityCounts.medium}</strong> reports  
• Low priority: <strong>${priorityCounts.low}</strong> reports

<strong>🎯 Performance Metrics:</strong>
• Resolution rate: <strong>${Math.round((statusCounts.closed / totalReports) * 100)}%</strong>
${statusCounts.closed > 0 ? `• Average time to resolve: <strong>${avgResolutionDays} days</strong>` : '• No reports have been closed yet for timing analysis'}

<strong>🗺️ Regional Breakdown:</strong>
${Object.entries(regionCounts)
  .sort(([,a], [,b]) => b - a)
  .map(([region, count]) => `• <strong>${region}:</strong> ${count} report${count > 1 ? 's' : ''}`)
  .join('<br>')}

<strong>💡 Key Takeaways:</strong>
${statusCounts.open > statusCounts.closed ? 
  `• There's currently a backlog with <strong>${statusCounts.open}</strong> open reports that need attention` :
  '• Good progress - more reports resolved than currently pending'}
${priorityCounts.high > 0 ? 
  `<br>• <strong>${priorityCounts.high}</strong> high-priority cases need immediate action` :
  '<br>• No urgent high-priority cases at the moment'}
${statusCounts.closed === 0 ?
  '<br>• Consider reviewing the assignment and follow-up processes to improve resolution rates' :
  avgResolutionDays > 7 ? 
    '<br>• Resolution time could be improved - consider streamlining processes' :
    '<br>• Resolution time is performing well'}`

  } catch (error) {
    console.error('Error getting report statistics:', error)
    return "I encountered an error while retrieving the report statistics. Please try again or contact your system administrator."
  }
}

const SYSTEM_CONTEXT = `You are EduAlert AI, an intelligent assistant for analyzing teacher absence reports and educational data in Guyana's education system.

You have access to real-time data about teacher absence reports, schools, regions, officers, and system usage. When users ask questions, provide specific data-driven answers based on actual information from the system.

IMPORTANT GUIDELINES:
1. Always provide real data and statistics, not just explanations of what you could do
2. Format responses with bold headings (not markdown **) 
3. Never mention table names, database schemas, or technical implementation details
4. Focus on educational insights and actionable information
5. Use bullet points and clear formatting for readability
6. Be professional and educational-focused
7. When you don't have specific data, clearly state limitations

You can analyze:
- Teacher absence report trends and statistics
- Regional and school performance patterns  
- Officer workload and assignment distributions
- Resolution times and efficiency metrics
- Priority classifications and outcomes
- Historical trends and comparisons`

async function callGeminiAPI(message: string): Promise<string> {
  try {
    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      throw new Error('Gemini API key not configured')
    }

    // Check if this is a question that needs database querying
    let dataContext = ""
    const lowerMessage = message.toLowerCase()
    
    if (lowerMessage.includes('report') && (lowerMessage.includes('month') || lowerMessage.includes('summary') || lowerMessage.includes('statistic'))) {
      dataContext = await getReportStatistics()
    }

    const prompt = `${SYSTEM_CONTEXT}

${dataContext ? `CURRENT DATA CONTEXT:\n${dataContext}\n\n` : ''}

USER QUESTION: ${message}

Provide a helpful, data-driven response. If you have current data context above, use it to give specific answers. Format your response professionally with bold headings and bullet points. Never mention database tables or technical implementation details.

RESPONSE:`

    console.log('Calling Gemini API with key:', apiKey ? 'KEY_EXISTS' : 'NO_KEY')

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 30000) // 30 second timeout

    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }],
          generationConfig: {
            temperature: 0.3,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 2048,
          }
        }),
        signal: controller.signal
      })

      clearTimeout(timeoutId)

      console.log('Gemini API response status:', response.status)

      if (!response.ok) {
        const errorText = await response.text()
        console.error('Gemini API error response:', errorText)
        throw new Error(`Gemini API error: ${response.status} - ${errorText}`)
      }

      const data = await response.json()
      console.log('Gemini API response received:', data ? 'SUCCESS' : 'NO_DATA')
      
      if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
        console.error('Invalid Gemini response structure:', JSON.stringify(data, null, 2))
        throw new Error('Invalid response from Gemini API')
      }

      let responseText = data.candidates[0].content.parts[0].text
      
      // Convert markdown formatting to proper display format
      responseText = responseText
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') // Convert **text** to <strong>text</strong>
        .replace(/\*(.*?)\*/g, '<em>$1</em>') // Convert *text* to <em>text</em>
        .replace(/• /g, '• ') // Ensure bullet points are properly formatted
      
      return responseText

    } finally {
      clearTimeout(timeoutId)
    }

  } catch (error) {
    console.error('Gemini API error:', error)
    
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        throw new Error('Request timeout - Gemini API took too long to respond')
      }
      if (error.message.includes('fetch failed')) {
        throw new Error('Network error - Unable to connect to Gemini API. Please check your internet connection.')
      }
    }
    
    throw error
  }
}

async function checkDailyUsage(userId: string): Promise<{ canAsk: boolean; usage: number; limit: number }> {
  const today = new Date().toISOString().split('T')[0]
  
  const { data, error } = await supabase
    .from('sms1_ai_usage')
    .select('questions_asked')
    .eq('user_id', userId)
    .eq('date', today)
    .single()

  if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
    console.error('Error checking usage:', error)
    return { canAsk: false, usage: 0, limit: 10 }
  }

  const currentUsage = data?.questions_asked || 0
  const dailyLimit = 10

  return {
    canAsk: currentUsage < dailyLimit,
    usage: currentUsage,
    limit: dailyLimit
  }
}

async function incrementUsage(userId: string): Promise<void> {
  const today = new Date().toISOString().split('T')[0]
  
  // First try to update existing record
  const { data: existingRecord } = await supabase
    .from('sms1_ai_usage')
    .select('questions_asked')
    .eq('user_id', userId)
    .eq('date', today)
    .single()

  if (existingRecord) {
    // Update existing record
    const { error } = await supabase
      .from('sms1_ai_usage')
      .update({ 
        questions_asked: existingRecord.questions_asked + 1,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId)
      .eq('date', today)

    if (error) {
      console.error('Error updating usage:', error)
    }
  } else {
    // Insert new record
    const { error } = await supabase
      .from('sms1_ai_usage')
      .insert({
        user_id: userId,
        date: today,
        questions_asked: 1
      })

    if (error) {
      console.error('Error inserting usage:', error)
    }
  }
}

export async function POST(request: NextRequest) {
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
        { error: 'Access denied. Admin or Senior Officer role required.' },
        { status: 403 }
      )
    }

    const { message } = await request.json()

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return NextResponse.json(
        { error: 'Valid message is required' },
        { status: 400 }
      )
    }

    // Check daily usage limit
    const usageCheck = await checkDailyUsage(user.userId)
    if (!usageCheck.canAsk) {
      return NextResponse.json(
        { error: `Daily limit of ${usageCheck.limit} questions reached. Please try again tomorrow.` },
        { status: 429 }
      )
    }

    // Check if this is a question that needs database querying
    let dataContext = ""
    let aiResponse: string
    const lowerMessage = message.trim().toLowerCase()
    
    // For report-related questions, try to get database statistics first
    if (lowerMessage.includes('report') && (lowerMessage.includes('month') || lowerMessage.includes('summary') || lowerMessage.includes('statistic'))) {
      dataContext = await getReportStatistics()
      
      // If we have database data, provide it directly even if Gemini fails
      if (dataContext && !dataContext.includes('error')) {
        aiResponse = dataContext
      } else {
        // Try Gemini API as fallback
        try {
          aiResponse = await callGeminiAPI(message.trim())
        } catch (apiError) {
          console.error('Gemini API failed, using database fallback:', apiError)
          aiResponse = dataContext || `I apologize, but I'm currently unable to process your request. There appears to be an issue accessing both the AI service and the database. Please try again later or contact your system administrator.`
        }
      }
    } else {
      // For other questions, try Gemini API first
      try {
        aiResponse = await callGeminiAPI(message.trim())
      } catch (apiError) {
        console.error('Gemini API failed, using general fallback:', apiError)
        
        // Provide a helpful fallback response
        aiResponse = `I apologize, but I'm currently unable to connect to the AI service. This might be due to network connectivity issues or temporary service unavailability.

Based on your question about "${message.trim()}", here are some insights I can provide about the EduAlert system:

<strong>Available Data in EduAlert:</strong>
• Teacher absence reports with details like school, grade, subject, and teacher name
• Report statuses (open, in progress, closed) and priority levels
• School information organized by regions and education levels
• Officer assignments and notification preferences
• Report comments and updates

<strong>Common Insights I can provide:</strong>
• Report statistics and trends
• Regional and school-level analysis
• Officer workload distribution
• Response time analysis

Please try your question again in a few moments, or contact your system administrator if the issue persists.`
      }
    }

    // Increment usage counter
    await incrementUsage(user.userId)

    return NextResponse.json({
      response: aiResponse,
      usage: {
        questionsUsed: usageCheck.usage + 1,
        dailyLimit: usageCheck.limit
      }
    })

  } catch (error) {
    console.error('AI chat error:', error)
    
    if (error instanceof Error && error.message.includes('Gemini API')) {
      return NextResponse.json(
        { error: 'AI service temporarily unavailable. Please try again later.' },
        { status: 503 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to process AI request' },
      { status: 500 }
    )
  }
}