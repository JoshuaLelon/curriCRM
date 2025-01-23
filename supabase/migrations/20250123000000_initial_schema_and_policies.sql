-- Enable pgcrypto extension
create extension if not exists pgcrypto;

-- Drop existing schema if it exists
drop schema if exists public cascade;
create schema public;

-- Create custom types
create type content_type as enum ('tutorial', 'explanation', 'how_to_guide', 'reference');
create type tag as enum ('math', 'software', 'ai');

-- Create profiles table (extends Supabase auth.users)
create table public.profiles (
  id int8 primary key,
  user_id uuid references auth.users on delete cascade,
  email text,
  created_at timestamptz default timezone('utc'::text, now())
);

-- Create requests table
create table public.requests (
  id uuid primary key,
  created_at timestamptz default timezone('utc'::text, now()),
  accepted_at timestamptz,
  started_at timestamptz,
  finished_at timestamptz,
  source_id uuid,
  start_time int8,
  end_time int8,
  content_type content_type,
  tag tag,
  student_id int8,
  expert_id int8
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
  source_id uuid,
  created_at timestamptz default timezone('utc'::text, now()),
  start_time int8,
  end_time int8,
  level int4,
  index_in_curriculum int4
);

-- Create sources table
create table public.sources (
  id uuid primary key,
  created_at timestamptz default timezone('utc'::text, now()),
  title varchar,
  URL text,
  created_by int8
);

-- Create messages table
create table public.messages (
  id int8 primary key,
  request_id uuid references public.requests on delete cascade,
  content text,
  created_at timestamptz default timezone('utc'::text, now()),
  sender_id int8
);

-- Create user_roles table
create table public.user_roles (
  id int8 primary key,
  created_at timestamptz default timezone('utc'::text, now()),
  specialty tag,
  profile_id int8 references public.profiles on delete cascade
);

-- Enable RLS on all tables
alter table public.profiles enable row level security;
alter table public.requests enable row level security;
alter table public.curriculums enable row level security;
alter table public.curriculum_nodes enable row level security;
alter table public.sources enable row level security;
alter table public.messages enable row level security;
alter table public.user_roles enable row level security;

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

-- User roles policies
create policy "User roles are viewable by everyone"
  on public.user_roles for select
  using (true);

create policy "Only admins can insert user roles"
  on public.user_roles for insert
  with check (
    exists (
      select 1 from public.user_roles ur
      join public.profiles p on p.id = ur.profile_id
      where p.user_id = auth.uid()
      and ur.specialty is null -- Admin has no specialty
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
      select 1 from public.user_roles ur
      join public.profiles p on p.id = ur.profile_id
      where p.user_id = auth.uid()
      and ur.specialty is null -- Students have no specialty
    )
  );

create policy "Experts can update assigned requests"
  on public.requests for update
  using (
    expert_id = (
      select ur.id from public.user_roles ur
      join public.profiles p on p.id = ur.profile_id
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
        select ur.id from public.user_roles ur
        join public.profiles p on p.id = ur.profile_id
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
        select ur.id from public.user_roles ur
        join public.profiles p on p.id = ur.profile_id
        where p.user_id = auth.uid()
        limit 1
      )
    )
  );

-- Sources policies
create policy "Sources are viewable by everyone"
  on public.sources for select
  using (true);

create policy "Experts can create sources"
  on public.sources for insert
  with check (
    exists (
      select 1 from public.user_roles ur
      join public.profiles p on p.id = ur.profile_id
      where p.user_id = auth.uid()
      and ur.specialty is not null
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
          select ur.id from public.user_roles ur
          join public.profiles p on p.id = ur.profile_id
          where p.user_id = auth.uid()
          limit 1
        )
        or
        r.expert_id = (
          select ur.id from public.user_roles ur
          join public.profiles p on p.id = ur.profile_id
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
          select ur.id from public.user_roles ur
          join public.profiles p on p.id = ur.profile_id
          where p.user_id = auth.uid()
          limit 1
        )
        or
        r.expert_id = (
          select ur.id from public.user_roles ur
          join public.profiles p on p.id = ur.profile_id
          where p.user_id = auth.uid()
          limit 1
        )
      )
    )
  );

-- Function to handle new user profiles
create or replace function public.handle_new_user()
returns trigger as $$
declare
  profile_id int8;
  role_id int8;
  user_specialty tag;
begin
  -- Create profile
  insert into public.profiles (id, user_id, email)
  values (
    (select coalesce(max(id), 0) + 1 from public.profiles),
    new.id,
    new.email
  )
  returning id into profile_id;

  -- Determine specialty based on email and create role only for admin/expert
  case
    when new.email = 'joshua.mitchell@g.austincc.edu' then
      -- Admin has no specialty
      insert into public.user_roles (id, specialty, profile_id)
      values (
        (select coalesce(max(id), 0) + 1 from public.user_roles),
        null,
        profile_id
      )
      returning id into role_id;
    when new.email = 'joshua.mitchell@gauntletai.com' then
      -- Expert with software specialty
      insert into public.user_roles (id, specialty, profile_id)
      values (
        (select coalesce(max(id), 0) + 1 from public.user_roles),
        'software'::tag,
        profile_id
      )
      returning id into role_id;
    else
      -- Students don't get a user role
      null;
  end case;

  return new;
end;
$$ language plpgsql security definer;

-- Create trigger for new user profiles
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

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