-- Add AI usage tracking table to existing database
-- Run this SQL in your Supabase SQL editor if the sms1_ai_usage table doesn't exist

-- AI usage tracking for daily limits
CREATE TABLE IF NOT EXISTS sms1_ai_usage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES sms1_users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    questions_asked INTEGER DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, date)
);

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_sms1_ai_usage_user_date ON sms1_ai_usage(user_id, date);

-- Updated_at trigger
CREATE TRIGGER IF NOT EXISTS trigger_sms1_ai_usage_updated_at
    BEFORE UPDATE ON sms1_ai_usage
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

-- Enable RLS
ALTER TABLE sms1_ai_usage ENABLE ROW LEVEL SECURITY;

-- RLS Policies for AI usage
CREATE POLICY "Users can read own AI usage" ON sms1_ai_usage
    FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "Admins can read all AI usage" ON sms1_ai_usage
    FOR SELECT USING (
        EXISTS(
            SELECT 1 FROM sms1_users 
            WHERE id::text = auth.uid()::text 
            AND role = 'admin' 
            AND is_approved = true
        )
    );

CREATE POLICY "Users can insert own AI usage" ON sms1_ai_usage
    FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Users can update own AI usage" ON sms1_ai_usage
    FOR UPDATE USING (auth.uid()::text = user_id::text);

CREATE POLICY "Admins can delete AI usage" ON sms1_ai_usage
    FOR DELETE USING (
        EXISTS(
            SELECT 1 FROM sms1_users 
            WHERE id::text = auth.uid()::text 
            AND role = 'admin' 
            AND is_approved = true
        )
    );