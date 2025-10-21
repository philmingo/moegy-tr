'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { ArrowLeft, Calendar, MapPin, User, BookOpen, AlertTriangle, CheckCircle, Clock, MessageSquare, Paperclip, Edit } from 'lucide-react'
import Navigation from '../../../components/Navigation'

interface TimelineItem {
  id: string
  action: string
  description: string
  timestamp: string
  officer: {
    name: string
    title: string
  } | null
}

interface Note {
  id: string
  content: string
  createdAt: string
  officer: {
    name: string
    title: string
  }
}

interface Officer {
  id: string
  name: string
  title: string
  position: string
  email: string
  role: string
}

interface Report {
  id: string
  referenceNumber: string
  school: {
    name: string
    code: string
    region: {
      name: string
    }
    address: string
    phone: string
  }
  grade: string
  teacherName: string
  subject: string
  reporterType: string
  description: string
  status: string
  priority: string
  createdAt: string
  updatedAt: string
  assignedOfficer: Officer | null
  resolution?: string
  notes: Note[]
  attachments: any[]
  timeline: TimelineItem[]
}

export default function ReportDetailsPage() {
  const params = useParams()
  const reportId = params.id as string
  const [report, setReport] = useState<Report | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showAddNote, setShowAddNote] = useState(false)
  const [newNote, setNewNote] = useState('')
  
  // Modal states
  const [showStatusModal, setShowStatusModal] = useState(false)
  const [showOfficerModal, setShowOfficerModal] = useState(false)
  const [showPriorityModal, setShowPriorityModal] = useState(false)
  
  // Action states
  const [selectedStatus, setSelectedStatus] = useState('')
  const [selectedOfficer, setSelectedOfficer] = useState('')
  const [selectedPriority, setSelectedPriority] = useState('')
  const [actionLoading, setActionLoading] = useState(false)
  
  // Officer search states
  const [officers, setOfficers] = useState<Officer[]>([])
  const [officerSearch, setOfficerSearch] = useState('')
  const [loadingOfficers, setLoadingOfficers] = useState(false)

  useEffect(() => {
    if (reportId) {
      fetchReport()
    }
  }, [reportId])

  useEffect(() => {
    if (showOfficerModal) {
      fetchOfficers(officerSearch)
    }
  }, [showOfficerModal, officerSearch])

  const fetchReport = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/reports/${reportId}`)
      if (!response.ok) {
        throw new Error('Report not found')
      }
      const data = await response.json()
      setReport(data.report)
    } catch (error) {
      console.error('Error fetching report:', error)
      setError(error instanceof Error ? error.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const fetchOfficers = async (searchQuery = '') => {
    try {
      setLoadingOfficers(true)
      const queryParam = searchQuery ? `?q=${encodeURIComponent(searchQuery)}` : '?role=officer'
      const response = await fetch(`/api/officers${queryParam}`)
      if (!response.ok) {
        throw new Error('Failed to fetch officers')
      }
      const data = await response.json()
      setOfficers(data.officers)
    } catch (error) {
      console.error('Error fetching officers:', error)
      setOfficers([])
    } finally {
      setLoadingOfficers(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-red-100 text-red-800 border-red-200'
      case 'in_progress': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'closed': return 'bg-green-100 text-green-800 border-green-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200'
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'low': return 'bg-blue-100 text-blue-800 border-blue-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'open': return <AlertTriangle className="h-5 w-5" />
      case 'in_progress': return <Clock className="h-5 w-5" />
      case 'closed': return <CheckCircle className="h-5 w-5" />
      default: return <Clock className="h-5 w-5" />
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatTimelineDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const handleUpdateStatus = async () => {
    if (!selectedStatus || !report) return
    
    setActionLoading(true)
    try {
      const response = await fetch(`/api/reports/${reportId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: selectedStatus })
      })

      if (response.ok) {
        // Update local state
        setReport({
          ...report,
          status: selectedStatus,
          updatedAt: new Date().toISOString()
        })
        setShowStatusModal(false)
        setSelectedStatus('')
      }
    } catch (error) {
      console.error('Error updating status:', error)
    } finally {
      setActionLoading(false)
    }
  }

  const handleAssignOfficer = async () => {
    if (!selectedOfficer || !report) return
    
    const selectedOfficerData = officers.find(o => o.id === selectedOfficer)
    if (!selectedOfficerData) return
    
    setActionLoading(true)
    try {
      const response = await fetch(`/api/reports/${reportId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assignedOfficer: selectedOfficer })
      })

      if (response.ok) {
        const assignedOfficer = {
          id: selectedOfficerData.id,
          name: selectedOfficerData.name,
          title: selectedOfficerData.position,
          position: selectedOfficerData.position,
          email: selectedOfficerData.email,
          role: selectedOfficerData.role
        }
        
        setReport({
          ...report,
          assignedOfficer: assignedOfficer,
          updatedAt: new Date().toISOString()
        })
        setShowOfficerModal(false)
        setSelectedOfficer('')
      }
    } catch (error) {
      console.error('Error assigning officer:', error)
    } finally {
      setActionLoading(false)
    }
  }

  const handleChangePriority = async () => {
    if (!selectedPriority || !report) return
    
    setActionLoading(true)
    try {
      const response = await fetch(`/api/reports/${reportId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priority: selectedPriority })
      })

      if (response.ok) {
        setReport({
          ...report,
          priority: selectedPriority,
          updatedAt: new Date().toISOString()
        })
        setShowPriorityModal(false)
        setSelectedPriority('')
      }
    } catch (error) {
      console.error('Error updating priority:', error)
    } finally {
      setActionLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading report details...</p>
        </div>
      </div>
    )
  }

  if (error || !report) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h1 className="text-xl font-semibold text-gray-900 mb-2">Report Not Found</h1>
          <p className="text-gray-600 mb-4">{error || 'The requested report could not be found.'}</p>
          <Link
            href="/dashboard"
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/dashboard" className="flex items-center text-gray-600 hover:text-gray-900">
              <ArrowLeft className="h-5 w-5 mr-2" />
              Back to Dashboard
            </Link>
            <h1 className="text-xl font-semibold text-gray-900">Report Details</h1>
            <div className="w-32"></div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Report Header */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{report.referenceNumber}</h2>
                  <p className="text-sm text-gray-500 mt-1">
                    Submitted on {formatDate(report.createdAt)}
                  </p>
                </div>
                <div className="flex space-x-3">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(report.status)}`}>
                    {getStatusIcon(report.status)}
                    <span className="ml-2">{report.status.replace('_', ' ').toUpperCase()}</span>
                  </span>
                  <span className={`inline-flex px-3 py-1 rounded-full text-sm font-medium border ${getPriorityColor(report.priority)}`}>
                    {report.priority.toUpperCase()} PRIORITY
                  </span>
                </div>
              </div>
              
              <div className="border-t pt-4">
                <h3 className="font-medium text-gray-900 mb-2">Report Description</h3>
                <p className="text-gray-700 leading-relaxed">{report.description}</p>
              </div>
            </div>

            {/* School and Teacher Information */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">School & Teacher Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <MapPin className="h-5 w-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="font-medium text-gray-900">{report.school.name}</p>
                      <p className="text-sm text-gray-500">{report.school.code}</p>
                      <p className="text-sm text-gray-600">{report.school.address}</p>
                      <p className="text-sm text-gray-600">{report.school.phone}</p>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <User className="h-5 w-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="font-medium text-gray-900">{report.teacherName}</p>
                      <p className="text-sm text-gray-600">{report.grade}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <BookOpen className="h-5 w-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="font-medium text-gray-900">{report.subject}</p>
                      <p className="text-sm text-gray-600">Subject</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Resolution (if closed) */}
            {report.status === 'closed' && report.resolution && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                <div className="flex items-center mb-3">
                  <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                  <h3 className="text-lg font-semibold text-green-900">Resolution</h3>
                </div>
                <p className="text-green-800">{report.resolution}</p>
              </div>
            )}

            {/* Notes */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Investigation Notes</h3>
                <button
                  onClick={() => setShowAddNote(!showAddNote)}
                  className="inline-flex items-center px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  <MessageSquare className="h-4 w-4 mr-1" />
                  Add Note
                </button>
              </div>

              {showAddNote && (
                <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                  <textarea
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    placeholder="Add your investigation note..."
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    rows={3}
                  />
                  <div className="flex space-x-2 mt-3">
                    <button
                      onClick={() => {
                        // TODO: Save note
                        setNewNote('')
                        setShowAddNote(false)
                      }}
                      className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                    >
                      Save Note
                    </button>
                    <button
                      onClick={() => {
                        setNewNote('')
                        setShowAddNote(false)
                      }}
                      className="px-3 py-1.5 bg-gray-300 text-gray-700 text-sm rounded hover:bg-gray-400"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {report.notes.length > 0 ? (
                <div className="space-y-4">
                  {report.notes.map((note) => (
                    <div key={note.id} className="border-l-4 border-blue-200 pl-4">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-gray-900">
                          {note.officer.name}
                        </span>
                        <span className="text-xs text-gray-500">
                          {formatDate(note.createdAt)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-1">{note.officer.title}</p>
                      <p className="text-gray-700">{note.content}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">No investigation notes yet.</p>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Report Info */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Report Information</h3>
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-gray-500">Reporter Type</label>
                  <p className="text-gray-900 capitalize">{report.reporterType}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Region</label>
                  <p className="text-gray-900">{report.school.region.name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Last Updated</label>
                  <p className="text-gray-900">{formatDate(report.updatedAt)}</p>
                </div>
                {report.assignedOfficer && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Assigned Officer</label>
                    <p className="text-gray-900">{report.assignedOfficer.name}</p>
                    <p className="text-sm text-gray-600">{report.assignedOfficer.title}</p>
                    <p className="text-sm text-gray-600">{report.assignedOfficer.email}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Officer Notification */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Officer Notifications</h3>
              {report.assignedOfficer ? (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <User className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div>
                      <p className="font-medium text-blue-900">{report.assignedOfficer.name}</p>
                      <p className="text-sm text-blue-700">{report.assignedOfficer.title}</p>
                      <p className="text-sm text-blue-600 mt-1">
                        Notified on {formatDate(report.timeline.find(item => item.action === 'Assigned to officer')?.timestamp || report.createdAt)}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <p className="text-yellow-800">
                    <strong>Status:</strong> No officer assigned yet. The report is in queue for assignment.
                  </p>
                </div>
              )}
            </div>

            {/* Timeline */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Timeline</h3>
              <div className="space-y-4">
                {report.timeline.map((item, index) => (
                  <div key={item.id} className="relative">
                    {index !== report.timeline.length - 1 && (
                      <div className="absolute left-2 top-8 bottom-0 w-0.5 bg-gray-200"></div>
                    )}
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0 w-4 h-4 bg-blue-600 rounded-full mt-1"></div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-gray-900">{item.action}</p>
                        <p className="text-sm text-gray-600">{item.description}</p>
                        <div className="flex items-center justify-between mt-1">
                          <p className="text-xs text-gray-500">
                            {item.officer ? item.officer.name : 'System'}
                          </p>
                          <p className="text-xs text-gray-500">
                            {formatTimelineDate(item.timestamp)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <button 
                  onClick={() => setShowStatusModal(true)}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-lg font-medium flex items-center justify-center"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Update Status
                </button>
                <button 
                  onClick={() => setShowOfficerModal(true)}
                  className="w-full bg-green-600 hover:bg-green-700 text-white px-4 py-3 rounded-lg font-medium flex items-center justify-center"
                >
                  <User className="h-4 w-4 mr-2" />
                  Assign Officer
                </button>
                <button 
                  onClick={() => setShowPriorityModal(true)}
                  className="w-full bg-orange-600 hover:bg-orange-700 text-white px-4 py-3 rounded-lg font-medium flex items-center justify-center"
                >
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  Change Priority
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Status Update Modal */}
      {showStatusModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Update Report Status</h3>
            <div className="space-y-3 mb-6">
              {['open', 'in_progress', 'closed'].map((status) => (
                <label key={status} className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="radio"
                    name="status"
                    value={status}
                    checked={selectedStatus === status}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                    className="text-blue-600"
                  />
                  <span className="capitalize">{status.replace('_', ' ')}</span>
                </label>
              ))}
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowStatusModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateStatus}
                disabled={!selectedStatus || actionLoading}
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg"
              >
                {actionLoading ? 'Updating...' : 'Update'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Officer Assignment Modal */}
      {showOfficerModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Assign Officer</h3>
            <div className="space-y-3 mb-6">
              {[
                { id: 'officer1', name: 'John Martinez', title: 'Education Officer' },
                { id: 'officer2', name: 'Maria Thompson', title: 'Senior Education Officer' },
                { id: 'officer3', name: 'David Wilson', title: 'Education Officer' }
              ].map((officer) => (
                <label key={officer.id} className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="radio"
                    name="officer"
                    value={officer.id}
                    checked={selectedOfficer === officer.id}
                    onChange={(e) => setSelectedOfficer(e.target.value)}
                    className="text-green-600"
                  />
                  <div>
                    <p className="font-medium">{officer.name}</p>
                    <p className="text-sm text-gray-600">{officer.title}</p>
                  </div>
                </label>
              ))}
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowOfficerModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleAssignOfficer}
                disabled={!selectedOfficer || actionLoading}
                className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white rounded-lg"
              >
                {actionLoading ? 'Assigning...' : 'Assign'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Priority Change Modal */}
      {showPriorityModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Change Priority</h3>
            <div className="space-y-3 mb-6">
              {[
                { value: 'low', label: 'Low Priority', color: 'text-blue-600' },
                { value: 'medium', label: 'Medium Priority', color: 'text-yellow-600' },
                { value: 'high', label: 'High Priority', color: 'text-red-600' }
              ].map((priority) => (
                <label key={priority.value} className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="radio"
                    name="priority"
                    value={priority.value}
                    checked={selectedPriority === priority.value}
                    onChange={(e) => setSelectedPriority(e.target.value)}
                    className="text-orange-600"
                  />
                  <span className={`font-medium ${priority.color}`}>{priority.label}</span>
                </label>
              ))}
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowPriorityModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleChangePriority}
                disabled={!selectedPriority || actionLoading}
                className="flex-1 px-4 py-2 bg-orange-600 hover:bg-orange-700 disabled:opacity-50 text-white rounded-lg"
              >
                {actionLoading ? 'Updating...' : 'Update'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Status Update Modal */}
      {showStatusModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Update Status</h3>
            <div className="space-y-3 mb-6">
              {[
                { value: 'open', label: 'Open', color: 'text-red-600' },
                { value: 'in_progress', label: 'In Progress', color: 'text-yellow-600' },
                { value: 'closed', label: 'Closed', color: 'text-green-600' }
              ].map((status) => (
                <label key={status.value} className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="radio"
                    name="status"
                    value={status.value}
                    checked={selectedStatus === status.value}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                    className="text-blue-600"
                  />
                  <span className={`font-medium ${status.color}`}>{status.label}</span>
                </label>
              ))}
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowStatusModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateStatus}
                disabled={!selectedStatus || actionLoading}
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg"
              >
                {actionLoading ? 'Updating...' : 'Update'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Officer Assignment Modal */}
      {showOfficerModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Assign Officer</h3>
            
            {/* Search Input */}
            <div className="mb-4">
              <input
                type="text"
                placeholder="Search officers by name or position..."
                value={officerSearch}
                onChange={(e) => setOfficerSearch(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>

            {/* Officers List */}
            <div className="max-h-64 overflow-y-auto mb-6">
              {loadingOfficers ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-600"></div>
                  <span className="ml-2 text-gray-600">Loading officers...</span>
                </div>
              ) : officers.length > 0 ? (
                <div className="space-y-2">
                  {officers.map((officer) => (
                    <label key={officer.id} className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                      <input
                        type="radio"
                        name="officer"
                        value={officer.id}
                        checked={selectedOfficer === officer.id}
                        onChange={(e) => setSelectedOfficer(e.target.value)}
                        className="text-green-600"
                      />
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">{officer.name}</div>
                        <div className="text-sm text-gray-600">{officer.position}</div>
                        <div className="text-xs text-gray-500">{officer.email}</div>
                      </div>
                    </label>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  {officerSearch ? 'No officers found matching your search.' : 'No officers available.'}
                </div>
              )}
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setShowOfficerModal(false)
                  setSelectedOfficer('')
                  setOfficerSearch('')
                }}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleAssignOfficer}
                disabled={!selectedOfficer || actionLoading}
                className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white rounded-lg"
              >
                {actionLoading ? 'Assigning...' : 'Assign'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}