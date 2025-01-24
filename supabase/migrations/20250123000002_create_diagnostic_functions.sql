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

-- Create function to check profile access
create or replace function public.check_profile_access(target_user_id uuid)
returns jsonb
language plpgsql
security definer
as $$
declare
  result jsonb;
begin
  select jsonb_build_object(
    'profile_exists', exists (
      select 1 from public.profiles where user_id = target_user_id
    ),
    'profile_data', (
      select row_to_json(p)
      from public.profiles p
      where p.user_id = target_user_id
    ),
    'rls_enabled', (
      select relrowsecurity 
      from pg_class 
      where relname = 'profiles'
    ),
    'policies', (
      select jsonb_agg(
        jsonb_build_object(
          'name', polname,
          'cmd', case polcmd
            when 'r' then 'SELECT'
            when 'w' then 'UPDATE'
            when 'a' then 'INSERT'
            when 'd' then 'DELETE'
            else polcmd::text
          end,
          'roles', pol.roles,
          'qual', pg_get_expr(pol.qual, pol.polrelid),
          'with_check', pg_get_expr(pol.with_check, pol.polrelid)
        )
      )
      from pg_policy pol
      where pol.polrelid = 'public.profiles'::regclass
    ),
    'current_user', current_user,
    'current_user_roles', (
      select array_agg(rolname)
      from pg_user
      join pg_auth_members on (pg_user.usesysid = pg_auth_members.member)
      join pg_roles on (pg_roles.oid = pg_auth_members.roleid)
      where pg_user.usename = current_user
    )
  ) into result;

  raise notice E'\n=== Profile Access Check ===\nUser ID: %\nResults: %', target_user_id, result;
  return result;
end;
$$;

-- Create function to check recent notices
create or replace function public.check_recent_activity(
  test_user_id uuid default null
)
returns text
language plpgsql
security definer
as $$
declare
  profile_check jsonb;
  notice_text text;
begin
  -- First raise a test notice
  raise notice E'\n=== Activity Check Started ===\nChecking for user: %', test_user_id;
  
  -- Try to get profile info if user_id provided
  if test_user_id is not null then
    profile_check := public.check_profile_access(test_user_id);
    notice_text := E'\nProfile check results: ' || profile_check::text;
  end if;

  -- Check if profile exists
  if test_user_id is not null then
    if exists (select 1 from public.profiles where user_id = test_user_id) then
      notice_text := notice_text || E'\nProfile exists for user';
    else
      notice_text := notice_text || E'\nNo profile found for user';
    end if;
  end if;

  -- Check RLS status
  notice_text := notice_text || E'\nRLS Status for tables:';
  for notice_text in (
    select format(E'\n- %s: %s', 
      tablename, 
      case when relrowsecurity then 'enabled' else 'disabled' end
    )
    from pg_tables t
    join pg_class c on c.relname = t.tablename
    where t.schemaname = 'public'
  ) loop
    raise notice '%', notice_text;
  end loop;

  raise notice E'\n=== Activity Check Complete ===';
  return notice_text;
end;
$$;

-- Grant execute permission to authenticated users
grant execute on function public.check_auth_schema() to authenticated;
grant execute on function public.check_auth_schema() to anon;
grant execute on function public.check_service_role_permissions() to authenticated;
grant execute on function public.check_service_role_permissions() to anon;
grant execute on function public.check_profile_access(uuid) to authenticated;
grant execute on function public.check_profile_access(uuid) to anon;
grant execute on function public.check_recent_activity(uuid) to authenticated;
grant execute on function public.check_recent_activity(uuid) to anon; 