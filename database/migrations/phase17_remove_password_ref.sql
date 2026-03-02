-- Phase 17: Remove plaintext password storage (Security Fix)
-- ISSUE: admin_password_ref was storing passwords in plaintext, violating OWASP A02
-- FIX: Drop the column entirely - Supabase Auth manages password storage securely

ALTER TABLE public.profiles DROP COLUMN IF EXISTS admin_password_ref;
