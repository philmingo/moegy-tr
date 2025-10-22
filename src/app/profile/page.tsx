'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { User, Lock, Mail, Briefcase, ArrowLeft, Eye, EyeOff, Bell, MapPin, GraduationCap, Plus, X } from 'lucide-react'
import Navigation from '../../components/Navigation'

interface UserProfile {
  id: string
  email: string
  fullName: string
  position: string
  role: string
  isApproved: boolean
  isVerified: boolean
  createdAt: string
}

interface Subscription {
  regionId: string
  regionName: string
  schoolLevelId: string
  schoolLevelName: string
}

interface Region {
  id: string
  name: string
}

interface SchoolLevel {
  id: string
  name: string
}

export default function ProfilePage() {
  const router = useRouter()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Subscription states
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
  const [availableRegions, setAvailableRegions] = useState<Region[]>([])
  const [availableSchoolLevels, setAvailableSchoolLevels] = useState<SchoolLevel[]>([])
  const [isEditingSubscriptions, setIsEditingSubscriptions] = useState(false)
  const [tempSubscriptions, setTempSubscriptions] = useState<{regionId: string, schoolLevelId: string}[]>([])
  const [loadingSubscriptions, setLoadingSubscriptions] = useState(false)

  const [formData, setFormData] = useState({
    fullName: '',
    position: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })

  useEffect(() => {
    fetchProfile()
    fetchSubscriptions()
  }, [])

  const fetchProfile = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/auth/profile')
      if (!response.ok) {
        if (response.status === 401) {
          router.push('/admin')
          return
        }
        throw new Error('Failed to load profile')
      }
      
      const data = await response.json()
      setProfile(data.profile)
      setFormData({
        fullName: data.profile.fullName,
        position: data.profile.position,
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      })
    } catch (error) {
      console.error('Error fetching profile:', error)
      setError(error instanceof Error ? error.message : 'Failed to load profile')
    } finally {
      setLoading(false)
    }
  }

  const fetchSubscriptions = async () => {
    try {
      setLoadingSubscriptions(true)
      const response = await fetch('/api/auth/subscriptions')
      if (!response.ok) {
        throw new Error('Failed to load subscriptions')
      }
      
      const data = await response.json()
      setSubscriptions(data.subscriptions)
      setAvailableRegions(data.availableRegions)
      setAvailableSchoolLevels(data.availableSchoolLevels)
      setTempSubscriptions(data.subscriptions.map((sub: Subscription) => ({
        regionId: sub.regionId,
        schoolLevelId: sub.schoolLevelId
      })))
    } catch (error) {
      console.error('Error fetching subscriptions:', error)
      // Don't set error state for subscriptions, just log it
    } finally {
      setLoadingSubscriptions(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage(null)

    // Validate password fields if changing password
    if (formData.newPassword || formData.currentPassword) {
      if (!formData.currentPassword) {
        setMessage({ type: 'error', text: 'Current password is required to change password' })
        return
      }
      if (!formData.newPassword) {
        setMessage({ type: 'error', text: 'New password is required' })
        return
      }
      if (formData.newPassword !== formData.confirmPassword) {
        setMessage({ type: 'error', text: 'New passwords do not match' })
        return
      }
      if (formData.newPassword.length < 8) {
        setMessage({ type: 'error', text: 'New password must be at least 8 characters long' })
        return
      }
    }

    setSaving(true)
    try {
      const updateData: any = {
        fullName: formData.fullName,
        position: formData.position
      }

      if (formData.newPassword) {
        updateData.currentPassword = formData.currentPassword
        updateData.newPassword = formData.newPassword
      }

      const response = await fetch('/api/auth/profile', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updateData)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update profile')
      }

      const data = await response.json()
      setProfile(data.profile)
      setFormData({
        ...formData,
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      })
      setIsEditing(false)
      setMessage({ type: 'success', text: 'Profile updated successfully' })
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: error instanceof Error ? error.message : 'Failed to update profile' 
      })
    } finally {
      setSaving(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  const handleAddSubscription = () => {
    setTempSubscriptions([...tempSubscriptions, { regionId: '', schoolLevelId: '' }])
  }

  const handleRemoveSubscription = (index: number) => {
    setTempSubscriptions(tempSubscriptions.filter((_, i) => i !== index))
  }

  const handleSubscriptionChange = (index: number, field: 'regionId' | 'schoolLevelId', value: string) => {
    const updated = [...tempSubscriptions]
    updated[index] = { ...updated[index], [field]: value }
    setTempSubscriptions(updated)
  }

  const handleSaveSubscriptions = async () => {
    try {
      setSaving(true)
      setMessage(null)

      // Filter out incomplete subscriptions
      const validSubscriptions = tempSubscriptions.filter(sub => sub.regionId && sub.schoolLevelId)

      const response = await fetch('/api/auth/subscriptions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ subscriptions: validSubscriptions })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update subscriptions')
      }

      const data = await response.json()
      setSubscriptions(data.subscriptions)
      setIsEditingSubscriptions(false)
      setMessage({ type: 'success', text: 'Notification preferences updated successfully' })
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: error instanceof Error ? error.message : 'Failed to update subscriptions' 
      })
    } finally {
      setSaving(false)
    }
  }

  const handleCancelSubscriptionEdit = () => {
    setIsEditingSubscriptions(false)
    setTempSubscriptions(subscriptions.map(sub => ({
      regionId: sub.regionId,
      schoolLevelId: sub.schoolLevelId
    })))
    setMessage(null)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-6">
          <button
            onClick={() => router.back()}
            className="inline-flex items-center text-primary-600 hover:text-primary-700 mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Profile Settings</h1>
          <p className="text-gray-600 mt-2">Manage your account information and security settings</p>
        </div>

        {message && (
          <div className={`p-4 rounded-lg mb-6 ${
            message.type === 'success' 
              ? 'bg-green-50 text-green-700 border border-green-200' 
              : 'bg-red-50 text-red-700 border border-red-200'
          }`}>
            {message.text}
          </div>
        )}

        {profile && (
          <div className="grid gap-6">
            {/* Account Information */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center">
                  <User className="w-6 h-6 text-primary-600 mr-3" />
                  <h2 className="text-xl font-semibold text-gray-900">Account Information</h2>
                </div>
                {!isEditing && (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                  >
                    Edit Profile
                  </button>
                )}
              </div>

              <form onSubmit={handleSubmit}>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-2">
                      Full Name
                    </label>
                    <input
                      type="text"
                      id="fullName"
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleChange}
                      disabled={!isEditing}
                      className={`w-full px-4 py-3 border border-gray-300 rounded-lg ${
                        isEditing 
                          ? 'focus:ring-2 focus:ring-primary-500 focus:border-transparent' 
                          : 'bg-gray-50'
                      }`}
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="position" className="block text-sm font-medium text-gray-700 mb-2">
                      Position/Title
                    </label>
                    <input
                      type="text"
                      id="position" 
                      name="position"
                      value={formData.position}
                      onChange={handleChange}
                      disabled={!isEditing}
                      className={`w-full px-4 py-3 border border-gray-300 rounded-lg ${
                        isEditing 
                          ? 'focus:ring-2 focus:ring-primary-500 focus:border-transparent' 
                          : 'bg-gray-50'
                      }`}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email Address
                    </label>
                    <div className="relative">
                      <input
                        type="email"
                        value={profile.email}
                        disabled
                        className="w-full px-4 py-3 pl-10 border border-gray-300 rounded-lg bg-gray-50"
                      />
                      <Mail className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Role
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={profile.role}
                        disabled
                        className="w-full px-4 py-3 pl-10 border border-gray-300 rounded-lg bg-gray-50 capitalize"
                      />
                      <Briefcase className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                    </div>
                  </div>
                </div>

                {isEditing && (
                  <>
                    <hr className="my-6" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                      <Lock className="w-5 h-5 mr-2" />
                      Change Password (Optional)
                    </h3>
                    
                    <div className="grid gap-6">
                      <div>
                        <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 mb-2">
                          Current Password
                        </label>
                        <div className="relative">
                          <input
                            type={showCurrentPassword ? 'text' : 'password'}
                            id="currentPassword"
                            name="currentPassword"
                            value={formData.currentPassword}
                            onChange={handleChange}
                            className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                            placeholder="Enter current password"
                          />
                          <button
                            type="button"
                            onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                          >
                            {showCurrentPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                          </button>
                        </div>
                      </div>

                      <div>
                        <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-2">
                          New Password
                        </label>
                        <div className="relative">
                          <input
                            type={showNewPassword ? 'text' : 'password'}
                            id="newPassword"
                            name="newPassword"
                            value={formData.newPassword}
                            onChange={handleChange}
                            className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                            placeholder="Enter new password"
                          />
                          <button
                            type="button"
                            onClick={() => setShowNewPassword(!showNewPassword)}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                          >
                            {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                          </button>
                        </div>
                      </div>

                      <div>
                        <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                          Confirm New Password
                        </label>
                        <input
                          type="password"
                          id="confirmPassword"
                          name="confirmPassword"
                          value={formData.confirmPassword}
                          onChange={handleChange}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                          placeholder="Confirm new password"
                        />
                      </div>
                    </div>

                    <div className="flex space-x-4 mt-6">
                      <button
                        type="button"
                        onClick={() => {
                          setIsEditing(false)
                          setFormData({
                            fullName: profile.fullName,
                            position: profile.position,
                            currentPassword: '',
                            newPassword: '',
                            confirmPassword: ''
                          })
                          setMessage(null)
                        }}
                        className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                        disabled={saving}
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 transition-colors"
                        disabled={saving}
                      >
                        {saving ? 'Saving...' : 'Save Changes'}
                      </button>
                    </div>
                  </>
                )}
              </form>
            </div>

            {/* Account Status */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Account Status</h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-700">Account Approval</span>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    profile.isApproved 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {profile.isApproved ? 'Approved' : 'Pending Approval'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-700">Email Verification</span>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    profile.isVerified 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {profile.isVerified ? 'Verified' : 'Not Verified'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-700">Member Since</span>
                  <span className="text-gray-600">
                    {new Date(profile.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Notification Preferences */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center">
                  <Bell className="w-6 h-6 text-primary-600 mr-3" />
                  <h2 className="text-xl font-semibold text-gray-900">Notification Preferences</h2>
                </div>
                {!isEditingSubscriptions && (
                  <button
                    onClick={() => setIsEditingSubscriptions(true)}
                    className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                  >
                    Edit Preferences
                  </button>
                )}
              </div>

              {loadingSubscriptions ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600"></div>
                  <span className="ml-2 text-gray-600">Loading preferences...</span>
                </div>
              ) : (
                <>
                  <p className="text-gray-600 mb-4">
                    Select which regions and school levels you want to receive notifications for when new teacher absence reports are submitted.
                  </p>

                  {isEditingSubscriptions ? (
                    <div className="space-y-4">
                      {tempSubscriptions.map((subscription, index) => (
                        <div key={index} className="flex items-center space-x-4 p-4 border border-gray-200 rounded-lg">
                          <div className="flex-1">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              <MapPin className="w-4 h-4 inline mr-1" />
                              Region
                            </label>
                            <select
                              value={subscription.regionId}
                              onChange={(e) => handleSubscriptionChange(index, 'regionId', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                            >
                              <option value="">Select Region</option>
                              {availableRegions.map((region) => (
                                <option key={region.id} value={region.id}>
                                  {region.name}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div className="flex-1">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              <GraduationCap className="w-4 h-4 inline mr-1" />
                              School Level
                            </label>
                            <select
                              value={subscription.schoolLevelId}
                              onChange={(e) => handleSubscriptionChange(index, 'schoolLevelId', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                            >
                              <option value="">Select Level</option>
                              {availableSchoolLevels.map((level) => (
                                <option key={level.id} value={level.id}>
                                  {level.name}
                                </option>
                              ))}
                            </select>
                          </div>
                          <button
                            onClick={() => handleRemoveSubscription(index)}
                            className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                            title="Remove subscription"
                          >
                            <X className="w-5 h-5" />
                          </button>
                        </div>
                      ))}

                      <button
                        onClick={handleAddSubscription}
                        className="flex items-center space-x-2 px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-primary-400 hover:bg-primary-50 transition-colors w-full"
                      >
                        <Plus className="w-5 h-5 text-gray-400" />
                        <span className="text-gray-600">Add Notification Preference</span>
                      </button>

                      <div className="flex space-x-4 pt-4">
                        <button
                          onClick={handleCancelSubscriptionEdit}
                          className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                          disabled={saving}
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleSaveSubscriptions}
                          className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 transition-colors"
                          disabled={saving}
                        >
                          {saving ? 'Saving...' : 'Save Preferences'}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {subscriptions.length > 0 ? (
                        (() => {
                          // Group subscriptions by region
                          const groupedSubscriptions = subscriptions.reduce((acc, subscription) => {
                            const regionName = subscription.regionName
                            if (!acc[regionName]) {
                              acc[regionName] = []
                            }
                            acc[regionName].push(subscription.schoolLevelName)
                            return acc
                          }, {} as Record<string, string[]>)

                          return Object.entries(groupedSubscriptions).map(([regionName, schoolLevels], index) => (
                            <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                              <div className="flex items-center space-x-3">
                                <MapPin className="w-4 h-4 text-primary-600 flex-shrink-0" />
                                <div className="text-gray-700">
                                  <span className="font-medium">{regionName}:</span>{' '}
                                  <span>{schoolLevels.join(', ')}</span>
                                </div>
                              </div>
                            </div>
                          ))
                        })()
                      ) : (
                        <div className="text-center py-8 text-gray-500">
                          <Bell className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                          <p>No notification preferences set</p>
                          <p className="text-sm">Click &quot;Edit Preferences&quot; to configure your notifications</p>
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}