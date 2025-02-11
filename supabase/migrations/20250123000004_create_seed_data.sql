do $$
declare
  admin_user_id uuid;
  expert_user_id uuid;
  student_user_id uuid;
  admin_profile_id int8;
  expert_profile_id int8;
  student_profile_id int8;
  jlelon_user_id uuid := '3fb73773-9bb2-470b-ac44-c49d96190971'::uuid;
  jlelon_profile_id int8;
begin

-- Clear all tables in the correct order (respecting foreign key constraints)
truncate table public.messages cascade;
truncate table public.curriculum_nodes cascade;
truncate table public.curriculums cascade;
truncate table public.requests cascade;
truncate table public.sources cascade;
truncate table public.profiles cascade;

-- Reset sequences
alter sequence public.profiles_id_seq restart with 1;
alter sequence public.messages_id_seq restart with 1;

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
select id into jlelon_profile_id from public.profiles where email = 'jlelonmitchell@gmail.com';
if jlelon_profile_id is null then
  insert into public.profiles (id, user_id, email, specialty, is_admin)
  values (nextval('public.profiles_id_seq'), jlelon_user_id, 'jlelonmitchell@gmail.com', null, false)
  returning id into jlelon_profile_id;
end if;

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
  ('00000000-0000-0000-0000-000000000006'::uuid, 'AI Ethics and Safety', 'https://www.edx.org/learn/artificial-intelligence/harvard-university-ethics-and-ai', expert_profile_id),
  -- New vector spaces sources
  ('00000000-0000-0000-0000-000000000011'::uuid, 'Introduction to Linear Algebra', 'https://www.youtube.com/watch?v=fNk_zzaMoSs', expert_profile_id),
  ('00000000-0000-0000-0000-000000000012'::uuid, 'Vector Space Basics', 'https://www.youtube.com/watch?v=k7RM-ot2NWY', expert_profile_id),
  ('00000000-0000-0000-0000-000000000013'::uuid, 'Linear Transformations', 'https://www.youtube.com/watch?v=kYB8IZa5AuE', expert_profile_id),
  ('00000000-0000-0000-0000-000000000014'::uuid, 'Group Theory Fundamentals', 'https://www.youtube.com/watch?v=TgKwz5Ikpc8', expert_profile_id),
  ('00000000-0000-0000-0000-000000000015'::uuid, 'Representation Theory', 'https://en.wikipedia.org/wiki/Representation_theory', expert_profile_id),
  ('00000000-0000-0000-0000-000000000016'::uuid, 'Vector Space Representations', 'https://www.youtube.com/watch?v=mH0oCDa74tE', expert_profile_id),
  ('00000000-0000-0000-0000-000000000017'::uuid, 'Dimension and Basis', 'https://www.youtube.com/watch?v=P2LTAUO1TdA', expert_profile_id),
  ('00000000-0000-0000-0000-000000000018'::uuid, 'Homomorphisms in Vector Spaces', 'https://www.youtube.com/watch?v=13r9QY6cmjc', expert_profile_id),
  -- New 20 new unique YouTube sources if they don't exist
  ('00000000-0000-0000-0000-000000000021'::uuid, 'Advanced React State Management', 'https://www.youtube.com/watch?v=someUniqueVideo1', expert_profile_id),
  ('00000000-0000-0000-0000-000000000022'::uuid, 'Node.js Cluster Mode Intro', 'https://www.youtube.com/watch?v=someUniqueVideo2', expert_profile_id),
  ('00000000-0000-0000-0000-000000000023'::uuid, 'Tailwind CSS Tips & Tricks', 'https://www.youtube.com/watch?v=someUniqueVideo3', expert_profile_id),
  ('00000000-0000-0000-0000-000000000024'::uuid, 'Next.js 13 App Router Overview', 'https://www.youtube.com/watch?v=someUniqueVideo4', expert_profile_id),
  ('00000000-0000-0000-0000-000000000025'::uuid, 'Shadcn UI Components Setup', 'https://www.youtube.com/watch?v=someUniqueVideo5', expert_profile_id),
  ('00000000-0000-0000-0000-000000000026'::uuid, 'Radix UI Deep Dive', 'https://www.youtube.com/watch?v=someUniqueVideo6', expert_profile_id),
  ('00000000-0000-0000-0000-000000000027'::uuid, 'AWS S3 Bucket Best Practices', 'https://www.youtube.com/watch?v=someUniqueVideo7', expert_profile_id),
  ('00000000-0000-0000-0000-000000000028'::uuid, 'Lambda Functions 101', 'https://www.youtube.com/watch?v=someUniqueVideo8', expert_profile_id),
  ('00000000-0000-0000-0000-000000000029'::uuid, 'DynamoDB Design Patterns', 'https://www.youtube.com/watch?v=someUniqueVideo9', expert_profile_id),
  ('00000000-0000-0000-0000-000000000030'::uuid, 'Server Components vs. Client Components', 'https://www.youtube.com/watch?v=someUniqueVideo10', expert_profile_id),
  ('00000000-0000-0000-0000-000000000031'::uuid, 'Next.js Middleware Examples', 'https://www.youtube.com/watch?v=someUniqueVideo11', expert_profile_id),
  ('00000000-0000-0000-0000-000000000032'::uuid, 'Supabase Auth Basics', 'https://www.youtube.com/watch?v=someUniqueVideo12', expert_profile_id),
  ('00000000-0000-0000-0000-000000000033'::uuid, 'TypeScript Utility Types', 'https://www.youtube.com/watch?v=someUniqueVideo13', expert_profile_id),
  ('00000000-0000-0000-0000-000000000034'::uuid, 'LangChain for LLM Orchestration', 'https://www.youtube.com/watch?v=someUniqueVideo14', expert_profile_id),
  ('00000000-0000-0000-0000-000000000035'::uuid, 'AI Ethics on YouTube', 'https://www.youtube.com/watch?v=someUniqueVideo15', expert_profile_id),
  ('00000000-0000-0000-0000-000000000036'::uuid, 'AWS Lambda Edge Cases', 'https://www.youtube.com/watch?v=someUniqueVideo16', expert_profile_id),
  ('00000000-0000-0000-0000-000000000037'::uuid, 'React Suspense Basics', 'https://www.youtube.com/watch?v=someUniqueVideo17', expert_profile_id),
  ('00000000-0000-0000-0000-000000000038'::uuid, 'Serverless Framework Demo', 'https://www.youtube.com/watch?v=someUniqueVideo18', expert_profile_id),
  ('00000000-0000-0000-0000-000000000039'::uuid, 'Tailwind CSS Animations', 'https://www.youtube.com/watch?v=someUniqueVideo19', expert_profile_id),
  ('00000000-0000-0000-0000-000000000040'::uuid, 'Optimizing Web Vitals', 'https://www.youtube.com/watch?v=someUniqueVideo20', expert_profile_id)
) as v(id, title, url, created_by)
where not exists (select 1 from public.sources where sources.id = v.id);

-- Create requests if they don't exist and set their source_ids
insert into public.requests (id, created_at, accepted_at, started_at, finished_at, source_id, content_type, tag, student_id, expert_id)
select * from (values
  ('00000000-0000-0000-0000-000000000101'::uuid, now() - interval '3 days', null, null, null, '00000000-0000-0000-0000-000000000005'::uuid, 'tutorial'::public.content_type, 'software'::public.tag, jlelon_profile_id, expert_profile_id),
  ('00000000-0000-0000-0000-000000000102'::uuid, now() - interval '2 days', now() - interval '1 day', null, null, '00000000-0000-0000-0000-000000000006'::uuid, 'explanation'::public.content_type, 'ai'::public.tag, jlelon_profile_id, expert_profile_id),
  ('00000000-0000-0000-0000-000000000103'::uuid, now() - interval '5 days', now() - interval '4 days', now() - interval '3 days', null, '00000000-0000-0000-0000-000000000001'::uuid, 'how_to_guide'::public.content_type, 'math'::public.tag, jlelon_profile_id, expert_profile_id),
  ('00000000-0000-0000-0000-000000000104'::uuid, now() - interval '10 days', now() - interval '9 days', now() - interval '8 days', now() - interval '1 day', '00000000-0000-0000-0000-000000000002'::uuid, 'reference'::public.content_type, 'software'::public.tag, jlelon_profile_id, expert_profile_id),
  -- New vector spaces request
  ('00000000-0000-0000-0000-000000000105'::uuid, now() - interval '10 days', now() - interval '9 days', now() - interval '8 days', now() - interval '1 day', '00000000-0000-0000-0000-000000000015'::uuid, 'explanation'::public.content_type, 'math'::public.tag, jlelon_profile_id, expert_profile_id),
  -- New 20 additional requests in "not accepted" status (accepted_at=null)
  ('00000000-0000-0000-0000-000000000601'::uuid, now() - interval '1 day', null, null, null, '00000000-0000-0000-0000-000000000021'::uuid, 'tutorial', 'software', student_profile_id, null),
  ('00000000-0000-0000-0000-000000000602'::uuid, now() - interval '2 days', null, null, null, '00000000-0000-0000-0000-000000000022'::uuid, 'tutorial', 'software', student_profile_id, null),
  ('00000000-0000-0000-0000-000000000603'::uuid, now() - interval '3 days', null, null, null, '00000000-0000-0000-0000-000000000023'::uuid, 'explanation', 'ai', student_profile_id, null),
  ('00000000-0000-0000-0000-000000000604'::uuid, now() - interval '4 days', null, null, null, '00000000-0000-0000-0000-000000000024'::uuid, 'how_to_guide', 'math', student_profile_id, null),
  ('00000000-0000-0000-0000-000000000605'::uuid, now() - interval '5 days', null, null, null, '00000000-0000-0000-0000-000000000025'::uuid, 'reference', 'software', student_profile_id, null),
  ('00000000-0000-0000-0000-000000000606'::uuid, now() - interval '6 days', null, null, null, '00000000-0000-0000-0000-000000000026'::uuid, 'tutorial', 'software', student_profile_id, null),
  ('00000000-0000-0000-0000-000000000607'::uuid, now() - interval '7 days', null, null, null, '00000000-0000-0000-0000-000000000027'::uuid, 'explanation', 'ai', student_profile_id, null),
  ('00000000-0000-0000-0000-000000000608'::uuid, now() - interval '8 days', null, null, null, '00000000-0000-0000-0000-000000000028'::uuid, 'how_to_guide', 'math', student_profile_id, null),
  ('00000000-0000-0000-0000-000000000609'::uuid, now() - interval '9 days', null, null, null, '00000000-0000-0000-0000-000000000029'::uuid, 'reference', 'software', student_profile_id, null),
  ('00000000-0000-0000-0000-000000000610'::uuid, now() - interval '10 days', null, null, null, '00000000-0000-0000-0000-000000000030'::uuid, 'tutorial', 'software', student_profile_id, null),
  ('00000000-0000-0000-0000-000000000611'::uuid, now() - interval '11 days', null, null, null, '00000000-0000-0000-0000-000000000031'::uuid, 'explanation', 'ai', student_profile_id, null),
  ('00000000-0000-0000-0000-000000000612'::uuid, now() - interval '12 days', null, null, null, '00000000-0000-0000-0000-000000000032'::uuid, 'how_to_guide', 'math', student_profile_id, null),
  ('00000000-0000-0000-0000-000000000613'::uuid, now() - interval '13 days', null, null, null, '00000000-0000-0000-0000-000000000033'::uuid, 'reference', 'software', student_profile_id, null),
  ('00000000-0000-0000-0000-000000000614'::uuid, now() - interval '14 days', null, null, null, '00000000-0000-0000-0000-000000000034'::uuid, 'tutorial', 'software', student_profile_id, null),
  ('00000000-0000-0000-0000-000000000615'::uuid, now() - interval '15 days', null, null, null, '00000000-0000-0000-0000-000000000035'::uuid, 'explanation', 'ai', student_profile_id, null),
  ('00000000-0000-0000-0000-000000000616'::uuid, now() - interval '16 days', null, null, null, '00000000-0000-0000-0000-000000000036'::uuid, 'how_to_guide', 'math', student_profile_id, null),
  ('00000000-0000-0000-0000-000000000617'::uuid, now() - interval '17 days', null, null, null, '00000000-0000-0000-0000-000000000037'::uuid, 'reference', 'software', student_profile_id, null),
  ('00000000-0000-0000-0000-000000000618'::uuid, now() - interval '18 days', null, null, null, '00000000-0000-0000-0000-000000000038'::uuid, 'tutorial', 'software', student_profile_id, null),
  ('00000000-0000-0000-0000-000000000619'::uuid, now() - interval '19 days', null, null, null, '00000000-0000-0000-0000-000000000039'::uuid, 'explanation', 'ai', student_profile_id, null),
  ('00000000-0000-0000-0000-000000000620'::uuid, now() - interval '20 days', null, null, null, '00000000-0000-0000-0000-000000000040'::uuid, 'how_to_guide', 'math', student_profile_id, null)
) as v(id, created_at, accepted_at, started_at, finished_at, source_id, content_type, tag, student_id, expert_id)
where not exists (select 1 from public.requests where requests.id = v.id);

-- Create curriculums if they don't exist
insert into public.curriculums (id, request_id)
select * from (values
  ('00000000-0000-0000-0000-000000000201'::uuid, '00000000-0000-0000-0000-000000000103'::uuid),
  ('00000000-0000-0000-0000-000000000202'::uuid, '00000000-0000-0000-0000-000000000104'::uuid),
  -- New vector spaces curriculum
  ('00000000-0000-0000-0000-000000000203'::uuid, '00000000-0000-0000-0000-000000000105'::uuid)
) as v(id, request_id)
where not exists (select 1 from public.curriculums where curriculums.id = v.id);

-- Create curriculum nodes if they don't exist
insert into public.curriculum_nodes (id, curriculum_id, source_id, start_time, end_time, level, index_in_curriculum)
select * from (values
  ('00000000-0000-0000-0000-000000000301'::uuid, '00000000-0000-0000-0000-000000000201'::uuid, '00000000-0000-0000-0000-000000000001'::uuid, 0, 300, 1, 1),
  ('00000000-0000-0000-0000-000000000302'::uuid, '00000000-0000-0000-0000-000000000201'::uuid, '00000000-0000-0000-0000-000000000002'::uuid, 0, 300, 2, 2),
  ('00000000-0000-0000-0000-000000000303'::uuid, '00000000-0000-0000-0000-000000000202'::uuid, '00000000-0000-0000-0000-000000000003'::uuid, 0, 300, 1, 1),
  ('00000000-0000-0000-0000-000000000304'::uuid, '00000000-0000-0000-0000-000000000202'::uuid, '00000000-0000-0000-0000-000000000004'::uuid, 0, 300, 2, 2),
  -- New vector spaces curriculum nodes - Updated indices for depth-first traversal
  -- Left branch
  ('00000000-0000-0000-0000-000000000401'::uuid, '00000000-0000-0000-0000-000000000203'::uuid, '00000000-0000-0000-0000-000000000011'::uuid, 0, 900, 0, 0), -- Linear Algebra
  ('00000000-0000-0000-0000-000000000403'::uuid, '00000000-0000-0000-0000-000000000203'::uuid, '00000000-0000-0000-0000-000000000012'::uuid, 0, 660, 1, 1), -- Vector Space Basics
  ('00000000-0000-0000-0000-000000000405'::uuid, '00000000-0000-0000-0000-000000000203'::uuid, '00000000-0000-0000-0000-000000000013'::uuid, 0, 780, 2, 2), -- Linear Transformations
  ('00000000-0000-0000-0000-000000000407'::uuid, '00000000-0000-0000-0000-000000000203'::uuid, '00000000-0000-0000-0000-000000000016'::uuid, 0, 1200, 3, 3), -- Vector Space Representations
  -- Right branch
  ('00000000-0000-0000-0000-000000000402'::uuid, '00000000-0000-0000-0000-000000000203'::uuid, '00000000-0000-0000-0000-000000000014'::uuid, 0, 1200, 0, 4), -- Group Theory
  ('00000000-0000-0000-0000-000000000404'::uuid, '00000000-0000-0000-0000-000000000203'::uuid, '00000000-0000-0000-0000-000000000017'::uuid, 0, 840, 1, 5), -- Dimension and Basis
  ('00000000-0000-0000-0000-000000000406'::uuid, '00000000-0000-0000-0000-000000000203'::uuid, '00000000-0000-0000-0000-000000000018'::uuid, 0, 1500, 2, 6)  -- Homomorphisms
) as v(id, curriculum_id, source_id, start_time, end_time, level, index_in_curriculum)
where not exists (select 1 from public.curriculum_nodes where curriculum_nodes.id = v.id);

-- Create messages if they don't exist
insert into public.messages (request_id, content, sender_id)
select * from (values
  ('00000000-0000-0000-0000-000000000103'::uuid, 'Hi, I need help understanding this concept.', jlelon_profile_id),
  ('00000000-0000-0000-0000-000000000103'::uuid, 'Sure, I can help you with that.', expert_profile_id),
  ('00000000-0000-0000-0000-000000000104'::uuid, 'Could you explain this in more detail?', jlelon_profile_id),
  ('00000000-0000-0000-0000-000000000104'::uuid, 'Here''s a detailed explanation...', expert_profile_id),
  -- New vector spaces messages
  ('00000000-0000-0000-0000-000000000105'::uuid, 'Hi, I need help understanding vector space representations. The Wikipedia article is a bit dense.', jlelon_profile_id),
  ('00000000-0000-0000-0000-000000000105'::uuid, 'I understand. Let me break it down into a structured curriculum that builds up from the fundamentals.', expert_profile_id),
  ('00000000-0000-0000-0000-000000000105'::uuid, 'Thanks! The visual tree really helps see how the concepts connect.', jlelon_profile_id),
  ('00000000-0000-0000-0000-000000000105'::uuid, 'Exactly! Notice how we start with basic linear algebra and group theory, then build up to the more advanced concepts.', expert_profile_id)
) as v(request_id, content, sender_id)
where not exists (select 1 from public.messages where messages.content = v.content);

-- Update sources for vector spaces curriculum
UPDATE public.sources
SET url = 'https://www.youtube.com/watch?v=fNk_zzaMoSs',
    title = '3Blue1Brown: Essence of Linear Algebra'
WHERE id = '00000000-0000-0000-0000-000000000011';

UPDATE public.sources
SET url = 'https://www.youtube.com/watch?v=k7RM-ot2NWY',
    title = '3Blue1Brown: Vector Spaces'
WHERE id = '00000000-0000-0000-0000-000000000012';

UPDATE public.sources
SET url = 'https://www.youtube.com/watch?v=kYB8IZa5AuE',
    title = '3Blue1Brown: Linear Transformations'
WHERE id = '00000000-0000-0000-0000-000000000013';

UPDATE public.sources
SET url = 'https://www.youtube.com/watch?v=TgKwz5Ikpc8',
    title = 'Group Theory: An Intuitive Introduction'
WHERE id = '00000000-0000-0000-0000-000000000014';

UPDATE public.sources
SET url = 'https://www.youtube.com/watch?v=mH0oCDa74tE',
    title = '3Blue1Brown: Change of Basis'
WHERE id = '00000000-0000-0000-0000-000000000016';

UPDATE public.sources
SET url = 'https://www.youtube.com/watch?v=P2LTAUO1TdA',
    title = '3Blue1Brown: Basis and Dimension'
WHERE id = '00000000-0000-0000-0000-000000000017';

UPDATE public.sources
SET url = 'https://www.youtube.com/watch?v=13r9QY6cmjc',
    title = 'Visual Group Theory: Homomorphisms'
WHERE id = '00000000-0000-0000-0000-000000000018';

-- Update curriculum nodes with appropriate timestamps
UPDATE public.curriculum_nodes
SET start_time = 0,
    end_time = 900  -- 15 minutes overview
WHERE id = '00000000-0000-0000-0000-000000000401';

UPDATE public.curriculum_nodes
SET start_time = 0,
    end_time = 660  -- 11 minutes
WHERE id = '00000000-0000-0000-0000-000000000403';

UPDATE public.curriculum_nodes
SET start_time = 0,
    end_time = 780  -- 13 minutes
WHERE id = '00000000-0000-0000-0000-000000000405';

UPDATE public.curriculum_nodes
SET start_time = 0,
    end_time = 1200  -- 20 minutes intro
WHERE id = '00000000-0000-0000-0000-000000000402';

UPDATE public.curriculum_nodes
SET start_time = 0,
    end_time = 840  -- 14 minutes
WHERE id = '00000000-0000-0000-0000-000000000407';

UPDATE public.curriculum_nodes
SET start_time = 0,
    end_time = 720  -- 12 minutes
WHERE id = '00000000-0000-0000-0000-000000000404';

UPDATE public.curriculum_nodes
SET start_time = 0,
    end_time = 1500  -- 25 minutes
WHERE id = '00000000-0000-0000-0000-000000000406';

end;
$$; 