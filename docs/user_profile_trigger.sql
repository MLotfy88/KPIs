-- Creates a trigger that automatically creates a new user profile
-- in the public.profiles table whenever a new user signs up in auth.users.

-- 1. Create a function that inserts a new row into public.profiles
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, name, role)
  values (
    new.id,
    new.email,
    -- You can pass 'name' in metadata when creating a user,
    -- otherwise it defaults to 'New User'
    coalesce(new.raw_user_meta_data->>'name', 'New User'),
    -- You can pass 'role' in metadata,
    -- otherwise it defaults to 'supervisor'
    coalesce(new.raw_user_meta_data->>'role', 'supervisor')
  );
  return new;
end;
$$;

-- 2. Create a trigger that calls the function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
