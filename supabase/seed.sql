-- Create some YouTube sources
insert into public.sources (id, title, URL, created_by)
values
  ('00000000-0000-0000-0000-000000000001'::uuid, 'Introduction to Algorithms', 'https://www.youtube.com/watch?v=example1', 2),
  ('00000000-0000-0000-0000-000000000002'::uuid, 'Data Structures Basics', 'https://www.youtube.com/watch?v=example2', 2),
  ('00000000-0000-0000-0000-000000000003'::uuid, 'Understanding Big O Notation', 'https://www.youtube.com/watch?v=example3', 2),
  ('00000000-0000-0000-0000-000000000004'::uuid, 'Machine Learning Fundamentals', 'https://www.youtube.com/watch?v=example4', 2);

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
select
  id::uuid,
  created_at,
  accepted_at,
  started_at,
  finished_at,
  source_id::uuid,
  content_type,
  tag,
  (select id from public.user_roles where profile_id = (select id from public.profiles where email = 'jlelonmitchell@gmail.com')),
  case when expert_id is not null then
    (select id from public.user_roles where profile_id = (select id from public.profiles where email = 'joshua.mitchell@gauntletai.com'))
  else null end
from (values
  -- Not accepted request
  (
    '00000000-0000-0000-0000-000000000101',
    now() - interval '3 days',
    null,
    null,
    null,
    null,
    'tutorial'::content_type,
    'software'::tag,
    null,
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
    'explanation'::content_type,
    'ai'::tag,
    null,
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
    'how_to_guide'::content_type,
    'math'::tag,
    null,
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
    'reference'::content_type,
    'software'::tag,
    null,
    2
  )
) as v(id, created_at, accepted_at, started_at, finished_at, source_id, content_type, tag, student_id, expert_id);

-- Create curriculums for in-progress and finished requests
insert into public.curriculums (id, request_id)
values
  ('00000000-0000-0000-0000-000000000201'::uuid, '00000000-0000-0000-0000-000000000103'::uuid),
  ('00000000-0000-0000-0000-000000000202'::uuid, '00000000-0000-0000-0000-000000000104'::uuid);

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

-- Create some messages for each request
insert into public.messages (id, request_id, content, sender_id, created_at)
values
  -- Messages for not accepted request
  (
    1,
    '00000000-0000-0000-0000-000000000101'::uuid,
    'I need help understanding software design patterns',
    3,
    now() - interval '3 days'
  ),
  
  -- Messages for not started request
  (
    2,
    '00000000-0000-0000-0000-000000000102'::uuid,
    'Could you explain neural networks to me?',
    3,
    now() - interval '2 days'
  ),
  (
    3,
    '00000000-0000-0000-0000-000000000102'::uuid,
    'I''d be happy to help with that',
    2,
    now() - interval '1 day'
  ),
  
  -- Messages for in-progress request
  (
    4,
    '00000000-0000-0000-0000-000000000103'::uuid,
    'I need a guide on calculus fundamentals',
    3,
    now() - interval '5 days'
  ),
  (
    5,
    '00000000-0000-0000-0000-000000000103'::uuid,
    'I can help you with that. Let''s start with the basics',
    2,
    now() - interval '4 days'
  ),
  (
    6,
    '00000000-0000-0000-0000-000000000103'::uuid,
    'Here''s your first set of materials to review',
    2,
    now() - interval '3 days'
  ),
  
  -- Messages for finished request
  (
    7,
    '00000000-0000-0000-0000-000000000104'::uuid,
    'I need a reference for data structures',
    3,
    now() - interval '10 days'
  ),
  (
    8,
    '00000000-0000-0000-0000-000000000104'::uuid,
    'I can help you with that. Here''s a comprehensive guide',
    2,
    now() - interval '9 days'
  ),
  (
    9,
    '00000000-0000-0000-0000-000000000104'::uuid,
    'Thanks! This is exactly what I needed',
    3,
    now() - interval '2 days'
  );