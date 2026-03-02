-- Fix RLS Infinite Recursion on Profiles

-- 1. Drop the problematic recursive policies
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Allow admins to select waiting_list" ON public.waiting_list;

-- 2. Create a secure helper function that bypasses RLS
-- This prevents the infinite loop triggered by referencing profiles within its own policy
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;

-- 3. Re-create the policies using the new, safe helper function
CREATE POLICY "Admins can view all profiles" ON public.profiles 
FOR SELECT USING (public.is_admin());

CREATE POLICY "Admins can update all profiles" ON public.profiles 
FOR UPDATE USING (public.is_admin());

CREATE POLICY "Allow admins to select waiting_list" ON public.waiting_list 
FOR SELECT USING (public.is_admin());
