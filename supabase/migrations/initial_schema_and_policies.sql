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
begin
  insert into public.profiles (id, user_id, email)
  values (
    (select coalesce(max(id), 0) + 1 from public.profiles),
    new.id,
    new.email
  )
  returning id into profile_id;
  return new;
end;
$$ language plpgsql security definer;

-- Create trigger for new user profiles
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Grant permissions
grant usage on schema public to service_role, anon, authenticated;
grant all privileges on all tables in schema public to service_role;
grant all privileges on all sequences in schema public to service_role;
grant all privileges on all functions in schema public to service_role;