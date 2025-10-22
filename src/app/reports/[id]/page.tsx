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
  assignedOfficers: Officer[]
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
  const [savingNote, setSavingNote] = useState(false)
  
  // Modal states
  const [showStatusModal, setShowStatusModal] = useState(false)
  const [showOfficerModal, setShowOfficerModal] = useState(false)
  const [showPriorityModal, setShowPriorityModal] = useState(false)
  
  // Action states
  const [selectedStatus, setSelectedStatus] = useState('')
  const [selectedOfficers, setSelectedOfficers] = useState<string[]>([])
  const [selectedPriority, setSelectedPriority] = useState('')
  const [actionLoading, setActionLoading] = useState(false)
  
  // Officer search states
  const [officers, setOfficers] = useState<Officer[]>([])
  const [officerSearch, setOfficerSearch] = useState('')
  const [loadingOfficers, setLoadingOfficers] = useState(false)

  useEffect(() => {
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

    if (reportId) {
      fetchReport()
    }
  }, [reportId])

  useEffect(() => {
    if (showOfficerModal) {
      fetchOfficers(officerSearch)
    }
  }, [showOfficerModal, officerSearch])

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

  const handleAssignOfficers = async () => {
    if (selectedOfficers.length === 0 || !report) return
    
    const selectedOfficerData = officers.filter(o => selectedOfficers.includes(o.id))
    if (selectedOfficerData.length === 0) return
    
    // Transform the officer data to the format expected by the database
    const officerDataForDB = selectedOfficerData.map(officer => ({
      id: officer.id,
      name: officer.name,  // This comes from the officers API
      title: officer.title || officer.position,
      position: officer.position,
      email: officer.email,
      role: officer.role
    }))
    
    setActionLoading(true)
    try {
      const response = await fetch(`/api/reports/${reportId}`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ assignedOfficers: officerDataForDB })
      })

      const responseData = await response.json()

      if (response.ok) {
        setReport({
          ...report,
          assignedOfficers: officerDataForDB,
          updatedAt: new Date().toISOString()
        })
        setShowOfficerModal(false)
        setSelectedOfficers([])
        
        // Show success message
        alert('Officers assigned successfully!')
      } else {
        console.error('Assignment failed:', responseData)
        alert(`Failed to assign officers: ${responseData.error || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Error assigning officers:', error)
      alert('Network error occurred while assigning officers. Please try again.')
    } finally {
      setActionLoading(false)
    }
  }

  const handleOfficerSelection = (officerId: string, checked: boolean) => {
    if (checked) {
      setSelectedOfficers(prev => [...prev, officerId])
    } else {
      setSelectedOfficers(prev => prev.filter(id => id !== officerId))
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

  const handleSaveNote = async () => {
    if (!newNote.trim() || !report) return
    
    setSavingNote(true)
    try {
      const response = await fetch(`/api/reports/${reportId}/notes`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ content: newNote.trim() })
      })

      const responseData = await response.json()

      if (response.ok) {
        // Add the new note to the report
        const updatedReport = {
          ...report,
          notes: [...report.notes, responseData.note],
          updatedAt: new Date().toISOString()
        }
        setReport(updatedReport)
        setNewNote('')
        setShowAddNote(false)
        
        // Show success message
        alert('Note added successfully!')
      } else {
        console.error('Failed to save note:', responseData)
        alert(`Failed to save note: ${responseData.error || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Error saving note:', error)
      alert('Network error occurred while saving note. Please try again.')
    } finally {
      setSavingNote(false)
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
      
      {/* Main Header Section - Blue Background */}
      <div className="bg-blue-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <Link href="/dashboard" className="flex items-center text-white/80 hover:text-white transition-colors">
              <ArrowLeft className="h-5 w-5 mr-2" />
              Back to Dashboard
            </Link>
          </div>
          
          {/* Report Title and Meta */}
          <div className="pb-8">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center space-x-3 mb-3">
                  <CheckCircle className="h-8 w-8 text-white" />
                  <h1 className="text-3xl font-bold text-white">
                    Report #{report.referenceNumber}
                  </h1>
                </div>
                <p className="text-blue-100 text-lg">
                  Submitted on {formatDate(report.createdAt)}
                </p>
                
                {/* Status and Priority Badges */}
                <div className="flex items-center space-x-3 mt-4">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                    report.status === 'closed' ? 'bg-green-600 text-white' :
                    report.status === 'in_progress' ? 'bg-yellow-600 text-white' :
                    'bg-red-600 text-white'
                  }`}>
                    {report.status === 'closed' ? 'Closed' : 
                     report.status === 'in_progress' ? 'In Progress' : 'Open'}
                  </span>
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                    report.priority === 'high' ? 'bg-red-200 text-red-800' :
                    report.priority === 'medium' ? 'bg-yellow-200 text-yellow-800' :
                    'bg-blue-200 text-blue-800'
                  }`}>
                    {report.priority.charAt(0).toUpperCase() + report.priority.slice(1)} Priority
                  </span>
                </div>
              </div>
              
              {/* Action Buttons */}
              <div className="flex items-center space-x-3">
                <button 
                  onClick={() => setShowStatusModal(true)}
                  className="bg-blue-700 hover:bg-blue-800 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                >
                  Change Status
                </button>
                <button 
                  onClick={() => setShowOfficerModal(true)}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                >
                  Assign Officer
                </button>
                <button 
                  onClick={() => setShowPriorityModal(true)}
                  className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                >
                  Change Priority
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left Column - Main Content */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Report Description */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center space-x-2 mb-4">
                <MessageSquare className="h-5 w-5 text-gray-600" />
                <h2 className="text-lg font-semibold text-gray-900">Report Description</h2>
              </div>
              <p className="text-gray-700 leading-relaxed">{report.description}</p>
            </div>

            {/* School & Teacher Details */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center space-x-2 mb-6">
                <MapPin className="h-5 w-5 text-gray-600" />
                <h2 className="text-lg font-semibold text-gray-900">School & Teacher Details</h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* School Info */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 text-lg mb-2">{report.school.name}</h3>
                  <p className="text-gray-600 mb-1">{report.school.code}</p>
                  <p className="text-sm text-gray-500">
                    Address: {report.school.address || 'Not available'}
                  </p>
                  <p className="text-sm text-gray-500">
                    Phone: {report.school.phone || 'Not available'}
                  </p>
                </div>
                
                {/* Teacher Info */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 text-lg mb-2">{report.teacherName}</h3>
                  <p className="text-gray-600 mb-1">{report.grade}</p>
                  <p className="text-sm text-gray-500">
                    Subject: {report.subject}
                  </p>
                </div>
              </div>
            </div>

            {/* Investigation Notes */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-2">
                  <MessageSquare className="h-5 w-5 text-gray-600" />
                  <h2 className="text-lg font-semibold text-gray-900">Investigation Notes</h2>
                </div>
                <button
                  onClick={() => setShowAddNote(!showAddNote)}
                  className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2"
                >
                  <MessageSquare className="h-4 w-4" />
                  <span>Add Note</span>
                </button>
              </div>

              {showAddNote && (
                <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <textarea
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    placeholder="Document your findings, follow-ups, or investigation details..."
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                    rows={4}
                  />
                  <div className="flex space-x-3 mt-3">
                    <button
                      onClick={handleSaveNote}
                      disabled={!newNote.trim() || savingNote}
                      className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {savingNote ? 'Saving...' : 'Save Note'}
                    </button>
                    <button
                      onClick={() => {
                        setNewNote('')
                        setShowAddNote(false)
                      }}
                      className="px-4 py-2 bg-gray-300 text-gray-700 text-sm rounded-lg hover:bg-gray-400 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {report.notes.length > 0 ? (
                <div className="space-y-4">
                  {report.notes.map((note) => (
                    <div key={note.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <User className="h-4 w-4 text-gray-500" />
                          <span className="text-sm font-semibold text-gray-900">
                            {note.officer.name}
                          </span>
                          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                            {note.officer.title}
                          </span>
                        </div>
                        <span className="text-xs text-gray-500 font-medium">
                          {formatDate(note.createdAt)}
                        </span>
                      </div>
                      <p className="text-gray-700 leading-relaxed">{note.content}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500 italic">No investigation notes have been added yet.</p>
                </div>
              )}
            </div>
            
          </div>

          {/* Right Column - Sidebar */}
          <div className="space-y-6">
            
            {/* Report Information */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Report Information</h3>
              
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <User className="h-4 w-4 text-blue-600" />
                  <div>
                    <p className="text-sm font-medium text-gray-500">Reporter:</p>
                    <p className="text-gray-900 capitalize">{report.reporterType}</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <MapPin className="h-4 w-4 text-green-600" />
                  <div>
                    <p className="text-sm font-medium text-gray-500">Region:</p>
                    <p className="text-gray-900">{report.school.region.name}</p>
                  </div>
                </div>
              </div>
              
              {report.assignedOfficers.length > 0 && (
                <div className="mt-6 pt-4 border-t border-gray-200">
                  <p className="text-sm font-medium text-gray-500 mb-3">Assigned Officer</p>
                  {report.assignedOfficers.map((officer) => (
                    <div key={officer.id} className="bg-blue-50 rounded-lg p-3">
                      <p className="font-semibold text-gray-900">{officer.name}</p>
                      <p className="text-sm text-gray-600">{officer.title}</p>
                      <a 
                        href={`mailto:${officer.email}`}
                        className="text-sm text-blue-600 hover:text-blue-800"
                      >
                        {officer.email}
                      </a>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Timeline */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Timeline</h3>
              
              <div className="space-y-4">
                {report.timeline.map((item, index) => (
                  <div key={item.id} className="flex items-start space-x-3">
                    <div className={`w-3 h-3 rounded-full mt-1 ${
                      item.action.includes('closed') ? 'bg-green-500' :
                      item.action.includes('submitted') ? 'bg-blue-500' :
                      'bg-gray-400'
                    }`}></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{item.action}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {formatDate(item.timestamp)}
                      </p>
                    </div>
                  </div>
                ))}
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