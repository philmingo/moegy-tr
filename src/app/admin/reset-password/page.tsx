'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import Navigation from '@/components/Navigation'
import { Key, ArrowLeft, CheckCircle, Eye, EyeOff } from 'lucide-react'

export default function ResetPasswordPage() {
  const [code, setCode] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [error, setError] = useState('')
  const [step, setStep] = useState<'validate' | 'reset'>('validate')
  const router = useRouter()

  const handleValidateCode = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      const response = await fetch('/api/auth/validate-reset-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Invalid code')
      }

      setStep('reset')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      setIsLoading(false)
      return
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters long')
      setIsLoading(false)
      return
    }

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code, password })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to reset password')
      }

      setIsSubmitted(true)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  // Format code input to show as XXX-XXX
  const formatCode = (value: string) => {
    const numbers = value.replace(/\D/g, '').slice(0, 6)
    if (numbers.length <= 3) {
      return numbers
    }
    return `${numbers.slice(0, 3)}-${numbers.slice(3)}`
  }

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCode(e.target.value)
    setCode(formatted.replace('-', ''))
  }

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation showAuthButtons={false} />
        <div className="py-8">
          <div className="container mx-auto px-4 max-w-md">
            <div className="bg-white rounded-xl shadow-sm border p-8 text-center">
              <CheckCircle className="h-16 w-16 text-success-500 mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-gray-900 mb-4">Password Reset Successfully</h1>
              <p className="text-gray-600 mb-6">
                Your password has been reset successfully. You can now log in with your new password.
              </p>
              <Link 
                href="/admin"
                className="block w-full bg-primary-500 hover:bg-primary-600 text-white py-3 px-6 rounded-lg font-semibold transition-colors duration-200"
              >
                Go to Login
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (step === 'validate') {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation showAuthButtons={false} />
        <div className="py-8">
          <div className="container mx-auto px-4 max-w-md">
            <div className="bg-white rounded-xl shadow-sm border p-8">
              <div className="text-center mb-8">
                <Key className="h-12 w-12 text-primary-500 mx-auto mb-4" />
                <h1 className="text-2xl font-bold text-gray-900 mb-2">Enter Reset Code</h1>
                <p className="text-gray-600">
                  Enter the 6-digit code sent to your email address.
                </p>
              </div>

              {error && (
                <div className="mb-6 p-4 bg-error-50 border border-error-200 rounded-lg">
                  <p className="text-error-700 text-sm">{error}</p>
                </div>
              )}

              <form onSubmit={handleValidateCode} className="space-y-6">
                <div>
                  <label htmlFor="code" className="block text-sm font-medium text-gray-700 mb-2">
                    Reset Code *
                  </label>
                  <input
                    type="text"
                    id="code"
                    value={formatCode(code)}
                    onChange={handleCodeChange}
                    placeholder="123-456"
                    className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-center text-lg font-mono tracking-wider"
                    maxLength={7}
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Enter the 6-digit code from your email
                  </p>
                </div>

                <button 
                  type="submit"
                  disabled={isLoading || code.length !== 6}
                  className="w-full bg-primary-500 hover:bg-primary-600 disabled:bg-gray-400 text-white py-3 px-6 rounded-lg font-semibold transition-colors duration-200"
                >
                  {isLoading ? 'Validating...' : 'Validate Code'}
                </button>
              </form>

              <div className="mt-6 text-center space-y-3">
                <Link 
                  href="/admin/forgot-password" 
                  className="inline-flex items-center text-sm text-primary-600 hover:text-primary-700"
                >
                  Didn&apos;t receive a code? Request new one
                </Link>
                <br />
                <Link 
                  href="/admin" 
                  className="inline-flex items-center text-sm text-gray-600 hover:text-gray-700"
                >
                  <ArrowLeft className="h-4 w-4 mr-1" />
                  Back to Login
                </Link>
              </div>

              <div className="mt-6 p-4 bg-info-50 border border-info-200 rounded-lg">
                <p className="text-info-700 text-xs">
                  <strong>Security Note:</strong> Reset codes expire after 15 minutes. 
                  If your code has expired, request a new one.
                </p>
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
              <Key className="h-12 w-12 text-primary-500 mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Set New Password</h1>
              <p className="text-gray-600">
                Create a new secure password for your account.
              </p>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-error-50 border border-error-200 rounded-lg">
                <p className="text-error-700 text-sm">{error}</p>
              </div>
            )}

            <form onSubmit={handleResetPassword} className="space-y-6">
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                  New Password *
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter new password"
                    className="w-full px-3 py-3 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Must be at least 8 characters long
                </p>
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                  Confirm New Password *
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    id="confirmPassword"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                    className="w-full px-3 py-3 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              <button 
                type="submit"
                disabled={isLoading || !password || !confirmPassword}
                className="w-full bg-primary-500 hover:bg-primary-600 disabled:bg-gray-400 text-white py-3 px-6 rounded-lg font-semibold transition-colors duration-200"
              >
                {isLoading ? 'Resetting...' : 'Reset Password'}
              </button>
            </form>

            <div className="mt-6 text-center">
              <button 
                onClick={() => setStep('validate')}
                className="inline-flex items-center text-sm text-gray-600 hover:text-gray-700"
              >
                <ArrowLeft className="h-4 w-4 mr-1" />
                Back to Code Validation
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}