import { createClient } from '@supabase/supabase-js'
import sgMail from '@sendgrid/mail'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

// Initialize SendGrid
sgMail.setApiKey(process.env.SENDGRID_API_KEY!)

interface NotificationContext {
  reportId: string
  reportRef: string
  schoolName: string
  teacherName: string
  description: string
  regionName: string
  schoolLevelName: string
}

async function getRelevantOfficers(regionId: string, schoolLevelId: string): Promise<any[]> {
  try {
    // Get officers who are subscribed to this region/school level combination
    const { data: subscriptions, error } = await supabase
      .from('sms1_officer_subscriptions')
      .select(`
        officer_id,
        sms1_users!officer_id (
          id,
          email,
          full_name,
          role,
          is_approved
        )
      `)
      .eq('region_id', regionId)
      .eq('school_level_id', schoolLevelId)
      .is('deleted_at', null)

    if (error) {
      console.error('Error fetching subscribed officers:', error)
      return []
    }

    // Filter for active, approved officers
    const officers = (subscriptions || [])
      .map(sub => (sub as any).sms1_users)
      .filter(officer => officer && officer.is_approved)

    // Also get admin and senior officers who should always be notified
    const { data: adminOfficers, error: adminError } = await supabase
      .from('sms1_users')
      .select('id, email, full_name, role')
      .in('role', ['admin', 'senior_officer'])
      .eq('is_approved', true)

    if (adminError) {
      console.error('Error fetching admin officers:', adminError)
    }

    // Combine and deduplicate officers
    const allOfficers = [...officers, ...(adminOfficers || [])]
    const uniqueOfficers = allOfficers.filter((officer, index, self) =>
      index === self.findIndex(o => o.id === officer.id)
    )

    return uniqueOfficers
  } catch (error) {
    console.error('Error getting relevant officers:', error)
    return []
  }
}

async function sendEmailNotification(officer: any, context: NotificationContext): Promise<void> {
  try {
    const emailContent = {
      to: officer.email,
      from: {
        email: process.env.SENDGRID_FROM_EMAIL!,
        name: process.env.SENDGRID_FROM_NAME!
      },
      subject: `🚨 New Teacher Absence Report: ${context.reportRef}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0;">
            <h1 style="margin: 0; font-size: 24px;">🎓 EduAlert Notification</h1>
            <p style="margin: 5px 0 0 0; opacity: 0.9;">Ministry of Education - Teacher Absence Report</p>
          </div>
          
          <div style="background: white; padding: 20px; border: 1px solid #e5e7eb; border-top: none;">
            <div style="background: #fef3c7; border: 1px solid #f59e0b; border-radius: 6px; padding: 15px; margin-bottom: 20px;">
              <p style="margin: 0; color: #92400e; font-weight: bold;">⚠️ New Report Requires Investigation</p>
            </div>
            
            <h2 style="color: #1f2937; margin-bottom: 15px;">Report Details</h2>
            
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
              <tr style="background: #f9fafb;">
                <td style="padding: 8px; font-weight: bold; border: 1px solid #e5e7eb;">Reference:</td>
                <td style="padding: 8px; border: 1px solid #e5e7eb;">${context.reportRef}</td>
              </tr>
              <tr>
                <td style="padding: 8px; font-weight: bold; border: 1px solid #e5e7eb;">School:</td>
                <td style="padding: 8px; border: 1px solid #e5e7eb;">${context.schoolName}</td>
              </tr>
              <tr style="background: #f9fafb;">
                <td style="padding: 8px; font-weight: bold; border: 1px solid #e5e7eb;">Teacher:</td>
                <td style="padding: 8px; border: 1px solid #e5e7eb;">${context.teacherName}</td>
              </tr>
              <tr>
                <td style="padding: 8px; font-weight: bold; border: 1px solid #e5e7eb;">Region:</td>
                <td style="padding: 8px; border: 1px solid #e5e7eb;">${context.regionName}</td>
              </tr>
              <tr style="background: #f9fafb;">
                <td style="padding: 8px; font-weight: bold; border: 1px solid #e5e7eb;">School Level:</td>
                <td style="padding: 8px; border: 1px solid #e5e7eb;">${context.schoolLevelName}</td>
              </tr>
            </table>
            
            <h3 style="color: #1f2937; margin-bottom: 10px;">Description:</h3>
            <div style="background: #f9fafb; padding: 15px; border-radius: 6px; border-left: 4px solid #3b82f6; margin-bottom: 20px;">
              <p style="margin: 0; line-height: 1.5; color: #374151;">${context.description}</p>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/reports/${context.reportId}" 
                 style="background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
                📋 View Report Details
              </a>
            </div>
            
            <div style="background: #eff6ff; border: 1px solid #3b82f6; border-radius: 6px; padding: 15px; margin-top: 20px;">
              <p style="margin: 0; color: #1e40af; font-size: 14px;">
                <strong>🤖 AI Analysis:</strong> This report has been automatically reviewed and approved for investigation. 
                Please review the details and take appropriate action within your assigned timeline.
              </p>
            </div>
          </div>
          
          <div style="background: #f9fafb; padding: 15px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px; text-align: center;">
            <p style="margin: 0; color: #6b7280; font-size: 12px;">
              This is an automated notification from the EduAlert system.<br>
              Ministry of Education, Guyana | ${new Date().getFullYear()}
            </p>
          </div>
        </div>
      `
    }

    await sgMail.send(emailContent)
    console.log(`Notification sent to ${officer.email} for report ${context.reportRef}`)

  } catch (error) {
    console.error(`Failed to send notification to ${officer.email}:`, error)
  }
}

export async function sendReportNotifications(reportId: string): Promise<void> {
  try {
    // Get the report details with school information
    const { data: report, error } = await supabase
      .from('sms1_reports')
      .select(`
        id,
        reference_number,
        teacher_name,
        description,
        sms_schools (
          name,
          region_id,
          school_level_id,
          sms_regions (
            name
          ),
          sms_school_levels (
            name
          )
        )
      `)
      .eq('id', reportId)
      .single()

    if (error || !report) {
      console.error('Error fetching report for notifications:', error)
      return
    }

    const school = report.sms_schools as any
    const region = school?.sms_regions
    const schoolLevel = school?.sms_school_levels

    const context: NotificationContext = {
      reportId: report.id,
      reportRef: report.reference_number,
      schoolName: school?.name || 'Unknown School',
      teacherName: report.teacher_name,
      description: report.description,
      regionName: region?.name || 'Unknown Region',
      schoolLevelName: schoolLevel?.name || 'Unknown Level'
    }

    // Get relevant officers to notify
    const officers = await getRelevantOfficers(school?.region_id, school?.school_level_id)

    if (officers.length === 0) {
      console.log(`No officers found to notify for report ${context.reportRef}`)
      return
    }

    console.log(`Sending notifications to ${officers.length} officers for report ${context.reportRef}`)

    // Send notifications to all relevant officers
    const notificationPromises = officers.map(officer => 
      sendEmailNotification(officer, context)
    )

    await Promise.allSettled(notificationPromises)
    
    console.log(`Completed sending notifications for report ${context.reportRef}`)

  } catch (error) {
    console.error('Error in sendReportNotifications:', error)
  }
}