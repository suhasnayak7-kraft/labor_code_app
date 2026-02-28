-- DATA CLEANUP SCRIPT
-- This script removes all entries except for the main Administrator.

-- 1. Identify your Admin User ID (The first one created is usually admin)
-- Replace the ID below if your admin ID is different, or use the role check.

-- Delete all profiles except admins
DELETE FROM public.profiles WHERE role != 'admin';

-- Optional: Delete all waiting list entries that are not pending
-- DELETE FROM public.waiting_list WHERE status != 'pending';

-- If you want to delete EVERYONE from the waiting list to start fresh:
-- DELETE FROM public.waiting_list;

-- Note: To delete the underlying Auth accounts, you would normally use 
-- the Supabase Dashboard, as deleting from the public.profiles table 
-- does not automatically remove the user from auth.users (unless ON DELETE CASCADE is set on the Auth side).
