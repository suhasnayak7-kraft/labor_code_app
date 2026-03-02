-- Fix: Create waiting_list entries when users sign up
-- The current trigger only creates profiles, not waiting_list entries

-- 1. Modify the waiting_list table to allow NULL company_name
ALTER TABLE public.waiting_list
ALTER COLUMN company_name DROP NOT NULL;

-- 2. Update profiles table to capture company_size and industry from user metadata
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS company_size TEXT;

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS industry TEXT;

-- 3. Create or replace the trigger to also insert into waiting_list
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert into profiles table
  INSERT INTO public.profiles (id, full_name, company_name, company_size, industry, role)
  VALUES (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'company_name',
    new.raw_user_meta_data->>'company_size',
    new.raw_user_meta_data->>'industry',
    CASE
        WHEN (SELECT count(*) FROM public.profiles) = 0 THEN 'admin'
        ELSE 'user'
    END
  );

  -- Also insert into waiting_list table (for governance tracking)
  INSERT INTO public.waiting_list (full_name, email, company_name, company_size, industry, status)
  VALUES (
    new.raw_user_meta_data->>'full_name',
    new.email,
    new.raw_user_meta_data->>'company_name',
    new.raw_user_meta_data->>'company_size',
    new.raw_user_meta_data->>'industry',
    'pending'
  )
  ON CONFLICT (email) DO NOTHING;  -- Prevent duplicates if email already exists

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Recreate the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
