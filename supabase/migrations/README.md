# Database Migrations

This directory contains all database migrations for the CurriCRM application.

## Migration Files

- `20250123000000_create_tables.sql`: Initial table creation
- `20250123000001_create_user_management_functions.sql`: User management functions
- `20250123000002_create_diagnostic_functions.sql`: Diagnostic functions
- `20250123000003_create_policies.sql`: Database policies
- `20250123000004_create_seed_data.sql`: Initial seed data
- `20250124000005_fix_null_email_change_column.sql`: Fix for null email_change column in auth.users table

## Recent Changes

### Fix for Email Change Column (20250124000005)
- Modified `auth.users` table to handle null values in `email_change` column
- Set default value to empty string for `email_change` column
- Updated existing null values to empty string
- Resolves issue with magic link authentication failing for certain users

## Migration Order
Migrations are executed in order based on their timestamp prefix. Each migration is run exactly once in sequence.

## Auth Schema Details

The auth schema requires specific fields for magic link authentication to work properly:

```sql
confirmation_token text DEFAULT '' -- Used for email confirmation
recovery_token text DEFAULT '' -- Used for password recovery
email_change_token_current text DEFAULT '' -- Used for email changes
email_change_token_new text DEFAULT '' -- Used for email changes
email_change text DEFAULT '' -- Used for email changes
```

These fields must not be NULL and should default to empty strings to ensure proper functionality of magic link authentication.

## Running Migrations

Migrations are automatically applied when:
1. Running the application locally with `npm run dev`
2. Deploying to production
3. Running `supabase db reset`

## Adding New Migrations

When adding new migrations:
1. Name files with timestamp prefix: `YYYYMMDDHHMMSS_description.sql`
2. Ensure idempotency (can be run multiple times safely)
3. Include both up and down migrations when possible
4. Document changes in this README 