-- Insert profiles with their roles
insert into public.profiles (id, user_id, email)
select 
  row_number() over (order by auth.users.email),
  auth.users.id,
  auth.users.email
from auth.users
where auth.users.email in (
  'joshua.mitchell@g.austincc.edu',
  'joshua.mitchell@gauntletai.com',
  'jlelonmitchell@gmail.com'
);

-- Insert user roles
insert into public.user_roles (id, profile_id, specialty)
select 
  row_number() over (order by profiles.email),
  profiles.id,
  case 
    when profiles.email = 'joshua.mitchell@g.austincc.edu' then null -- admin has no specialty
    when profiles.email = 'joshua.mitchell@gauntletai.com' then 'software'::tag -- expert
    else null -- student has no specialty
  end
from public.profiles;

-- Create some YouTube sources
insert into public.sources (id, title, URL, created_by)
values
  ('00000000-0000-0000-0000-000000000001', 'Introduction to Algorithms', 'https://www.youtube.com/watch?v=example1', 2),
  ('00000000-0000-0000-0000-000000000002', 'Data Structures Basics', 'https://www.youtube.com/watch?v=example2', 2),
  ('00000000-0000-0000-0000-000000000003', 'Understanding Big O Notation', 'https://www.youtube.com/watch?v=example3', 2),
  ('00000000-0000-0000-0000-000000000004', 'Machine Learning Fundamentals', 'https://www.youtube.com/watch?v=example4', 2);

-- Create 4 requests (one of each status)
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
  -- Not accepted request
  (
    '00000000-0000-0000-0000-000000000101',
    now() - interval '3 days',
    null,
    null,
    null,
    null,
    'tutorial',
    'software',
    3,
    null
  ),
  -- Not started request (accepted but no curriculum)
  (
    '00000000-0000-0000-0000-000000000102',
    now() - interval '2 days',
    now() - interval '1 day',
    null,
    null,
    null,
    'explanation',
    'ai',
    3,
    2
  ),
  -- In progress request (has curriculum nodes)
  (
    '00000000-0000-0000-0000-000000000103',
    now() - interval '5 days',
    now() - interval '4 days',
    now() - interval '3 days',
    null,
    '00000000-0000-0000-0000-000000000001',
    'how_to_guide',
    'math',
    3,
    2
  ),
  -- Finished request
  (
    '00000000-0000-0000-0000-000000000104',
    now() - interval '10 days',
    now() - interval '9 days',
    now() - interval '8 days',
    now() - interval '1 day',
    '00000000-0000-0000-0000-000000000002',
    'reference',
    'software',
    3,
    2
  );

-- Create curriculums for in-progress and finished requests
insert into public.curriculums (id, request_id)
values
  ('00000000-0000-0000-0000-000000000201', '00000000-0000-0000-0000-000000000103'),
  ('00000000-0000-0000-0000-000000000202', '00000000-0000-0000-0000-000000000104');

-- Create curriculum nodes for the in-progress request
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
    '00000000-0000-0000-0000-000000000301',
    '00000000-0000-0000-0000-000000000201',
    '00000000-0000-0000-0000-000000000001',
    0,
    0,
    0,
    300
  ),
  (
    '00000000-0000-0000-0000-000000000302',
    '00000000-0000-0000-0000-000000000201',
    '00000000-0000-0000-0000-000000000002',
    1,
    1,
    0,
    240
  ),
  (
    '00000000-0000-0000-0000-000000000303',
    '00000000-0000-0000-0000-000000000201',
    '00000000-0000-0000-0000-000000000003',
    2,
    2,
    0,
    180
  );

-- Create curriculum nodes for the finished request
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
  -- Finished request curriculum
  (
    '00000000-0000-0000-0000-000000000304',
    '00000000-0000-0000-0000-000000000202',
    '00000000-0000-0000-0000-000000000002',
    0,
    0,
    0,
    360
  ),
  (
    '00000000-0000-0000-0000-000000000305',
    '00000000-0000-0000-0000-000000000202',
    '00000000-0000-0000-0000-000000000003',
    1,
    1,
    0,
    240
  ),
  (
    '00000000-0000-0000-0000-000000000306',
    '00000000-0000-0000-0000-000000000202',
    '00000000-0000-0000-0000-000000000004',
    1,
    2,
    120,
    300
  );

-- Create some messages for each request
insert into public.messages (id, request_id, content, sender_id, created_at)
values
  -- Messages for not accepted request
  (
    1,
    '00000000-0000-0000-0000-000000000101',
    'I need help understanding software design patterns',
    3,
    now() - interval '3 days'
  ),
  
  -- Messages for not started request
  (
    2,
    '00000000-0000-0000-0000-000000000102',
    'Could you explain neural networks to me?',
    3,
    now() - interval '2 days'
  ),
  (
    3,
    '00000000-0000-0000-0000-000000000102',
    'I''d be happy to help with that',
    2,
    now() - interval '1 day'
  ),
  
  -- Messages for in-progress request
  (
    4,
    '00000000-0000-0000-0000-000000000103',
    'I need a guide on calculus fundamentals',
    3,
    now() - interval '5 days'
  ),
  (
    5,
    '00000000-0000-0000-0000-000000000103',
    'I can help you with that. Let''s start with the basics',
    2,
    now() - interval '4 days'
  ),
  (
    6,
    '00000000-0000-0000-0000-000000000103',
    'Here''s your first set of materials to review',
    2,
    now() - interval '3 days'
  ),
  
  -- Messages for finished request
  (
    7,
    '00000000-0000-0000-0000-000000000104',
    'I need a reference for data structures',
    3,
    now() - interval '10 days'
  ),
  (
    8,
    '00000000-0000-0000-0000-000000000104',
    'I''ll create a comprehensive reference for you',
    2,
    now() - interval '9 days'
  ),
  (
    9,
    '00000000-0000-0000-0000-000000000104',
    'Here''s your complete reference guide',
    2,
    now() - interval '1 day'
  );