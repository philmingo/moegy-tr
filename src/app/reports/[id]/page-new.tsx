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
  reportedBy: {
    name: string
    position: string
    email: string
    phone: string
    relationship: string
  }
  absence: {
    teacherName: string
    position: string
    dateStarted: string
    reason: string
    expectedReturn: string | null
    coverageArranged: boolean
    classesAffected: string[]
  }
  description: string
  urgencyLevel: string
  priority: string
  status: string
  assignedOfficers: Officer[]
  createdAt: string
  updatedAt: string
  timeline: TimelineItem[]
  notes: Note[]
  attachments?: string[]
}

export default function ReportDetails() {
  const params = useParams()
  const reportId = params?.id as string

  const [report, setReport] = useState<Report | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState(false)
  const [newNote, setNewNote] = useState('')
  
  // Modal states
  const [showOfficerModal, setShowOfficerModal] = useState(false)
  const [showPriorityModal, setShowPriorityModal] = useState(false)
  const [showStatusModal, setShowStatusModal] = useState(false)
  
  // Officer assignment states
  const [officers, setOfficers] = useState<Officer[]>([])
  const [selectedOfficers, setSelectedOfficers] = useState<string[]>([])
  const [loadingOfficers, setLoadingOfficers] = useState(false)
  const [officerSearch, setOfficerSearch] = useState('')
  
  // Priority and status states
  const [selectedPriority, setSelectedPriority] = useState('')
  const [selectedStatus, setSelectedStatus] = useState('')

  // Fetch report details
  useEffect(() => {
    if (!reportId) return
    
    fetchReport()
  }, [reportId])

  const fetchReport = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch(`/api/reports/${reportId}`)
      
      if (!response.ok) {
        throw new Error(`Failed to fetch report: ${response.status}`)
      }
      
      const data = await response.json()
      setReport(data.report)
    } catch (error) {
      console.error('Error fetching report:', error)
      setError('Failed to load report details')
    } finally {
      setLoading(false)
    }
  }

  // Fetch officers for assignment
  const fetchOfficers = async (search = '') => {
    try {
      setLoadingOfficers(true)
      const params = new URLSearchParams()
      if (search) params.append('search', search)
      
      const response = await fetch(`/api/officers?${params.toString()}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch officers')
      }
      
      const data = await response.json()
      setOfficers(data.officers)
    } catch (error) {
      console.error('Error fetching officers:', error)
    } finally {
      setLoadingOfficers(false)
    }
  }

  // Officer selection handling
  const handleOfficerSelection = (officerId: string, isSelected: boolean) => {
    setSelectedOfficers(prev => {
      if (isSelected) {
        return [...prev, officerId]
      } else {
        return prev.filter(id => id !== officerId)
      }
    })
  }

  // Assign officers to report
  const handleAssignOfficers = async () => {
    if (selectedOfficers.length === 0) return

    try {
      setActionLoading(true)
      const response = await fetch(`/api/reports/${reportId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          assignedOfficers: selectedOfficers,
          action: 'assign_officers'
        })
      })

      if (response.ok) {
        await fetchReport() // Refresh data
        setShowOfficerModal(false)
        setSelectedOfficers([])
      } else {
        throw new Error('Failed to assign officers')
      }
    } catch (error) {
      console.error('Error assigning officers:', error)
      alert('Failed to assign officers. Please try again.')
    } finally {
      setActionLoading(false)
    }
  }

  // Update priority
  const handleChangePriority = async () => {
    if (!selectedPriority) return

    try {
      setActionLoading(true)
      const response = await fetch(`/api/reports/${reportId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          priority: selectedPriority,
          action: 'update_priority'
        })
      })

      if (response.ok) {
        await fetchReport()
        setShowPriorityModal(false)
        setSelectedPriority('')
      } else {
        throw new Error('Failed to update priority')
      }
    } catch (error) {
      console.error('Error updating priority:', error)
      alert('Failed to update priority. Please try again.')
    } finally {
      setActionLoading(false)
    }
  }

  // Update status
  const handleUpdateStatus = async () => {
    if (!selectedStatus) return

    try {
      setActionLoading(true)
      const response = await fetch(`/api/reports/${reportId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          status: selectedStatus,
          action: 'update_status'
        })
      })

      if (response.ok) {
        await fetchReport()
        setShowStatusModal(false)
        setSelectedStatus('')
      } else {
        throw new Error('Failed to update status')
      }
    } catch (error) {
      console.error('Error updating status:', error)
      alert('Failed to update status. Please try again.')
    } finally {
      setActionLoading(false)
    }
  }

  // Add note
  const handleAddNote = async () => {
    if (!newNote.trim()) return

    try {
      setActionLoading(true)
      const response = await fetch(`/api/reports/${reportId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          note: newNote.trim(),
          action: 'add_note'
        })
      })

      if (response.ok) {
        await fetchReport()
        setNewNote('')
      } else {
        throw new Error('Failed to add note')
      }
    } catch (error) {
      console.error('Error adding note:', error)
      alert('Failed to add note. Please try again.')
    } finally {
      setActionLoading(false)
    }
  }

  // Open officer modal with data fetching
  const openOfficerModal = () => {
    setShowOfficerModal(true)
    fetchOfficers(officerSearch)
  }

  // Format date function
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-50 border-red-200'
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200'
      case 'low': return 'text-blue-600 bg-blue-50 border-blue-200'
      default: return 'text-gray-600 bg-gray-50 border-gray-200'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'text-red-600 bg-red-50 border-red-200'
      case 'in_progress': return 'text-yellow-600 bg-yellow-50 border-yellow-200'
      case 'closed': return 'text-green-600 bg-green-50 border-green-200'
      default: return 'text-gray-600 bg-gray-50 border-gray-200'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      </div>
    )
  }

  if (error || !report) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-red-800 mb-2">Error Loading Report</h2>
            <p className="text-red-600">{error || 'Report not found'}</p>
            <Link href="/dashboard" className="inline-block mt-4 text-blue-600 hover:text-blue-800">
              Return to Dashboard
            </Link>
          </div>
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
        <div className="lg:grid lg:grid-cols-3 lg:gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Report Header */}
            <div className="bg-white shadow rounded-lg p-6 mb-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 mb-2">
                    Report #{report.referenceNumber}
                  </h1>
                  <div className="flex items-center space-x-4 text-sm text-gray-600">
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-1" />
                      {formatDate(report.createdAt)}
                    </div>
                    <div className={`px-2 py-1 text-xs font-medium rounded border ${getPriorityColor(report.priority)}`}>
                      {report.priority.charAt(0).toUpperCase() + report.priority.slice(1)} Priority
                    </div>
                    <div className={`px-2 py-1 text-xs font-medium rounded border ${getStatusColor(report.status)}`}>
                      {report.status.replace('_', ' ').charAt(0).toUpperCase() + report.status.replace('_', ' ').slice(1)}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* School Information */}
            <div className="bg-white shadow rounded-lg p-6 mb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <BookOpen className="h-5 w-5 mr-2" />
                School Information
              </h2>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">School Name</p>
                  <p className="font-medium text-gray-900">{report.school.name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">School Code</p>
                  <p className="font-medium text-gray-900">{report.school.code}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Region</p>
                  <p className="font-medium text-gray-900">{report.school.region.name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Phone</p>
                  <p className="font-medium text-gray-900">{report.school.phone}</p>
                </div>
                <div className="md:col-span-2">
                  <p className="text-sm text-gray-600">Address</p>
                  <p className="font-medium text-gray-900">{report.school.address}</p>
                </div>
              </div>
            </div>

            {/* Reporter Information */}
            <div className="bg-white shadow rounded-lg p-6 mb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <User className="h-5 w-5 mr-2" />
                Reported By
              </h2>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Name</p>
                  <p className="font-medium text-gray-900">{report.reportedBy.name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Position</p>
                  <p className="font-medium text-gray-900">{report.reportedBy.position}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Email</p>
                  <p className="font-medium text-gray-900">{report.reportedBy.email}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Phone</p>
                  <p className="font-medium text-gray-900">{report.reportedBy.phone}</p>
                </div>
              </div>
            </div>

            {/* Absence Details */}
            <div className="bg-white shadow rounded-lg p-6 mb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <AlertTriangle className="h-5 w-5 mr-2" />
                Absence Details
              </h2>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Teacher Name</p>
                  <p className="font-medium text-gray-900">{report.absence.teacherName}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Position</p>
                  <p className="font-medium text-gray-900">{report.absence.position}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Date Started</p>
                  <p className="font-medium text-gray-900">{new Date(report.absence.dateStarted).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Expected Return</p>
                  <p className="font-medium text-gray-900">
                    {report.absence.expectedReturn ? new Date(report.absence.expectedReturn).toLocaleDateString() : 'Not specified'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Reason</p>
                  <p className="font-medium text-gray-900">{report.absence.reason}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Coverage Arranged</p>
                  <p className="font-medium text-gray-900">
                    {report.absence.coverageArranged ? 'Yes' : 'No'}
                  </p>
                </div>
              </div>
              
              {report.absence.classesAffected && report.absence.classesAffected.length > 0 && (
                <div className="mt-4">
                  <p className="text-sm text-gray-600 mb-2">Classes Affected</p>
                  <div className="flex flex-wrap gap-2">
                    {report.absence.classesAffected.map((className, index) => (
                      <span key={index} className="px-2 py-1 bg-gray-100 text-gray-800 text-sm rounded">
                        {className}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Description */}
            <div className="bg-white shadow rounded-lg p-6 mb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Additional Details</h2>
              <p className="text-gray-700 whitespace-pre-wrap">{report.description}</p>
            </div>

            {/* Timeline */}
            <div className="bg-white shadow rounded-lg p-6 mb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Clock className="h-5 w-5 mr-2" />
                Timeline
              </h2>
              <div className="space-y-4">
                {report.timeline.map((item, index) => (
                  <div key={item.id} className="flex items-start space-x-3">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <CheckCircle className="w-4 h-4 text-blue-600" />
                      </div>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{item.action}</p>
                      <p className="text-sm text-gray-600">{item.description}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {formatDate(item.timestamp)}
                        {item.officer && ` by ${item.officer.name} (${item.officer.title})`}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            {/* Actions */}
            <div className="bg-white shadow rounded-lg p-6 mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Actions</h3>
              <div className="space-y-3">
                <button
                  onClick={openOfficerModal}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 flex items-center justify-center"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Assign Officers
                </button>
                <button
                  onClick={() => {
                    setSelectedPriority(report.priority)
                    setShowPriorityModal(true)
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 flex items-center justify-center"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Change Priority
                </button>
                <button
                  onClick={() => {
                    setSelectedStatus(report.status)
                    setShowStatusModal(true)
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 flex items-center justify-center"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Update Status
                </button>
              </div>
            </div>

            {/* Assigned Officers */}
            <div className="bg-white shadow rounded-lg p-6 mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Assigned Officers</h3>
              {report.assignedOfficers && report.assignedOfficers.length > 0 ? (
                <div className="space-y-3">
                  {report.assignedOfficers.map((officer) => (
                    <div key={officer.id} className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <User className="w-4 h-4 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">{officer.name}</p>
                        <p className="text-xs text-gray-600">{officer.title || officer.position}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-600">No officers assigned</p>
              )}
            </div>

            {/* Notes */}
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <MessageSquare className="h-5 w-5 mr-2" />
                Notes
              </h3>
              
              {/* Add Note */}
              <div className="mb-4">
                <textarea
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  placeholder="Add a note..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows={3}
                />
                <button
                  onClick={handleAddNote}
                  disabled={!newNote.trim() || actionLoading}
                  className="mt-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg text-sm"
                >
                  {actionLoading ? 'Adding...' : 'Add Note'}
                </button>
              </div>

              {/* Notes List */}
              <div className="space-y-4">
                {report.notes && report.notes.length > 0 ? (
                  report.notes.map((note) => (
                    <div key={note.id} className="border-l-4 border-blue-200 pl-4">
                      <p className="text-sm text-gray-700 mb-1">{note.content}</p>
                      <p className="text-xs text-gray-500">
                        {formatDate(note.createdAt)} by {note.officer.name} ({note.officer.title})
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-600">No notes yet</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Officer Assignment Modal */}
      {showOfficerModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6 max-h-96 overflow-y-auto">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Assign Officers (Multiple Selection)</h3>
            
            {/* Search Input */}
            <div className="mb-4">
              <input
                type="text"
                placeholder="Search officers by name, position, or email..."
                value={officerSearch}
                onChange={(e) => {
                  setOfficerSearch(e.target.value)
                  fetchOfficers(e.target.value)
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {loadingOfficers ? (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                <p className="text-gray-600 mt-2">Loading officers...</p>
              </div>
            ) : (
              <div className="space-y-3 mb-6 max-h-48 overflow-y-auto">
                {officers.length > 0 ? (
                  officers.map((officer) => (
                    <label key={officer.id} className="flex items-center space-x-3 cursor-pointer p-2 hover:bg-gray-50 rounded">
                      <input
                        type="checkbox"
                        checked={selectedOfficers.includes(officer.id)}
                        onChange={(e) => handleOfficerSelection(officer.id, e.target.checked)}
                        className="text-blue-600 rounded"
                      />
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{officer.name}</p>
                        <p className="text-sm text-gray-600">{officer.title || officer.position}</p>
                        <p className="text-xs text-gray-500">{officer.email}</p>
                      </div>
                    </label>
                  ))
                ) : (
                  <p className="text-gray-500 text-center py-4">No officers found</p>
                )}
              </div>
            )}

            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-600">
                {selectedOfficers.length} officer{selectedOfficers.length !== 1 ? 's' : ''} selected
              </p>
              <div className="flex space-x-3">
                <button
                  onClick={() => {
                    setShowOfficerModal(false)
                    setSelectedOfficers([])
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAssignOfficers}
                  disabled={selectedOfficers.length === 0 || actionLoading}
                  className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white rounded-lg"
                >
                  {actionLoading ? 'Assigning...' : 'Assign'}
                </button>
              </div>
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
    </div>
  )
}