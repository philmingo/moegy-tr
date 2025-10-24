'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  FileText, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Eye,
  Search,
  ChevronRight,
  Filter,
  BarChart3,
  TrendingUp
} from 'lucide-react'
import Navigation from '@/components/Navigation'

interface DashboardStats {
  totalReports: number
  openReports: number
  inProgressReports: number
  closedReports: number
}

interface QuickMetrics {
  assignedToMe: number
  highPriorityOpen: number
  avgOpenDays: number
  totalOpen: number
}

interface RecentReport {
  id: string
  ref: string
  status: string
  description: string
  school: string
  time: string
}

interface ReportOverTime {
  date: string
  count: number
  label: string
}

export default function DashboardPage() {
  const router = useRouter()
  const [stats, setStats] = useState<DashboardStats>({
    totalReports: 0,
    openReports: 0,
    inProgressReports: 0,
    closedReports: 0
  })
  const [quickMetrics, setQuickMetrics] = useState<QuickMetrics>({
    assignedToMe: 0,
    highPriorityOpen: 0,
    avgOpenDays: 0,
    totalOpen: 0
  })
  const [recentReports, setRecentReports] = useState<RecentReport[]>([])
  const [reportsOverTime, setReportsOverTime] = useState<ReportOverTime[]>([])
  const [user, setUser] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [lastFetch, setLastFetch] = useState<number>(0)
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [priorityFilter, setPriorityFilter] = useState('all')
  const [regionFilter, setRegionFilter] = useState('all')
  const [filteredReports, setFilteredReports] = useState<RecentReport[]>([])
  
  // Chart hover states
  const [hoveredSegment, setHoveredSegment] = useState<string | null>(null)
  const [hoveredBar, setHoveredBar] = useState<number | null>(null)

  useEffect(() => {
    checkAuthAndLoadData()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Filter reports when search term or filters change
  useEffect(() => {
    let filtered = [...recentReports]

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(report =>
        report.ref.toLowerCase().includes(searchTerm.toLowerCase()) ||
        report.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        report.school.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(report => report.status.toLowerCase() === statusFilter.toLowerCase())
    }

    // Apply priority filter
    if (priorityFilter !== 'all') {
      // Note: We'll need to get priority from the API
      // For now, we'll simulate this
      filtered = filtered.filter(report => {
        // This would need actual priority data from the API
        return true
      })
    }

    // Apply region filter
    if (regionFilter !== 'all') {
      // Note: We'll need region data from the API
      // For now, we'll simulate this
      filtered = filtered.filter(report => {
        // This would need actual region data from the API
        return true
      })
    }

    setFilteredReports(filtered)
  }, [recentReports, searchTerm, statusFilter, priorityFilter, regionFilter])

  const checkAuthAndLoadData = async () => {
    try {
      // Check if we have recent data (cache for 2 minutes)
      const now = Date.now()
      if (lastFetch && (now - lastFetch) < 120000 && user && stats.totalReports > 0) {
        setIsLoading(false)
        return
      }

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
        setQuickMetrics(dashboardData.quickMetrics)
        setRecentReports(dashboardData.recentReports)
        setReportsOverTime(dashboardData.reportsOverTime || [])
        setLastFetch(now)
      } else {
        console.error('Failed to load dashboard data')
        // Set empty data if API fails
        setRecentReports([])
        setReportsOverTime([])
      }

    } catch (error) {
      console.error('Auth check failed:', error)
      router.push('/admin')
    } finally {
      setIsLoading(false)
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
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      {/* Header Section */}
      <div className="bg-primary-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-primary-100 mt-2">Welcome back, {user?.fullName}</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Charts & Metrics */}
          <div className="lg:col-span-1 space-y-6">
            {/* Status Distribution */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Status Distribution</h3>
              <div className="flex items-center justify-center mb-6 relative">
                <div className="relative w-32 h-32">
                  {/* Interactive pie chart */}
                  <div className="w-32 h-32 rounded-full border-8 border-gray-200 relative overflow-hidden">
                    {stats.totalReports > 0 ? (
                      <>
                        {/* Pie chart segments */}
                        <div 
                          className="absolute inset-0 rounded-full cursor-pointer transition-opacity"
                          style={{
                            background: `conic-gradient(
                              #ef4444 0deg ${(stats.openReports / stats.totalReports) * 360}deg,
                              #3b82f6 ${(stats.openReports / stats.totalReports) * 360}deg ${((stats.openReports + stats.inProgressReports) / stats.totalReports) * 360}deg,
                              #10b981 ${((stats.openReports + stats.inProgressReports) / stats.totalReports) * 360}deg 360deg
                            )`,
                            opacity: hoveredSegment ? 0.7 : 1
                          }}
                          onMouseEnter={() => setHoveredSegment('chart')}
                          onMouseLeave={() => setHoveredSegment(null)}
                        />
                        
                        {/* Hover tooltip */}
                        {hoveredSegment && (
                          <div className="absolute -top-16 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white px-3 py-2 rounded-lg text-sm whitespace-nowrap z-10">
                            <div>Open: {stats.openReports}</div>
                            <div>In Progress: {stats.inProgressReports}</div>
                            <div>Closed: {stats.closedReports}</div>
                            <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="absolute inset-0 rounded-full bg-gray-100 flex items-center justify-center">
                        <span className="text-gray-400 text-xs">No data</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="space-y-3">
                <div 
                  className="flex items-center justify-between cursor-pointer p-2 rounded hover:bg-gray-50 transition-colors"
                  onMouseEnter={() => setHoveredSegment('closed')}
                  onMouseLeave={() => setHoveredSegment(null)}
                >
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span className="text-sm text-gray-600">Closed</span>
                  </div>
                  <span className="text-sm font-medium">{stats.closedReports}</span>
                </div>
                <div 
                  className="flex items-center justify-between cursor-pointer p-2 rounded hover:bg-gray-50 transition-colors"
                  onMouseEnter={() => setHoveredSegment('in_progress')}
                  onMouseLeave={() => setHoveredSegment(null)}
                >
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                    <span className="text-sm text-gray-600">In Progress</span>
                  </div>
                  <span className="text-sm font-medium">{stats.inProgressReports}</span>
                </div>
                <div 
                  className="flex items-center justify-between cursor-pointer p-2 rounded hover:bg-gray-50 transition-colors"
                  onMouseEnter={() => setHoveredSegment('open')}
                  onMouseLeave={() => setHoveredSegment(null)}
                >
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                    <span className="text-sm text-gray-600">Open</span>
                  </div>
                  <span className="text-sm font-medium">{stats.openReports}</span>
                </div>
              </div>
            </div>

            {/* Reports Over Time */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Reports Over Time (14d)</h3>
              <div className="h-48 w-full relative overflow-hidden">
                {/* Interactive bar chart */}
                {reportsOverTime.length > 0 ? (
                  <div className="h-full flex items-end justify-between px-1">
                    {reportsOverTime.map((dataPoint, index) => {
                      const maxCount = Math.max(...reportsOverTime.map(d => d.count), 1)
                      const heightPercentage = (dataPoint.count / maxCount) * 100
                      const minHeight = 8 // Minimum height for visibility
                      const height = Math.max((heightPercentage / 100) * 120, minHeight) // Max height 120px
                      
                      return (
                        <div key={index} className="flex flex-col items-center space-y-1 relative flex-1 max-w-none">
                          <div 
                            className={`bg-primary-500 rounded-t cursor-pointer transition-all duration-200 mx-auto ${
                              hoveredBar === index ? 'bg-primary-600 transform scale-y-105' : ''
                            }`}
                            style={{ 
                              height: `${height}px`,
                              width: `${Math.min(100 / reportsOverTime.length * 0.7, 24)}%`,
                              maxWidth: '20px'
                            }}
                            onMouseEnter={() => setHoveredBar(index)}
                            onMouseLeave={() => setHoveredBar(null)}
                          />
                          
                          {/* Hover tooltip */}
                          {hoveredBar === index && (
                            <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white px-2 py-1 rounded text-xs whitespace-nowrap z-10">
                              {dataPoint.count} report{dataPoint.count !== 1 ? 's' : ''}
                              <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-2 border-transparent border-t-gray-900"></div>
                            </div>
                          )}
                          
                          <span className="text-xs text-gray-500 text-center truncate w-full">
                            {dataPoint.label}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <div className="flex items-center justify-center w-full h-32 text-gray-400">
                    <div className="text-center">
                      <BarChart3 className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">Loading chart data...</p>
                    </div>
                  </div>
                )}
              </div>
              <div className="flex items-center justify-center space-x-4 mt-4 text-xs">
                <div className="flex items-center space-x-1">
                  <div className="w-3 h-3 bg-primary-500 rounded"></div>
                  <span className="text-gray-600">daily reports</span>
                </div>
              </div>
            </div>

            {/* Quick Metrics */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Quick Metrics</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Assigned to me</p>
                  <p className="text-2xl font-bold text-gray-900">{quickMetrics.assignedToMe}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide">High priority open</p>
                  <p className="text-2xl font-bold text-gray-900">{quickMetrics.highPriorityOpen}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Avg open days</p>
                  <p className="text-2xl font-bold text-gray-900">{quickMetrics.avgOpenDays}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Total open</p>
                  <p className="text-2xl font-bold text-gray-900">{quickMetrics.totalOpen}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Reports List */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="p-6 border-b">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">All Reports</h3>
                  <span className="text-sm text-gray-500">
                    Showing {filteredReports.length} of {recentReports.length}
                  </span>
                </div>
                
                {/* Search and Filters */}
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search reports, schools, or regions..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>
                  <div className="flex gap-2">
                    <select 
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
                    >
                      <option value="all">All Status</option>
                      <option value="open">Open</option>
                      <option value="in progress">In Progress</option>
                      <option value="closed">Closed</option>
                    </select>
                    <select 
                      value={priorityFilter}
                      onChange={(e) => setPriorityFilter(e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
                    >
                      <option value="all">All Priority</option>
                      <option value="high">High Priority</option>
                      <option value="medium">Medium Priority</option>
                      <option value="low">Low Priority</option>
                    </select>
                    <select 
                      value={regionFilter}
                      onChange={(e) => setRegionFilter(e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
                    >
                      <option value="all">All Regions</option>
                      <option value="georgetown">Georgetown</option>
                      <option value="region_7">Region 7</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Reports List */}
              <div className="divide-y divide-gray-200">
                {filteredReports.length > 0 ? filteredReports.map((report) => (
                  <Link 
                    key={report.id}
                    href={`/reports/${report.id}`}
                    className="block p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-3 mb-1">
                          <span className="font-medium text-primary-600">{report.ref}</span>
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            report.status === 'Open' ? 'bg-orange-100 text-orange-800' :
                            report.status === 'In Progress' ? 'bg-blue-100 text-blue-800' :
                            'bg-green-100 text-green-800'
                          }`}>
                            {report.status}
                          </span>
                        </div>
                        <p className="text-sm text-gray-900 mb-1">{report.description}</p>
                        <p className="text-xs text-gray-500">{report.school} • {report.time}</p>
                      </div>
                      <ChevronRight className="h-5 w-5 text-gray-400" />
                    </div>
                  </Link>
                )) : (
                  <div className="p-8 text-center">
                    <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500 mb-2">
                      {searchTerm || statusFilter !== 'all' || priorityFilter !== 'all' || regionFilter !== 'all' 
                        ? 'No reports match your filters' 
                        : 'No reports found'
                      }
                    </p>
                    <p className="text-gray-400 text-sm">
                      {searchTerm || statusFilter !== 'all' || priorityFilter !== 'all' || regionFilter !== 'all' 
                        ? 'Try adjusting your search criteria' 
                        : 'New reports will appear here when submitted'
                      }
                    </p>
                  </div>
                )}
              </div>

              {/* Pagination */}
              {filteredReports.length > 0 && (
                <div className="p-4 border-t bg-gray-50 flex items-center justify-between">
                  <div className="flex items-center text-sm text-gray-600">
                    <span>Rows per page:</span>
                    <select className="ml-2 border-none bg-transparent focus:ring-0">
                      <option>10</option>
                      <option>25</option>
                      <option>50</option>
                    </select>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-600">Page 1 of 1</span>
                    <button className="px-3 py-1 text-sm border rounded hover:bg-gray-100 disabled:opacity-50" disabled>
                      Previous
                    </button>
                    <button className="px-3 py-1 text-sm border rounded hover:bg-gray-100 disabled:opacity-50" disabled>
                      Next
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}