-- Function to handle new user profiles
create or replace function public.handle_new_user()
returns trigger as $$
declare
  profile_id int8;
begin
  -- Create profile
  insert into public.profiles (id, user_id, email)
  values (
    (select coalesce(max(id), 0) + 1 from public.profiles),
    new.id,
    new.email
  )
  returning id into profile_id;

  -- Create user role based on email
  insert into public.user_roles (id, profile_id, specialty)
  values (
    (select coalesce(max(id), 0) + 1 from public.user_roles),
    profile_id,
    case 
      when new.email = 'joshua.mitchell@g.austincc.edu' then null -- admin has no specialty
      when new.email = 'joshua.mitchell@gauntletai.com' then 'software'::tag -- expert
      else null -- student has no specialty
    end
  );

  return new;
end;
$$ language plpgsql security definer; 