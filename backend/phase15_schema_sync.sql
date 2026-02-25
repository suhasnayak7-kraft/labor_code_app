-- Phase 15: Schema Sync for Admin Console Visibility

-- 1. Add email column to profiles for easier administration
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email TEXT;

-- 2. Populate existing emails from auth.users
UPDATE public.profiles p 
SET email = u.email 
FROM auth.users u 
WHERE p.id = u.id;

-- 3. Update the handle_new_user trigger function to include email
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, role)
  VALUES (
    new.id, 
    new.raw_user_meta_data->>'full_name',
    new.email,
    -- Make the first user an admin, others regular users
    CASE 
        WHEN (SELECT count(*) FROM public.profiles) = 0 THEN 'admin'
        ELSE 'user'
    END
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Re-enable the trigger (it might have been dropped or modified)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
