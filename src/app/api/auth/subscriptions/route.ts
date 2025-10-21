import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import jwt from 'jsonwebtoken'

// Mock school levels based on what I saw in the schools API
const mockSchoolLevels = [
  { id: '1', name: 'Nursery' },
  { id: '2', name: 'Primary' },
  { id: '3', name: 'Secondary' }
]

// Mock regions from the regions API
const mockRegions = [
  { id: '1', name: 'Region 1 - Barima-Waini' },
  { id: '2', name: 'Region 2 - Pomeroon-Supenaam' },
  { id: '3', name: 'Region 3 - Essequibo Islands-West Demerara' },
  { id: '4', name: 'Region 4 - Demerara-Mahaica' },
  { id: '5', name: 'Region 5 - Mahaica-Berbice' },
  { id: '6', name: 'Region 6 - East Berbice-Corentyne' },
  { id: '7', name: 'Region 7 - Cuyuni-Mazaruni' },
  { id: '8', name: 'Region 8 - Potaro-Siparuni' },
  { id: '9', name: 'Region 9 - Upper Takutu-Upper Essequibo' },
  { id: '10', name: 'Region 10 - Upper Demerara-Berbice' }
]

// Mock subscriptions data (in real app, this would be from database)
const mockSubscriptions: Record<string, Array<{regionId: string, schoolLevelId: string}>> = {
  'phil.mingo@moe.gov.gy': [
    { regionId: '4', schoolLevelId: '2' }, // Region 4, Primary
    { regionId: '4', schoolLevelId: '3' }, // Region 4, Secondary
  ],
  'j.martinez@moe.gov.gy': [
    { regionId: '1', schoolLevelId: '1' }, // Region 1, Nursery
    { regionId: '1', schoolLevelId: '2' }, // Region 1, Primary
  ]
}

async function getAuthenticatedUser(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('auth-token')

    if (!token) {
      return null
    }

    const decoded = jwt.verify(token.value, process.env.JWT_SECRET || 'your-secret-key') as any
    return decoded
  } catch (error) {
    return null
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request)
    
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    console.log('Authenticated user for subscriptions:', user) // Debug log

    const userSubscriptions = mockSubscriptions[user.email] || []
    
    // Convert subscription data to include region and school level names
    const subscriptionsWithDetails = userSubscriptions.map(sub => {
      const region = mockRegions.find(r => r.id === sub.regionId)
      const schoolLevel = mockSchoolLevels.find(sl => sl.id === sub.schoolLevelId)
      
      return {
        regionId: sub.regionId,
        regionName: region?.name || 'Unknown Region',
        schoolLevelId: sub.schoolLevelId,
        schoolLevelName: schoolLevel?.name || 'Unknown Level'
      }
    })

    return NextResponse.json({
      subscriptions: subscriptionsWithDetails,
      availableRegions: mockRegions,
      availableSchoolLevels: mockSchoolLevels
    })
  } catch (error) {
    console.error('Error fetching subscriptions:', error)
    return NextResponse.json(
      { error: 'Failed to fetch subscriptions' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request)
    
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { subscriptions } = body

    if (!Array.isArray(subscriptions)) {
      return NextResponse.json(
        { error: 'Subscriptions must be an array' },
        { status: 400 }
      )
    }

    // Validate subscription data
    for (const sub of subscriptions) {
      if (!sub.regionId || !sub.schoolLevelId) {
        return NextResponse.json(
          { error: 'Each subscription must have regionId and schoolLevelId' },
          { status: 400 }
        )
      }
      
      const regionExists = mockRegions.find(r => r.id === sub.regionId)
      const schoolLevelExists = mockSchoolLevels.find(sl => sl.id === sub.schoolLevelId)
      
      if (!regionExists || !schoolLevelExists) {
        return NextResponse.json(
          { error: 'Invalid region or school level ID' },
          { status: 400 }
        )
      }
    }

    // Update subscriptions (in real app, this would update the database)
    mockSubscriptions[user.email] = subscriptions

    return NextResponse.json({
      message: 'Subscriptions updated successfully',
      subscriptions: subscriptions.map(sub => {
        const region = mockRegions.find(r => r.id === sub.regionId)
        const schoolLevel = mockSchoolLevels.find(sl => sl.id === sub.schoolLevelId)
        
        return {
          regionId: sub.regionId,
          regionName: region?.name || 'Unknown Region',
          schoolLevelId: sub.schoolLevelId,
          schoolLevelName: schoolLevel?.name || 'Unknown Level'
        }
      })
    })
  } catch (error) {
    console.error('Error updating subscriptions:', error)
    return NextResponse.json(
      { error: 'Failed to update subscriptions' },
      { status: 500 }
    )
  }
}