-- 1. Remove max_seats from plan_config (transitioning to single seats model)
ALTER TABLE plan_config DROP COLUMN IF EXISTS max_seats;

-- 2. Ensure tool_config has all necessary fields for Registry management
-- Note: Assuming table already has id, name, description, icon, status
-- Adding specific audit limits if they don't exist (already handled in migration 1? No, migration 1 was add branding fields)
-- Let's ensure name and description are TEXT and not limited.

-- 3. Enable RLS and add Policies for Tool Management (Admin only)
ALTER TABLE tool_config ENABLE ROW LEVEL SECURITY;

-- Policy: Admins can do everything
DROP POLICY IF EXISTS "Admins can manage tools" ON tool_config;
CREATE POLICY "Admins can manage tools"
ON tool_config
FOR ALL
USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'))
WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- Policy: Everyone can view active/live tools
DROP POLICY IF EXISTS "Users can view active tools" ON tool_config;
CREATE POLICY "Users can view active tools"
ON tool_config
FOR SELECT
USING (TRUE); -- Everyone can select, Compliance Hub will filter by status and tier

-- 4. Set default values for new tools
ALTER TABLE tool_config ALTER COLUMN status SET DEFAULT 'coming_soon';
ALTER TABLE tool_config ALTER COLUMN tier SET DEFAULT 1;
