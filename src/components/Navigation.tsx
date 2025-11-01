'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  Menu, 
  X, 
  User, 
  LogOut, 
  AlertTriangle, 
  ChevronDown, 
  Brain,
  LayoutDashboard,
  Users,
  FileText,
  Settings,
  Home
} from 'lucide-react'

interface NavigationProps {
  showAuthButtons?: boolean
}

export default function Navigation({ showAuthButtons = true }: NavigationProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [userEmail, setUserEmail] = useState('')
  const [userRole, setUserRole] = useState('')
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [userFirstName, setUserFirstName] = useState('')
  const pathname = usePathname()
  const isHomePage = pathname === '/'

  useEffect(() => {
    // Check localStorage for immediate UI feedback
    const storedLoginState = localStorage.getItem('isLoggedIn')
    const storedEmail = localStorage.getItem('userEmail')
    const storedRole = localStorage.getItem('userRole')
    
    if (storedLoginState === 'true' && storedEmail) {
      setIsLoggedIn(true)
      setUserEmail(storedEmail)
      setUserRole(storedRole || '')
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
        setUserEmail(data.user.email)
        setUserRole(data.user.role)
        // Extract first name from email (part before @)
        const firstName = data.user.email.split('@')[0].split('.')[0]
        setUserFirstName(firstName.charAt(0).toUpperCase() + firstName.slice(1))
        
        // Store auth state in localStorage for persistence
        localStorage.setItem('isLoggedIn', 'true')
        localStorage.setItem('userEmail', data.user.email)
        localStorage.setItem('userRole', data.user.role)
      } else {
        setIsLoggedIn(false)
        setUserEmail('')
        setUserRole('')
        setUserFirstName('')
        localStorage.removeItem('isLoggedIn')
        localStorage.removeItem('userEmail')
        localStorage.removeItem('userRole')
      }
    } catch (error) {
      console.error('Auth check failed:', error)
      setIsLoggedIn(false)
      setUserEmail('')
      setUserRole('')
      setUserFirstName('')
      localStorage.removeItem('isLoggedIn')
      localStorage.removeItem('userEmail')
      localStorage.removeItem('userRole')
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
      setUserRole('')
      setUserFirstName('')
      localStorage.removeItem('isLoggedIn')
      localStorage.removeItem('userEmail')
      localStorage.removeItem('userRole')
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
          <div className="hidden md:flex items-center space-x-1">
            {showAuthButtons && (
              <>
                {isLoggedIn ? (
                  <div className="flex items-center space-x-1">
                    <Link 
                      href="/dashboard" 
                      className={`flex items-center space-x-2 px-3 py-2 rounded-lg font-medium transition-colors ${
                        pathname === '/dashboard' 
                          ? 'bg-primary-100 text-primary-700' 
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                      }`}
                    >
                      <LayoutDashboard className="h-4 w-4" />
                      <span>Dashboard</span>
                    </Link>
                    
                    {(userRole === 'admin' || userRole === 'senior_officer') && (
                      <Link 
                        href="/officers" 
                        className={`flex items-center space-x-2 px-3 py-2 rounded-lg font-medium transition-colors ${
                          pathname === '/officers' 
                            ? 'bg-primary-100 text-primary-700' 
                            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                        }`}
                      >
                        <Users className="h-4 w-4" />
                        <span>Officers</span>
                      </Link>
                    )}
                    
                    {(userRole === 'admin' || userRole === 'senior_officer') && (
                      <Link 
                        href="/ai" 
                        className={`flex items-center space-x-2 px-3 py-2 rounded-lg font-medium transition-colors ${
                          pathname === '/ai' 
                            ? 'bg-primary-100 text-primary-700' 
                            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                        }`}
                      >
                        <Brain className="h-4 w-4" />
                        <span>EduAlert AI</span>
                      </Link>
                    )}
                    
                    {/* User Dropdown */}
                    <div className="relative ml-2">
                      <button
                        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                        className="flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors text-gray-600 hover:bg-gray-100"
                      >
                        <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center">
                          <span className="text-white font-semibold text-sm">
                            {userFirstName.charAt(0)}
                          </span>
                        </div>
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
                          <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-20">
                            <div className="px-4 py-2 border-b border-gray-100">
                              <p className="text-sm font-medium text-gray-900">{userFirstName}</p>
                              <p className="text-xs text-gray-500">{userEmail}</p>
                              <p className="text-xs text-primary-600 capitalize">{userRole.replace('_', ' ')}</p>
                            </div>
                            <Link
                              href="/profile"
                              className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                              onClick={() => setIsDropdownOpen(false)}
                            >
                              <Settings className="h-4 w-4 mr-3" />
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
                      className="flex items-center space-x-2 px-3 py-2 rounded-lg font-medium text-primary-600 hover:text-primary-700 hover:bg-primary-50 transition-colors"
                    >
                      <User className="h-4 w-4" />
                      <span>Report Dashboard</span>
                    </Link>
                  </div>
                )}
              </>
            )}

            {/* Report Button */}
            <Link
              href="/report"
              className="ml-4 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2"
            >
              <AlertTriangle className="h-4 w-4" />
              <span>Report Absence</span>
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
          <div className="px-4 py-3 space-y-1">
            {showAuthButtons && (
              <>
                {isLoggedIn ? (
                  <>
                    {/* User Info Section */}
                    <div className="flex items-center space-x-3 px-3 py-3 bg-gray-50 rounded-lg mb-3">
                      <div className="w-10 h-10 bg-primary-600 rounded-full flex items-center justify-center">
                        <span className="text-white font-semibold">
                          {userFirstName.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{userFirstName}</p>
                        <p className="text-xs text-gray-500">{userEmail}</p>
                        <p className="text-xs text-primary-600 capitalize">{userRole.replace('_', ' ')}</p>
                      </div>
                    </div>
                    
                    <Link
                      href="/dashboard"
                      className={`flex items-center space-x-3 px-3 py-2 rounded-lg font-medium transition-colors ${
                        pathname === '/dashboard' 
                          ? 'bg-primary-100 text-primary-700' 
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                      }`}
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <LayoutDashboard className="h-5 w-5" />
                      <span>Dashboard</span>
                    </Link>
                    
                    {(userRole === 'admin' || userRole === 'senior_officer') && (
                      <Link
                        href="/officers"
                        className={`flex items-center space-x-3 px-3 py-2 rounded-lg font-medium transition-colors ${
                          pathname === '/officers' 
                            ? 'bg-primary-100 text-primary-700' 
                            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                        }`}
                        onClick={() => setIsMenuOpen(false)}
                      >
                        <Users className="h-5 w-5" />
                        <span>Manage Officers</span>
                      </Link>
                    )}
                    
                    {(userRole === 'admin' || userRole === 'senior_officer') && (
                      <Link
                        href="/ai"
                        className={`flex items-center space-x-3 px-3 py-2 rounded-lg font-medium transition-colors ${
                          pathname === '/ai' 
                            ? 'bg-primary-100 text-primary-700' 
                            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                        }`}
                        onClick={() => setIsMenuOpen(false)}
                      >
                        <Brain className="h-5 w-5" />
                        <span>EduAlert AI</span>
                      </Link>
                    )}
                    
                    <div className="border-t border-gray-200 my-3"></div>
                    
                    <Link
                      href="/profile"
                      className="flex items-center space-x-3 px-3 py-2 rounded-lg font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <Settings className="h-5 w-5" />
                      <span>Profile Settings</span>
                    </Link>
                    
                    <button
                      onClick={() => {
                        setIsMenuOpen(false)
                        handleLogout()
                      }}
                      className="flex items-center space-x-3 px-3 py-2 rounded-lg font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors w-full"
                    >
                      <LogOut className="h-5 w-5" />
                      <span>Logout</span>
                    </button>
                  </>
                ) : (
                  <Link
                    href="/admin"
                    className="flex items-center space-x-3 px-3 py-2 rounded-lg font-medium text-primary-600 hover:text-primary-700 hover:bg-primary-50 transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <User className="h-5 w-5" />
                    <span>Report Dashboard</span>
                  </Link>
                )}
              </>
            )}

            {/* Report Button for mobile */}
            <div className="pt-3 border-t border-gray-200">
              <Link
                href="/report"
                className="flex items-center justify-center space-x-2 bg-primary-600 hover:bg-primary-700 text-white px-4 py-3 rounded-lg font-medium transition-colors w-full"
                onClick={() => setIsMenuOpen(false)}
              >
                <AlertTriangle className="h-5 w-5" />
                <span>Report Absence</span>
              </Link>
            </div>
          </div>
        </div>
      )}
    </nav>
  )
}