import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'

export async function GET() {
  try {
    const supabase = createAdminClient()
    
    // Test database connectivity and basic operations
    const tests = {
      regions: { count: 0, sample: null },
      schoolLevels: { count: 0, sample: null },
      schools: { count: 0, sample: null },
      users: { count: 0, sample: null },
      reports: { count: 0, sample: null }
    }
    
    // Test regions
    try {
      const { count } = await supabase
        .from('sms_regions')
        .select('*', { count: 'exact', head: true })
      tests.regions.count = count || 0
      
      const { data: regionSample } = await supabase
        .from('sms_regions')
        .select('id, name')
        .limit(1)
        .single()
      tests.regions.sample = regionSample
    } catch (error) {
      console.error('Regions test failed:', error)
    }
    
    // Test school levels
    try {
      const { count } = await supabase
        .from('sms_school_levels')
        .select('*', { count: 'exact', head: true })
      tests.schoolLevels.count = count || 0
      
      const { data: levelSample } = await supabase
        .from('sms_school_levels')
        .select('id, name')
        .limit(1)
        .single()
      tests.schoolLevels.sample = levelSample
    } catch (error) {
      console.error('School levels test failed:', error)
    }
    
    // Test schools
    try {
      const { count } = await supabase
        .from('sms_schools')
        .select('*', { count: 'exact', head: true })
      tests.schools.count = count || 0
      
      const { data: schoolSample } = await supabase
        .from('sms_schools')
        .select('id, name, code')
        .limit(1)
        .single()
      tests.schools.sample = schoolSample
    } catch (error) {
      console.error('Schools test failed:', error)
    }
    
    // Test users
    try {
      const { count } = await supabase
        .from('sms1_users')
        .select('*', { count: 'exact', head: true })
      tests.users.count = count || 0
      
      const { data: userSample } = await supabase
        .from('sms1_users')
        .select('id, email, full_name, role')
        .limit(1)
        .single()
      tests.users.sample = userSample
    } catch (error) {
      console.error('Users test failed:', error)
    }
    
    // Test reports
    try {
      const { count } = await supabase
        .from('sms1_reports')
        .select('*', { count: 'exact', head: true })
      tests.reports.count = count || 0
      
      const { data: reportSample } = await supabase
        .from('sms1_reports')
        .select('id, reference_number, status')
        .limit(1)
        .single()
      tests.reports.sample = reportSample
    } catch (error) {
      console.error('Reports test failed:', error)
    }
    
    return NextResponse.json({
      status: 'success',
      message: 'Database connectivity test completed',
      timestamp: new Date().toISOString(),
      tests,
      summary: {
        totalRegions: tests.regions.count,
        totalSchoolLevels: tests.schoolLevels.count,
        totalSchools: tests.schools.count,
        totalUsers: tests.users.count,
        totalReports: tests.reports.count
      }
    })

  } catch (error) {
    console.error('Database test error:', error)
    return NextResponse.json(
      { 
        status: 'error',
        message: 'Database connectivity test failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}