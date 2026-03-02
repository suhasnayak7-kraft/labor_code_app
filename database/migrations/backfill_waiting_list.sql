-- migration: backfill_waiting_list.sql
-- Goal: Insert existing users into waiting_list if they are not there.

INSERT INTO public.waiting_list (full_name, email, company_name, company_size, industry, status)
SELECT 
    COALESCE(p.full_name, 'Unknown User'),
    u.email,
    COALESCE(p.company_name, 'Unknown Co.'),
    COALESCE(p.company_size, 'UNKNOWN'),
    COALESCE(p.industry, 'UNKNOWN'),
    'pending'
FROM public.profiles p
JOIN auth.users u ON p.id = u.id
LEFT JOIN public.waiting_list w ON u.email = w.email
WHERE p.role = 'user' 
  AND (p.is_deleted IS FALSE OR p.is_deleted IS NULL)
  AND w.id IS NULL
ON CONFLICT (email) DO NOTHING;
