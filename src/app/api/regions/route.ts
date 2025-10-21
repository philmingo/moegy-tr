import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  try {
    // TODO: Get regions from Supabase
    // For now, return mock data

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

    return NextResponse.json({
      regions: mockRegions
    })

  } catch (error) {
    console.error('Regions API error:', error)
    return NextResponse.json(
      { error: 'An error occurred while fetching regions' },
      { status: 500 }
    )
  }
}