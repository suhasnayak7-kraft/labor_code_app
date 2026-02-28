-- Add admin-only password reference column to profiles
-- This stores the last password set by the admin, for reference purposes only.
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS admin_password_ref TEXT;
