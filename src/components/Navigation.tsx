'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Menu, X, User, LogOut, AlertTriangle, Home, FileText, Settings } from 'lucide-react'

interface NavigationProps {
  showAuthButtons?: boolean
}

export default function Navigation({ showAuthButtons = true }: NavigationProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [userEmail, setUserEmail] = useState('')

  useEffect(() => {
    // Check if user is logged in by looking for auth token
    const token = localStorage.getItem('authToken')
    const email = localStorage.getItem('userEmail')
    
    if (token && email) {
      setIsLoggedIn(true)
      setUserEmail(email)
    }
  }, [])

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
      localStorage.removeItem('authToken')
      localStorage.removeItem('userEmail')
      setIsLoggedIn(false)
      setUserEmail('')
      window.location.href = '/'
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo and brand */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">EA</span>
              </div>
              <span className="text-xl font-bold text-gray-900">EduAlert</span>
            </Link>
          </div>

          {/* Desktop navigation */}
          <div className="hidden md:flex items-center space-x-6">
            <Link href="/" className="text-gray-600 hover:text-gray-900 font-medium">
              Home
            </Link>
            
            {showAuthButtons && (
              <>
                {isLoggedIn ? (
                  <div className="flex items-center space-x-4">
                    <Link href="/dashboard" className="text-gray-600 hover:text-gray-900 font-medium">
                      Dashboard
                    </Link>
                    <Link 
                      href="/profile" 
                      className="flex items-center space-x-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <User className="h-4 w-4 text-gray-500" />
                      <span className="text-sm text-gray-600 hover:text-gray-900">{userEmail}</span>
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="inline-flex items-center space-x-1 text-gray-600 hover:text-gray-900"
                    >
                      <LogOut className="h-4 w-4" />
                      <span>Logout</span>
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center space-x-4">
                    <Link
                      href="/admin"
                      className="text-primary-600 hover:text-primary-700 font-medium"
                    >
                      Officer Login
                    </Link>
                  </div>
                )}
              </>
            )}
            
            {/* Prominent CTA Button */}
            <Link
              href="/report"
              className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200 inline-flex items-center space-x-2"
            >
              <AlertTriangle className="h-4 w-4" />
              <span>Report Teacher Absence</span>
            </Link>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-gray-600 hover:text-gray-900"
            >
              {isMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {isMenuOpen && (
          <div className="md:hidden py-4 space-y-2 border-t">
            <Link 
              href="/" 
              className="flex items-center space-x-3 px-3 py-2 text-gray-600 hover:text-gray-900 font-medium"
              onClick={() => setIsMenuOpen(false)}
            >
              <Home className="h-5 w-5" />
              <span>Home</span>
            </Link>
            
            {showAuthButtons && (
              <>
                {isLoggedIn ? (
                  <Link 
                    href="/dashboard" 
                    className="flex items-center space-x-3 px-3 py-2 text-gray-600 hover:text-gray-900 font-medium"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <Settings className="h-5 w-5" />
                    <span>Dashboard</span>
                  </Link>
                ) : (
                  <Link 
                    href="/admin" 
                    className="flex items-center space-x-3 px-3 py-2 text-primary-600 hover:text-primary-700 font-medium"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <User className="h-5 w-5" />
                    <span>Officer Login</span>
                  </Link>
                )}
              </>
            )}
            
            {/* Prominent CTA for mobile */}
            <Link 
              href="/report" 
              className="flex items-center space-x-3 mx-3 my-4 px-4 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium"
              onClick={() => setIsMenuOpen(false)}
            >
              <AlertTriangle className="h-5 w-5" />
              <span>Report Teacher Absence</span>
            </Link>
            
            {showAuthButtons && isLoggedIn && (
              <div className="px-3 py-2 border-t">
                <Link 
                  href="/profile" 
                  className="flex items-center space-x-2 mb-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <User className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-600 hover:text-gray-900">{userEmail}</span>
                </Link>
                <button
                  onClick={handleLogout}
                  className="inline-flex items-center space-x-1 text-gray-600 hover:text-gray-900"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Logout</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </nav>
  )
}