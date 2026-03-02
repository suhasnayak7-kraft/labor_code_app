-- Migration: update_plans_and_tools.sql
-- Goal: 3 plans (free, pro, max), rename tool columns, 6 core tools

-- 1. Rename columns in tool_config
ALTER TABLE public.tool_config RENAME COLUMN enabled_for_paid TO enabled_for_pro;
ALTER TABLE public.tool_config RENAME COLUMN paid_limit TO pro_limit;
ALTER TABLE public.tool_config RENAME COLUMN enabled_for_team TO enabled_for_max;
ALTER TABLE public.tool_config RENAME COLUMN team_limit TO max_limit;

-- 2. Clear existing plan_config and insert Free, Pro, Max
DELETE FROM public.plan_config;

INSERT INTO public.plan_config (id, display_name, price_monthly, price_annual, max_seats, description, features, sort_order, is_active)
VALUES 
('free', 'Free', 0, 0, 1, 'Perfect for testing and small teams', '["labour-audit", "audit-history", "basic-reports"]'::jsonb, 0, true),
('pro', 'Pro', 49900, 499000, 5, 'For growing businesses', '["up-to-5-seats", "50-audits-per-month", "all-tools-enabled", "pdf-export-branded"]'::jsonb, 1, true),
('max', 'Max', 99900, 999000, 10, 'For large organizations', '["up-to-10-seats", "100-audits-per-month", "priority-support", "pdf-export-branded"]'::jsonb, 2, true);

-- 3. Clear existing tool_config and insert exactly 6 core tools
DELETE FROM public.tool_config;

-- Labour Code Auditor, Wage Compliance Checker, Social Security & Benefits, Workplace Safety & Health, Industrial Relations, Contract & Agreement Review

INSERT INTO public.tool_config (id, name, description, icon, tier, status, free_limit, pro_limit, max_limit, enabled_for_free, enabled_for_pro, enabled_for_max, sort_order)
VALUES
('labour-audit', 'Labour Code Auditor', 'AI-scored audit of company policy vs Indian Labour Codes 2025', 'FileCheck', 1, 'live', 3, 50, 100, true, true, true, 1),
('wage-compliance', 'Wage Compliance Checker', 'Verify wage structures, deductions, and payment compliance', 'ShieldCheck', 2, 'coming_soon', 0, 50, 100, false, true, true, 2),
('social-security', 'Social Security & Benefits', 'Review employee benefits, PF, ESI, and gratuity compliance', 'Shield', 2, 'coming_soon', 0, 50, 100, false, true, true, 3),
('workplace-safety', 'Workplace Safety & Health', 'Assess occupational safety protocols and working conditions', 'AlertTriangle', 2, 'coming_soon', 0, 50, 100, false, true, true, 4),
('ir-compliance', 'Industrial Relations', 'Check dispute resolution, collective bargaining, and employee relations', 'Users', 2, 'coming_soon', 0, 50, 100, false, true, true, 5),
('contract-review', 'Contract & Agreement Review', 'Review employment contracts, service agreements, and documents', 'FolderOpen', 2, 'coming_soon', 0, 50, 100, false, true, true, 6);

-- 4. Update existing profiles that were on 'paid' or 'team' to 'pro' or 'max' or 'free'
UPDATE public.profiles SET plan = 'free' WHERE plan IS NULL OR plan = '';
UPDATE public.profiles SET plan = 'pro' WHERE plan = 'paid';
UPDATE public.profiles SET plan = 'max' WHERE plan = 'team' OR plan = 'enterprise';
