'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Navigation from '@/components/Navigation'
import { Lock, Eye, EyeOff, CheckCircle, AlertCircle } from 'lucide-react'

export default function ResetPasswordPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isValidToken, setIsValidToken] = useState(false)
  const [isCheckingToken, setIsCheckingToken] = useState(true)
  const [isSuccess, setIsSuccess] = useState(false)
  const [error, setError] = useState('')

  // Validate token on component mount
  useEffect(() => {
    const validateToken = async () => {
      if (!token) {
        setError('Invalid or missing reset token')
        setIsCheckingToken(false)
        return
      }

      try {
        const response = await fetch('/api/auth/validate-reset-token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ token })
        })

        if (response.ok) {
          setIsValidToken(true)
        } else {
          const data = await response.json()
          setError(data.error || 'Invalid or expired reset token')
        }
      } catch (err) {
        setError('Failed to validate reset token')
      } finally {
        setIsCheckingToken(false)
      }
    }

    validateToken()
  }, [token])

  const validatePassword = (pass: string) => {
    if (pass.length < 8) return false
    if (!/[A-Z]/.test(pass)) return false
    if (!/[a-z]/.test(pass)) return false
    if (!/[0-9]/.test(pass)) return false
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(pass)) return false
    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    // Validate passwords
    if (!validatePassword(password)) {
      setError('Password must be at least 8 characters with uppercase, lowercase, number, and special character')
      setIsLoading(false)
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      setIsLoading(false)
      return
    }

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token, password })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to reset password')
      }

      setIsSuccess(true)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  if (isCheckingToken) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation showAuthButtons={false} />
        <div className="py-8">
          <div className="container mx-auto px-4 max-w-md">
            <div className="bg-white rounded-xl shadow-sm border p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500 mx-auto mb-4"></div>
              <p className="text-gray-600">Validating reset token...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!isValidToken) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation showAuthButtons={false} />
        <div className="py-8">
          <div className="container mx-auto px-4 max-w-md">
            <div className="bg-white rounded-xl shadow-sm border p-8 text-center">
              <AlertCircle className="h-16 w-16 text-error-500 mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-gray-900 mb-4">Invalid Reset Link</h1>
              <p className="text-gray-600 mb-6">{error}</p>
              <div className="space-y-3">
                <Link 
                  href="/admin/forgot-password"
                  className="block w-full bg-primary-500 hover:bg-primary-600 text-white py-3 px-6 rounded-lg font-semibold transition-colors duration-200"
                >
                  Request New Reset Link
                </Link>
                <Link 
                  href="/admin"
                  className="block w-full text-primary-600 hover:text-primary-700 py-2 text-sm"
                >
                  Back to Login
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (isSuccess) {
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

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation showAuthButtons={false} />
      <div className="py-8">
        <div className="container mx-auto px-4 max-w-md">
          <div className="bg-white rounded-xl shadow-sm border p-8">
            <div className="text-center mb-8">
              <Lock className="h-12 w-12 text-primary-500 mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Set New Password</h1>
              <p className="text-gray-600">
                Please enter your new password below.
              </p>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-error-50 border border-error-200 rounded-lg">
                <p className="text-error-700 text-sm">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
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
                    className="w-full px-3 py-3 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5 text-gray-400" />
                    ) : (
                      <Eye className="h-5 w-5 text-gray-400" />
                    )}
                  </button>
                </div>
                <div className="mt-2 text-xs text-gray-500">
                  <p>Password must contain:</p>
                  <ul className="list-disc list-inside space-y-1 mt-1">
                    <li className={password.length >= 8 ? 'text-success-600' : ''}>At least 8 characters</li>
                    <li className={/[A-Z]/.test(password) ? 'text-success-600' : ''}>One uppercase letter</li>
                    <li className={/[a-z]/.test(password) ? 'text-success-600' : ''}>One lowercase letter</li>
                    <li className={/[0-9]/.test(password) ? 'text-success-600' : ''}>One number</li>
                    <li className={/[!@#$%^&*(),.?":{}|<>]/.test(password) ? 'text-success-600' : ''}>One special character</li>
                  </ul>
                </div>
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
                    className="w-full px-3 py-3 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-5 w-5 text-gray-400" />
                    ) : (
                      <Eye className="h-5 w-5 text-gray-400" />
                    )}
                  </button>
                </div>
                {confirmPassword && password !== confirmPassword && (
                  <p className="text-error-600 text-xs mt-1">Passwords do not match</p>
                )}
              </div>

              <button 
                type="submit"
                disabled={isLoading || !password || !confirmPassword || password !== confirmPassword}
                className="w-full bg-primary-500 hover:bg-primary-600 disabled:bg-gray-400 text-white py-3 px-6 rounded-lg font-semibold transition-colors duration-200"
              >
                {isLoading ? 'Resetting Password...' : 'Reset Password'}
              </button>
            </form>

            <div className="mt-6 text-center">
              <Link 
                href="/admin" 
                className="text-sm text-primary-600 hover:text-primary-700"
              >
                Back to Login
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}