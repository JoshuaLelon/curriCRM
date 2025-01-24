-- Function to handle new user profiles
create or replace function public.handle_new_user()
returns trigger
security definer
set search_path = public, auth
language plpgsql
as $$
declare
  profile_id int8;
  user_specialty text;
begin
  -- Add delay to ensure user is fully created
  perform pg_sleep(0.1);
  
  -- Enhanced logging with NOTICE level
  raise notice E'\n=== New User Trigger ===\nUser: % (ID: %)\nMetadata: %\nApp Metadata: %', 
    new.email, new.id, new.raw_user_meta_data, new.raw_app_meta_data;
  
  -- Determine specialty without using enum directly
  user_specialty := case
    when new.email = 'joshua.mitchell@gauntletai.com' then 'software'
    else null
  end;

  -- Check if profile already exists with enhanced logging
  if exists (select 1 from public.profiles where user_id = new.id) then
    raise notice E'\n=== Profile Exists ===\nUser: % (ID: %)', new.email, new.id;
    select id into profile_id from public.profiles where user_id = new.id;
    raise notice 'Existing profile ID: %', profile_id;
    return new;
  end if;

  -- Create profile with appropriate role
  begin
    insert into public.profiles (
      user_id,
      email,
      specialty,
      is_admin
    )
    values (
      new.id,
      new.email,
      user_specialty::public.tag,
      new.email = 'joshua.mitchell@g.austincc.edu'
    )
    returning id into profile_id;

    raise notice E'\n=== Profile Created ===\nID: %\nUser: % (ID: %)', profile_id, new.email, new.id;
  exception when others then
    raise warning E'\n=== Profile Creation Error ===\nUser: % (ID: %)\nError: % (%)', 
      new.email, new.id, SQLERRM, SQLSTATE;
    return new;
  end;

  return new;
exception
  when others then
    raise warning E'\n=== Unexpected Error ===\nUser: % (ID: %)\nError: % (%)', 
      new.email, new.id, SQLERRM, SQLSTATE;
    return new;
end;
$$;

-- Create function to create auth user with proper error handling
create or replace function public.create_seed_auth_user(
  user_email text,
  is_admin boolean default false,
  user_specialty public.tag default null
)
returns uuid
language plpgsql
security definer
set search_path = auth, public
as $$
declare
  new_user_id uuid;
begin
  -- Insert into auth.users with minimal required fields for magic link auth
  insert into auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    email_confirmed_at,
    created_at,
    updated_at,
    raw_app_meta_data,
    raw_user_meta_data,
    is_sso_user,
    encrypted_password
  ) values (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    user_email,
    now(), -- Pre-confirm email for magic link
    now(),
    now(),
    '{"provider":"email","providers":["email"]}',
    jsonb_build_object(
      'is_admin', is_admin,
      'specialty', user_specialty
    ),
    false,
    '' -- No password needed for magic link
  ) returning id into new_user_id;

  return new_user_id;
exception
  when unique_violation then
    -- If user already exists, get their ID
    select id into new_user_id from auth.users where email = user_email;
    return new_user_id;
  when others then
    raise exception 'Failed to create auth user: %', sqlerrm;
end;
$$;

-- Create trigger for handle_new_user
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user(); 