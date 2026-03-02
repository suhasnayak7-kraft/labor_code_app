# 1. Multi-SaaS Platform Architecture

## Overview

A modular, scalable SaaS platform architecture that allows rapid development and deployment of multiple compliance tools. Inspired by Basecamp's multi-product approach but simpler and lighter.

**Philosophy:** Build once, deploy many. Minimize code duplication by separating concerns into:
1. **Shared Infrastructure** (auth, payments, analytics)
2. **Tool Modules** (self-contained tools)
3. **Design System** (visual consistency)

---

## Architecture Layers

### **Layer 1: User & Infrastructure** (Shared across all tools)

```
┌─────────────────────────────────────────────────┐
│         Authentication & Authorization          │
│  (Supabase Auth: Email/Password, SSO, MFA)     │
└─────────────────────────────────┬───────────────┘
                                  │
┌─────────────────────────────────▼───────────────┐
│         User Profile & Plan Management          │
│  (Profiles, Subscriptions, Pricing Tiers)      │
└─────────────────────────────────┬───────────────┘
                                  │
┌─────────────────────────────────▼───────────────┐
│        Tool Access & Feature Gating             │
│  (Which tools available per user's plan)       │
└─────────────────────────────────┬───────────────┘
                                  │
┌─────────────────────────────────▼───────────────┐
│     Analytics & Usage Logging                   │
│  (Token counts, API usage, tool telemetry)     │
└─────────────────────────────────────────────────┘
```

### **Layer 2: Tool Hub** (Multi-tool landing page)

After login, user sees dashboard with available tools as cards:
- Each card shows tool name, description, icon
- Clicking card opens that tool
- Disabled tools (due to pricing tier) show lock icon with upgrade CTA

**No routing needed** — state-based navigation simplifies code:
```typescript
const [activeTool, setActiveTool] = useState<'labour-auditor' | 'gst-checker' | null>(null);
```

### **Layer 3: Individual Tools** (Self-contained modules)

Each tool is independent:

```
Tool Module Structure:
├── Frontend Component (React)
│   ├── UI Layout (card, form, results, tabs)
│   ├── State Management (tool-specific queries)
│   └── API Calls (tool-specific endpoints)
├── Backend Routes (FastAPI)
│   ├── /audit or equivalent endpoint
│   ├── /status or equivalent
│   └── /logs or equivalent
├── Database Tables
│   ├── Tool-specific logs (e.g., gst_audit_logs)
│   ├── Tool-specific configs (if needed)
│   └── RLS policies (user data isolation)
└── Knowledge Base
    └── Embeddings in shared vector table with tool identifier
```

**Key:** Tools don't call each other. They only call their own backend endpoints.

### **Layer 4: Admin Hub** (Global management)

Admin after login sees different view:
- Global dashboard (all metrics, user counts, revenue)
- Per-tool dashboard (tool-specific metrics)
- User management (create, lock, plan upgrade)
- Tool management (enable/disable, configure)
- Knowledge base ingestion (per tool)

---

## Data Flow: User Perspective

### **Regular User**

```
1. Login with email/password
   ↓
2. Supabase Auth validates token
   ↓
3. Frontend queries /api/tools (list available tools for user's plan)
   ↓
4. Tool Hub renders cards for available tools
   ↓
5. Click card → Tool opens (frontend state change)
   ↓
6. Tool UI loads (e.g., file upload form for auditor)
   ↓
7. User uploads file → POST /api/tool/{tool_id}/audit
   ↓
8. Backend validates user (RLS), runs analysis, returns results
   ↓
9. Tool UI displays results
   ↓
10. User logs out
```

### **Admin User**

```
1. Login as admin@example.com
   ↓
2. Auth token has role='admin' in JWT
   ↓
3. Frontend detects admin role → renders Admin Hub
   ↓
4. Admin views global dashboard
   ↓
5. Admin clicks on tool → sees tool-specific metrics
   ↓
6. Admin can:
   - Enable/disable tool (updates tools.enabled flag)
   - View tool configuration
   - Ingest knowledge base
   - See tool's total usage across all users
   ↓
7. Admin clicks on "Users" → user management panel
   ↓
8. Can create user, assign plan tier, lock account, etc.
```

---

## Key Architectural Decisions

### **1. Single Codebase vs. Monorepo**

**Decision: Single Codebase (Monorepo Pattern)**

One git repo with multiple tool modules:
```
labour-saas/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── ToolHub.tsx (shared)
│   │   │   ├── AdminDashboard.tsx (shared)
│   │   │   ├── tools/
│   │   │   │   ├── LabourAuditor.tsx (tool-specific)
│   │   │   │   ├── GstChecker.tsx (tool-specific)
│   │   │   │   └── ...
│   │   │   └── common/ (shared components)
│   │   └── ...
├── backend/
│   ├── main.py (routes dispatcher)
│   ├── tools/
│   │   ├── labour_auditor.py (tool endpoints)
│   │   ├── gst_checker.py (tool endpoints)
│   │   └── ...
│   ├── shared/ (shared utilities)
│   │   ├── auth.py
│   │   ├── db.py
│   │   ├── embeddings.py
│   │   └── ...
│   └── ...
└── docs/
```

**Why?**
- Simple deployment (one Vercel project)
- Easy code sharing
- Single database connection
- Easier debugging across tools

**Downside:** Tools can accidentally call each other. Mitigate with linting rules.

### **2. State Management: Local vs. Global**

**Decision: React Hooks + React Query (local state)**

No Redux/Zustand needed. Each tool manages its own state:
```typescript
// In LabourAuditor.tsx
const [file, setFile] = useState<File | null>(null);
const [results, setResults] = useState<AuditResults | null>(null);
const { data: status } = useQuery(['audit-status'], () => fetchStatus());
```

Shared state (user, auth) stored in Supabase client (automatically synced):
```typescript
const { data: { user } } = await supabase.auth.getUser();
```

**Why?**
- Each tool independent
- No cross-tool state bugs
- Simple debugging

### **3. Backend Route Organization**

**Decision: Tool-namespaced routes**

```python
# main.py
@app.post("/api/tools/labour-auditor/audit")
async def labour_audit(file: UploadFile):
    ...

@app.post("/api/tools/gst-checker/verify")
async def gst_verify(document: GstDocument):
    ...

@app.get("/api/tools/{tool_id}/status")
async def tool_status(tool_id: str):
    ...
```

**Why?**
- Clear organization
- Tool-specific logic isolated
- Easy to find endpoint for debugging

### **4. Database: Multi-Tenant Design**

**Decision: Single Supabase project, multiple schemas with RLS**

```sql
-- Shared tables
CREATE TABLE profiles (id, email, role, plan_tier, ...);
CREATE TABLE tools (id, slug, name, enabled, ...);

-- Tool-specific tables
CREATE TABLE labour_audit_logs (id, user_id, ...);
CREATE TABLE gst_audit_logs (id, user_id, ...);

-- All audit tables have RLS:
-- Users can only see their own logs
-- Admins can see aggregated data (no PII)
```

**Why?**
- Single database connection
- RLS enforces data isolation at database level
- Easy to query across tools if needed

### **5. Embeddings: Shared Vector Table**

**Decision: Single `embeddings` table with `tool_id` column**

```sql
CREATE TABLE embeddings (
  id bigserial,
  tool_id text,           -- 'labour-auditor', 'gst-checker', etc.
  content text,
  embedding vector(768),
  created_at timestamptz
);
```

**Why?**
- Single vector index (better performance)
- Easy to scope search to one tool
- Shared infrastructure

### **6. Feature Gating: Pricing Tier Control**

**Decision: Tool-level pricing + feature flags**

```sql
-- In tools table
CREATE TABLE tools (
  id bigserial,
  slug text,              -- 'labour-auditor'
  name text,
  min_plan_tier text,     -- 'free', 'pro', 'enterprise'
  enabled boolean,
  ...
);

-- In subscription_tiers table
CREATE TABLE subscription_tiers (
  id text,                -- 'free', 'pro', 'enterprise'
  name text,
  price_inr int,
  tools_included text[],  -- ['labour-auditor', 'gst-checker']
  ...
);
```

At login, frontend queries `/api/my-tools` which returns tools user can access based on plan.

**Why?**
- No code changes to enable/disable tool
- Admin can control via UI
- Pricing flexibility

### **7. Admin Control: Global vs. Tool-Specific**

**Decision: Two-level admin dashboard**

```
Admin Dashboard
├── Global View
│   ├── Total users by tier
│   ├── Revenue by month
│   ├── API usage across all tools
│   ├── Top tools by usage
│   └── System health (error rates, latency)
├── Tool Management
│   ├── Select tool → tool-specific metrics
│   ├── Enable/disable tool
│   ├── Configure tool (if needed)
│   └── Ingest knowledge base for tool
└── User Management
    ├── Create/delete users
    ├── Assign plan tier
    ├── Lock accounts
    └── View per-user usage
```

**Why?**
- Founder sees business metrics
- Tool owners can configure their tools
- No need to access code to manage tools

---

## Integration Points

### **How Tools Integrate with Platform**

1. **Authentication**
   - All tools use same Supabase Auth
   - JWT token validated at backend
   - User info from `profiles` table

2. **Analytics**
   - All tools log to `api_logs` table
   - Tool identifier stored in log
   - Dashboard queries by tool_id

3. **Knowledge Base**
   - Tool-specific embeddings in shared `embeddings` table
   - Each tool's search scoped to its tool_id
   - Admin uploads knowledge base per tool

4. **Pricing**
   - Tools check user's plan tier via `/api/my-tools`
   - Disabled tools return 403 Forbidden
   - No need for tool-specific pricing logic

5. **Rate Limiting**
   - Global API rate limit (e.g., 100 req/min per user)
   - Per-tool limits configurable in tools table
   - Enforced in middleware

---

## Error Handling & Monitoring

### **Shared Error Handling**

```python
# main.py - global exception handler
@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    tool_id = extract_tool_id_from_path(request.url.path)

    log_error(
        tool_id=tool_id,
        error=str(exc),
        user_id=get_current_user(request),
        timestamp=datetime.now()
    )

    return JSONResponse(
        status_code=500,
        content={"error": "Internal server error", "request_id": ...}
    )
```

### **Monitoring**

- **APM**: Datadog/NewRelic tracks errors by tool_id
- **Logging**: All logs tagged with tool_id for filtering
- **Alerts**: Alert if any tool error rate > 5%

---

## Scalability Considerations

### **Horizontal Scaling**

Since all tools use shared Supabase:
- DB auto-scales (Supabase handles it)
- Frontend static on Vercel (CDN)
- Backend serverless on Vercel (scales automatically)

### **Tool Limits**

- **Single project:** 10-15 tools recommended
- **Beyond:** Split into separate Supabase projects (one per tool)

Example growth path:
1. Start: 1 Supabase project, 1 backend, 1 frontend
2. 3-5 tools: Still 1 project, 1 backend, 1 frontend
3. 10+ tools: Consider separate projects per tool, API gateway for routing

### **Database Performance**

- RLS policies auto-index on user_id (good)
- Vector search: Max 100K embeddings per tool (fine for MVP)
- Audit logs: Archive old logs to separate table if >1M rows

---

## Security Principles

1. **Data Isolation:** RLS policies enforce at database layer (not application layer)
2. **Auth:** Supabase JWT tokens, validated on every request
3. **Rate Limiting:** Middleware checks user's daily/monthly limits
4. **Encryption:** Supabase handles encryption at rest; HTTPS in transit
5. **Admin Access:** Separate admin_audit_logs table (never shows PII)

See DATA_ISOLATION_PRIVACY.md for detailed RLS policies.

---

## Summary

This architecture balances:
- **Simplicity:** One codebase, one database, one backend
- **Modularity:** Tools don't depend on each other
- **Speed:** New tool adds <100 lines of code
- **Consistency:** Shared design system, components, infrastructure
- **Safety:** RLS policies, data isolation, audit logging

**Next:** Read DATABASE_SCHEMA.md to plan your data model.
