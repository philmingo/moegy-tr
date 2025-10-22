-- EduAlert Database Schema
-- Run this in your Supabase SQL editor to set up the database

-- Create enums first with sms1_ prefix to avoid conflicts
CREATE TYPE sms1_user_role AS ENUM ('officer', 'senior_officer', 'admin');
CREATE TYPE sms1_report_status AS ENUM ('open', 'in_progress', 'closed');
CREATE TYPE sms1_report_priority AS ENUM ('low', 'medium', 'high');
CREATE TYPE sms1_reporter_type AS ENUM ('student', 'parent', 'other');

-- Users table for authentication and role management
CREATE TABLE sms1_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL CHECK (email ~* '^[^@]+@moe\.gov\.gy$'),
    password_hash TEXT NOT NULL,
    full_name TEXT NOT NULL,
    position TEXT NOT NULL,
    role sms1_user_role DEFAULT 'officer',
    is_approved BOOLEAN DEFAULT false,
    is_verified BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ NULL
);

-- Officer subscriptions to regions and school levels
CREATE TABLE sms1_officer_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    officer_id UUID NOT NULL REFERENCES sms1_users(id) ON DELETE CASCADE,
    region_id UUID NOT NULL REFERENCES sms_regions(id),
    school_level_id UUID NOT NULL REFERENCES sms_school_levels(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ NULL,
    UNIQUE(officer_id, region_id, school_level_id)
);

-- Reports table for teacher absence reports
CREATE TABLE sms1_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reference_number TEXT UNIQUE NOT NULL,
    school_id UUID NOT NULL REFERENCES sms_schools(id),
    grade TEXT NOT NULL,
    teacher_name TEXT NOT NULL,
    subject TEXT NOT NULL,
    reporter_type sms1_reporter_type NOT NULL,
    description TEXT NOT NULL,
    status sms1_report_status DEFAULT 'open',
    priority sms1_report_priority DEFAULT 'medium',
    closed_by UUID NULL REFERENCES sms1_users(id),
    closed_at TIMESTAMPTZ NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Report assignments to officers
CREATE TABLE sms1_report_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_id UUID NOT NULL REFERENCES sms1_reports(id) ON DELETE CASCADE,
    officer_id UUID NOT NULL REFERENCES sms1_users(id) ON DELETE CASCADE,
    assigned_by UUID NOT NULL REFERENCES sms1_users(id),
    assigned_at TIMESTAMPTZ DEFAULT NOW(),
    removed_at TIMESTAMPTZ NULL,
    UNIQUE(report_id, officer_id)
);

-- Comments and updates on reports
CREATE TABLE sms1_report_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_id UUID NOT NULL REFERENCES sms1_reports(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES sms1_users(id),
    comment TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- OTP codes for email verification
CREATE TABLE sms1_otp_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL,
    code TEXT NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    used_at TIMESTAMPTZ NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- AI usage tracking for daily limits
CREATE TABLE sms1_ai_usage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES sms1_users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    questions_asked INTEGER DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, date)
);

-- Indexes for better performance
CREATE INDEX idx_sms1_users_email ON sms1_users(email);
CREATE INDEX idx_sms1_users_role_approved ON sms1_users(role, is_approved);
CREATE INDEX idx_sms1_reports_status ON sms1_reports(status);
CREATE INDEX idx_sms1_reports_created_at ON sms1_reports(created_at DESC);
CREATE INDEX idx_sms1_reports_school_status ON sms1_reports(school_id, status);
CREATE INDEX idx_sms1_officer_subscriptions_officer ON sms1_officer_subscriptions(officer_id);
CREATE INDEX idx_sms1_report_assignments_report ON sms1_report_assignments(report_id);
CREATE INDEX idx_sms1_report_assignments_officer ON sms1_report_assignments(officer_id);
CREATE INDEX idx_sms1_report_comments_report ON sms1_report_comments(report_id);
CREATE INDEX idx_sms1_otp_codes_email_expires ON sms1_otp_codes(email, expires_at);
CREATE INDEX idx_sms1_ai_usage_user_date ON sms1_ai_usage(user_id, date);

-- Function to generate reference numbers
CREATE OR REPLACE FUNCTION generate_reference_number()
RETURNS TEXT AS $$
DECLARE
    current_year TEXT;
    sequence_num TEXT;
BEGIN
    current_year := EXTRACT(YEAR FROM NOW())::TEXT;
    sequence_num := LPAD(
        (SELECT COALESCE(MAX(CAST(SUBSTRING(reference_number FROM 9) AS INTEGER)), 0) + 1
         FROM sms1_reports 
         WHERE reference_number LIKE 'EDU' || current_year || '%'), 
        4, '0'
    );
    RETURN 'EDU' || current_year || sequence_num;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-generate reference numbers
CREATE OR REPLACE FUNCTION set_reference_number()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.reference_number IS NULL OR NEW.reference_number = '' THEN
        NEW.reference_number := generate_reference_number();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_reference_number
    BEFORE INSERT ON sms1_reports
    FOR EACH ROW
    EXECUTE FUNCTION set_reference_number();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER trigger_sms1_users_updated_at
    BEFORE UPDATE ON sms1_users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_sms1_reports_updated_at
    BEFORE UPDATE ON sms1_reports
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_sms1_report_comments_updated_at
    BEFORE UPDATE ON sms1_report_comments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_sms1_ai_usage_updated_at
    BEFORE UPDATE ON sms1_ai_usage
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

-- Insert default admin user
INSERT INTO sms1_users (email, password_hash, full_name, position, role, is_approved, is_verified)
VALUES (
    'phil.mingo@moe.gov.gy',
    '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewreZhh8YJrHiFPa', -- This is 'Admin@123456789' hashed
    'Phil Mingo',
    'System Administrator',
    'admin',
    true,
    true
);

-- Enable Row Level Security
ALTER TABLE sms1_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE sms1_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE sms1_officer_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE sms1_report_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE sms1_report_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE sms1_otp_codes ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can read their own data
CREATE POLICY "Users can read own data" ON sms1_users
    FOR SELECT USING (auth.uid()::text = id::text);

-- Admins can read all users
CREATE POLICY "Admins can read all users" ON sms1_users
    FOR SELECT USING (
        EXISTS(
            SELECT 1 FROM sms1_users 
            WHERE id::text = auth.uid()::text 
            AND role = 'admin' 
            AND is_approved = true
        )
    );

-- Officers can read reports assigned to them
CREATE POLICY "Officers can read assigned reports" ON sms1_reports
    FOR SELECT USING (
        EXISTS(
            SELECT 1 FROM sms1_report_assignments ra
            JOIN sms1_users u ON u.id = ra.officer_id
            WHERE ra.report_id = sms1_reports.id
            AND u.id::text = auth.uid()::text
            AND u.is_approved = true
            AND ra.removed_at IS NULL
        )
    );

-- Senior officers and admins can read all reports
CREATE POLICY "Senior officers and admins can read all reports" ON sms1_reports
    FOR SELECT USING (
        EXISTS(
            SELECT 1 FROM sms1_users 
            WHERE id::text = auth.uid()::text 
            AND role IN ('senior_officer', 'admin')
            AND is_approved = true
        )
    );

-- Comments are readable by officers assigned to the report
CREATE POLICY "Officers can read comments on assigned reports" ON sms1_report_comments
    FOR SELECT USING (
        EXISTS(
            SELECT 1 FROM sms1_report_assignments ra
            JOIN sms1_users u ON u.id = ra.officer_id
            WHERE ra.report_id = sms1_report_comments.report_id
            AND u.id::text = auth.uid()::text
            AND u.is_approved = true
            AND ra.removed_at IS NULL
        )
    );