-- Alpha 0.2: Admin Governance & Invite-Only Auth Schema

-- 1. Create the waiting_list table
CREATE TABLE IF NOT EXISTS public.waiting_list (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    company_name TEXT NOT NULL,
    company_size TEXT,
    industry TEXT,
    status TEXT DEFAULT 'pending' -- 'pending', 'approved', 'rejected'
);

-- 2. Create the profiles table linked to auth.users
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    full_name TEXT,
    company_name TEXT,
    company_size TEXT,
    industry TEXT,
    is_locked BOOLEAN DEFAULT false NOT NULL,
    daily_audit_limit INTEGER DEFAULT 3 NOT NULL,
    role TEXT DEFAULT 'user' NOT NULL, -- 'user' or 'admin'
    
    -- Constraint to ensure role is valid
    CONSTRAINT valid_role CHECK (role IN ('user', 'admin'))
);

-- Enable RLS on the new tables
ALTER TABLE public.waiting_list ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Waiting List Policies
-- Allow anyone to insert into the waiting list (e.g. from the landing page)
CREATE POLICY "Allow public insert to waiting_list" ON public.waiting_list FOR INSERT WITH CHECK (true);

-- Allow admins to view the waiting list
CREATE POLICY "Allow admins to select waiting_list" ON public.waiting_list FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
);

-- Profiles Policies
-- Users can view their own profile
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);

-- Admins can view all profiles
CREATE POLICY "Admins can view all profiles" ON public.profiles FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.profiles AS p
        WHERE p.id = auth.uid() AND p.role = 'admin'
    )
);

-- Admins can update all profiles
CREATE POLICY "Admins can update all profiles" ON public.profiles FOR UPDATE USING (
    EXISTS (
        SELECT 1 FROM public.profiles AS p
        WHERE p.id = auth.uid() AND p.role = 'admin'
    )
);

-- 3. Automatic Profile Creation Trigger
-- Automatically create a profile when a new user signs up in Supabase Auth
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (
    new.id, 
    new.raw_user_meta_data->>'full_name',
    -- Make the first user an admin, others regular users (Optional, but useful for testing)
    CASE 
        WHEN (SELECT count(*) FROM public.profiles) = 0 THEN 'admin'
        ELSE 'user'
    END
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger the function every time a user is created
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 4. Update api_logs table to track the user who performed the audit
ALTER TABLE public.api_logs ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
