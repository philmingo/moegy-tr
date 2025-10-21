'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu, X, User, LogOut, AlertTriangle, ChevronDown } from 'lucide-react'

interface NavigationProps {
  showAuthButtons?: boolean
}

export default function Navigation({ showAuthButtons = true }: NavigationProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [userEmail, setUserEmail] = useState('')
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [userFirstName, setUserFirstName] = useState('')
  const pathname = usePathname()
  const isHomePage = pathname === '/'

  useEffect(() => {
    // Check localStorage for immediate UI feedback
    const storedLoginState = localStorage.getItem('isLoggedIn')
    const storedEmail = localStorage.getItem('userEmail')
    
    if (storedLoginState === 'true' && storedEmail) {
      setIsLoggedIn(true)
      setUserEmail(storedEmail)
      const firstName = storedEmail.split('@')[0].split('.')[0]
      setUserFirstName(firstName.charAt(0).toUpperCase() + firstName.slice(1))
    }
    
    // Always verify with server
    checkAuthStatus()
  }, [])

  const checkAuthStatus = async () => {
    try {
      const response = await fetch('/api/auth/validate', {
        credentials: 'include'
      })
      
      if (response.ok) {
        const data = await response.json()
        setIsLoggedIn(true)
        setUserEmail(data.email)
        // Extract first name from email (part before @)
        const firstName = data.email.split('@')[0].split('.')[0]
        setUserFirstName(firstName.charAt(0).toUpperCase() + firstName.slice(1))
        
        // Store auth state in localStorage for persistence
        localStorage.setItem('isLoggedIn', 'true')
        localStorage.setItem('userEmail', data.email)
      } else {
        setIsLoggedIn(false)
        setUserEmail('')
        setUserFirstName('')
        localStorage.removeItem('isLoggedIn')
        localStorage.removeItem('userEmail')
      }
    } catch (error) {
      console.error('Auth check failed:', error)
      setIsLoggedIn(false)
      setUserEmail('')
      setUserFirstName('')
      localStorage.removeItem('isLoggedIn')
      localStorage.removeItem('userEmail')
    }
  }

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include'
      })
      setIsLoggedIn(false)
      setUserEmail('')
      setUserFirstName('')
      localStorage.removeItem('isLoggedIn')
      localStorage.removeItem('userEmail')
      window.location.href = '/'
    } catch (error) {
      console.error('Logout failed:', error)
    }
  }

  // Don't render navigation on home page
  if (isHomePage) {
    return null
  }

  return (
    <nav className="bg-white shadow-sm border-gray-200 border-b">
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
            {showAuthButtons && (
              <>
                {isLoggedIn ? (
                  <div className="flex items-center space-x-4">
                    <Link 
                      href="/dashboard" 
                      className="font-medium text-gray-600 hover:text-gray-900 transition-colors"
                    >
                      Dashboard
                    </Link>
                    
                    {/* User Dropdown */}
                    <div className="relative">
                      <button
                        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                        className="flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors text-gray-600 hover:bg-gray-100"
                      >
                        <User className="h-4 w-4" />
                        <span className="text-sm font-medium">{userFirstName}</span>
                        <ChevronDown className={`h-4 w-4 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
                      </button>

                      {/* Dropdown Menu */}
                      {isDropdownOpen && (
                        <>
                          <div 
                            className="fixed inset-0 z-10" 
                            onClick={() => setIsDropdownOpen(false)}
                          ></div>
                          <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20">
                            <Link
                              href="/profile"
                              className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                              onClick={() => setIsDropdownOpen(false)}
                            >
                              <User className="h-4 w-4 mr-3" />
                              Profile Settings
                            </Link>
                            <hr className="my-1" />
                            <button
                              onClick={() => {
                                setIsDropdownOpen(false)
                                handleLogout()
                              }}
                              className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                            >
                              <LogOut className="h-4 w-4 mr-3" />
                              Logout
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center space-x-4">
                    <Link
                      href="/admin"
                      className="font-medium text-primary-600 hover:text-primary-700 transition-colors"
                    >
                      Officer Login
                    </Link>
                  </div>
                )}
              </>
            )}

            {/* Report Button */}
            <Link
              href="/report"
              className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
              Report Absence
            </Link>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 rounded-lg transition-colors text-gray-600 hover:bg-gray-100"
            >
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isMenuOpen && (
        <div className="md:hidden bg-white border-t border-gray-200">
          <div className="px-4 py-3 space-y-3">
            {showAuthButtons && (
              <>
                {isLoggedIn ? (
                  <>
                    <Link
                      href="/dashboard"
                      className="block text-gray-600 hover:text-gray-900 font-medium"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Dashboard
                    </Link>
                    
                    <div className="flex items-center space-x-2 px-3 py-2 text-gray-600">
                      <User className="h-4 w-4" />
                      <span className="text-sm">{userFirstName}</span>
                    </div>
                    
                    <Link
                      href="/profile"
                      className="block text-gray-600 hover:text-gray-900 font-medium"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Profile Settings
                    </Link>
                    
                    <button
                      onClick={() => {
                        setIsMenuOpen(false)
                        handleLogout()
                      }}
                      className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 font-medium"
                    >
                      <LogOut className="h-4 w-4" />
                      <span>Logout</span>
                    </button>
                  </>
                ) : (
                  <Link
                    href="/admin"
                    className="block text-primary-600 hover:text-primary-700 font-medium"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Officer Login
                  </Link>
                )}
              </>
            )}

            {/* Report Button for mobile */}
            <Link
              href="/report"
              className="block bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg font-medium text-center transition-colors"
              onClick={() => setIsMenuOpen(false)}
            >
              Report Absence
            </Link>
          </div>
        </div>
      )}
    </nav>
  )
}