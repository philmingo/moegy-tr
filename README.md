# EduAlert - Teacher Absence Reporting System

A modern web application for reporting and managing teacher absence in Guyana's education system.

## Features

- **Public Reporting**: Easy-to-use form for reporting teacher absence
- **Officer Dashboard**: Role-based access for education officers
- **Admin Panel**: Complete system management for administrators
- **Email Notifications**: Automated alerts via SendGrid
- **AI Summaries**: Report summarization using Gemini AI
- **Mobile Responsive**: Works seamlessly on all devices

## Technology Stack

- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Database**: Supabase
- **Authentication**: Custom system for @moe.gov.gy emails
- **Email**: SendGrid API
- **AI**: Google Gemini API

## Getting Started

### Prerequisites

- Node.js 18 or later
- npm or yarn
- Supabase account
- SendGrid account
- Google Gemini API access

### Installation

1. Clone the repository and install dependencies:
```bash
npm install
```

2. Set up environment variables:
Create a `.env.local` file with:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# SendGrid Configuration
SENDGRID_API_KEY=your_sendgrid_api_key
SENDGRID_FROM_EMAIL=noreply@moe.gov.gy

# Gemini AI Configuration
GEMINI_API_KEY=your_gemini_api_key

# JWT Configuration
JWT_SECRET=your_jwt_secret_key

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

3. Set up the database:
```bash
# Run database migrations (once Supabase is configured)
npm run db:setup
```

4. Start the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

## Project Structure

```
src/
├── app/                    # Next.js app router pages
│   ├── admin/             # Admin/officer authentication
│   ├── report/            # Public reporting interface  
│   └── dashboard/         # Officer/admin dashboards
├── components/            # Reusable UI components
│   ├── ui/               # Base UI components
│   └── home/             # Homepage components
├── lib/                  # Utility functions and configurations
└── types/                # TypeScript type definitions
```

## User Roles

### Public Users
- Submit teacher absence reports
- No authentication required

### Officers
- View assigned reports
- Add comments and updates
- Change report status
- Manage subscriptions to regions/school levels

### Senior Officers  
- All officer capabilities
- Assign officers to reports
- Generate AI report summaries
- View all reports in subscribed areas

### Administrators
- Approve officer registrations
- Manage system settings
- Full access to all reports and users

## Database Schema

Tables are prefixed with `sms1_`:

- `sms1_users` - User accounts and roles
- `sms1_reports` - Teacher absence reports  
- `sms1_officer_subscriptions` - Officer region/level assignments
- `sms1_report_assignments` - Report-officer assignments
- `sms1_report_comments` - Comments and updates
- `sms1_otp_codes` - Email verification codes

Existing reference tables:
- `sms_schools` - School information
- `sms_school_levels` - School level definitions  
- `sms_regions` - Geographic regions

## Development Commands

```bash
# Development
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run type-check   # Run TypeScript checks

# Database
npm run db:setup     # Initialize database schema
npm run db:seed      # Seed with sample data
npm run db:reset     # Reset database
```

## Authentication Flow

1. **Registration**: Officers register with @moe.gov.gy email
2. **OTP Verification**: 5-minute OTP sent via SendGrid
3. **Admin Approval**: Admin approves new registrations
4. **Login**: JWT-based authentication with role-based access

Default admin account:
- Email: `phil.mingo@moe.gov.gy`
- Password: `Admin@123456789`

## Report Workflow

1. **Submission**: Public form submission (no auth required)
2. **Assignment**: Auto-assigned to officers based on region/school level
3. **Notification**: Email alerts sent to assigned officers
4. **Processing**: Officers add comments and update status
5. **Resolution**: Reports marked as closed with resolution notes

## Contributing

1. Follow TypeScript and ESLint configurations
2. Use conventional commit messages
3. Write tests for new features
4. Update documentation as needed

## License

Ministry of Education - Guyana © 2024