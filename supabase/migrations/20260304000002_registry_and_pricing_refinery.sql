-- 1. Remove max_seats from plan_config (single seat model)
ALTER TABLE plan_config DROP COLUMN IF EXISTS max_seats;

-- 2. Add discount_percentage to plan_config (for annual savings display)
ALTER TABLE plan_config ADD COLUMN IF NOT EXISTS discount_percentage INTEGER DEFAULT 0;

-- 3. Ensure tool_config has all metadata fields
ALTER TABLE tool_config ADD COLUMN IF NOT EXISTS icon_name TEXT DEFAULT 'FileText';
ALTER TABLE tool_config ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'coming_soon'; -- 'live', 'coming_soon', 'maintenance'
ALTER TABLE tool_config ADD COLUMN IF NOT EXISTS tier INTEGER DEFAULT 1;

-- 4. Enable RLS and add Policies for Tool Management (Admin only)
ALTER TABLE tool_config ENABLE ROW LEVEL SECURITY;

-- Policy: Admins can do everything
DROP POLICY IF EXISTS "Admins can manage tools" ON tool_config;
CREATE POLICY "Admins can manage tools"
ON tool_config
FOR ALL
USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'))
WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- Policy: Everyone can view tools (frontend handles status filtering)
DROP POLICY IF EXISTS "Users can view tools" ON tool_config;
CREATE POLICY "Users can view tools"
ON tool_config
FOR SELECT
USING (TRUE);
