'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Send, Brain, User, Bot, AlertCircle, RotateCcw } from 'lucide-react'
import Navigation from '@/components/Navigation'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

interface UserProfile {
  role: string
  email: string
  fullName: string
}

interface UsageInfo {
  questionsUsed: number
  dailyLimit: number
  resetsAt: string
}

export default function AIPage() {
  const router = useRouter()
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [user, setUser] = useState<UserProfile | null>(null)
  const [usage, setUsage] = useState<UsageInfo>({ questionsUsed: 0, dailyLimit: 10, resetsAt: '' })
  const [authLoading, setAuthLoading] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    checkAuthAndLoadData()
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const checkAuthAndLoadData = async () => {
    try {
      const authResponse = await fetch('/api/auth/validate')
      if (!authResponse.ok) {
        router.push('/admin')
        return
      }

      const authData = await authResponse.json()
      const userRole = authData.user.role

      // Check if user has permission (admin or senior_officer only)
      if (userRole !== 'admin' && userRole !== 'senior_officer') {
        router.push('/dashboard')
        return
      }

      setUser({
        role: userRole,
        email: authData.user.email,
        fullName: authData.user.email.split('@')[0].replace('.', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())
      })

      // Load usage information asynchronously (don't block UI)
      loadUsageInfo() // Remove await to make this non-blocking

      // Add welcome message
      setMessages([{
        id: '1',
        role: 'assistant',
        content: `Hello! I'm EduAlert AI, your intelligent assistant for analyzing teacher absence reports and educational data. I can help you with insights about reports, statistics, trends, and answer questions based on the data in our system.\n\nWhat would you like to know about?`,
        timestamp: new Date()
      }])

    } catch (error) {
      console.error('Auth check failed:', error)
      router.push('/admin')
    } finally {
      setAuthLoading(false)
    }
  }

  const loadUsageInfo = async () => {
    try {
      // Add a timeout to prevent hanging
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 5000) // 5 second timeout
      
      const response = await fetch('/api/ai/usage', {
        signal: controller.signal
      })
      
      clearTimeout(timeoutId)
      
      if (response.ok) {
        const data = await response.json()
        setUsage(data)
      } else {
        console.warn('Usage API returned error:', response.status)
        // Use default values if API fails
        setUsage({ questionsUsed: 0, dailyLimit: 10, resetsAt: '' })
      }
    } catch (error) {
      console.error('Failed to load usage info:', error)
      // Use default values if fetch fails
      setUsage({ questionsUsed: 0, dailyLimit: 10, resetsAt: '' })
    }
  }

  const resetUsage = async () => {
    if (user?.role !== 'admin') return

    try {
      const response = await fetch('/api/ai/usage', {
        method: 'DELETE'
      })
      if (response.ok) {
        await loadUsageInfo()
      }
    } catch (error) {
      console.error('Failed to reset usage:', error)
    }
  }

  const sendMessage = async () => {
    if (!input.trim() || isLoading || usage.questionsUsed >= usage.dailyLimit) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: input.trim() })
      })

      if (!response.ok) {
        throw new Error('Failed to get AI response')
      }

      const data = await response.json()

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.response,
        timestamp: new Date()
      }

      setMessages(prev => [...prev, aiMessage])
      setUsage(prev => ({ ...prev, questionsUsed: prev.questionsUsed + 1 }))

    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Sorry, I encountered an error while processing your question. Please try again.',
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading EduAlert AI...</p>
        </div>
      </div>
    )
  }

  if (!user) return null

  const isAtLimit = usage.questionsUsed >= usage.dailyLimit

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => router.back()}
            className="inline-flex items-center text-primary-600 hover:text-primary-700 mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </button>
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Brain className="w-8 h-8 text-primary-600 mr-3" />
              <div>
                <h1 className="text-3xl font-bold text-gray-900">EduAlert AI</h1>
                <p className="text-gray-600">Intelligent insights from your education data</p>
              </div>
            </div>
            
            {/* Usage Counter */}
            <div className="text-right">
              <div className="flex items-center space-x-2">
                <div className="text-sm text-gray-600">
                  <span className={`font-medium ${isAtLimit ? 'text-red-600' : 'text-gray-900'}`}>
                    {usage.questionsUsed}/{usage.dailyLimit}
                  </span> questions today
                </div>
                {user.role === 'admin' && (
                  <button
                    onClick={resetUsage}
                    className="p-1 text-gray-400 hover:text-gray-600"
                    title="Reset usage counter"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                )}
              </div>
              <div className="text-xs text-gray-500">
                Resets: {new Date(usage.resetsAt).toLocaleDateString()}
              </div>
            </div>
          </div>
        </div>

        {/* Chat Container */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 h-[600px] flex flex-col">
          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-lg px-4 py-3 ${
                    message.role === 'user'
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-100 text-gray-900'
                  }`}
                >
                  <div className="flex items-start space-x-2">
                    {message.role === 'assistant' && (
                      <Bot className="w-5 h-5 text-primary-600 flex-shrink-0 mt-0.5" />
                    )}
                    {message.role === 'user' && (
                      <User className="w-5 h-5 text-white flex-shrink-0 mt-0.5" />
                    )}
                    <div className="flex-1">
                      <div 
                        className="whitespace-pre-wrap"
                        dangerouslySetInnerHTML={{ 
                          __html: message.content.replace(/\n/g, '<br/>') 
                        }}
                      />
                      <div className={`text-xs mt-2 ${
                        message.role === 'user' ? 'text-primary-200' : 'text-gray-500'
                      }`}>
                        {message.timestamp.toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 rounded-lg px-4 py-3 max-w-[80%]">
                  <div className="flex items-center space-x-2">
                    <Bot className="w-5 h-5 text-primary-600" />
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="border-t border-gray-200 p-4">
            {isAtLimit ? (
              <div className="flex items-center justify-center p-4 bg-amber-50 rounded-lg border border-amber-200">
                <AlertCircle className="w-5 h-5 text-amber-600 mr-2" />
                <span className="text-amber-700">
                  You&apos;ve reached your daily limit of {usage.dailyLimit} questions. 
                  {user.role === 'admin' ? ' Click the reset button above to continue.' : ' Please try again tomorrow.'}
                </span>
              </div>
            ) : (
              <div className="flex space-x-3">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask me anything about your education data..."
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                  rows={1}
                  disabled={isLoading}
                />
                <button
                  onClick={sendMessage}
                  disabled={!input.trim() || isLoading}
                  className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Info Card */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-medium text-blue-900 mb-2">What I can help you with:</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Report statistics and trends analysis</li>
            <li>• School and regional performance insights</li>
            <li>• Teacher absence patterns</li>
            <li>• Data-driven recommendations</li>
            <li>• System usage and performance metrics</li>
          </ul>
        </div>
      </div>
    </div>
  )
}