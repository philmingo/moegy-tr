'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Navigation from '@/components/Navigation'
import { Brain, FileText, Send, CheckCircle, XCircle, Clock } from 'lucide-react'

interface Report {
  id: string
  reference_number: string
  teacher_name: string
  status: string
  description: string
  school: {
    name: string
  }
  created_at: string
}

export default function AIManagementPage() {
  const router = useRouter()
  const [reports, setReports] = useState<Report[]>([])
  const [loading, setLoading] = useState(true)
  const [analyzing, setAnalyzing] = useState<string | null>(null)
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    checkAuthAndLoadData()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const checkAuthAndLoadData = async () => {
    try {
      const authResponse = await fetch('/api/auth/validate')
      if (!authResponse.ok) {
        router.push('/admin')
        return
      }

      const authData = await authResponse.json()
      if (authData.user.role !== 'admin') {
        router.push('/dashboard')
        return
      }

      setUser(authData.user)
      await loadReports()
    } catch (error) {
      console.error('Auth check failed:', error)
      router.push('/admin')
    }
  }

  const loadReports = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/reports?limit=50', {
        credentials: 'include'
      })

      if (response.ok) {
        const data = await response.json()
        setReports(data.reports || [])
      }
    } catch (error) {
      console.error('Error loading reports:', error)
    } finally {
      setLoading(false)
    }
  }

  const triggerAnalysis = async (reportId: string) => {
    try {
      setAnalyzing(reportId)
      
      const response = await fetch('/api/test/analyze-report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reportId }),
      })

      const result = await response.json()

      if (response.ok) {
        alert(`Analysis completed: ${result.result.action}\n\nReason: ${result.result.reason}`)
        await loadReports() // Reload to see status changes
      } else {
        alert(`Analysis failed: ${result.error}`)
      }
    } catch (error) {
      console.error('Analysis error:', error)
      alert('Failed to trigger analysis')
    } finally {
      setAnalyzing(null)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading AI Management...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-4">
            <Brain className="h-8 w-8 text-primary-600" />
            <h1 className="text-3xl font-bold text-gray-900">AI Analysis Management</h1>
          </div>
          <p className="text-gray-600">
            Review and manually trigger AI analysis for teacher absence reports
          </p>
        </div>

        {/* Reports List */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-6 border-b">
            <h2 className="text-lg font-semibold text-gray-900">Recent Reports</h2>
            <p className="text-sm text-gray-600 mt-1">
              Click &quot;Analyze&quot; to manually trigger AI analysis for any report
            </p>
          </div>

          <div className="divide-y divide-gray-200">
            {reports.length > 0 ? (
              reports.map((report) => (
                <div key={report.id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <span className="font-medium text-primary-600">
                          {report.reference_number}
                        </span>
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          report.status === 'open' ? 'bg-orange-100 text-orange-800' :
                          report.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {report.status === 'in_progress' ? 'In Progress' : 
                           report.status.charAt(0).toUpperCase() + report.status.slice(1)}
                        </span>
                      </div>
                      
                      <div className="space-y-1">
                        <p className="text-sm text-gray-900">
                          <strong>Teacher:</strong> {report.teacher_name}
                        </p>
                        <p className="text-sm text-gray-900">
                          <strong>School:</strong> {(report.school as any)?.name || 'Unknown School'}
                        </p>
                        <p className="text-sm text-gray-600">
                          {report.description.length > 100 
                            ? `${report.description.substring(0, 100)}...` 
                            : report.description}
                        </p>
                        <p className="text-xs text-gray-500">
                          Submitted: {new Date(report.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3 ml-6">
                      <button
                        onClick={() => router.push(`/reports/${report.id}`)}
                        className="flex items-center space-x-2 px-3 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        <FileText className="h-4 w-4" />
                        <span>View</span>
                      </button>

                      <button
                        onClick={() => triggerAnalysis(report.id)}
                        disabled={analyzing === report.id}
                        className="flex items-center space-x-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {analyzing === report.id ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            <span>Analyzing...</span>
                          </>
                        ) : (
                          <>
                            <Brain className="h-4 w-4" />
                            <span>Analyze</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No reports found</p>
              </div>
            )}
          </div>
        </div>

        {/* Info Card */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="font-medium text-blue-900 mb-3">How AI Analysis Works:</h3>
          <div className="space-y-2 text-sm text-blue-800">
            <div className="flex items-start space-x-2">
              <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
              <span><strong>Valid Reports:</strong> Get approved for investigation and notifications are sent to relevant officers</span>
            </div>
            <div className="flex items-start space-x-2">
              <XCircle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
              <span><strong>Invalid Reports:</strong> Are automatically closed with explanatory comments</span>
            </div>
            <div className="flex items-start space-x-2">
              <Clock className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
              <span><strong>Automatic Process:</strong> New reports are analyzed immediately upon submission</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}