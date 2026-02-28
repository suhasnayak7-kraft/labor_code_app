# 11. Migration Strategy: Single-Tool → Multi-Tool Platform

How to convert the existing Labour Code Auditor app into a multi-tool SaaS platform.

---

## Current State (Labour Code Auditor)

```
Frontend: React + Vite
Backend: FastAPI
Database: Supabase PostgreSQL + pgvector
Auth: Supabase Auth
```

## Migration Phases

### **Phase 1: Database Schema Upgrade** (2-3 hours)

**Goal:** Add infrastructure for multiple tools without breaking existing app.

```sql
-- Step 1: Create tools registry table
CREATE TABLE tools (
  id bigserial PRIMARY KEY,
  slug text UNIQUE NOT NULL,
  name text NOT NULL,
  description text,
  icon text,
  category text,
  enabled boolean DEFAULT true,
  min_plan_tier text DEFAULT 'free',
  max_file_size_mb int DEFAULT 50,
  api_timeout_seconds int DEFAULT 30,
  rate_limit_per_minute int DEFAULT 60,
  status text DEFAULT 'active',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Step 2: Register existing Labour Code Auditor tool
INSERT INTO tools (slug, name, description, category, min_plan_tier, enabled)
VALUES (
  'labour-auditor',
  'Labour Code Auditor',
  'Verify employee policies for compliance',
  'Compliance',
  'free',
  true
);

-- Step 3: Create subscription_tiers table
CREATE TABLE subscription_tiers (
  id text PRIMARY KEY,
  name text NOT NULL,
  description text,
  price_inr int,
  daily_audit_limit int,
  monthly_request_limit int,
  tools_included text[],
  support_tier text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Step 4: Add tier data
INSERT INTO subscription_tiers VALUES
('free', 'Free', 'Basic access', 0, 3, 90, ARRAY['labour-auditor'], 'email', true, now(), now()),
('pro', 'Professional', '₹499/month', 499, 30, 1000, ARRAY['labour-auditor'], 'priority', true, now(), now()),
('business', 'Business', '₹1499/month', 1499, 100, 10000, ARRAY['labour-auditor'], 'dedicated', true, now(), now());

-- Step 5: Update existing profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS subscription_tier_id text REFERENCES subscription_tiers(id);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS subscription_started_at timestamptz;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS subscription_renews_at timestamptz;

-- Step 6: Migrate existing users to 'free' tier
UPDATE profiles SET subscription_tier_id = 'free' WHERE subscription_tier_id IS NULL;

-- Step 7: Update api_logs table
ALTER TABLE api_logs ADD COLUMN IF NOT EXISTS tool_id text REFERENCES tools(slug);

-- Step 8: Migrate existing logs to labour-auditor
UPDATE api_logs SET tool_id = 'labour-auditor' WHERE tool_id IS NULL;
ALTER TABLE api_logs ALTER COLUMN tool_id SET NOT NULL;

-- Step 9: Update embeddings table
ALTER TABLE embeddings ADD COLUMN IF NOT EXISTS tool_id text REFERENCES tools(slug);

-- Step 10: Migrate existing embeddings
UPDATE embeddings SET tool_id = 'labour-auditor' WHERE tool_id IS NULL;
ALTER TABLE embeddings ALTER COLUMN tool_id SET NOT NULL;

-- Step 11: Create index for performance
CREATE INDEX idx_api_logs_tool_created ON api_logs(tool_id, created_at DESC);
CREATE INDEX idx_embeddings_tool ON embeddings(tool_id);

-- Verification
SELECT COUNT(*) as users, COUNT(DISTINCT id) as distinct_users FROM profiles;
SELECT COUNT(*) as logs_with_tool FROM api_logs WHERE tool_id IS NOT NULL;
SELECT COUNT(*) as embeddings_with_tool FROM embeddings WHERE tool_id IS NOT NULL;
```

**Rollback plan:** If anything fails, all new columns have `NOT NULL` set after migration, so can be removed:
```sql
ALTER TABLE profiles DROP COLUMN subscription_tier_id;
ALTER TABLE api_logs DROP COLUMN tool_id;
-- etc.
```

---

### **Phase 2: Frontend Refactoring** (1-2 days)

**Goal:** Separate tool logic from shared infrastructure.

#### **Step 1: Reorganize folder structure**

```bash
# Before
frontend/src/
├── App.tsx
├── Login.tsx
├── AdminDashboard.tsx
├── Usage.tsx
└── components/

# After
frontend/src/
├── App.tsx                    # Root - tool hub
├── Login.tsx
├── components/
│   ├── ui/                   # Shared UI components (unchanged)
│   ├── layouts/
│   │   ├── PageLayout.tsx
│   │   └── ToolLayout.tsx
│   └── common/
│       ├── Header.tsx         # Shared (refactored)
│       ├── ToolHub.tsx        # NEW: Tool selection
│       └── AdminDashboard.tsx # Enhanced for multi-tool
├── tools/
│   └── labour-auditor/        # Extracted into module
│       ├── LabourAuditor.tsx
│       ├── components/
│       │   ├── UploadForm.tsx
│       │   ├── ResultsDisplay.tsx
│       │   └── AuditHistory.tsx
│       ├── hooks/
│       │   ├── useAudit.ts
│       │   └── useAuditStatus.ts
│       ├── services/
│       │   └── api.ts
│       ├── types/
│       │   └── index.ts
│       └── index.ts
├── config/
│   └── tools.ts               # NEW: Tool registry
└── ...
```

#### **Step 2: Extract tool-specific code**

```typescript
// Extract from current App.tsx
// Create: frontend/src/tools/labour-auditor/LabourAuditor.tsx

import { useState } from 'react';
import { Card, Tabs, Button } from '@/components';
import { useAudit } from './hooks/useAudit';
import { UploadForm } from './components/UploadForm';
import { ResultsDisplay } from './components/ResultsDisplay';
import { AuditHistory } from './components/AuditHistory';

export function LabourAuditor() {
  const [activeTab, setActiveTab] = useState<'audit' | 'history'>('audit');
  const { audit, isLoading, error, results } = useAudit();

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold">Labour Code Auditor</h1>
        <p className="text-gray-600">Verify employee policies for compliance</p>
      </div>

      <Tabs
        items={[
          {
            id: 'audit',
            label: 'New Audit',
            content: <UploadForm onSubmit={audit} loading={isLoading} />,
          },
          {
            id: 'history',
            label: 'History',
            content: <AuditHistory />,
          },
        ]}
        defaultTab={activeTab}
      />
    </div>
  );
}
```

#### **Step 3: Create tool hub**

```typescript
// frontend/src/components/common/ToolHub.tsx (NEW)

import { useState } from 'react';
import { Card, Button, Grid } from '@/components';
import { getAllTools, getToolsByPlan } from '@/config/tools';

interface ToolHubProps {
  userPlan: string;
  onSelectTool: (slug: string) => void;
}

export function ToolHub({ userPlan, onSelectTool }: ToolHubProps) {
  const availableTools = getToolsByPlan(userPlan);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-2">Compliance Tools</h1>
      <p className="text-gray-600 mb-6">Select a tool to get started</p>

      <Grid columns={{ mobile: 1, tablet: 2, desktop: 3 }} gap="md">
        {availableTools.map((tool) => (
          <Card
            key={tool.slug}
            onClick={() => onSelectTool(tool.slug)}
            hover
          >
            <div className="text-3xl mb-2">{tool.icon}</div>
            <h3 className="font-semibold">{tool.name}</h3>
            <p className="text-sm text-gray-600">{tool.description}</p>
            <Button className="mt-4" variant="primary">
              Open
            </Button>
          </Card>
        ))}
      </Grid>
    </div>
  );
}
```

#### **Step 4: Update App.tsx root component**

```typescript
// frontend/src/App.tsx (REFACTORED)

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Header } from '@/components/common/Header';
import { ToolHub } from '@/components/common/ToolHub';
import { AdminDashboard } from '@/components/common/AdminDashboard';
import { LabourAuditor } from '@/tools/labour-auditor';
import { tools } from '@/config/tools';

export function App() {
  const { user, isLoading } = useAuth();
  const [activeTool, setActiveTool] = useState<string | null>(null);

  if (isLoading) return <LoadingScreen />;
  if (!user) return <LoginPage />;

  // Admin view
  if (user.role === 'admin') {
    return (
      <div className="min-h-screen bg-background">
        <Header user={user} />
        <AdminDashboard
          selectedTool={activeTool}
          onSelectTool={setActiveTool}
        />
      </div>
    );
  }

  // Tool hub (show if no tool selected)
  if (!activeTool) {
    return (
      <div className="min-h-screen bg-background">
        <Header user={user} />
        <ToolHub
          userPlan={user.subscription_tier_id}
          onSelectTool={setActiveTool}
        />
      </div>
    );
  }

  // Tool view
  return (
    <div className="min-h-screen bg-background">
      <Header user={user} onLogoClick={() => setActiveTool(null)} />
      <div className="p-6">
        <button
          onClick={() => setActiveTool(null)}
          className="mb-4 text-primary hover:underline"
        >
          ← Back to Tools
        </button>

        {activeTool === 'labour-auditor' && <LabourAuditor />}
        {/* Add more tools here */}
      </div>
    </div>
  );
}
```

---

### **Phase 3: Backend Refactoring** (1-2 days)

**Goal:** Reorganize FastAPI code to support multiple tool endpoints.

#### **Step 1: Extract tool routes**

```python
# Before: backend/main.py (579 lines, all mixed)
# After: backend/tools/labour_auditor.py (extracted)

# backend/tools/labour_auditor.py (NEW)

from fastapi import APIRouter, UploadFile, File, Depends
from shared.auth import get_current_user
from shared.db import supabase
from shared.embeddings import generate_embedding, search_embeddings, call_gemini
from models.labour_auditor import AuditResponse
import logging

router = APIRouter(tags=["labour-auditor"])
logger = logging.getLogger(__name__)

TOOL_ID = "labour-auditor"
SYSTEM_PROMPT = """You are a Labour Code compliance expert..."""

@router.post("/labour-auditor/audit")
async def audit_policy(
    file: UploadFile = File(...),
    current_user = Depends(get_current_user),
):
    """Audit policy document"""
    # ... (move audit logic here from main.py)

@router.get("/labour-auditor/status")
async def check_status(current_user = Depends(get_current_user)):
    """Check daily limit"""
    # ... (move status logic here)

@router.get("/labour-auditor/logs")
async def get_logs(current_user = Depends(get_current_user)):
    """Get audit history"""
    # ... (move logs logic here)
```

#### **Step 2: Update main.py to import tool routers**

```python
# backend/main.py (SIMPLIFIED after extraction)

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from tools import labour_auditor  # Import tool module
from shared.middleware import error_handler, rate_limit

app = FastAPI(title="Multi-Tool SaaS API")

# Middleware
app.add_middleware(CORSMiddleware, ...)
app.add_middleware(rate_limit)
app.add_exception_handler(Exception, error_handler)

# Include tool routers
app.include_router(labour_auditor.router, prefix="/api/tools")

# Shared endpoints
@app.get("/api/health")
async def health():
    return {"status": "healthy"}

@app.get("/api/my-tools")
async def get_my_tools(current_user = Depends(get_current_user)):
    """Return tools for user's plan"""
    # ... (get from DB)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
```

#### **Step 3: Create shared utilities folder**

Move common functions to `backend/shared/`:
- `auth.py` - Authentication
- `db.py` - Database operations
- `embeddings.py` - Vector search
- `storage.py` - File upload/extraction
- `utils.py` - Helpers

---

### **Phase 4: Admin Dashboard Enhancement** (1-2 days)

**Goal:** Add multi-tool support to admin dashboard.

```typescript
// Enhance existing AdminDashboard.tsx to show:
// 1. Global metrics (all tools)
// 2. Per-tool dashboard selection
// 3. Tool enable/disable toggle
// 4. Knowledge base ingestion per tool
// 5. Pricing tier management

// See 7-ADMIN_DASHBOARD_DESIGN.md for full UI specs
```

---

### **Phase 5: Testing & Validation** (1-2 days)

#### **Step 1: Database integrity checks**

```sql
-- Verify migration completeness
SELECT COUNT(*) FROM api_logs WHERE tool_id IS NULL;  -- Should be 0
SELECT COUNT(*) FROM embeddings WHERE tool_id IS NULL;  -- Should be 0
SELECT COUNT(*) FROM profiles WHERE subscription_tier_id IS NULL;  -- Should be 0

-- Verify RLS policies
-- (Run as non-admin user)
SELECT COUNT(*) FROM api_logs;  -- Should only see own logs
```

#### **Step 2: Frontend testing**

```bash
# Test tool hub
npm run dev
# Login as user
# Should see ToolHub with Labour Auditor card
# Click card → should open LabourAuditor component

# Test admin dashboard
# Login as admin
# Should see AdminDashboard with multi-tool support
```

#### **Step 3: Backend testing**

```bash
# Test endpoints
curl -X POST http://localhost:8000/api/tools/labour-auditor/audit \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@test.pdf"

# Should return same response as before
```

#### **Step 4: Performance testing**

```
Before: Average response time ~240ms
After: Should be same or faster (code reorganization shouldn't impact)

If slower: Profile and optimize critical paths
```

---

## Rollback Strategy

If anything breaks during migration:

```bash
# Backend
1. Revert git commit
2. Redeploy previous version
3. No database changes were made yet (Phase 1 only)

# Database
1. If Phase 1 (schema changes) broke something:
   - Drop new tables/columns
   - Restore from backup
   - Run migration again carefully

# Frontend
1. Revert to previous branch
2. Redeploy via Vercel
```

---

## Timeline

```
Phase 1 (Database):       2-3 hours
  - Schema changes
  - Data migration
  - Verification

Phase 2 (Frontend):       1-2 days
  - Folder reorganization
  - Component extraction
  - Tool hub creation
  - Testing

Phase 3 (Backend):        1-2 days
  - Route extraction
  - Main.py simplification
  - Shared utilities
  - Testing

Phase 4 (Admin):          1-2 days
  - Dashboard enhancement
  - Tool management UI
  - Testing

Phase 5 (Testing):        1-2 days
  - Full integration testing
  - Performance testing
  - UAT

Total: 1-2 weeks

Parallel phases 2-4 can reduce time to 5-7 days
```

---

## Post-Migration Checklist

- [ ] All existing functionality works (Labour Auditor)
- [ ] RLS policies tested & verified
- [ ] Admin dashboard shows all tools
- [ ] New tool scaffold tested (build sample tool)
- [ ] Performance benchmarks match or improve
- [ ] Error logging shows tool_id correctly
- [ ] Analytics/metrics work across all tools
- [ ] Users on free tier can only access Labour Auditor
- [ ] Upgrade flow works (upgrade → unlock tools)
- [ ] Deployment process tested (Vercel)
- [ ] Documentation updated
- [ ] Team trained on new architecture

---

## What Stays the Same

After migration, existing users won't notice changes:
- Login/auth unchanged
- Labour Auditor works identically
- Daily limits still enforced
- Pricing unchanged (for now)
- Performance same or better

---

## What Changes for Developers

- New tool folder structure (`/tools/{tool-name}/`)
- Tool-specific code isolated
- Shared code in `/shared` folder
- Admin dashboard manages tools (no code needed)
- Can now ship new tools in 1-2 days

---

## Summary

This migration:
- ✅ Transforms single-tool app into multi-tool platform
- ✅ Maintains backward compatibility
- ✅ Allows rapid tool development
- ✅ Preserves all existing functionality
- ✅ Takes 1-2 weeks to complete

**After migration, you can build new tools using TOOL_SCAFFOLDING_TEMPLATE.md in 1-2 days each.**
