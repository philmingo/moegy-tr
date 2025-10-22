'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Plus, Trash2, Users, MapPin, GraduationCap, AlertTriangle } from 'lucide-react'
import Navigation from '@/components/Navigation'

interface Officer {
  id: string
  full_name: string
  email: string
  role: string
}

interface Region {
  id: string
  name: string
}

interface SchoolLevel {
  id: string
  name: string
}

interface Subscription {
  id: string
  region_id: string
  school_level_id: string
  created_at: string
  sms_regions: Region
  sms_school_levels: SchoolLevel
}

export default function OfficerSubscriptionsPage() {
  const router = useRouter()
  const params = useParams()
  const officerId = params.id as string

  const [officer, setOfficer] = useState<Officer | null>(null)
  const [regions, setRegions] = useState<Region[]>([])
  const [schoolLevels, setSchoolLevels] = useState<SchoolLevel[]>([])
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Modal states
  const [showAddModal, setShowAddModal] = useState(false)
  const [selectedRegion, setSelectedRegion] = useState('')
  const [selectedSchoolLevel, setSelectedSchoolLevel] = useState('')
  const [actionLoading, setActionLoading] = useState(false)
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    checkAuthAndLoadData()
  }, [officerId])

  const checkAuthAndLoadData = async () => {
    try {
      const authResponse = await fetch('/api/auth/validate', {
        credentials: 'include'
      })

      if (!authResponse.ok) {
        router.push('/admin')
        return
      }

      const authData = await authResponse.json()
      
      // Only allow admin and senior_officer to manage subscriptions
      if (!['admin', 'senior_officer'].includes(authData.user.role)) {
        router.push('/dashboard')
        return
      }

      setUser(authData.user)
      loadSubscriptionData()
    } catch (error) {
      console.error('Auth check failed:', error)
      router.push('/admin')
    }
  }

  const loadSubscriptionData = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/officers/${officerId}/subscriptions`, {
        credentials: 'include'
      })

      if (!response.ok) {
        throw new Error('Failed to load subscription data')
      }

      const data = await response.json()
      setOfficer(data.officer)
      setRegions(data.regions)
      setSchoolLevels(data.schoolLevels)
      setSubscriptions(data.subscriptions)
    } catch (error) {
      console.error('Error loading data:', error)
      setError(error instanceof Error ? error.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleAddSubscription = async () => {
    if (!selectedRegion || !selectedSchoolLevel) return

    setActionLoading(true)
    try {
      const response = await fetch(`/api/officers/${officerId}/subscriptions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          regionId: selectedRegion,
          schoolLevelId: selectedSchoolLevel
        })
      })

      if (response.ok) {
        setShowAddModal(false)
        setSelectedRegion('')
        setSelectedSchoolLevel('')
        loadSubscriptionData()
      } else {
        const errorData = await response.json()
        alert(errorData.error || 'Failed to add subscription')
      }
    } catch (error) {
      console.error('Error adding subscription:', error)
      alert('Failed to add subscription')
    } finally {
      setActionLoading(false)
    }
  }

  const handleRemoveSubscription = async (subscriptionId: string) => {
    if (!confirm('Are you sure you want to remove this subscription?')) return

    try {
      const response = await fetch(`/api/officers/${officerId}/subscriptions?subscriptionId=${subscriptionId}`, {
        method: 'DELETE',
        credentials: 'include'
      })

      if (response.ok) {
        loadSubscriptionData()
      } else {
        const errorData = await response.json()
        alert(errorData.error || 'Failed to remove subscription')
      }
    } catch (error) {
      console.error('Error removing subscription:', error)
      alert('Failed to remove subscription')
    }
  }

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin': return 'Administrator'
      case 'senior_officer': return 'Senior Officer'
      case 'officer': return 'Officer'
      default: return role
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading subscriptions...</p>
        </div>
      </div>
    )
  }

  if (error || !officer) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h1 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Data</h1>
          <p className="text-gray-600 mb-4">{error || 'Officer not found'}</p>
          <Link
            href="/officers"
            className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Officers
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Users className="h-8 w-8 text-primary-600" />
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  {officer.full_name || officer.email.split('@')[0]} - Subscriptions
                </h1>
                <p className="text-gray-600">
                  {officer.email} • {getRoleLabel(officer.role)}
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg font-medium flex items-center space-x-2"
            >
              <Plus className="h-4 w-4" />
              <span>Add Subscription</span>
            </button>
          </div>
        </div>

        {/* Subscriptions Content */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Region & School Level Subscriptions</h2>
            <p className="text-sm text-gray-500 mt-1">
              Manage which regions and school levels this officer receives notifications for
            </p>
          </div>

          {subscriptions.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Region
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      School Level
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Added On
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {subscriptions.map((subscription) => (
                    <tr key={subscription.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <MapPin className="h-4 w-4 text-blue-500 mr-2" />
                          <span className="text-sm font-medium text-gray-900">
                            {subscription.sms_regions.name}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <GraduationCap className="h-4 w-4 text-green-500 mr-2" />
                          <span className="text-sm text-gray-900">
                            {subscription.sms_school_levels.name}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(subscription.created_at).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => handleRemoveSubscription(subscription.id)}
                          className="text-red-600 hover:text-red-900"
                          title="Remove subscription"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No subscriptions</h3>
              <p className="text-gray-500 mb-4">
                This officer is not subscribed to any regions or school levels yet.
              </p>
              <button
                onClick={() => setShowAddModal(true)}
                className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg"
              >
                Add First Subscription
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Add Subscription Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Add New Subscription</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Region</label>
                <select
                  value={selectedRegion}
                  onChange={(e) => setSelectedRegion(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="">Select a region...</option>
                  {regions.map((region) => (
                    <option key={region.id} value={region.id}>
                      {region.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">School Level</label>
                <select
                  value={selectedSchoolLevel}
                  onChange={(e) => setSelectedSchoolLevel(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="">Select a school level...</option>
                  {schoolLevels.map((level) => (
                    <option key={level.id} value={level.id}>
                      {level.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => setShowAddModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleAddSubscription}
                disabled={!selectedRegion || !selectedSchoolLevel || actionLoading}
                className="flex-1 px-4 py-2 bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white rounded-lg"
              >
                {actionLoading ? 'Adding...' : 'Add Subscription'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}