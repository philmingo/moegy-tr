'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { FileText, Users, AlertTriangle, CheckCircle, Clock, Menu, LogOut, Eye } from 'lucide-react'

interface DashboardStats {
  totalReports: number
  openReports: number
  inProgressReports: number
  closedReports: number
}

interface RecentReport {
  id: string
  ref: string
  status: string
  description: string
  school: string
  time: string
}

export default function DashboardPage() {
  const router = useRouter()
  const [stats, setStats] = useState<DashboardStats>({
    totalReports: 0,
    openReports: 0,
    inProgressReports: 0,
    closedReports: 0
  })
  const [recentReports, setRecentReports] = useState<RecentReport[]>([])
  const [user, setUser] = useState<any>(null)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    checkAuthAndLoadData()
  }, [])

  const checkAuthAndLoadData = async () => {
    try {
      // Check authentication status
      const authResponse = await fetch('/api/auth/validate', {
        credentials: 'include'
      })

      if (!authResponse.ok) {
        // Not authenticated, redirect to login
        router.push('/admin')
        return
      }

      const authData = await authResponse.json()
      setUser({
        id: authData.user.id,
        fullName: authData.user.email.split('@')[0].replace('.', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()),
        role: authData.user.role,
        email: authData.user.email
      })

      // Load dashboard data from API
      const dashboardResponse = await fetch('/api/dashboard', {
        credentials: 'include'
      })

      if (dashboardResponse.ok) {
        const dashboardData = await dashboardResponse.json()
        setStats(dashboardData.stats)
        setRecentReports(dashboardData.recentReports)
      } else {
        console.error('Failed to load dashboard data')
        // Set empty data if API fails
        setRecentReports([])
      }

    } catch (error) {
      console.error('Auth check failed:', error)
      router.push('/admin')
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
      window.location.href = '/admin'
    } catch (error) {
      console.error('Logout failed:', error)
    }
  }

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  // Don't render anything if user is not set (will redirect)
  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div className={`bg-white shadow-lg transition-all duration-300 ${isSidebarOpen ? 'w-64' : 'w-20'} lg:w-64`}>
        <div className="p-4">
          <div className="flex items-center space-x-3">
            <div className="bg-primary-500 rounded-lg p-2">
              <AlertTriangle className="h-6 w-6 text-white" />
            </div>
            <div className={`${isSidebarOpen ? 'block' : 'hidden'} lg:block`}>
              <h1 className="font-bold text-gray-900">EduAlert</h1>
              <p className="text-xs text-gray-600">Admin Dashboard</p>
            </div>
          </div>
        </div>

        <nav className="mt-8">
          <div className="px-4 space-y-2">
            <a href="#" className="flex items-center space-x-3 px-3 py-2 rounded-lg bg-primary-50 text-primary-600">
              <FileText className="h-5 w-5" />
              <span className={`${isSidebarOpen ? 'block' : 'hidden'} lg:block`}>Reports</span>
            </a>
            <Link href="/report" className="flex items-center space-x-3 px-3 py-2 rounded-lg text-gray-600 hover:bg-gray-100">
              <AlertTriangle className="h-5 w-5" />
              <span className={`${isSidebarOpen ? 'block' : 'hidden'} lg:block`}>Report Teacher Absence</span>
            </Link>
            {(['admin', 'senior_officer'].includes(user?.role)) && (
              <Link href="/officers" className="flex items-center space-x-3 px-3 py-2 rounded-lg text-gray-600 hover:bg-gray-100">
                <Users className="h-5 w-5" />
                <span className={`${isSidebarOpen ? 'block' : 'hidden'} lg:block`}>Officers</span>
              </Link>
            )}
          </div>
        </nav>

        <div className="absolute bottom-4 left-4 right-4">
          <div className={`${isSidebarOpen ? 'block' : 'hidden'} lg:block mb-4`}>
            <div className="text-sm">
              <p className="font-medium text-gray-900">{user?.fullName}</p>
              <p className="text-gray-600 capitalize">{user?.role}</p>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="flex items-center space-x-3 px-3 py-2 rounded-lg text-red-600 hover:bg-red-50 w-full"
          >
            <LogOut className="h-5 w-5" />
            <span className={`${isSidebarOpen ? 'block' : 'hidden'} lg:block`}>Logout</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-white shadow-sm border-b px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button 
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="lg:hidden p-2 rounded-lg hover:bg-gray-100"
              >
                <Menu className="h-6 w-6" />
              </button>
              <h2 className="text-2xl font-bold text-gray-900">Dashboard</h2>
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <main className="flex-1 p-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Reports</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.totalReports}</p>
                </div>
                <FileText className="h-8 w-8 text-gray-400" />
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Open Reports</p>
                  <p className="text-3xl font-bold text-warning-600">{stats.openReports}</p>
                </div>
                <AlertTriangle className="h-8 w-8 text-warning-400" />
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">In Progress</p>
                  <p className="text-3xl font-bold text-primary-600">{stats.inProgressReports}</p>
                </div>
                <Clock className="h-8 w-8 text-primary-400" />
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Closed Reports</p>
                  <p className="text-3xl font-bold text-success-600">{stats.closedReports}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-success-400" />
              </div>
            </div>
          </div>

          {/* Recent Reports */}
          <div className="bg-white rounded-xl shadow-sm border">
            <div className="p-6 border-b flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Recent Reports</h3>
              <Link href="/reports" className="text-primary-600 hover:text-primary-700 font-medium text-sm">
                View All Reports
              </Link>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {recentReports.length > 0 ? recentReports.map((report) => (
                  <div key={report.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                    <div className="flex-1 mb-3 sm:mb-0">
                      <div className="flex items-center space-x-3 mb-2">
                        <span className="font-medium text-gray-900">{report.ref}</span>
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          report.status === 'Open' ? 'bg-red-100 text-red-800' :
                          report.status === 'In Progress' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {report.status}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-1">{report.description}</p>
                      <p className="text-xs text-gray-500">{report.school} • {report.time}</p>
                    </div>
                    <Link 
                      href={`/reports/${report.id}`}
                      className="bg-primary-600 hover:bg-primary-700 text-white px-3 py-2 rounded text-sm font-medium inline-flex items-center justify-center sm:ml-4"
                    >
                      <Eye className="h-4 w-4 mr-1 sm:mr-2" />
                      <span className="hidden sm:inline">View Details</span>
                      <span className="sm:hidden">View</span>
                    </Link>
                  </div>
                )) : (
                  <div className="text-center py-8">
                    <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No reports found</p>
                    <p className="text-gray-400 text-sm">New reports will appear here when submitted</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}