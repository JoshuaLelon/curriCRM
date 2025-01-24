-- Function to handle new user profiles
create or replace function public.handle_new_user()
returns trigger
security definer
set search_path = public, auth
language plpgsql
as $$
declare
  profile_id int8;
  user_specialty text;
begin
  -- Add delay to ensure user is fully created
  perform pg_sleep(0.1);
  
  -- Log the new user creation attempt
  raise notice 'Creating profile for user: % (ID: %)', new.email, new.id;

  -- Determine specialty without using enum directly
  user_specialty := case
    when new.email = 'joshua.mitchell@gauntletai.com' then 'software'
    else null
  end;

  -- Check if profile already exists
  if exists (select 1 from public.profiles where user_id = new.id) then
    raise notice 'Profile already exists for user: %', new.email;
    return new;
  end if;

  -- Create profile with appropriate role
  insert into public.profiles (
    user_id,
    email,
    specialty,
    is_admin
  )
  values (
    new.id,
    new.email,
    user_specialty::public.tag,
    new.email = 'joshua.mitchell@g.austincc.edu'
  )
  returning id into profile_id;

  raise notice 'Created profile with ID: % for user: %', profile_id, new.email;
  return new;
exception
  when others then
    raise warning 'Failed to create profile for % (ID: %): %', new.email, new.id, SQLERRM;
    return new;
end;
$$;

-- Create function to create auth user with proper error handling
create or replace function public.create_seed_auth_user(
  user_email text,
  is_admin boolean default false,
  user_specialty public.tag default null
)
returns uuid
language plpgsql
security definer
set search_path = auth, public
as $$
declare
  new_user_id uuid;
begin
  -- Insert into auth.users with minimal required fields for magic link auth
  insert into auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    email_confirmed_at,
    created_at,
    updated_at,
    raw_app_meta_data,
    raw_user_meta_data,
    is_sso_user,
    encrypted_password
  ) values (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    user_email,
    now(), -- Pre-confirm email for magic link
    now(),
    now(),
    '{"provider":"email","providers":["email"]}',
    jsonb_build_object(
      'is_admin', is_admin,
      'specialty', user_specialty
    ),
    false,
    '' -- No password needed for magic link
  ) returning id into new_user_id;

  return new_user_id;
exception
  when unique_violation then
    -- If user already exists, get their ID
    select id into new_user_id from auth.users where email = user_email;
    return new_user_id;
  when others then
    raise exception 'Failed to create auth user: %', sqlerrm;
end;
$$;

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