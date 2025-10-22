'use client'

import { useState } from 'react'
import Link from 'next/link'
import Navigation from '@/components/Navigation'
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send reset email')
      }

      setIsSubmitted(true)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation showAuthButtons={false} />
        <div className="py-8">
          <div className="container mx-auto px-4 max-w-md">
            <div className="bg-white rounded-xl shadow-sm border p-8 text-center">
              <CheckCircle className="h-16 w-16 text-success-500 mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-gray-900 mb-4">Check Your Email</h1>
              <p className="text-gray-600 mb-6">
                If an account with <strong>{email}</strong> exists, we&apos;ve sent you a 6-digit reset code.
              </p>
              <p className="text-sm text-gray-500 mb-6">
                Please check your email for the 6-digit code and use it to reset your password. 
                The code will expire in 15 minutes for security reasons.
              </p>
              <div className="space-y-3">
                <Link 
                  href="/admin/reset-password"
                  className="block w-full bg-primary-500 hover:bg-primary-600 text-white py-3 px-6 rounded-lg font-semibold transition-colors duration-200"
                >
                  Enter Reset Code
                </Link>
                <Link 
                  href="/admin"
                  className="block w-full bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 px-6 rounded-lg font-semibold transition-colors duration-200"
                >
                  Back to Login
                </Link>
                <button
                  onClick={() => {
                    setIsSubmitted(false)
                    setEmail('')
                  }}
                  className="block w-full text-primary-600 hover:text-primary-700 py-2 text-sm"
                >
                  Try different email
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation showAuthButtons={false} />
      <div className="py-8">
        <div className="container mx-auto px-4 max-w-md">
          <div className="bg-white rounded-xl shadow-sm border p-8">
            <div className="text-center mb-8">
              <Mail className="h-12 w-12 text-primary-500 mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Reset Your Password</h1>
              <p className="text-gray-600">
                Enter your email address and we&apos;ll send you a 6-digit code to reset your password.
              </p>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-error-50 border border-error-200 rounded-lg">
                <p className="text-error-700 text-sm">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address *
                </label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your.email@moe.gov.gy"
                  className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Must be a valid @moe.gov.gy email address
                </p>
              </div>

              <button 
                type="submit"
                disabled={isLoading || !email}
                className="w-full bg-primary-500 hover:bg-primary-600 disabled:bg-gray-400 text-white py-3 px-6 rounded-lg font-semibold transition-colors duration-200"
              >
                {isLoading ? 'Sending...' : 'Send Reset Code'}
              </button>
            </form>

            <div className="mt-6 text-center">
              <Link 
                href="/admin" 
                className="inline-flex items-center text-sm text-primary-600 hover:text-primary-700"
              >
                <ArrowLeft className="h-4 w-4 mr-1" />
                Back to Login
              </Link>
            </div>

            <div className="mt-6 p-4 bg-info-50 border border-info-200 rounded-lg">
              <p className="text-info-700 text-xs">
                <strong>Security Note:</strong> Reset codes expire after 15 minutes. 
                If you don&apos;t receive an email, check your spam folder or contact your system administrator.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}