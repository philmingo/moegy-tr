# Database Schema Updates - EduAlert System

## Overview
Updated all database types to use the `sms1_` prefix to avoid conflicts with existing database types in the project.

## Changes Made

### 1. Enum Types (PostgreSQL)
**Before:**
```sql
CREATE TYPE user_role AS ENUM ('officer', 'senior_officer', 'admin');
CREATE TYPE report_status AS ENUM ('open', 'in_progress', 'closed');
CREATE TYPE report_priority AS ENUM ('low', 'medium', 'high');
CREATE TYPE reporter_type AS ENUM ('student', 'parent', 'other');
```

**After:**
```sql
CREATE TYPE sms1_user_role AS ENUM ('officer', 'senior_officer', 'admin');
CREATE TYPE sms1_report_status AS ENUM ('open', 'in_progress', 'closed');
CREATE TYPE sms1_report_priority AS ENUM ('low', 'medium', 'high');
CREATE TYPE sms1_reporter_type AS ENUM ('student', 'parent', 'other');
```

### 2. Table Column Updates

**sms1_users table:**
```sql
-- Before: role user_role DEFAULT 'officer'
-- After:
role sms1_user_role DEFAULT 'officer'
```

**sms1_reports table:**
```sql
-- Before: 
-- reporter_type reporter_type NOT NULL,
-- status report_status DEFAULT 'open',
-- priority report_priority DEFAULT 'medium'

-- After:
reporter_type sms1_reporter_type NOT NULL,
status sms1_report_status DEFAULT 'open',
priority sms1_report_priority DEFAULT 'medium'
```

### 3. TypeScript Type Definitions

**Updated enum references in database.ts:**
```typescript
Enums: {
  sms1_user_role: 'officer' | 'senior_officer' | 'admin'
  sms1_report_status: 'open' | 'in_progress' | 'closed'  
  sms1_report_priority: 'low' | 'medium' | 'high'
  sms1_reporter_type: 'student' | 'parent' | 'other'
}
```

**Updated table type references:**
```typescript
// Example for sms1_users
role: Database['public']['Enums']['sms1_user_role']

// Example for sms1_reports  
reporter_type: Database['public']['Enums']['sms1_reporter_type']
status: Database['public']['Enums']['sms1_report_status'] 
priority: Database['public']['Enums']['sms1_report_priority']
```

## Benefits

1. **Namespace Protection**: Prevents conflicts with existing database types
2. **Consistency**: All EduAlert types follow the same `sms1_` naming convention  
3. **Future-Proofing**: Allows for easy identification of EduAlert-specific types
4. **Type Safety**: Maintains full TypeScript type checking and IntelliSense

## Files Updated

- `database/schema.sql` - PostgreSQL schema with prefixed enum types
- `src/types/database.ts` - TypeScript type definitions with enum references

## Next Steps

When setting up Supabase:
1. Run the updated `schema.sql` file to create the database structure
2. The TypeScript types will automatically work with the new enum names
3. All existing code will continue to work as the enum values remain the same

## Migration Notes

If you already have a database with the old enum names:
```sql
-- Drop old enums (only if they exist and are not used elsewhere)
DROP TYPE IF EXISTS user_role CASCADE;
DROP TYPE IF EXISTS report_status CASCADE; 
DROP TYPE IF EXISTS report_priority CASCADE;
DROP TYPE IF EXISTS reporter_type CASCADE;

-- Then run the new schema.sql
```