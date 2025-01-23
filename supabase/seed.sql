-- Seed data is now handled in the migration file
select 1;

-- Ensure auth schema permissions are set correctly
DO $$
BEGIN
  -- Grant schema usage
  EXECUTE 'GRANT USAGE ON SCHEMA auth TO authenticated';
  EXECUTE 'GRANT USAGE ON SCHEMA auth TO anon';

  -- Grant table permissions
  EXECUTE 'GRANT SELECT, UPDATE ON auth.users TO authenticated';
  EXECUTE 'GRANT SELECT, UPDATE ON auth.users TO anon';
  
  EXECUTE 'GRANT SELECT, INSERT, UPDATE ON auth.refresh_tokens TO authenticated';
  EXECUTE 'GRANT SELECT, INSERT, UPDATE ON auth.refresh_tokens TO anon';
  
  EXECUTE 'GRANT SELECT, INSERT, UPDATE ON auth.sessions TO authenticated';
  EXECUTE 'GRANT SELECT, INSERT, UPDATE ON auth.sessions TO anon';

  -- Grant sequence usage
  EXECUTE 'GRANT USAGE ON ALL SEQUENCES IN SCHEMA auth TO authenticated';
  EXECUTE 'GRANT USAGE ON ALL SEQUENCES IN SCHEMA auth TO anon';
  
  RAISE NOTICE 'Auth schema permissions have been set successfully';
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Error setting auth permissions: %', SQLERRM;
END;
$$;