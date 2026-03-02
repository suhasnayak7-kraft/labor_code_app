-- Fix missing profiles for existing auth users
-- This creates profiles for any auth.users that don't have a corresponding profile record

INSERT INTO public.profiles (id, full_name, email, role, is_approved)
SELECT
    u.id,
    u.raw_user_meta_data->>'full_name' as full_name,
    u.email,
    CASE
        WHEN (SELECT count(*) FROM public.profiles) = 0 THEN 'admin'
        ELSE 'user'
    END as role,
    CASE
        WHEN (SELECT count(*) FROM public.profiles) = 0 THEN true
        ELSE false
    END as is_approved
FROM auth.users u
WHERE u.id NOT IN (SELECT id FROM public.profiles)
ON CONFLICT (id) DO NOTHING;
