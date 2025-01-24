do $$
declare
  admin_user_id uuid;
  expert_user_id uuid;
  student_user_id uuid;
  admin_profile_id int8;
  expert_profile_id int8;
  student_profile_id int8;
begin

-- Check if we have permission to insert into auth.users
if not exists (
  select 1 from information_schema.role_table_grants 
  where table_schema = 'auth' 
  and table_name = 'users' 
  and privilege_type = 'INSERT'
) then
  raise exception 'No permission to insert into auth.users';
end if;

-- Get or create users in auth.users
IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'joshua.mitchell@g.austincc.edu') THEN
  INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at)
  VALUES (gen_random_uuid(), 'joshua.mitchell@g.austincc.edu', crypt('password123', gen_salt('bf')), now())
  RETURNING id INTO admin_user_id;
ELSE
  SELECT id INTO admin_user_id FROM auth.users WHERE email = 'joshua.mitchell@g.austincc.edu';
END IF;

IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'joshua.mitchell@gauntletai.com') THEN
  INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at)
  VALUES (gen_random_uuid(), 'joshua.mitchell@gauntletai.com', crypt('password123', gen_salt('bf')), now())
  RETURNING id INTO expert_user_id;
ELSE
  SELECT id INTO expert_user_id FROM auth.users WHERE email = 'joshua.mitchell@gauntletai.com';
END IF;

IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'student@example.com') THEN
  INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at)
  VALUES (gen_random_uuid(), 'student@example.com', crypt('password123', gen_salt('bf')), now())
  RETURNING id INTO student_user_id;
ELSE
  SELECT id INTO student_user_id FROM auth.users WHERE email = 'student@example.com';
END IF;

-- Get or create profiles
select id into admin_profile_id from public.profiles where email = 'joshua.mitchell@g.austincc.edu';
if admin_profile_id is null then
  insert into public.profiles (id, user_id, email, specialty, is_admin)
  values (nextval('public.profiles_id_seq'), admin_user_id, 'joshua.mitchell@g.austincc.edu', null, true)
  returning id into admin_profile_id;
end if;

select id into expert_profile_id from public.profiles where email = 'joshua.mitchell@gauntletai.com';
if expert_profile_id is null then
  insert into public.profiles (id, user_id, email, specialty, is_admin)
  values (nextval('public.profiles_id_seq'), expert_user_id, 'joshua.mitchell@gauntletai.com', 'software', false)
  returning id into expert_profile_id;
end if;

select id into student_profile_id from public.profiles where email = 'student@example.com';
if student_profile_id is null then
  insert into public.profiles (id, user_id, email, specialty, is_admin)
  values (nextval('public.profiles_id_seq'), student_user_id, 'student@example.com', null, false)
  returning id into student_profile_id;
end if;

-- Create sources if they don't exist
insert into public.sources (id, title, URL, created_by)
select * from (values
  ('00000000-0000-0000-0000-000000000001'::uuid, 'Introduction to Algorithms', 'https://www.coursera.org/learn/algorithms-part1', expert_profile_id),
  ('00000000-0000-0000-0000-000000000002'::uuid, 'Data Structures Basics', 'https://www.geeksforgeeks.org/data-structures/', expert_profile_id),
  ('00000000-0000-0000-0000-000000000003'::uuid, 'ChatGPT API Tutorial', 'https://platform.openai.com/docs/tutorials/web-qa-embeddings', expert_profile_id),
  ('00000000-0000-0000-0000-000000000004'::uuid, 'Machine Learning Fundamentals', 'https://www.deeplearning.ai/courses/machine-learning-specialization/', expert_profile_id),
  ('00000000-0000-0000-0000-000000000005'::uuid, 'Software Design Patterns', 'https://refactoring.guru/design-patterns', expert_profile_id),
  ('00000000-0000-0000-0000-000000000006'::uuid, 'AI Ethics and Safety', 'https://www.edx.org/learn/artificial-intelligence/harvard-university-ethics-and-ai', expert_profile_id)
) as v(id, title, url, created_by)
where not exists (select 1 from public.sources where sources.id = v.id);

-- Create requests if they don't exist
insert into public.requests (id, created_at, accepted_at, started_at, finished_at, source_id, content_type, tag, student_id, expert_id)
select * from (values
  ('00000000-0000-0000-0000-000000000101'::uuid, now() - interval '3 days', null, null, null, '00000000-0000-0000-0000-000000000005'::uuid, 'tutorial'::public.content_type, 'software'::public.tag, student_profile_id, expert_profile_id),
  ('00000000-0000-0000-0000-000000000102'::uuid, now() - interval '2 days', now() - interval '1 day', null, null, '00000000-0000-0000-0000-000000000006'::uuid, 'explanation'::public.content_type, 'ai'::public.tag, student_profile_id, expert_profile_id),
  ('00000000-0000-0000-0000-000000000103'::uuid, now() - interval '5 days', now() - interval '4 days', now() - interval '3 days', null, '00000000-0000-0000-0000-000000000001'::uuid, 'how_to_guide'::public.content_type, 'math'::public.tag, student_profile_id, expert_profile_id),
  ('00000000-0000-0000-0000-000000000104'::uuid, now() - interval '10 days', now() - interval '9 days', now() - interval '8 days', now() - interval '1 day', '00000000-0000-0000-0000-000000000002'::uuid, 'reference'::public.content_type, 'software'::public.tag, student_profile_id, expert_profile_id)
) as v(id, created_at, accepted_at, started_at, finished_at, source_id, content_type, tag, student_id, expert_id)
where not exists (select 1 from public.requests where requests.id = v.id);

-- Create curriculums if they don't exist
insert into public.curriculums (id, request_id)
select * from (values
  ('00000000-0000-0000-0000-000000000201'::uuid, '00000000-0000-0000-0000-000000000103'::uuid),
  ('00000000-0000-0000-0000-000000000202'::uuid, '00000000-0000-0000-0000-000000000104'::uuid)
) as v(id, request_id)
where not exists (select 1 from public.curriculums where curriculums.id = v.id);

-- Create curriculum nodes if they don't exist
insert into public.curriculum_nodes (id, curriculum_id, source_id, start_time, end_time, level, index_in_curriculum)
select * from (values
  ('00000000-0000-0000-0000-000000000301'::uuid, '00000000-0000-0000-0000-000000000201'::uuid, '00000000-0000-0000-0000-000000000001'::uuid, 0, 300, 1, 1),
  ('00000000-0000-0000-0000-000000000302'::uuid, '00000000-0000-0000-0000-000000000201'::uuid, '00000000-0000-0000-0000-000000000002'::uuid, 0, 300, 2, 2),
  ('00000000-0000-0000-0000-000000000303'::uuid, '00000000-0000-0000-0000-000000000202'::uuid, '00000000-0000-0000-0000-000000000003'::uuid, 0, 300, 1, 1),
  ('00000000-0000-0000-0000-000000000304'::uuid, '00000000-0000-0000-0000-000000000202'::uuid, '00000000-0000-0000-0000-000000000004'::uuid, 0, 300, 2, 2)
) as v(id, curriculum_id, source_id, start_time, end_time, level, index_in_curriculum)
where not exists (select 1 from public.curriculum_nodes where curriculum_nodes.id = v.id);

-- Create messages if they don't exist
insert into public.messages (id, request_id, content, sender_id)
select * from (values
  (1, '00000000-0000-0000-0000-000000000103'::uuid, 'Hi, I need help understanding this concept.', student_profile_id),
  (2, '00000000-0000-0000-0000-000000000103'::uuid, 'Sure, I can help you with that.', expert_profile_id),
  (3, '00000000-0000-0000-0000-000000000104'::uuid, 'Could you explain this in more detail?', student_profile_id),
  (4, '00000000-0000-0000-0000-000000000104'::uuid, 'Here''s a detailed explanation...', expert_profile_id)
) as v(id, request_id, content, sender_id)
where not exists (select 1 from public.messages where messages.id = v.id);

end;
$$; 