import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const apiKey = process.env.GEMINI_API_KEY
    
    if (!apiKey) {
      return NextResponse.json({ error: 'API key not found' }, { status: 500 })
    }

    console.log('Testing Gemini API connectivity...')
    
    // Test with a simple request
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 15000) // 15 second timeout
    
    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: "Hello, can you respond with just 'API working'?"
            }]
          }],
          generationConfig: {
            maxOutputTokens: 10,
          }
        }),
        signal: controller.signal
      })

      clearTimeout(timeoutId)

      console.log('Response status:', response.status)
      console.log('Response headers:', Object.fromEntries(response.headers))

      if (!response.ok) {
        const errorText = await response.text()
        console.error('API error response:', errorText)
        return NextResponse.json({ 
          error: `API error: ${response.status}`,
          details: errorText,
          endpoint: 'gemini-2.0-flash-exp'
        })
      }

      const data = await response.json()
      console.log('API response structure:', JSON.stringify(data, null, 2))

      return NextResponse.json({ 
        success: true, 
        response: data,
        endpoint: 'gemini-2.0-flash-exp'
      })

    } finally {
      clearTimeout(timeoutId)
    }

  } catch (error) {
    console.error('Connection test error:', error)
    
    let errorMessage = 'Unknown error'
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        errorMessage = 'Request timeout after 15 seconds'
      } else if (error.message.includes('fetch failed')) {
        errorMessage = 'Network connection failed - possible firewall or DNS issue'
      } else {
        errorMessage = error.message
      }
    }

    return NextResponse.json({ 
      error: errorMessage,
      type: error instanceof Error ? error.name : 'Unknown',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}