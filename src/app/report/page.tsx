'use client'

import { useState, useEffect } from 'react'
import { CheckCircle, AlertCircle } from 'lucide-react'
import Navigation from '../../components/Navigation'

export default function ReportPage() {
  const [formData, setFormData] = useState({
    regionId: '',
    schoolId: '',
    grade: '',
    teacherName: '',
    subject: '',
    reporterType: '',
    description: ''
  })
  
  const [schoolSearch, setSchoolSearch] = useState('')
  const [filteredSchools, setFilteredSchools] = useState([])
  
  const [regions, setRegions] = useState([])
  const [schools, setSchools] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [referenceNumber, setReferenceNumber] = useState('')
  const [error, setError] = useState('')

  // Load regions on component mount
  useEffect(() => {
    fetch('/api/regions')
      .then(res => res.json())
      .then(data => setRegions(data.regions || []))
      .catch(err => console.error('Failed to load regions:', err))
  }, [])

  // Load schools when region changes
  useEffect(() => {
    if (formData.regionId) {
      fetch(`/api/schools?regionId=${formData.regionId}`)
        .then(res => res.json())
        .then(data => {
          setSchools(data.schools || [])
          setFilteredSchools(data.schools || [])
        })
        .catch(err => console.error('Failed to load schools:', err))
    } else {
      setSchools([])
      setFilteredSchools([])
      setFormData(prev => ({ ...prev, schoolId: '' }))
      setSchoolSearch('')
    }
  }, [formData.regionId])

  // Filter schools based on search
  useEffect(() => {
    if (schoolSearch.trim() === '') {
      setFilteredSchools(schools)
    } else {
      const filtered = schools.filter((school: any) =>
        school.name.toLowerCase().includes(schoolSearch.toLowerCase()) ||
        school.code.toLowerCase().includes(schoolSearch.toLowerCase())
      )
      setFilteredSchools(filtered)
    }
  }, [schoolSearch, schools])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    setError('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      const response = await fetch('/api/reports', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit report')
      }

      setReferenceNumber(data.referenceNumber)
      setIsSubmitted(true)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="py-8">
          <div className="container mx-auto px-4 max-w-2xl">
            <div className="bg-white rounded-xl shadow-sm border p-8 text-center">
            <CheckCircle className="h-16 w-16 text-success-500 mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Report Submitted Successfully!</h1>
            <p className="text-gray-600 mb-6">Your report has been received and forwarded to the appropriate education officers.</p>
            
            <div className="bg-success-50 border border-success-200 rounded-lg p-4 mb-6">
              <p className="font-semibold text-success-800 mb-2">Reference Number:</p>
              <p className="text-2xl font-bold text-success-900">{referenceNumber}</p>
              <p className="text-sm text-success-700 mt-2">Please save this reference number for your records.</p>
            </div>

            <button 
              onClick={() => {
                setIsSubmitted(false)
                setFormData({
                  regionId: '',
                  schoolId: '',
                  grade: '',
                  teacherName: '',
                  subject: '',
                  reporterType: '',
                  description: ''
                })
                setSchoolSearch('')
              }}
              className="bg-primary-500 hover:bg-primary-600 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200"
            >
              Submit Another Report
            </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <div className="py-8">
        <div className="container mx-auto px-4 max-w-2xl">
        <div className="bg-white rounded-xl shadow-sm border p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Report Teacher Absence</h1>
            <p className="text-gray-600">Help us ensure quality education by reporting teacher absence</p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start space-x-3">
              <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
              <p className="text-red-700">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Region Selection */}
            <div>
              <label htmlFor="regionId" className="block text-sm font-medium text-gray-700 mb-2">
                Region *
              </label>
              <select 
                id="regionId"
                name="regionId"
                value={formData.regionId}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                required
              >
                <option value="">Select a region</option>
                {regions.map((region: any) => (
                  <option key={region.id} value={region.id}>
                    {region.name}
                  </option>
                ))}
              </select>
            </div>

            {/* School Search and Selection */}
            <div>
              <label htmlFor="schoolSearch" className="block text-sm font-medium text-gray-700 mb-2">
                Search for School *
              </label>
              <div className="space-y-2">
                <input
                  type="text"
                  id="schoolSearch"
                  value={schoolSearch}
                  onChange={(e) => setSchoolSearch(e.target.value)}
                  placeholder={formData.regionId ? 'Type school name or code to search...' : 'First select a region'}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-100"
                  disabled={!formData.regionId}
                />
                
                {formData.regionId && filteredSchools.length > 0 && (
                  <div className="border border-gray-200 rounded-lg max-h-40 overflow-y-auto">
                    {filteredSchools.map((school: any) => (
                      <button
                        key={school.id}
                        type="button"
                        onClick={() => {
                          setFormData(prev => ({ ...prev, schoolId: school.id }))
                          setSchoolSearch(`${school.name} (${school.code})`)
                        }}
                        className={`w-full text-left px-3 py-2 hover:bg-gray-50 border-b border-gray-100 last:border-b-0 ${
                          formData.schoolId === school.id ? 'bg-primary-50 text-primary-700' : 'text-gray-900'
                        }`}
                      >
                        <div className="font-medium">{school.name}</div>
                        <div className="text-sm text-gray-500">{school.code} • {school.school_level?.name}</div>
                      </button>
                    ))}
                  </div>
                )}
                
                {formData.regionId && schoolSearch.length > 0 && filteredSchools.length === 0 && (
                  <div className="text-sm text-gray-500 italic">No schools found matching your search</div>
                )}
              </div>
              
              {formData.schoolId && (
                <input type="hidden" name="schoolId" value={formData.schoolId} required />
              )}
            </div>

            {/* Grade */}
            <div>
              <label htmlFor="grade" className="block text-sm font-medium text-gray-700 mb-2">
                Grade/Class *
              </label>
              <input 
                type="text"
                id="grade"
                name="grade"
                value={formData.grade}
                onChange={handleInputChange}
                placeholder="e.g., Grade 5, Form 3A"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                required
              />
            </div>

            {/* Teacher Name */}
            <div>
              <label htmlFor="teacherName" className="block text-sm font-medium text-gray-700 mb-2">
                Teacher&apos;s Name *
              </label>
              <input 
                type="text"
                id="teacherName"
                name="teacherName"
                value={formData.teacherName}
                onChange={handleInputChange}
                placeholder="Enter teacher's full name"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                required
              />
            </div>

            {/* Subject */}
            <div>
              <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-2">
                Subject *
              </label>
              <input 
                type="text"
                id="subject"
                name="subject"
                value={formData.subject}
                onChange={handleInputChange}
                placeholder="e.g., Mathematics, English, Science"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                required
              />
            </div>

            {/* Reporter Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                You are reporting as: *
              </label>
              <div className="space-y-2">
                <label className="flex items-center">
                  <input 
                    type="radio" 
                    name="reporterType" 
                    value="student"
                    checked={formData.reporterType === 'student'}
                    onChange={handleInputChange}
                    className="mr-2" 
                    required 
                  />
                  Student
                </label>
                <label className="flex items-center">
                  <input 
                    type="radio" 
                    name="reporterType" 
                    value="parent"
                    checked={formData.reporterType === 'parent'}
                    onChange={handleInputChange}
                    className="mr-2" 
                  />
                  Parent/Guardian
                </label>
                <label className="flex items-center">
                  <input 
                    type="radio" 
                    name="reporterType" 
                    value="other"
                    checked={formData.reporterType === 'other'}
                    onChange={handleInputChange}
                    className="mr-2" 
                  />
                  Community Member/Other
                </label>
              </div>
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                Description of Issue *
              </label>
              <textarea 
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={4}
                placeholder="Please provide details about the teacher absence or issue..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                required
              ></textarea>
            </div>

            {/* Submit Button */}
            <button 
              type="submit"
              disabled={isLoading}
              className="w-full bg-primary-500 hover:bg-primary-600 disabled:bg-gray-400 text-white py-3 px-6 rounded-lg font-semibold transition-colors duration-200"
            >
              {isLoading ? 'Submitting...' : 'Submit Report'}
            </button>
          </form>

          <div className="mt-6 p-4 bg-success-50 border border-success-200 rounded-lg">
            <p className="text-success-700 text-sm">
              <strong>Note:</strong> Your report will be automatically forwarded to the appropriate education officers 
              for your region. You will receive a confirmation with a reference number once submitted.
            </p>
          </div>
        </div>
      </div>
    </div>
    </div>
  )
}