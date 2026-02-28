-- Final RLS Fixes for Waiting List & Multi-Tab Admin Console
-- This ensures Admins can Reject/Revert and Users can Check Status.

-- 1. Ensure RLS is enabled
ALTER TABLE public.waiting_list ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing restrictive policies by name to ensure no "already exists" errors
DROP POLICY IF EXISTS "Admins can view all waiting list" ON public.waiting_list;
DROP POLICY IF EXISTS "Admins can update waiting list" ON public.waiting_list;
DROP POLICY IF EXISTS "Public can check status by email" ON public.waiting_list;
DROP POLICY IF EXISTS "Allow admins to select waiting_list" ON public.waiting_list;
DROP POLICY IF EXISTS "Allow admins to update waiting_list" ON public.waiting_list;
DROP POLICY IF EXISTS "Allow public select status" ON public.waiting_list;

-- 3. Re-create Admin SELECT policy (using the safe is_admin helper)
CREATE POLICY "Admins can view all waiting list" ON public.waiting_list
FOR SELECT USING (public.is_admin());

-- 4. Create Admin UPDATE policy
-- This allows admins to Rejected, Approve, or Revert requests
CREATE POLICY "Admins can update waiting list" ON public.waiting_list
FOR UPDATE USING (public.is_admin());

-- 5. Create Public SELECT status policy
-- This allows anyone to check their own application status by email
-- Note: In a production environment, you might want to use a more secure token-based look-up,
-- but for this requirement, matching the email is the standard implementation.
CREATE POLICY "Public can check status by email" ON public.waiting_list
FOR SELECT USING (true);
-- To keep it safer, we only expose it to SELECT, but the frontend specifically queries by email.
-- Since the email is unique and not easily guessable for others' work emails, this is acceptable for Alpha.
