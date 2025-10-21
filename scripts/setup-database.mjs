#!/usr/bin/env node

/**
 * Database Setup and Test Script
 * This script sets up the database schema and tests basic functionality
 */

import { createAdminClient } from '../src/lib/supabase.js'
import { readFileSync } from 'fs'
import { join } from 'path'

async function setupDatabase() {
  console.log('🚀 Starting database setup...')
  
  const supabase = createAdminClient()
  
  try {
    // Test basic connection
    console.log('📡 Testing database connection...')
    const { data, error } = await supabase
      .from('sms_regions')
      .select('count', { count: 'exact', head: true })
    
    if (error) {
      console.error('❌ Database connection failed:', error.message)
      
      // If the table doesn't exist, we need to run the schema
      if (error.message.includes('relation "sms_regions" does not exist')) {
        console.log('📝 Setting up database schema...')
        console.log('Please run the schema.sql file in your Supabase SQL editor:')
        console.log('Location: ./database/schema.sql')
        return false
      }
      return false
    }
    
    console.log('✅ Database connection successful!')
    
    // Check if we have sample data
    console.log('🔍 Checking for existing data...')
    
    const { data: regions } = await supabase
      .from('sms_regions')
      .select('*')
      .limit(1)
    
    if (!regions || regions.length === 0) {
      console.log('📊 No sample data found. Adding initial data...')
      await addSampleData(supabase)
    } else {
      console.log('✅ Sample data exists!')
    }
    
    // Test our new tables
    console.log('🧪 Testing new tables...')
    
    const { data: users } = await supabase
      .from('sms1_users')
      .select('count', { count: 'exact', head: true })
      
    const { data: reports } = await supabase
      .from('sms1_reports')
      .select('count', { count: 'exact', head: true })
    
    console.log(`📈 Found ${users?.count || 0} users`)
    console.log(`📋 Found ${reports?.count || 0} reports`)
    
    console.log('🎉 Database setup complete!')
    return true
    
  } catch (error) {
    console.error('💥 Setup failed:', error)
    return false
  }
}

async function addSampleData(supabase) {
  // Add regions
  const regions = [
    { name: 'Region 1 - Barima-Waini' },
    { name: 'Region 2 - Pomeroon-Supenaam' },
    { name: 'Region 3 - Essequibo Islands-West Demerara' },
    { name: 'Region 4 - Demerara-Mahaica' },
    { name: 'Region 5 - Mahaica-Berbice' },
    { name: 'Region 6 - East Berbice-Corentyne' },
    { name: 'Region 7 - Cuyuni-Mazaruni' },
    { name: 'Region 8 - Potaro-Siparuni' },
    { name: 'Region 9 - Upper Takutu-Upper Essequibo' },
    { name: 'Region 10 - Upper Demerara-Berbice' }
  ]
  
  console.log('📍 Adding regions...')
  const { error: regionError } = await supabase
    .from('sms_regions')
    .insert(regions)
    
  if (regionError) {
    console.error('Failed to add regions:', regionError)
    return
  }
  
  // Add school levels
  const schoolLevels = [
    { name: 'Nursery' },
    { name: 'Primary' },
    { name: 'Secondary' }
  ]
  
  console.log('🏫 Adding school levels...')
  const { error: levelError } = await supabase
    .from('sms_school_levels')
    .insert(schoolLevels)
    
  if (levelError) {
    console.error('Failed to add school levels:', levelError)
    return
  }
  
  console.log('✅ Sample data added!')
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  setupDatabase()
    .then((success) => {
      process.exit(success ? 0 : 1)
    })
    .catch((error) => {
      console.error('Script failed:', error)
      process.exit(1)
    })
}

export { setupDatabase }