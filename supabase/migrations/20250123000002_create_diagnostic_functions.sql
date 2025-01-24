-- Create function to run arbitrary SQL
create or replace function public.run_sql(sql text)
returns void
language plpgsql
security definer
as $$
begin
  execute sql;
end;
$$;

-- Create function to check auth schema
create or replace function public.check_auth_schema()
returns jsonb
language plpgsql
security definer
as $$
declare
  result jsonb;
begin
  select jsonb_build_object(
    'auth_schema_exists', exists (
      select 1 from information_schema.schemata where schema_name = 'auth'
    ),
    'auth_tables', (
      select jsonb_agg(table_name)
      from information_schema.tables
      where table_schema = 'auth'
    )
  ) into result;
  
  return result;
end;
$$;

-- Create function to check service role permissions
create or replace function public.check_service_role_permissions()
returns jsonb
language plpgsql
security definer
as $$
declare
  result jsonb;
begin
  -- First check if we can access auth schema
  perform set_config('search_path', 'auth', false);
  
  select jsonb_build_object(
    'current_role', current_user,
    'current_database', current_database(),
    'can_access_auth_schema', (
      select has_schema_privilege(current_user, 'auth', 'USAGE')
    ),
    'auth_table_permissions', (
      select jsonb_object_agg(
        table_name,
        (
          select jsonb_agg(distinct privilege_type)
          from information_schema.role_table_grants
          where table_schema = 'auth'
            and table_name = t.table_name
            and grantee = current_user
        )
      )
      from information_schema.tables t
      where table_schema = 'auth'
    ),
    'auth_schema_privileges', (
      select jsonb_agg(distinct privilege_type)
      from information_schema.role_usage_grants
      where object_schema = 'auth'
        and grantee = current_user
    )
  ) into result;
  
  -- Reset search path
  perform set_config('search_path', 'public', false);
  
  return result;
end;
$$;

-- Grant execute permission to authenticated users
grant execute on function public.check_auth_schema() to authenticated;
grant execute on function public.check_auth_schema() to anon;
grant execute on function public.check_service_role_permissions() to authenticated;
grant execute on function public.check_service_role_permissions() to anon; 