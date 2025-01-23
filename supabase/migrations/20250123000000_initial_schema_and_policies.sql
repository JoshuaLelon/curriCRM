-- Enable pgcrypto extension
create extension if not exists pgcrypto;

-- Drop existing schema if it exists
drop schema if exists public cascade;
create schema public;

-- Grant necessary permissions
grant usage on schema public to anon, authenticated;
grant all on all tables in schema public to anon, authenticated;
grant all on all sequences in schema public to anon, authenticated;
grant all on all routines in schema public to anon, authenticated;

-- Additional auth schema permissions
grant usage on schema auth to service_role;
grant all on all tables in schema auth to service_role;
grant all on all sequences in schema auth to service_role;

-- Drop and recreate custom types
drop type if exists public.content_type cascade;
drop type if exists public.tag cascade;

-- Create custom types
create type public.content_type as enum ('tutorial', 'explanation', 'how_to_guide', 'reference');
create type public.tag as enum ('math', 'software', 'ai');

-- Create profiles table (extends Supabase auth.users)
create sequence if not exists public.profiles_id_seq;
create table public.profiles (
  id int8 primary key default nextval('public.profiles_id_seq'),
  user_id uuid references auth.users on delete cascade,
  email text,
  created_at timestamptz default timezone('utc'::text, now()),
  specialty public.tag,
  is_admin boolean not null default false
);
alter sequence public.profiles_id_seq owned by public.profiles.id;

-- Create sources table
create table public.sources (
  id uuid primary key,
  created_at timestamptz default timezone('utc'::text, now()),
  title varchar,
  URL text,
  created_by int8 references public.profiles(id)
);

-- Create requests table
create table public.requests (
  id uuid primary key,
  created_at timestamptz default timezone('utc'::text, now()),
  accepted_at timestamptz,
  started_at timestamptz,
  finished_at timestamptz,
  source_id uuid references public.sources(id),
  start_time int8,
  end_time int8,
  content_type public.content_type,
  tag public.tag,
  student_id int8 references public.profiles(id),
  expert_id int8 references public.profiles(id)
);

-- Create curriculums table
create table public.curriculums (
  id uuid primary key,
  created_at timestamptz default timezone('utc'::text, now()),
  updated_at timestamptz default timezone('utc'::text, now()),
  request_id uuid references public.requests on delete cascade
);

-- Create curriculum_nodes table
create table public.curriculum_nodes (
  id uuid primary key,
  curriculum_id uuid references public.curriculums on delete cascade,
  source_id uuid references public.sources(id),
  created_at timestamptz default timezone('utc'::text, now()),
  start_time int8,
  end_time int8,
  level int4,
  index_in_curriculum int4
);

-- Create messages table
create table public.messages (
  id int8 primary key,
  request_id uuid references public.requests on delete cascade,
  content text,
  created_at timestamptz default timezone('utc'::text, now()),
  sender_id int8 references public.profiles(id)
);

-- Enable RLS on all tables
alter table public.profiles enable row level security;
alter table public.requests enable row level security;
alter table public.curriculums enable row level security;
alter table public.curriculum_nodes enable row level security;
alter table public.sources enable row level security;
alter table public.messages enable row level security;

-- Profiles policies
create policy "Public profiles are viewable by everyone"
  on public.profiles for select
  using (true);

create policy "Users can insert their own profile"
  on public.profiles for insert
  with check (auth.uid()::text = user_id::text);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid()::text = user_id::text);

-- Sources policies
create policy "Sources are viewable by everyone"
  on public.sources for select
  using (true);

create policy "Experts can create sources"
  on public.sources for insert
  with check (
    exists (
      select 1 from public.profiles p
      where p.id = created_by
      and p.user_id = auth.uid()
      and p.specialty is not null
    )
  );

-- Requests policies
create policy "Requests are viewable by everyone"
  on public.requests for select
  using (true);

create policy "Students can create requests"
  on public.requests for insert
  with check (
    exists (
      select 1 from public.profiles p
      where p.user_id = auth.uid()
      and p.specialty is null
      and not p.is_admin
    )
  );

create policy "Experts can update assigned requests"
  on public.requests for update
  using (
    expert_id = (
      select p.id from public.profiles p
      where p.user_id = auth.uid()
      limit 1
    )
  );

-- Curriculums policies
create policy "Curriculums are viewable by everyone"
  on public.curriculums for select
  using (true);

create policy "Experts can create curriculums for their requests"
  on public.curriculums for insert
  with check (
    exists (
      select 1 from public.requests r
      where r.id = request_id
      and r.expert_id = (
        select p.id from public.profiles p
        where p.user_id = auth.uid()
        limit 1
      )
    )
  );

-- Curriculum nodes policies
create policy "Curriculum nodes are viewable by everyone"
  on public.curriculum_nodes for select
  using (true);

create policy "Experts can create curriculum nodes"
  on public.curriculum_nodes for insert
  with check (
    exists (
      select 1 from public.curriculums c
      join public.requests r on r.id = c.request_id
      where c.id = curriculum_id
      and r.expert_id = (
        select p.id from public.profiles p
        where p.user_id = auth.uid()
        limit 1
      )
    )
  );

-- Messages policies
create policy "Messages are viewable by participants"
  on public.messages for select
  using (
    exists (
      select 1 from public.requests r
      where r.id = request_id
      and (
        r.student_id = (
          select p.id from public.profiles p
          where p.user_id = auth.uid()
          limit 1
        )
        or
        r.expert_id = (
          select p.id from public.profiles p
          where p.user_id = auth.uid()
          limit 1
        )
      )
    )
  );

create policy "Participants can insert messages"
  on public.messages for insert
  with check (
    exists (
      select 1 from public.requests r
      where r.id = request_id
      and (
        r.student_id = (
          select p.id from public.profiles p
          where p.user_id = auth.uid()
          limit 1
        )
        or
        r.expert_id = (
          select p.id from public.profiles p
          where p.user_id = auth.uid()
          limit 1
        )
      )
    )
  );

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

-- Drop and recreate trigger for new user profiles
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Grant additional permissions for auth operations
grant usage on schema auth to authenticated;
grant usage on schema auth to anon;
grant select on auth.users to authenticated;
grant select on auth.users to anon;
grant update on auth.users to authenticated;
grant update on auth.users to anon;
grant insert on auth.users to service_role;
grant update on auth.users to service_role;
grant delete on auth.users to service_role;

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

-- Create function to seed initial data
create or replace function public.seed_initial_data()
returns void
language plpgsql
security definer
as $$
declare
  admin_id uuid;
  expert_id uuid;
  admin_profile_id int8;
  expert_profile_id int8;
begin
  -- Create auth users in a transaction
  begin
    -- Create admin user
    admin_id := public.create_seed_auth_user(
      'joshua.mitchell@g.austincc.edu',
      true,
      null
    );
    
    -- Create expert user
    expert_id := public.create_seed_auth_user(
      'joshua.mitchell@gauntletai.com',
      false,
      'software'
    );

    -- Get profile IDs
    select id into admin_profile_id
    from public.profiles p
    where p.user_id = admin_id;

    select id into expert_profile_id
    from public.profiles p
    where p.user_id = expert_id;

    -- Create sources
    insert into public.sources (id, title, URL, created_by)
    values
      ('00000000-0000-0000-0000-000000000001'::uuid, 'Introduction to Algorithms', 'https://www.youtube.com/watch?v=example1', expert_profile_id),
      ('00000000-0000-0000-0000-000000000002'::uuid, 'Data Structures Basics', 'https://www.youtube.com/watch?v=example2', expert_profile_id),
      ('00000000-0000-0000-0000-000000000003'::uuid, 'Understanding Big O Notation', 'https://www.youtube.com/watch?v=example3', expert_profile_id),
      ('00000000-0000-0000-0000-000000000004'::uuid, 'Machine Learning Fundamentals', 'https://www.youtube.com/watch?v=example4', expert_profile_id);

    -- Create requests
    insert into public.requests (
      id,
      created_at,
      accepted_at,
      started_at,
      finished_at,
      source_id,
      content_type,
      tag,
      student_id,
      expert_id
    )
    values
      (
        '00000000-0000-0000-0000-000000000101'::uuid,
        now() - interval '3 days',
        null,
        null,
        null,
        null,
        'tutorial'::public.content_type,
        'software'::public.tag,
        null,
        expert_profile_id
      ),
      (
        '00000000-0000-0000-0000-000000000102'::uuid,
        now() - interval '2 days',
        now() - interval '1 day',
        null,
        null,
        null,
        'explanation'::public.content_type,
        'ai'::public.tag,
        null,
        expert_profile_id
      ),
      (
        '00000000-0000-0000-0000-000000000103'::uuid,
        now() - interval '5 days',
        now() - interval '4 days',
        now() - interval '3 days',
        null,
        '00000000-0000-0000-0000-000000000001'::uuid,
        'how_to_guide'::public.content_type,
        'math'::public.tag,
        null,
        expert_profile_id
      ),
      (
        '00000000-0000-0000-0000-000000000104'::uuid,
        now() - interval '10 days',
        now() - interval '9 days',
        now() - interval '8 days',
        now() - interval '1 day',
        '00000000-0000-0000-0000-000000000002'::uuid,
        'reference'::public.content_type,
        'software'::public.tag,
        null,
        expert_profile_id
      );

    -- Create curriculums
    insert into public.curriculums (id, request_id)
    values
      ('00000000-0000-0000-0000-000000000201'::uuid, '00000000-0000-0000-0000-000000000103'::uuid),
      ('00000000-0000-0000-0000-000000000202'::uuid, '00000000-0000-0000-0000-000000000104'::uuid);

    -- Create curriculum nodes
    insert into public.curriculum_nodes (
      id,
      curriculum_id,
      source_id,
      level,
      index_in_curriculum,
      start_time,
      end_time
    )
    values
      -- In-progress request curriculum
      (
        '00000000-0000-0000-0000-000000000301'::uuid,
        '00000000-0000-0000-0000-000000000201'::uuid,
        '00000000-0000-0000-0000-000000000001'::uuid,
        0,
        0,
        0,
        300
      ),
      (
        '00000000-0000-0000-0000-000000000302'::uuid,
        '00000000-0000-0000-0000-000000000201'::uuid,
        '00000000-0000-0000-0000-000000000002'::uuid,
        1,
        1,
        0,
        240
      ),
      (
        '00000000-0000-0000-0000-000000000303'::uuid,
        '00000000-0000-0000-0000-000000000201'::uuid,
        '00000000-0000-0000-0000-000000000003'::uuid,
        2,
        2,
        0,
        180
      ),
      -- Finished request curriculum
      (
        '00000000-0000-0000-0000-000000000304'::uuid,
        '00000000-0000-0000-0000-000000000202'::uuid,
        '00000000-0000-0000-0000-000000000002'::uuid,
        0,
        0,
        0,
        360
      ),
      (
        '00000000-0000-0000-0000-000000000305'::uuid,
        '00000000-0000-0000-0000-000000000202'::uuid,
        '00000000-0000-0000-0000-000000000003'::uuid,
        1,
        1,
        0,
        240
      ),
      (
        '00000000-0000-0000-0000-000000000306'::uuid,
        '00000000-0000-0000-0000-000000000202'::uuid,
        '00000000-0000-0000-0000-000000000004'::uuid,
        1,
        2,
        120,
        300
      );

    -- Create messages
    insert into public.messages (id, request_id, content, sender_id, created_at)
    values
      -- Messages for not accepted request
      (
        1,
        '00000000-0000-0000-0000-000000000101'::uuid,
        'I need help understanding software design patterns',
        null,
        now() - interval '3 days'
      ),
      -- Messages for not started request
      (
        2,
        '00000000-0000-0000-0000-000000000102'::uuid,
        'Could you explain neural networks to me?',
        null,
        now() - interval '2 days'
      ),
      (
        3,
        '00000000-0000-0000-0000-000000000102'::uuid,
        'I''d be happy to help with that',
        expert_profile_id,
        now() - interval '1 day'
      ),
      -- Messages for in-progress request
      (
        4,
        '00000000-0000-0000-0000-000000000103'::uuid,
        'I need a guide on calculus fundamentals',
        null,
        now() - interval '5 days'
      ),
      (
        5,
        '00000000-0000-0000-0000-000000000103'::uuid,
        'I can help you with that. Let''s start with the basics',
        expert_profile_id,
        now() - interval '4 days'
      ),
      (
        6,
        '00000000-0000-0000-0000-000000000103'::uuid,
        'Here''s your first set of materials to review',
        expert_profile_id,
        now() - interval '3 days'
      ),
      -- Messages for finished request
      (
        7,
        '00000000-0000-0000-0000-000000000104'::uuid,
        'I need a reference for data structures',
        null,
        now() - interval '10 days'
      ),
      (
        8,
        '00000000-0000-0000-0000-000000000104'::uuid,
        'I can help you with that. Here''s a comprehensive guide',
        expert_profile_id,
        now() - interval '9 days'
      ),
      (
        9,
        '00000000-0000-0000-0000-000000000104'::uuid,
        'Thanks! This is exactly what I needed',
        null,
        now() - interval '2 days'
      );
  exception
    when others then
      raise exception 'Failed to seed data: %', sqlerrm;
  end;
end;
$$;

-- Call seed function at the end of migration
select public.seed_initial_data();

-- Create function to create seed user
create or replace function public.create_seed_user(username text, password text)
returns void
language plpgsql
security definer
as $$
begin
  execute format('create user %I with password %L', username, password);
  execute format('grant usage on schema public to %I', username);
  execute format('grant all privileges on all tables in schema public to %I', username);
  execute format('grant all privileges on all sequences in schema public to %I', username);
  execute format('grant all privileges on all functions in schema public to %I', username);
end;
$$;

-- Create function to drop and recreate schema
create or replace function public.drop_and_recreate_schema()
returns void
language plpgsql
security definer
as $$
begin
  drop schema if exists public cascade;
  create schema public;
  grant usage on schema public to postgres, anon, authenticated, service_role;
  grant all privileges on all tables in schema public to postgres, anon, authenticated, service_role;
  grant all privileges on all sequences in schema public to postgres, anon, authenticated, service_role;
  grant all privileges on all functions in schema public to postgres, anon, authenticated, service_role;
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

-- Create the function to check auth schema
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

-- Create the function to check service role permissions
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

-- Grant permissions
grant usage on schema public to service_role, anon, authenticated;
grant all privileges on all tables in schema public to service_role;
grant all privileges on all sequences in schema public to service_role;
grant all privileges on all functions in schema public to service_role;

-- Grant auth schema permissions
GRANT USAGE ON SCHEMA auth TO authenticated;
GRANT USAGE ON SCHEMA auth TO anon;

-- Grant select on auth.users to allow user lookup
GRANT SELECT ON auth.users TO authenticated;
GRANT SELECT ON auth.users TO anon;

-- Grant necessary permissions for magic link auth
GRANT SELECT, UPDATE ON auth.users TO authenticated;
GRANT SELECT, UPDATE ON auth.users TO anon;

-- Grant access to sessions and refresh tokens
GRANT SELECT, INSERT, UPDATE ON auth.refresh_tokens TO authenticated;
GRANT SELECT, INSERT, UPDATE ON auth.refresh_tokens TO anon;
GRANT SELECT, INSERT, UPDATE ON auth.sessions TO authenticated;
GRANT SELECT, INSERT, UPDATE ON auth.sessions TO anon;

-- Grant usage on auth schema sequences
GRANT USAGE ON ALL SEQUENCES IN SCHEMA auth TO authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA auth TO anon;

-- Create function to create auth user
create or replace function public.create_auth_user(user_email text)
returns jsonb
language plpgsql
security definer
set search_path = auth, public
as $$
declare
  result jsonb;
  user_id uuid;
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
    '{}',
    false,
    '' -- No password needed for magic link
  ) returning id into user_id;

  -- Get the created user
  select row_to_json(u)::jsonb into result
  from auth.users u
  where u.id = user_id;

  return result;
end;
$$;

-- Grant execute permission to service role
grant execute on function public.create_auth_user(text) to service_role;

-- Grant specific permissions for profiles table
grant all privileges on public.profiles to authenticated;
grant all privileges on public.profiles to anon;
grant usage on sequence public.profiles_id_seq to authenticated;
grant usage on sequence public.profiles_id_seq to anon;

-- Grant permissions for requests
grant all privileges on public.requests to authenticated;
grant all privileges on public.requests to anon;

-- Additional RLS policies for requests
create policy "Users can view their own requests"
  on public.requests for select
  using (
    student_id in (
      select id from public.profiles where user_id = auth.uid()
    )
    or
    expert_id in (
      select id from public.profiles where user_id = auth.uid()
    )
  );