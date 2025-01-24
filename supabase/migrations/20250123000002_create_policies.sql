-- Drop all existing policies first
drop policy if exists "Public profiles are viewable by everyone" on public.profiles;
drop policy if exists "Users can insert their own profile" on public.profiles;
drop policy if exists "Users can update own profile" on public.profiles;
drop policy if exists "Sources are viewable by everyone" on public.sources;
drop policy if exists "Authenticated users can create sources" on public.sources;
drop policy if exists "Authenticated users can view sources" on public.sources;
drop policy if exists "Authenticated users can insert sources" on public.sources;
drop policy if exists "Authenticated users can view all sources" on public.sources;
drop policy if exists "Students can view their own requests" on public.requests;
drop policy if exists "Experts can view assigned requests" on public.requests;
drop policy if exists "Admins can view all requests" on public.requests;
drop policy if exists "Authenticated users can view requests" on public.requests;
drop policy if exists "Users can view their own requests" on public.requests;
drop policy if exists "Students can create requests" on public.requests;
drop policy if exists "Experts can update assigned requests" on public.requests;
drop policy if exists "Curriculums are viewable by everyone" on public.curriculums;
drop policy if exists "Users can view curriculums for their requests" on public.curriculums;
drop policy if exists "Experts can create curriculums for their requests" on public.curriculums;
drop policy if exists "Experts can update curriculums for their requests" on public.curriculums;
drop policy if exists "Users can view curriculums" on public.curriculums;
drop policy if exists "Experts can create curriculums" on public.curriculums;
drop policy if exists "Experts can update curriculums" on public.curriculums;
drop policy if exists "Authenticated users can view curriculums" on public.curriculums;
drop policy if exists "Curriculum nodes are viewable by everyone" on public.curriculum_nodes;
drop policy if exists "Users can view curriculum nodes" on public.curriculum_nodes;
drop policy if exists "Experts can create curriculum nodes" on public.curriculum_nodes;
drop policy if exists "Authenticated users can view curriculum nodes" on public.curriculum_nodes;
drop policy if exists "Messages are viewable by participants" on public.messages;
drop policy if exists "Participants can insert messages" on public.messages;
drop policy if exists "Authenticated users can view messages" on public.messages;

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
create policy "Authenticated users can view sources"
  on public.sources for select
  using (auth.role() = 'authenticated');

create policy "Authenticated users can insert sources"
  on public.sources for insert
  with check (auth.role() = 'authenticated');

-- Requests policies
create policy "Authenticated users can view requests"
  on public.requests for select
  using (auth.role() = 'authenticated');

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
      and p.specialty is not null
      and not p.is_admin
    )
  );

-- Curriculums policies
create policy "Authenticated users can view curriculums"
  on public.curriculums for select
  using (auth.role() = 'authenticated');

create policy "Experts can create curriculums"
  on public.curriculums for insert
  with check (
    exists (
      select 1 from public.requests r
      join public.profiles p on r.expert_id = p.id
      where r.id = request_id
      and p.user_id = auth.uid()
    )
  );

create policy "Experts can update curriculums"
  on public.curriculums for update
  using (
    exists (
      select 1 from public.requests r
      join public.profiles p on r.expert_id = p.id
      where r.id = request_id
      and p.user_id = auth.uid()
    )
  );

-- Curriculum nodes policies
create policy "Authenticated users can view curriculum nodes"
  on public.curriculum_nodes for select
  using (auth.role() = 'authenticated');

create policy "Experts can create curriculum nodes"
  on public.curriculum_nodes for insert
  with check (
    exists (
      select 1 from public.curriculums c
      join public.requests r on r.id = c.request_id
      join public.profiles p on r.expert_id = p.id
      where c.id = curriculum_id
      and p.user_id = auth.uid()
    )
  );

-- Messages policies
create policy "Authenticated users can view messages"
  on public.messages for select
  using (auth.role() = 'authenticated');

create policy "Participants can insert messages"
  on public.messages for insert
  with check (
    exists (
      select 1 from public.requests r
      join public.profiles p on (r.student_id = p.id or r.expert_id = p.id)
      where r.id = request_id
      and p.user_id = auth.uid()
    )
  );

-- Add missing request policy
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

-- Add specific profile grants
grant all privileges on public.profiles to authenticated;
grant all privileges on public.profiles to anon;
grant usage on sequence public.profiles_id_seq to authenticated;
grant usage on sequence public.profiles_id_seq to anon; 

-- Fix sources table permissions and policy
grant all privileges on public.sources to authenticated;

