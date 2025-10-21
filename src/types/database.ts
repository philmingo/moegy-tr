export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      // Existing tables
      sms_regions: {
        Row: {
          id: string
          name: string
          created_at: string
          deleted_at: string | null
        }
        Insert: {
          id?: string
          name: string
          created_at?: string
          deleted_at?: string | null
        }
        Update: {
          id?: string
          name?: string
          created_at?: string
          deleted_at?: string | null
        }
      }
      sms_school_levels: {
        Row: {
          id: string
          name: string
          created_at: string
          deleted_at: string | null
        }
        Insert: {
          id?: string
          name: string
          created_at?: string
          deleted_at?: string | null
        }
        Update: {
          id?: string
          name?: string
          created_at?: string
          deleted_at?: string | null
        }
      }
      sms_schools: {
        Row: {
          id: string
          name: string
          school_level_id: string
          region_id: string
          grade: string
          code: string
          created_at: string
          deleted_at: string | null
        }
        Insert: {
          id?: string
          name: string
          school_level_id: string
          region_id: string
          grade: string
          code: string
          created_at?: string
          deleted_at?: string | null
        }
        Update: {
          id?: string
          name?: string
          school_level_id?: string
          region_id?: string
          grade?: string
          code?: string
          created_at?: string
          deleted_at?: string | null
        }
      }
      // New tables for the reporting system
      sms1_users: {
        Row: {
          id: string
          email: string
          password_hash: string
          full_name: string
          role: Database['public']['Enums']['sms1_user_role']
          is_approved: boolean
          is_verified: boolean
          created_at: string
          updated_at: string
          deleted_at: string | null
        }
        Insert: {
          id?: string
          email: string
          password_hash: string
          full_name: string
          role?: Database['public']['Enums']['sms1_user_role']
          is_approved?: boolean
          is_verified?: boolean
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
        Update: {
          id?: string
          email?: string
          password_hash?: string
          full_name?: string
          role?: Database['public']['Enums']['sms1_user_role']
          is_approved?: boolean
          is_verified?: boolean
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
      }
      sms1_reports: {
        Row: {
          id: string
          reference_number: string
          school_id: string
          grade: string
          teacher_name: string
          subject: string
          reporter_type: Database['public']['Enums']['sms1_reporter_type']
          description: string
          status: Database['public']['Enums']['sms1_report_status']
          priority: Database['public']['Enums']['sms1_report_priority']
          closed_by: string | null
          closed_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          reference_number: string
          school_id: string
          grade: string
          teacher_name: string
          subject: string
          reporter_type: Database['public']['Enums']['sms1_reporter_type']
          description: string
          status?: Database['public']['Enums']['sms1_report_status']
          priority?: Database['public']['Enums']['sms1_report_priority']
          closed_by?: string | null
          closed_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          reference_number?: string
          school_id?: string
          grade?: string
          teacher_name?: string
          subject?: string
          reporter_type?: Database['public']['Enums']['sms1_reporter_type']
          description?: string
          status?: Database['public']['Enums']['sms1_report_status']
          priority?: Database['public']['Enums']['sms1_report_priority']
          closed_by?: string | null
          closed_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      sms1_officer_subscriptions: {
        Row: {
          id: string
          officer_id: string
          region_id: string
          school_level_id: string
          created_at: string
          deleted_at: string | null
        }
        Insert: {
          id?: string
          officer_id: string
          region_id: string
          school_level_id: string
          created_at?: string
          deleted_at?: string | null
        }
        Update: {
          id?: string
          officer_id?: string
          region_id?: string
          school_level_id?: string
          created_at?: string
          deleted_at?: string | null
        }
      }
      sms1_report_assignments: {
        Row: {
          id: string
          report_id: string
          officer_id: string
          assigned_by: string
          assigned_at: string
          removed_at: string | null
        }
        Insert: {
          id?: string
          report_id: string
          officer_id: string
          assigned_by: string
          assigned_at?: string
          removed_at?: string | null
        }
        Update: {
          id?: string
          report_id?: string
          officer_id?: string
          assigned_by?: string
          assigned_at?: string
          removed_at?: string | null
        }
      }
      sms1_report_comments: {
        Row: {
          id: string
          report_id: string
          user_id: string
          comment: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          report_id: string
          user_id: string
          comment: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          report_id?: string
          user_id?: string
          comment?: string
          created_at?: string
          updated_at?: string
        }
      }
      sms1_otp_codes: {
        Row: {
          id: string
          email: string
          code: string
          expires_at: string
          used_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          email: string
          code: string
          expires_at: string
          used_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          email?: string
          code?: string
          expires_at?: string
          used_at?: string | null
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      sms1_user_role: 'officer' | 'senior_officer' | 'admin'
      sms1_report_status: 'open' | 'in_progress' | 'closed'
      sms1_report_priority: 'low' | 'medium' | 'high'
      sms1_reporter_type: 'student' | 'parent' | 'other'
    }
  }
}