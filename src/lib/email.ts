import sgMail from '@sendgrid/mail'

// Initialize SendGrid
if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY)
} else {
  console.warn('SENDGRID_API_KEY not configured - email sending will fail')
}

export interface EmailData {
  to: string | string[]
  subject: string
  html?: string
  text?: string
  templateId?: string
  dynamicTemplateData?: Record<string, any>
}

export class EmailService {
  private static instance: EmailService
  private fromEmail: string
  private fromName: string

  private constructor() {
    this.fromEmail = process.env.SENDGRID_FROM_EMAIL || 'noreply@moe.gov.gy'
    this.fromName = process.env.SENDGRID_FROM_NAME || 'EduAlert'
  }

  public static getInstance(): EmailService {
    if (!EmailService.instance) {
      EmailService.instance = new EmailService()
    }
    return EmailService.instance
  }

  async sendEmail(emailData: EmailData): Promise<boolean> {
    try {
      if (!process.env.SENDGRID_API_KEY) {
        console.error('SendGrid API key not configured')
        return false
      }

      const msg: any = {
        to: emailData.to,
        from: {
          email: this.fromEmail,
          name: this.fromName
        },
        subject: emailData.subject
      }

      // Add content based on what's provided
      if (emailData.html) {
        msg.html = emailData.html
      }
      if (emailData.text) {
        msg.text = emailData.text
      }
      if (emailData.templateId) {
        msg.templateId = emailData.templateId
      }
      if (emailData.dynamicTemplateData) {
        msg.dynamicTemplateData = emailData.dynamicTemplateData
      }

      await sgMail.send(msg)
      console.log(`Email sent successfully to ${emailData.to}`)
      return true
    } catch (error) {
      console.error('Failed to send email:', error)
      return false
    }
  }

  async sendPasswordResetCode(email: string, code: string, fullName?: string): Promise<boolean> {
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Password Reset Code - EduAlert</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f8fafc; }
          .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
          .header { background-color: #2563eb; padding: 20px; text-align: center; }
          .header h1 { color: #ffffff; margin: 0; font-size: 24px; }
          .content { padding: 40px 20px; }
          .code-box { background-color: #f1f5f9; border: 2px solid #e2e8f0; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0; }
          .code { font-size: 32px; font-weight: bold; color: #1e40af; letter-spacing: 4px; margin: 10px 0; }
          .footer { background-color: #f8fafc; padding: 20px; text-align: center; border-top: 1px solid #e2e8f0; }
          .warning { background-color: #fef3c7; border: 1px solid #f59e0b; border-radius: 6px; padding: 15px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🛡️ EduAlert Password Reset</h1>
          </div>
          
          <div class="content">
            <h2>Hello ${fullName ? fullName : 'User'},</h2>
            
            <p>You requested a password reset for your EduAlert account. Use the verification code below to reset your password:</p>
            
            <div class="code-box">
              <div style="font-size: 14px; color: #64748b; margin-bottom: 10px;">Your Reset Code</div>
              <div class="code">${code}</div>
              <div style="font-size: 12px; color: #64748b; margin-top: 10px;">Enter this code in the EduAlert app</div>
            </div>
            
            <div class="warning">
              <strong>⚠️ Important Security Information:</strong>
              <ul style="margin: 10px 0; padding-left: 20px;">
                <li>This code expires in <strong>15 minutes</strong></li>
                <li>Only use this code if you requested a password reset</li>
                <li>Never share this code with anyone</li>
                <li>EduAlert staff will never ask for this code</li>
              </ul>
            </div>
            
            <p>If you did not request this password reset, please ignore this email and contact your system administrator immediately.</p>
            
            <p>Best regards,<br>
            <strong>Ministry of Education</strong><br>
            EduAlert Team</p>
          </div>
          
          <div class="footer">
            <p style="margin: 0; color: #64748b; font-size: 12px;">
              This is an automated message from the EduAlert Teacher Absence Reporting System.<br>
              Ministry of Education, Guyana
            </p>
          </div>
        </div>
      </body>
      </html>
    `

    const textContent = `
EduAlert Password Reset

Hello ${fullName ? fullName : 'User'},

You requested a password reset for your EduAlert account.

Your Reset Code: ${code}

IMPORTANT:
- This code expires in 15 minutes
- Only use this code if you requested a password reset
- Never share this code with anyone
- EduAlert staff will never ask for this code

If you did not request this password reset, please ignore this email and contact your system administrator.

Best regards,
Ministry of Education
EduAlert Team
    `

    return await this.sendEmail({
      to: email,
      subject: `EduAlert Password Reset Code: ${code}`,
      html: htmlContent,
      text: textContent
    })
  }

  async sendOTPCode(email: string, code: string, fullName?: string): Promise<boolean> {
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Verification Code - EduAlert</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f8fafc; }
          .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
          .header { background-color: #059669; padding: 20px; text-align: center; }
          .header h1 { color: #ffffff; margin: 0; font-size: 24px; }
          .content { padding: 40px 20px; }
          .code-box { background-color: #f0fdf4; border: 2px solid #bbf7d0; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0; }
          .code { font-size: 32px; font-weight: bold; color: #047857; letter-spacing: 4px; margin: 10px 0; }
          .footer { background-color: #f8fafc; padding: 20px; text-align: center; border-top: 1px solid #e2e8f0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>✅ EduAlert Account Verification</h1>
          </div>
          
          <div class="content">
            <h2>Welcome ${fullName ? fullName : 'User'}!</h2>
            
            <p>Thank you for registering with EduAlert. To complete your account setup, please verify your email address using the code below:</p>
            
            <div class="code-box">
              <div style="font-size: 14px; color: #065f46; margin-bottom: 10px;">Your Verification Code</div>
              <div class="code">${code}</div>
              <div style="font-size: 12px; color: #065f46; margin-top: 10px;">Enter this code to verify your account</div>
            </div>
            
            <p><strong>This code expires in 5 minutes.</strong></p>
            
            <p>If you did not create an EduAlert account, please contact your system administrator.</p>
            
            <p>Best regards,<br>
            <strong>Ministry of Education</strong><br>
            EduAlert Team</p>
          </div>
          
          <div class="footer">
            <p style="margin: 0; color: #64748b; font-size: 12px;">
              This is an automated message from the EduAlert Teacher Absence Reporting System.<br>
              Ministry of Education, Guyana
            </p>
          </div>
        </div>
      </body>
      </html>
    `

    const textContent = `
EduAlert Account Verification

Welcome ${fullName ? fullName : 'User'}!

Thank you for registering with EduAlert. To complete your account setup, please verify your email address.

Your Verification Code: ${code}

This code expires in 5 minutes.

If you did not create an EduAlert account, please contact your system administrator.

Best regards,
Ministry of Education
EduAlert Team
    `

    return await this.sendEmail({
      to: email,
      subject: `EduAlert Account Verification: ${code}`,
      html: htmlContent,
      text: textContent
    })
  }

  async sendReportNotification(
    email: string, 
    reportRef: string, 
    schoolName: string, 
    teacherName: string,
    fullName?: string
  ): Promise<boolean> {
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>New Teacher Absence Report - EduAlert</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f8fafc; }
          .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
          .header { background-color: #dc2626; padding: 20px; text-align: center; }
          .header h1 { color: #ffffff; margin: 0; font-size: 24px; }
          .content { padding: 40px 20px; }
          .report-box { background-color: #fef2f2; border: 2px solid #fecaca; border-radius: 8px; padding: 20px; margin: 20px 0; }
          .footer { background-color: #f8fafc; padding: 20px; text-align: center; border-top: 1px solid #e2e8f0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🚨 New Teacher Absence Report</h1>
          </div>
          
          <div class="content">
            <h2>Hello ${fullName ? fullName : 'Officer'},</h2>
            
            <p>A new teacher absence report has been submitted and assigned to you for review.</p>
            
            <div class="report-box">
              <h3 style="color: #dc2626; margin-top: 0;">Report Details</h3>
              <p><strong>Report Reference:</strong> ${reportRef}</p>
              <p><strong>School:</strong> ${schoolName}</p>
              <p><strong>Teacher:</strong> ${teacherName}</p>
              <p><strong>Submitted:</strong> ${new Date().toLocaleString('en-US', { 
                timeZone: 'America/Guyana',
                dateStyle: 'full',
                timeStyle: 'short'
              })}</p>
            </div>
            
            <p>Please log into the EduAlert system to review this report and take appropriate action.</p>
            
            <p style="text-align: center; margin: 30px 0;">
              <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard" 
                 style="background-color: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
                View Report in EduAlert
              </a>
            </p>
            
            <p>Best regards,<br>
            <strong>Ministry of Education</strong><br>
            EduAlert System</p>
          </div>
          
          <div class="footer">
            <p style="margin: 0; color: #64748b; font-size: 12px;">
              This is an automated notification from the EduAlert Teacher Absence Reporting System.<br>
              Ministry of Education, Guyana
            </p>
          </div>
        </div>
      </body>
      </html>
    `

    return await this.sendEmail({
      to: email,
      subject: `EduAlert: New Teacher Absence Report ${reportRef}`,
      html: htmlContent
    })
  }

  async sendWelcomeEmail(email: string, fullName: string, role: string = 'Officer'): Promise<boolean> {
    const loginUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/admin`
    
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to EduAlert</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f8fafc; }
          .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
          .header { background-color: #2563eb; padding: 30px 20px; text-align: center; }
          .header h1 { color: #ffffff; margin: 0; font-size: 28px; }
          .header p { color: #bfdbfe; margin: 5px 0 0 0; }
          .content { padding: 40px 20px; }
          .welcome-box { background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%); border-left: 4px solid #0ea5e9; padding: 20px; margin: 20px 0; border-radius: 8px; }
          .button { display: inline-block; background-color: #2563eb; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }
          .footer { background-color: #f8fafc; padding: 20px; text-align: center; border-top: 1px solid #e2e8f0; }
          .feature-list { background-color: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 Welcome to EduAlert</h1>
            <p>Teacher Absence Reporting System</p>
          </div>
          
          <div class="content">
            <div class="welcome-box">
              <h2 style="margin-top: 0; color: #0369a1;">Hello ${fullName}!</h2>
              <p>Welcome to the EduAlert Teacher Absence Reporting System! Your officer account has been successfully created and you're ready to start managing teacher absence reports.</p>
            </div>
            
            <p><strong>📋 Your Account Details:</strong></p>
            <ul>
              <li><strong>Email:</strong> ${email}</li>
              <li><strong>Role:</strong> ${role}</li>
              <li><strong>Access Level:</strong> Report Management & Assignment</li>
            </ul>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${loginUrl}" class="button">🚀 Login to EduAlert</a>
            </div>
            
            <div class="feature-list">
              <h3 style="margin-top: 0; color: #1f2937;">🛠️ What you can do:</h3>
              <ul>
                <li>📊 View and manage reports assigned to you</li>
                <li>🔄 Update report statuses and priorities</li>
                <li>📝 Add notes and comments to reports</li>
                <li>🏫 Access regional school information</li>
                <li>📈 Track your assigned cases</li>
              </ul>
            </div>
            
            <p>If you have any questions or need assistance getting started, please contact the system administrator.</p>
            
            <p>Best regards,<br>
            <strong>The EduAlert Team</strong><br>
            Ministry of Education</p>
          </div>
          
          <div class="footer">
            <p style="margin: 0; color: #64748b; font-size: 12px;">
              This is an automated welcome message from the EduAlert system.<br>
              Ministry of Education, Guyana
            </p>
          </div>
        </div>
      </body>
      </html>
    `

    return await this.sendEmail({
      to: email,
      subject: 'Welcome to EduAlert - Your Officer Account is Ready!',
      html: htmlContent
    })
  }

  async sendAssignmentNotification(
    email: string, 
    officerName: string,
    reportDetails: {
      referenceNumber: string
      school: string
      teacherName: string
      subject: string
      description: string
      priority: string
    }
  ): Promise<boolean> {
    const loginUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/admin`
    const priorityColor = reportDetails.priority === 'high' ? '#dc2626' : 
                         reportDetails.priority === 'medium' ? '#d97706' : '#2563eb'
    const priorityIcon = reportDetails.priority === 'high' ? '🚨' : 
                        reportDetails.priority === 'medium' ? '⚠️' : 'ℹ️'
    
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>New Report Assignment - EduAlert</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f8fafc; }
          .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
          .header { background-color: #2563eb; padding: 20px; text-align: center; }
          .header h1 { color: #ffffff; margin: 0; font-size: 24px; }
          .header p { color: #bfdbfe; margin: 5px 0 0 0; }
          .content { padding: 40px 20px; }
          .report-card { background: #ffffff; border: 2px solid #e5e7eb; border-radius: 12px; padding: 24px; margin: 24px 0; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); }
          .priority { display: inline-block; padding: 6px 16px; border-radius: 20px; color: white; font-weight: bold; text-transform: uppercase; font-size: 11px; letter-spacing: 0.5px; }
          .button { display: inline-block; background-color: #2563eb; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }
          .footer { background-color: #f8fafc; padding: 20px; text-align: center; border-top: 1px solid #e2e8f0; }
          .urgent-banner { background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%); border: 2px solid #fca5a5; border-radius: 8px; padding: 16px; margin: 20px 0; text-align: center; }
          .description-box { background: #f8fafc; border-left: 4px solid #2563eb; padding: 16px; border-radius: 0 8px 8px 0; margin: 16px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>${priorityIcon} New Report Assignment</h1>
            <p>EduAlert Teacher Absence Reporting System</p>
          </div>
          
          <div class="content">
            ${reportDetails.priority === 'high' ? `
            <div class="urgent-banner">
              <strong>🚨 HIGH PRIORITY ASSIGNMENT</strong><br>
              <span style="font-size: 14px;">This report requires immediate attention</span>
            </div>
            ` : ''}
            
            <h2>Hello ${officerName},</h2>
            <p>A new teacher absence report has been assigned to you for investigation and follow-up action. Please review the details below and take appropriate action.</p>
            
            <div class="report-card">
              <h3 style="margin-top: 0; color: #1f2937;">📋 Report Details</h3>
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;"><strong>Reference Number:</strong></td>
                  <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">${reportDetails.referenceNumber}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;"><strong>School:</strong></td>
                  <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">🏫 ${reportDetails.school}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;"><strong>Teacher:</strong></td>
                  <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">👨‍🏫 ${reportDetails.teacherName}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;"><strong>Subject:</strong></td>
                  <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">📚 ${reportDetails.subject}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0;"><strong>Priority:</strong></td>
                  <td style="padding: 8px 0;"><span class="priority" style="background-color: ${priorityColor};">${reportDetails.priority}</span></td>
                </tr>
              </table>
              
              <div class="description-box">
                <h4 style="margin-top: 0;">📝 Report Description:</h4>
                <p style="margin-bottom: 0;">${reportDetails.description}</p>
              </div>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${loginUrl}" class="button">🔍 Login to View Full Report</a>
            </div>
            
            <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h4 style="margin-top: 0; color: #374151;">📋 Next Steps:</h4>
              <ul style="margin-bottom: 0;">
                <li>🔍 Review the complete report details in the system</li>
                <li>📞 Contact the school administration if necessary</li>
                <li>📝 Update the report status as you progress</li>
                <li>💬 Add notes and comments for tracking purposes</li>
                <li>⏰ Address this report based on its priority level</li>
              </ul>
            </div>
            
            <p>Thank you for your dedication to maintaining educational standards in our schools.</p>
            
            <p>Best regards,<br>
            <strong>The EduAlert System</strong><br>
            Ministry of Education</p>
          </div>
          
          <div class="footer">
            <p style="margin: 0; color: #64748b; font-size: 12px;">
              This is an automated assignment notification from the EduAlert system.<br>
              Report Reference: ${reportDetails.referenceNumber} | Ministry of Education, Guyana
            </p>
          </div>
        </div>
      </body>
      </html>
    `

    return await this.sendEmail({
      to: email,
      subject: `${priorityIcon} New Report Assignment: ${reportDetails.referenceNumber}`,
      html: htmlContent
    })
  }
}

// Export singleton instance
export const emailService = EmailService.getInstance()

// Utility functions for backward compatibility
export const sendPasswordResetCode = (email: string, code: string, fullName?: string) => 
  emailService.sendPasswordResetCode(email, code, fullName)

export const sendOTPCode = (email: string, code: string, fullName?: string) => 
  emailService.sendOTPCode(email, code, fullName)

export const sendReportNotification = (
  email: string, 
  reportRef: string, 
  schoolName: string, 
  teacherName: string,
  fullName?: string
) => emailService.sendReportNotification(email, reportRef, schoolName, teacherName, fullName)

export const sendWelcomeEmail = (email: string, fullName: string, role?: string) =>
  emailService.sendWelcomeEmail(email, fullName, role)

export const sendAssignmentNotification = (
  email: string,
  officerName: string,
  reportDetails: {
    referenceNumber: string
    school: string
    teacherName: string
    subject: string
    description: string
    priority: string
  }
) => emailService.sendAssignmentNotification(email, officerName, reportDetails)