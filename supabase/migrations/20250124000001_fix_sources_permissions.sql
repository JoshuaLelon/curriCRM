 -- Drop existing sources policies
drop policy if exists "Authenticated users can view sources" on public.sources;
drop policy if exists "Authenticated users can insert sources" on public.sources;

-- Create new policies for sources
create policy "Authenticated users can view sources"
  on public.sources for select
  using (auth.role() = 'authenticated');

create policy "Authenticated users can insert sources"
  on public.sources for insert
  with check (auth.role() = 'authenticated');

-- Grant necessary permissions
grant usage on schema public to authenticated;
grant all privileges on public.sources to authenticated;