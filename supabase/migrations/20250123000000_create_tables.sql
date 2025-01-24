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

-- Create custom types
create type public.content_type as enum ('tutorial', 'explanation', 'how_to_guide', 'reference');
create type public.tag as enum ('math', 'software', 'ai');

-- Create profiles table
create sequence if not exists public.profiles_id_seq;
create table public.profiles (
  id int8 primary key default nextval('public.profiles_id_seq'),
  user_id uuid unique not null,
  email text,
  created_at timestamptz default timezone('utc'::text, now()),
  specialty public.tag,
  is_admin boolean not null default false
);
alter sequence public.profiles_id_seq owned by public.profiles.id;

-- Create sources table
create table public.sources (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default timezone('utc'::text, now()),
  title varchar,
  URL text,
  created_by int8 references public.profiles(id)
);

-- Create requests table
create table public.requests (
  id uuid primary key default gen_random_uuid(),
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
drop sequence if exists public.messages_id_seq cascade;
create sequence public.messages_id_seq;
create table public.messages (
  id int8 primary key default nextval('public.messages_id_seq'),
  request_id uuid references public.requests on delete cascade,
  content text,
  created_at timestamptz default timezone('utc'::text, now()),
  sender_id int8 references public.profiles(id)
);
alter sequence public.messages_id_seq owned by public.messages.id;
select setval('public.messages_id_seq', (select coalesce(max(id), 0) + 1 from public.messages), false);

-- Grant sequence permissions
grant usage, select on sequence public.messages_id_seq to authenticated;

-- Enable RLS on all tables
alter table public.profiles enable row level security;
alter table public.requests enable row level security;
alter table public.curriculums enable row level security;
alter table public.curriculum_nodes enable row level security;
alter table public.sources enable row level security;
alter table public.messages enable row level security;

-- Enable realtime for messages table
alter publication supabase_realtime add table messages;

-- Grant permissions for foreign key references
grant select on public.profiles to authenticated;
grant select on public.sources to authenticated;
grant select on public.requests to authenticated; 