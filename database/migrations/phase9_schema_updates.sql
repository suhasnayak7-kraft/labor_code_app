-- Phase 9: Database Updates for User Lifecycle Management

-- 1. Add is_deleted column to public.profiles for soft deletion
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT false NOT NULL;

-- 2. Ensure waiting_list status constraint (Optional but good for data integrity)
-- We already have a text default 'pending', let's just make sure we use it properly in our frontend.
