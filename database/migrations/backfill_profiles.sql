-- Phase 16: Legacy Profile Backfill
-- Run this if your "Approved & Live" tab shows "N/A" for older accounts.

-- Update profiles from waiting_list based on matching emails
UPDATE public.profiles p
SET 
  full_name = COALESCE(p.full_name, w.full_name),
  company_name = COALESCE(p.company_name, w.company_name),
  company_size = COALESCE(p.company_size, w.company_size),
  industry = COALESCE(p.industry, w.industry)
FROM public.waiting_list w
WHERE p.email = w.email 
  OR (p.email IS NULL AND w.email = (SELECT email FROM auth.users WHERE id = p.id));

-- Just in case, ensure all profiles have emails from the auth table
UPDATE public.profiles p
SET email = u.email
FROM auth.users u
WHERE p.id = u.id AND p.email IS NULL;
