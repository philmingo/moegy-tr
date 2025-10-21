'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { FileText, Users, AlertTriangle, CheckCircle, Clock, Menu, LogOut, Eye } from 'lucide-react'

interface DashboardStats {
  totalReports: number
  openReports: number
  inProgressReports: number
  closedReports: number
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    totalReports: 0,
    openReports: 0,
    inProgressReports: 0,
    closedReports: 0
  })
  const [user, setUser] = useState<any>(null)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  useEffect(() => {
    // Mock stats for now
    setStats({
      totalReports: 127,
      openReports: 23,
      inProgressReports: 45,
      closedReports: 59
    })

    // Mock user for now
    setUser({
      fullName: 'Philip Mingo',
      role: 'admin',
      email: 'phil.mingo@moe.gov.gy'
    })
  }, [])

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
      window.location.href = '/admin'
    } catch (error) {
      console.error('Logout failed:', error)
    }
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
            <a href="#" className="flex items-center space-x-3 px-3 py-2 rounded-lg text-gray-600 hover:bg-gray-100">
              <Users className="h-5 w-5" />
              <span className={`${isSidebarOpen ? 'block' : 'hidden'} lg:block`}>Officers</span>
            </a>
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
                {[
                  { id: '1', ref: 'EDU20241001', status: 'Open', description: 'Teacher absent from Mathematics class - Grade 5', school: 'Georgetown Primary School', time: '2 hours ago' },
                  { id: '2', ref: 'EDU20241002', status: 'In Progress', description: 'Physics teacher frequently arrives late', school: "Queen's College", time: '5 hours ago' },
                  { id: '3', ref: 'EDU20241003', status: 'Closed', description: 'English teacher has not shown up', school: 'New Amsterdam Secondary', time: '1 day ago' },
                  { id: '4', ref: 'EDU20241004', status: 'Open', description: 'Chemistry teacher cancels classes frequently', school: 'Mackenzie High School', time: '2 days ago' },
                  { id: '5', ref: 'EDU20241005', status: 'In Progress', description: 'Teacher uses phone during class time', school: "St. Margaret's Primary", time: '3 days ago' }
                ].map((report) => (
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
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}