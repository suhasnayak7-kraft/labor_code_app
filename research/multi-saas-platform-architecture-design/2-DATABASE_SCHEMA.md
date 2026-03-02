# 2. Database Schema: Multi-Tool Design

Complete PostgreSQL schema for multi-tool SaaS platform. Single Supabase project, organized by concern.

---

## Schema Overview

```
Shared Infrastructure:
├── auth.users (Supabase Auth - built-in)
├── profiles (user accounts, plans)
├── subscription_tiers (pricing, features)
├── api_logs (shared audit log)
└── embeddings (shared vector DB with tool scoping)

Tool Management:
├── tools (tool registry, enable/disable)
└── tool_configs (tool-specific settings)

Tool-Specific Tables:
├── labour_audit_logs
├── gst_audit_logs
├── [other tools]_audit_logs
└── [other tools]_configs
```

---

## 1. Shared Infrastructure Tables

### **profiles** (User accounts)

```sql
CREATE TABLE profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  full_name text,
  company_name text,
  company_size text,
  industry text,

  -- Plan & billing
  subscription_tier_id text REFERENCES subscription_tiers(id),
  subscription_started_at timestamptz,
  subscription_renews_at timestamptz,
  billing_email text,

  -- Admin & access control
  role text DEFAULT 'user',  -- 'user', 'admin', 'tool_owner'
  is_locked boolean DEFAULT false,
  is_deleted boolean DEFAULT false,
  locked_reason text,

  -- Usage tracking
  daily_audit_limit int DEFAULT 3,
  audits_run_today int DEFAULT 0,
  audits_run_this_month int DEFAULT 0,

  -- Timestamps
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  last_login_at timestamptz,

  -- Metadata
  timezone text DEFAULT 'UTC',
  preferred_language text DEFAULT 'en'
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Policy: Users see own profile
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

-- Policy: Admins see all profiles
CREATE POLICY "Admins see all profiles" ON profiles
  FOR SELECT USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
  );

-- Policy: Users can update own profile (except role, tier)
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id
    AND role = (SELECT role FROM profiles WHERE id = auth.uid())
    AND subscription_tier_id = (SELECT subscription_tier_id FROM profiles WHERE id = auth.uid())
  );

-- Trigger: Update updated_at
CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON profiles
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Index for performance
CREATE INDEX idx_profiles_email ON profiles(email);
CREATE INDEX idx_profiles_role ON profiles(role);
CREATE INDEX idx_profiles_subscription_tier_id ON profiles(subscription_tier_id);
```

### **subscription_tiers** (Pricing & features)

```sql
CREATE TABLE subscription_tiers (
  id text PRIMARY KEY,  -- 'free', 'pro', 'business', 'enterprise'
  name text NOT NULL,
  description text,
  price_inr int,  -- Monthly price in INR
  price_currency text DEFAULT 'INR',

  -- Feature limits
  daily_audit_limit int,
  monthly_request_limit int,
  max_file_size_mb int,
  api_requests_per_minute int,

  -- Tools included
  tools_included text[],  -- Array: ['labour-auditor', 'gst-checker', ...]

  -- Support level
  support_tier text,  -- 'email', 'priority', 'dedicated'
  support_email text,

  -- Billing
  billing_cycle text DEFAULT 'monthly',  -- 'monthly', 'yearly'
  is_active boolean DEFAULT true,

  -- Timestamps
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Sample data
INSERT INTO subscription_tiers VALUES
('free', 'Free', 'Basic tool access', 0, 'INR', 3, 90, 10, 10,
 ARRAY['labour-auditor'], 'email', NULL, 'monthly', true, now(), now()),
('pro', 'Professional', '₹499/month', 499, 'INR', 30, 1000, 50, 60,
 ARRAY['labour-auditor', 'gst-checker', 'income-tax'], 'priority', 'support@example.com', 'monthly', true, now(), now()),
('business', 'Business', '₹1499/month', 1499, 'INR', 100, 10000, 500, 300,
 ARRAY['labour-auditor', 'gst-checker', 'income-tax', 'dpdp-compliance'], 'dedicated', 'support@example.com', 'monthly', true, now(), now());
```

### **tools** (Tool registry)

```sql
CREATE TABLE tools (
  id bigserial PRIMARY KEY,
  slug text UNIQUE NOT NULL,  -- 'labour-auditor', 'gst-checker'
  name text NOT NULL,
  description text,
  icon text,  -- URL or SVG
  category text,  -- 'compliance', 'tax', 'payroll'

  -- Access control
  enabled boolean DEFAULT true,  -- Admin can disable without code changes
  min_plan_tier text REFERENCES subscription_tiers(id),

  -- Tool configuration
  max_file_size_mb int DEFAULT 50,
  api_timeout_seconds int DEFAULT 30,
  rate_limit_per_minute int DEFAULT 60,

  -- Status
  status text DEFAULT 'active',  -- 'active', 'beta', 'deprecated'

  -- Metadata
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  last_checked_at timestamptz,
  health_status text DEFAULT 'healthy'  -- 'healthy', 'degraded', 'down'
);

-- Sample data
INSERT INTO tools VALUES
(1, 'labour-auditor', 'Labour Code Auditor', 'Verify employee policies...', NULL, 'compliance',
 true, 'free', 50, 30, 60, 'active', now(), now(), now(), 'healthy'),
(2, 'gst-checker', 'GST Compliance Checker', 'Verify GST filings...', NULL, 'tax',
 true, 'pro', 50, 30, 60, 'beta', now(), now(), now(), 'healthy');

-- No RLS needed for tools (public metadata)
```

### **api_logs** (Shared audit log for all tools)

```sql
CREATE TABLE api_logs (
  id bigserial PRIMARY KEY,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,

  -- Tool & endpoint
  tool_id text REFERENCES tools(slug),
  endpoint text,  -- '/tools/labour-auditor/audit'
  method text,  -- 'POST', 'GET'

  -- File & request
  filename text,
  file_size_bytes int,

  -- Tokens & cost
  prompt_tokens int,
  completion_tokens int,
  total_tokens int,
  estimated_cost_inr float,

  -- Response
  status_code int,  -- 200, 400, 429, 500
  response_time_ms int,
  error_message text,

  -- AI model used
  model_id text,  -- 'gemini-2.5-flash', 'gemini-1.5-flash'
  provider text,  -- 'google', 'anthropic'

  -- Results (tool-specific)
  results jsonb,  -- {compliance_score: 85, findings: [...]}

  -- Metadata
  ip_address inet,
  user_agent text,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE api_logs ENABLE ROW LEVEL SECURITY;

-- Policy: Users see own logs
CREATE POLICY "Users see own logs" ON api_logs
  FOR SELECT USING (auth.uid() = user_id);

-- Policy: Admins see all logs (no PII in logs)
CREATE POLICY "Admins see all logs" ON api_logs
  FOR SELECT USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
  );

-- Indexes for performance
CREATE INDEX idx_api_logs_user_id ON api_logs(user_id);
CREATE INDEX idx_api_logs_tool_id ON api_logs(tool_id);
CREATE INDEX idx_api_logs_created_at ON api_logs(created_at DESC);
CREATE INDEX idx_api_logs_user_tool ON api_logs(user_id, tool_id);
```

### **embeddings** (Shared vector DB for all tools)

```sql
CREATE TABLE embeddings (
  id bigserial PRIMARY KEY,
  tool_id text REFERENCES tools(slug),  -- Scope to specific tool

  -- Content
  content text NOT NULL,  -- ~3000 char chunks
  source_document text,  -- Filename or section name
  content_hash text UNIQUE,  -- Prevent duplicates

  -- Vector
  embedding vector(768),  -- Gemini embeddings

  -- Metadata
  chunk_index int,  -- Order within document
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- No RLS (public knowledge base)
-- Index for vector search
CREATE INDEX idx_embeddings_tool_id ON embeddings(tool_id);

-- Vector search function
CREATE OR REPLACE FUNCTION match_embeddings_for_tool(
  query_embedding vector(768),
  tool_id_filter text,
  match_threshold float DEFAULT 0.7,
  match_count int DEFAULT 5
)
RETURNS TABLE (
  id bigint,
  tool_id text,
  content text,
  source_document text,
  similarity float
) LANGUAGE SQL
AS $$
  SELECT
    id,
    tool_id,
    content,
    source_document,
    (1 - (embedding <=> query_embedding)) AS similarity
  FROM embeddings
  WHERE tool_id = tool_id_filter
    AND (1 - (embedding <=> query_embedding)) > match_threshold
  ORDER BY embedding <=> query_embedding
  LIMIT match_count;
$$;
```

---

## 2. Tool-Specific Tables

### **labour_audit_logs** (Tool-specific results)

```sql
CREATE TABLE labour_audit_logs (
  id bigserial PRIMARY KEY,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  api_log_id bigint REFERENCES api_logs(id),

  -- Document
  filename text,
  file_type text,  -- 'pdf', 'docx'

  -- Analysis results
  compliance_score int,  -- 0-100
  risk_level text,  -- 'low', 'medium', 'high'

  -- Findings
  findings jsonb,  -- [{severity: 'high', issue: '...', recommendation: '...'}]

  -- Metadata
  model_used text,
  analysis_time_ms int,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE labour_audit_logs ENABLE ROW LEVEL SECURITY;

-- Policy: Users see own audits
CREATE POLICY "Users see own labour audits" ON labour_audit_logs
  FOR SELECT USING (auth.uid() = user_id);

-- Policy: Admins see aggregated data only
-- (Separate admin view that doesn't expose PII)

-- Index
CREATE INDEX idx_labour_audit_logs_user_id ON labour_audit_logs(user_id);
CREATE INDEX idx_labour_audit_logs_created_at ON labour_audit_logs(created_at DESC);
```

### **gst_audit_logs** (Another tool - same pattern)

```sql
CREATE TABLE gst_audit_logs (
  id bigserial PRIMARY KEY,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  api_log_id bigint REFERENCES api_logs(id),

  -- GST-specific fields
  gst_number text,
  filing_period text,  -- 'Q1-2024', 'FY-2023-24'

  -- Results
  compliance_score int,
  status text,  -- 'compliant', 'has_errors', 'needs_amendment'

  issues jsonb,
  recommendations jsonb,

  created_at timestamptz DEFAULT now()
);

-- Same RLS pattern as labour_audit_logs
ALTER TABLE gst_audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see own gst audits" ON gst_audit_logs
  FOR SELECT USING (auth.uid() = user_id);

CREATE INDEX idx_gst_audit_logs_user_id ON gst_audit_logs(user_id);
```

---

## 3. Admin-Specific Views

### **admin_dashboard_metrics** (View for admin dashboard)

```sql
CREATE VIEW admin_dashboard_metrics AS
SELECT
  (SELECT COUNT(*) FROM profiles WHERE role = 'user') as total_users,
  (SELECT COUNT(*) FROM profiles WHERE subscription_tier_id = 'pro') as pro_users,
  (SELECT COUNT(*) FROM profiles WHERE subscription_tier_id = 'business') as business_users,
  (SELECT COUNT(*) FROM api_logs WHERE DATE(created_at) = CURRENT_DATE) as audits_today,
  (SELECT SUM(total_tokens) FROM api_logs WHERE DATE(created_at) = CURRENT_DATE) as tokens_used_today,
  (SELECT COUNT(DISTINCT DATE(created_at)) FROM api_logs WHERE tool_id = 'labour-auditor') as labour_auditor_days_active,
  (SELECT COUNT(DISTINCT DATE(created_at)) FROM api_logs WHERE tool_id = 'gst-checker') as gst_checker_days_active,
  (SELECT AVG(response_time_ms) FROM api_logs WHERE DATE(created_at) = CURRENT_DATE) as avg_response_time_ms,
  (SELECT COUNT(*) FROM api_logs WHERE status_code >= 400 AND DATE(created_at) = CURRENT_DATE) as errors_today;
```

### **admin_audit_logs** (View: aggregated, no PII)

```sql
CREATE VIEW admin_audit_logs AS
SELECT
  id,
  DATE(created_at) as audit_date,
  tool_id,
  COUNT(*) as audit_count,
  AVG(response_time_ms) as avg_response_time_ms,
  SUM(total_tokens) as total_tokens_used,
  SUM(estimated_cost_inr) as total_cost_inr,
  COUNT(CASE WHEN status_code >= 400 THEN 1 END) as error_count
FROM api_logs
GROUP BY DATE(created_at), tool_id
ORDER BY audit_date DESC;
```

---

## 4. Migrations: From Single Tool to Multi-Tool

If migrating from existing Labour Code App schema:

```sql
-- Step 1: Create tools table
CREATE TABLE tools (...);  -- As above

-- Step 2: Rename labour_audit_logs to include tool reference
ALTER TABLE api_logs ADD COLUMN tool_id text REFERENCES tools(slug);
UPDATE api_logs SET tool_id = 'labour-auditor';
ALTER TABLE api_logs ALTER COLUMN tool_id SET NOT NULL;

-- Step 3: Create subscription_tiers (if not exists)
CREATE TABLE subscription_tiers (...);  -- As above

-- Step 4: Add subscription_tier_id to profiles
ALTER TABLE profiles ADD COLUMN subscription_tier_id text REFERENCES subscription_tiers(id);
UPDATE profiles SET subscription_tier_id = 'free';
ALTER TABLE profiles ALTER COLUMN subscription_tier_id SET NOT NULL;

-- Step 5: Rename risk_score to compliance_score (if needed)
ALTER TABLE labour_audit_logs RENAME COLUMN risk_score TO compliance_score;

-- Step 6: Create embeddings table with tool_id
CREATE TABLE embeddings (...);  -- As above

-- Step 7: Enable RLS on all user-facing tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_logs ENABLE ROW LEVEL SECURITY;
-- ... (as shown above)
```

---

## 5. Performance Tuning

### **Indexes for Common Queries**

```sql
-- User dashboard: "Show my audits"
CREATE INDEX idx_api_logs_user_created ON api_logs(user_id, created_at DESC);

-- Admin dashboard: "Show audits for tool X today"
CREATE INDEX idx_api_logs_tool_date ON api_logs(tool_id, DATE(created_at));

-- Analytics: "Total tokens this month"
CREATE INDEX idx_api_logs_created_month ON api_logs(DATE_TRUNC('month', created_at));

-- Vector search: "Find similar policies for labour auditor"
-- Requires pgvector index (automatic)
```

### **Archival Strategy**

Once api_logs table exceeds 1M rows:
```sql
-- Archive old logs to separate table
CREATE TABLE api_logs_archive AS
  SELECT * FROM api_logs
  WHERE created_at < CURRENT_DATE - INTERVAL '90 days';

DELETE FROM api_logs
  WHERE created_at < CURRENT_DATE - INTERVAL '90 days';
```

---

## Summary

This schema supports:
- ✅ Multiple tools in single database
- ✅ User data isolation via RLS
- ✅ Pricing tier-based feature gating
- ✅ Admin controls (enable/disable tools, view metrics)
- ✅ Per-tool analytics
- ✅ Shared infrastructure (auth, embeddings, logging)

**Next:** Read DESIGN_SYSTEM.md to define visual consistency across tools.
