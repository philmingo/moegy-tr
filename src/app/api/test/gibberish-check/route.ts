import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { teacherName, description, subject } = await request.json()

    // Test the gibberish detection logic
    const isGibberish = (text: string): boolean => {
      if (!text || text.trim().length < 2) return false
      
      const gibberishPatterns = [
        /^[a-z]{2,}\s+[a-z]{2,}\s+[a-z]{2,}/i, // Multiple random letter sequences
        /^(df|sd|fs|ds|as|qw|er|ty|ui|op|zx|cv|bn){2,}/i, // Keyboard mashing patterns
        /[a-z]{8,}/i, // Very long letter sequences without spaces
        /^[a-z]{1,3}\s+[a-z]{1,3}\s+[a-z]{1,3}/i, // Short random sequences
        /^(test|asdf|qwer|zxcv|dfgh|sdfg)/i, // Common test patterns
      ]
      
      return gibberishPatterns.some(pattern => pattern.test(text.trim()))
    }

    const teacherGibberish = isGibberish(teacherName)
    const descriptionGibberish = isGibberish(description)
    const subjectGibberish = isGibberish(subject)

    return NextResponse.json({
      results: {
        teacherName: {
          text: teacherName,
          isGibberish: teacherGibberish
        },
        description: {
          text: description,
          isGibberish: descriptionGibberish
        },
        subject: {
          text: subject,
          isGibberish: subjectGibberish
        }
      },
      overall: {
        hasGibberish: teacherGibberish || descriptionGibberish || subjectGibberish,
        shouldReject: teacherGibberish || descriptionGibberish || subjectGibberish
      }
    })

  } catch (error) {
    console.error('Gibberish check error:', error)
    return NextResponse.json(
      { error: 'Failed to check for gibberish' },
      { status: 500 }
    )
  }
}