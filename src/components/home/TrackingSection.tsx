'use client'

import { useState } from 'react'
import { Search, Calendar, MapPin, AlertTriangle, CheckCircle, Clock } from 'lucide-react'

interface TrackingResult {
  referenceNumber: string
  status: string
  priority: string
  school: string
  region: string
  createdAt: string
  officerNotified: {
    name: string
    title: string
    notifiedAt: string
  }
}

export default function TrackingSection() {
  const [trackingNumber, setTrackingNumber] = useState('')
  const [searchResult, setSearchResult] = useState<TrackingResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSearch = async () => {
    if (!trackingNumber.trim()) {
      setError('Please enter a reference number')
      return
    }

    try {
      setLoading(true)
      setError('')
      
      const response = await fetch(`/api/track?ref=${encodeURIComponent(trackingNumber.trim())}`)
      const data = await response.json()
      
      if (response.ok) {
        setSearchResult(data.report)
      } else {
        setError(data.error || 'Reference number not found. Please check and try again.')
        setSearchResult(null)
      }
    } catch (err) {
      setError('An error occurred while searching. Please try again.')
      setSearchResult(null)
    } finally {
      setLoading(false)
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

  return (
    <section className="py-16 bg-white">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              Track Your Report
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Enter your reference number to check the status of your teacher absence report
            </p>
          </div>

          {/* Search Form */}
          <div className="bg-gray-50 rounded-2xl p-8 mb-8">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="Enter reference number (e.g., EDU20241001)"
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
              <button
                onClick={handleSearch}
                disabled={loading}
                className="bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white px-6 py-3 rounded-lg font-medium flex items-center justify-center space-x-2 min-w-[140px]"
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                ) : (
                  <>
                    <Search className="h-5 w-5" />
                    <span>Search</span>
                  </>
                )}
              </button>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-700">{error}</p>
              </div>
            )}
          </div>

          {/* Search Results */}
          {searchResult && (
            <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-gray-900">
                  {searchResult.referenceNumber}
                </h3>
                <div className="flex space-x-3">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(searchResult.status)}`}>
                    {getStatusIcon(searchResult.status)}
                    <span className="ml-2">{searchResult.status.replace('_', ' ').toUpperCase()}</span>
                  </span>
                  <span className={`inline-flex px-3 py-1 rounded-full text-sm font-medium border ${getPriorityColor(searchResult.priority)}`}>
                    {searchResult.priority.toUpperCase()} PRIORITY
                  </span>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-8">
                {/* Report Information */}
                <div className="space-y-6">
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3">Report Information</h4>
                    <div className="space-y-3">
                      <div className="flex items-start space-x-3">
                        <MapPin className="h-5 w-5 text-gray-400 mt-0.5" />
                        <div>
                          <p className="font-medium text-gray-900">{searchResult.school}</p>
                          <p className="text-sm text-gray-600">{searchResult.region}</p>
                        </div>
                      </div>
                      <div className="flex items-start space-x-3">
                        <Calendar className="h-5 w-5 text-gray-400 mt-0.5" />
                        <div>
                          <p className="text-sm text-gray-600">Filed on</p>
                          <p className="font-medium text-gray-900">{formatDate(searchResult.createdAt)}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Officer Notification */}
                <div className="space-y-6">
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3">Officer Notification</h4>
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <p className="font-medium text-blue-900">{searchResult.officerNotified.name}</p>
                      <p className="text-sm text-blue-700">{searchResult.officerNotified.title}</p>
                      <p className="text-sm text-blue-600 mt-2">
                        Notified on {formatDate(searchResult.officerNotified.notifiedAt)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Status Messages */}
              <div className="mt-8 p-4 bg-gray-50 rounded-lg">
                {searchResult.status === 'open' && (
                  <p className="text-gray-700">
                    <strong>Status:</strong> Your report has been received and an education officer has been notified. 
                    Investigation is pending.
                  </p>
                )}
                {searchResult.status === 'in_progress' && (
                  <p className="text-gray-700">
                    <strong>Status:</strong> Your report is currently being investigated by our education officer. 
                    You will be updated on any developments.
                  </p>
                )}
                {searchResult.status === 'closed' && (
                  <p className="text-gray-700">
                    <strong>Status:</strong> Your report has been resolved. Thank you for helping us maintain 
                    educational standards.
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Sample Reference Numbers for Testing */}
          <div className="mt-8 text-center">
            <p className="text-sm text-gray-500 mb-2">For testing, try these reference numbers:</p>
            <div className="flex flex-wrap justify-center gap-2">
              <button
                onClick={() => setTrackingNumber('EDU20241001')}
                className="text-sm text-primary-600 hover:text-primary-700 underline"
              >
                EDU20241001
              </button>
              <button
                onClick={() => setTrackingNumber('EDU20241002')}
                className="text-sm text-primary-600 hover:text-primary-700 underline"
              >
                EDU20241002
              </button>
              <button
                onClick={() => setTrackingNumber('EDU20241003')}
                className="text-sm text-primary-600 hover:text-primary-700 underline"
              >
                EDU20241003
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}