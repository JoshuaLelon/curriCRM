-- Drop all existing policies
do $$ 
declare
  pol record;
begin
  for pol in 
    select policyname, tablename 
    from pg_policies 
    where schemaname = 'public'
  loop
    execute format('drop policy if exists %I on %I.%I', 
      pol.policyname, 
      'public',
      pol.tablename
    );
  end loop;
end $$;

-- Disable RLS on all tables
do $$
declare
  table_name text;
begin
  for table_name in (select tablename from pg_tables where schemaname = 'public')
  loop
    execute format('alter table public.%I disable row level security', table_name);
  end loop;
end $$;

-- Grant full access to all roles
grant usage on schema public to anon, authenticated, service_role;
grant all privileges on all tables in schema public to anon, authenticated, service_role;
grant all privileges on all sequences in schema public to anon, authenticated, service_role;
grant all privileges on all routines in schema public to anon, authenticated, service_role;

