'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Users, Plus, Search, Edit, Trash2, Key, Settings, Mail, CheckCircle, XCircle, AlertTriangle } from 'lucide-react'

interface Officer {
  id: string
  full_name: string
  email: string
  position: string
  role: 'officer' | 'senior_officer' | 'admin'
  is_approved: boolean
  is_verified: boolean
  created_at: string
  subscription_count?: number
}

export default function OfficersPage() {
  const router = useRouter()
  const [officers, setOfficers] = useState<Officer[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [showAddModal, setShowAddModal] = useState(false)
  const [selectedOfficer, setSelectedOfficer] = useState<Officer | null>(null)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [user, setUser] = useState<any>(null)

  // Form states
  const [newOfficer, setNewOfficer] = useState({
    full_name: '',
    email: '',
    position: '',
    role: 'officer' as 'officer' | 'senior_officer' | 'admin',
    password: ''
  })

  useEffect(() => {
    checkAuthAndLoadData()
  }, [])

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
      
      // Only allow admin and senior_officer to access officers management
      if (!['admin', 'senior_officer'].includes(authData.user.role)) {
        router.push('/dashboard')
        return
      }

      setUser(authData.user)
      loadOfficers()
    } catch (error) {
      console.error('Auth check failed:', error)
      router.push('/admin')
    }
  }

  const loadOfficers = async () => {
    try {
      setLoading(true)
      const query = new URLSearchParams()
      if (searchTerm) query.append('q', searchTerm)
      if (roleFilter !== 'all') query.append('role', roleFilter)

      const response = await fetch(`/api/officers/manage?${query.toString()}`, {
        credentials: 'include'
      })

      if (response.ok) {
        const data = await response.json()
        setOfficers(data.officers)
      }
    } catch (error) {
      console.error('Error loading officers:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const debounce = setTimeout(() => {
      if (user) loadOfficers()
    }, 300)
    return () => clearTimeout(debounce)
  }, [searchTerm, roleFilter])

  const handleAddOfficer = async () => {
    try {
      const response = await fetch('/api/officers/manage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(newOfficer)
      })

      if (response.ok) {
        setShowAddModal(false)
        setNewOfficer({
          full_name: '',
          email: '',
          position: '',
          role: 'officer',
          password: ''
        })
        loadOfficers()
      }
    } catch (error) {
      console.error('Error adding officer:', error)
    }
  }

  const handleUpdateOfficer = async () => {
    if (!selectedOfficer) return

    try {
      const response = await fetch(`/api/officers/manage/${selectedOfficer.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          full_name: selectedOfficer.full_name,
          position: selectedOfficer.position,
          role: selectedOfficer.role,
          is_approved: selectedOfficer.is_approved
        })
      })

      if (response.ok) {
        setShowEditModal(false)
        setSelectedOfficer(null)
        loadOfficers()
      }
    } catch (error) {
      console.error('Error updating officer:', error)
    }
  }

  const handleDeleteOfficer = async (officer: Officer) => {
    if (!confirm(`Are you sure you want to delete ${officer.full_name}? This action cannot be undone.`)) {
      return
    }

    try {
      const response = await fetch(`/api/officers/manage/${officer.id}`, {
        method: 'DELETE',
        credentials: 'include'
      })

      if (response.ok) {
        loadOfficers()
      }
    } catch (error) {
      console.error('Error deleting officer:', error)
    }
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-purple-100 text-purple-800'
      case 'senior_officer': return 'bg-blue-100 text-blue-800'
      case 'officer': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin': return 'Admin'
      case 'senior_officer': return 'Senior Officer'
      case 'officer': return 'Officer'
      default: return role
    }
  }

  if (loading && officers.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading officers...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/dashboard" className="text-gray-600 hover:text-gray-900">
                ← Back to Dashboard
              </Link>
              <div className="flex items-center space-x-3">
                <Users className="h-8 w-8 text-primary-600" />
                <h1 className="text-2xl font-bold text-gray-900">Officers Management</h1>
              </div>
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg font-medium flex items-center space-x-2"
            >
              <Plus className="h-4 w-4" />
              <span>Add Officer</span>
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search officers by name, email, or position..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
            </div>
            <div>
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="all">All Roles</option>
                <option value="officer">Officers</option>
                <option value="senior_officer">Senior Officers</option>
                <option value="admin">Admins</option>
              </select>
            </div>
          </div>
        </div>

        {/* Officers Table */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Officer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Subscriptions
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {officers.map((officer) => (
                  <tr key={officer.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {officer.full_name || officer.email.split('@')[0]}
                        </div>
                        <div className="text-sm text-gray-500">{officer.email}</div>
                        <div className="text-xs text-gray-400">{officer.position || 'No position set'}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleColor(officer.role)}`}>
                        {getRoleLabel(officer.role)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        {officer.is_approved ? (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-500" />
                        )}
                        <span className={`text-sm ${officer.is_approved ? 'text-green-700' : 'text-red-700'}`}>
                          {officer.is_approved ? 'Approved' : 'Pending'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {officer.subscription_count || 0} regions
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      <button
                        onClick={() => {
                          setSelectedOfficer(officer)
                          setShowEditModal(true)
                        }}
                        className="text-blue-600 hover:text-blue-900"
                        title="Edit Officer"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => {
                          setSelectedOfficer(officer)
                          setShowPasswordModal(true)
                        }}
                        className="text-yellow-600 hover:text-yellow-900"
                        title="Reset Password"
                      >
                        <Key className="h-4 w-4" />
                      </button>
                      <Link
                        href={`/officers/${officer.id}/subscriptions`}
                        className="text-green-600 hover:text-green-900"
                        title="Manage Subscriptions"
                      >
                        <Settings className="h-4 w-4" />
                      </Link>
                      <button
                        onClick={() => handleDeleteOfficer(officer)}
                        className="text-red-600 hover:text-red-900"
                        title="Delete Officer"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {officers.length === 0 && !loading && (
            <div className="text-center py-12">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No officers found</h3>
              <p className="text-gray-500">
                {searchTerm || roleFilter !== 'all' 
                  ? 'Try adjusting your search filters.' 
                  : 'Get started by adding your first officer.'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Add Officer Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Add New Officer</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <input
                  type="text"
                  value={newOfficer.full_name}
                  onChange={(e) => setNewOfficer({...newOfficer, full_name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={newOfficer.email}
                  onChange={(e) => setNewOfficer({...newOfficer, email: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="user@moe.gov.gy"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Position</label>
                <input
                  type="text"
                  value={newOfficer.position}
                  onChange={(e) => setNewOfficer({...newOfficer, position: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Education Officer"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                <select
                  value={newOfficer.role}
                  onChange={(e) => setNewOfficer({...newOfficer, role: e.target.value as any})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="officer">Officer</option>
                  <option value="senior_officer">Senior Officer</option>
                  {user?.role === 'admin' && <option value="admin">Admin</option>}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <input
                  type="password"
                  value={newOfficer.password}
                  onChange={(e) => setNewOfficer({...newOfficer, password: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
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
                onClick={handleAddOfficer}
                className="flex-1 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg"
              >
                Add Officer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Officer Modal */}
      {showEditModal && selectedOfficer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Edit Officer</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <input
                  type="text"
                  value={selectedOfficer.full_name}
                  onChange={(e) => setSelectedOfficer({...selectedOfficer, full_name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Position</label>
                <input
                  type="text"
                  value={selectedOfficer.position}
                  onChange={(e) => setSelectedOfficer({...selectedOfficer, position: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                <select
                  value={selectedOfficer.role}
                  onChange={(e) => setSelectedOfficer({...selectedOfficer, role: e.target.value as any})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="officer">Officer</option>
                  <option value="senior_officer">Senior Officer</option>
                  {user?.role === 'admin' && <option value="admin">Admin</option>}
                </select>
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="approved"
                  checked={selectedOfficer.is_approved}
                  onChange={(e) => setSelectedOfficer({...selectedOfficer, is_approved: e.target.checked})}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <label htmlFor="approved" className="ml-2 block text-sm text-gray-900">
                  Approved
                </label>
              </div>
            </div>
            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => setShowEditModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateOfficer}
                className="flex-1 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg"
              >
                Update
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}