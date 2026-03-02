# 🔒 Security Checklist for Vibe-Coded MVP (Free Tier)

**Stack:** Vercel | Gemini API | Supabase | React + Vite + TypeScript (frontend) | FastAPI (backend)
**Last Updated:** February 27, 2026
**Status:** ⚠️ PRE-LAUNCH SECURITY REVIEW

---

## Table of Contents

1. [🔴 Tier 1: Critical (Do First)](#tier-1-critical)
2. [🟠 Tier 2: High Priority (Do Second)](#tier-2-high-priority)
3. [🟡 Tier 3: Important (If Time Permits)](#tier-3-important)
4. [🟢 Tier 4: Can Wait](#tier-4-can-wait)
5. [Quick Launch Checklist (30 minutes)](#quick-launch-checklist)
6. [Implementation Guide](#implementation-guide)

---

## TIER 1: Critical (Do First)

### ✅ 1.1 API Key Exposure

**Priority:** 🔴 CRITICAL  
**Impact:** Complete quota burn, data breach, account takeover  
**Effort:** 5 minutes

**What to check:**

```bash
# Search for exposed secrets in source files
grep -r "GEMINI_API_KEY" --include="*.ts" --include="*.tsx" --include="*.py" frontend/ backend/
grep -r "SUPABASE_KEY\|SUPABASE_SERVICE" --include="*.ts" --include="*.tsx" frontend/

# Check git history for secrets (even if deleted)
git log --all -p | grep -i "api_key\|sk_live_\|Bearer\|ghp_"
```

**Checklist:**

- [ ] No secrets hardcoded in source files
- [ ] `.env` file in `.gitignore` (never commit environment files)
- [ ] No API keys in git history (`git log --all -p` contains no secrets)
- [ ] `SUPABASE_KEY` (service role) does NOT have `VITE_` prefix — stays backend-only
- [ ] `GEMINI_API_KEY` does NOT have `VITE_` prefix — stays backend-only
- [ ] No secrets in comments like `// GEMINI_API_KEY=...`
- [ ] No secrets in error messages or logging

**Current Status:**
- [ ] Verified
- [ ] Issues Found: _________________

**Notes:**
```


```

---

### ✅ 1.2 .gitignore Coverage

**Priority:** 🔴 CRITICAL  
**Impact:** Secrets exposed in repository forever  
**Effort:** 2 minutes

**Verify your .gitignore contains:**

```
.env
.env.*
```

**Checklist:**

- [ ] `.env` is in `.gitignore`
- [ ] No environment files are staged: `git status | grep .env`
- [ ] Clean git history: no commits with `.env` files

**Current Status:**
- [ ] Verified
- [ ] Issues Found: _________________

---

### ✅ 1.3 No Public Prefixes on Secrets

**Priority:** 🔴 CRITICAL  
**Impact:** Secrets bundled into client JavaScript, visible in browser  
**Effort:** 3 minutes

**These secrets must NEVER have the `VITE_` prefix** (Vite bundles all `VITE_` vars into the client-side JavaScript):

```
SUPABASE_KEY                 ❌ Never public (service role — full DB access)
GEMINI_API_KEY               ❌ Never public (backend only)
```

**These are OK with `VITE_` prefix (read-only, safe for browser):**

```
VITE_SUPABASE_URL            ✅ OK (connection endpoint)
VITE_SUPABASE_ANON_KEY       ✅ OK (limited read access, protected by RLS)
VITE_API_URL                 ✅ OK (just a URL, leave empty in Vercel)
```

**Checklist:**

- [ ] `SUPABASE_KEY` (service role) has NO `VITE_` prefix
- [ ] `GEMINI_API_KEY` has NO `VITE_` prefix
- [ ] Only read-only public keys use `VITE_` prefix
- [ ] Verified in: `.env`, Vercel dashboard environment variables

**Current Status:**
- [ ] Verified
- [ ] Issues Found: _________________

---

### ✅ 1.4 No Secrets in Console/Logs

**Priority:** 🔴 CRITICAL  
**Impact:** Secrets visible in browser DevTools or server logs  
**Effort:** 5 minutes

**Search for:**

```bash
# Find console logs with potential secrets
grep -r "console.log\|console.error" --include="*.ts" --include="*.tsx" \
  | grep -i "api\|key\|secret\|token\|auth\|password"

# Find dangerouslySetInnerHTML or unescaped renders
grep -r "dangerouslySetInnerHTML\|{.*}.*html" --include="*.tsx"
```

**Checklist:**

- [ ] No `console.log(process.env)` in any file
- [ ] No API keys logged to console
- [ ] No JWT tokens logged to console
- [ ] No error stack traces sent to client (logged server-side only)
- [ ] Verified error boundary doesn't expose secrets

**Current Status:**
- [ ] Verified
- [ ] Issues Found: _________________

---

### ✅ 1.5 Build Artifacts Don't Expose Secrets

**Priority:** 🔴 CRITICAL  
**Impact:** Source maps let attacker reconstruct original code + secrets  
**Effort:** 2 minutes

**Check `frontend/vite.config.ts`:**

```typescript
// ❌ DANGEROUS in production
export default defineConfig({
  build: {
    sourcemap: true,  // Exposes original source to anyone
  },
});

// ✅ SAFE
export default defineConfig({
  build: {
    sourcemap: false,  // Disabled — no source maps in production bundle
  },
});
```

**Checklist:**

- [ ] `build.sourcemap` is NOT `true` in `vite.config.ts`
- [ ] Source maps are disabled in production Vite config
- [ ] Vercel deployment does NOT have "Generate source maps" enabled

**Current Status:**
- [ ] Verified
- [ ] Issues Found: _________________

---

### ✅ 1.6 Environment Variables Validated on Startup

**Priority:** 🔴 CRITICAL  
**Impact:** Silent failures, undefined behavior, quota burned  
**Effort:** 5 minutes

**Frontend: Create `frontend/src/lib/validate-env.ts`** (Vite exposes vars via `import.meta.env`):

```typescript
/**
 * Validates required Vite environment variables at app startup.
 * Called once in main.tsx before React mounts — fails fast if config is missing.
 */
export function validateEnvironment() {
  const required = [
    'VITE_SUPABASE_URL',
    'VITE_SUPABASE_ANON_KEY',
  ];

  const missing = required.filter(key => !import.meta.env[key]);

  if (missing.length > 0) {
    throw new Error(
      `❌ Missing required environment variables:\n${missing.join('\n')}\n\nCheck your .env file.`
    );
  }
}
```

**Call in `frontend/src/main.tsx`:**

```typescript
import { validateEnvironment } from './lib/validate-env';

validateEnvironment();   // Throws before React mounts if env is missing

ReactDOM.createRoot(document.getElementById('root')!).render(<App />);
```

**Backend: FastAPI validates its own env on startup in `backend/main.py`:**

```python
import os, sys

required = ['SUPABASE_URL', 'SUPABASE_KEY', 'GEMINI_API_KEY']
missing = [k for k in required if not os.getenv(k)]
if missing:
    sys.exit(f"❌ Missing required environment variables: {', '.join(missing)}")
```

**Checklist:**

- [ ] Frontend validation checks `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
- [ ] Backend validation checks `SUPABASE_URL`, `SUPABASE_KEY`, `GEMINI_API_KEY`
- [ ] Tested locally: remove a var and verify startup failure
- [ ] Prevents silent failures where app starts but API calls return 500

**Current Status:**
- [ ] Verified
- [ ] Issues Found: _________________

---

## TIER 2: High Priority (Do Second)

### ✅ 2.1 Supabase RLS Enabled on All Tables

**Priority:** 🟠 HIGH  
**Impact:** All users can see all data in the database  
**Effort:** 10 minutes

**Check all tables:**

```sql
-- Run in Supabase SQL Editor
SELECT 
  schemaname,
  tablename,
  rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;
```

**Expected output:**
```
schemaname | tablename    | rowsecurity
-----------+--------------+------------
public     | users        | true       ✅
public     | posts        | true       ✅
public     | comments     | true       ✅
public     | profiles     | true       ✅
```

**If any show `false`, enable RLS:**

```sql
ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;
```

**Checklist:**

- [ ] Ran `pg_tables` query to check RLS status
- [ ] ALL tables in public schema have `rowsecurity = true`
- [ ] Any new tables created have RLS enabled immediately
- [ ] Documented which tables are public vs. user-specific

**Tables in this project:**

| Table Name | RLS Enabled | Status |
|---|---|---|
| `labour_laws` | [ ] | ✅/⚠️ |
| `profiles` | [ ] | ✅/⚠️ |
| `api_logs` | [ ] | ✅/⚠️ |
| `waiting_list` | [ ] | ✅/⚠️ |

**Current Status:**
- [ ] Verified - All tables have RLS
- [ ] Issues Found: _________________

---

### ✅ 2.2 RLS Policies Exist (Not Just Enabled)

**Priority:** 🟠 HIGH  
**Impact:** Tables with RLS enabled but no policies return empty results (hidden bug)  
**Effort:** 15 minutes

**Check policies for each table:**

```sql
-- Run for each table
SELECT * FROM pg_policies WHERE tablename = 'your_table_name';
```

**Every RLS-enabled table MUST have:**

- [ ] At least one SELECT policy (so users can read data)
- [ ] At least one INSERT policy (if users create data)
- [ ] At least one UPDATE policy (if users modify data)
- [ ] At least one DELETE policy (if users delete data)

**If policies are missing, add them:**

```sql
-- Example: Users table
CREATE POLICY "Users can read own profile" ON users
  FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Example: Posts table (user can read own, admins read all)
CREATE POLICY "Users can read own posts" ON posts
  FOR SELECT
  USING (auth.uid() = user_id OR EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = true
  ));

CREATE POLICY "Users can insert posts" ON posts
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);
```

**Checklist:**

- [ ] Ran `pg_policies` for each table
- [ ] Every table has SELECT policy
- [ ] Every table has INSERT policy (if applicable)
- [ ] Every table has UPDATE policy (if applicable)
- [ ] Every table has DELETE policy (if applicable)
- [ ] All policies use `auth.uid()` (not user metadata)

**Current Status:**
- [ ] Verified - All tables have policies
- [ ] Issues Found: _________________

---

### ✅ 2.3 INSERT/UPDATE Policies Include WITH CHECK

**Priority:** 🟠 HIGH  
**Impact:** Users can impersonate others, change ownership of data  
**Effort:** 10 minutes

**The vulnerability:**

```sql
-- ❌ DANGEROUS - User can insert with ANY user_id
CREATE POLICY "Users can insert posts" ON posts
  FOR INSERT
  AS permissive
  TO authenticated
  USING (true);

-- ✅ SAFE - User_id is checked
CREATE POLICY "Users can insert posts" ON posts
  FOR INSERT
  AS permissive
  TO authenticated
  WITH CHECK (auth.uid() = user_id);
```

**Check all INSERT/UPDATE policies:**

```sql
SELECT 
  schemaname,
  tablename,
  policyname,
  qual,
  with_check
FROM pg_policies 
WHERE schemaname = 'public'
AND cmd IN ('INSERT', 'UPDATE');
```

**All results must have a `with_check` clause (non-empty):**

| policyname | cmd | with_check |
|-----------|-----|-----------|
| Users can insert posts | INSERT | `auth.uid() = user_id` ✅ |
| Bad policy | INSERT | `null` ❌ |

**Checklist:**

- [ ] All INSERT policies have WITH CHECK clause
- [ ] All UPDATE policies have WITH CHECK clause
- [ ] WITH CHECK validates user ownership (auth.uid() = user_id)
- [ ] Verified no INSERT/UPDATE policies allow arbitrary values

**Current Status:**
- [ ] Verified
- [ ] Issues Found: _________________

---

### ✅ 2.4 RLS Uses auth.uid() Not User Metadata

**Priority:** 🟠 HIGH  
**Impact:** Users can spoof their identity by modifying JWT claims  
**Effort:** 5 minutes

**The vulnerability:**

```sql
-- ❌ DANGEROUS - User metadata can be faked
CREATE POLICY "Bad policy" ON posts
  FOR SELECT
  USING (auth.jwt()->'user_metadata'->>'user_id' = user_id);

-- ✅ SAFE - auth.uid() is verified server-side
CREATE POLICY "Good policy" ON posts
  FOR SELECT
  USING (auth.uid() = user_id);
```

**Check all policies:**

```sql
SELECT 
  policyname,
  qual,
  with_check
FROM pg_policies 
WHERE schemaname = 'public'
AND (qual LIKE '%user_metadata%' OR with_check LIKE '%user_metadata%');
```

**This should return ZERO results.** If it doesn't, those policies need fixing.

**Checklist:**

- [ ] Searched for `user_metadata` in RLS policies (should find nothing)
- [ ] All policies use `auth.uid()` for identity
- [ ] No policies use `auth.jwt()->'user_metadata'`
- [ ] Verified in Supabase SQL Editor

**Current Status:**
- [ ] Verified
- [ ] Issues Found: _________________

---

### ✅ 2.5 Service Role Key Never in Client Code

**Priority:** 🟠 HIGH  
**Impact:** Complete database bypass, anyone can modify all data  
**Effort:** 5 minutes

**Search for service role key:**

```bash
# Should find NOTHING in frontend source
grep -r "SUPABASE_KEY" --include="*.ts" --include="*.tsx" frontend/

# Should only appear in backend
grep -r "SUPABASE_KEY" backend/main.py
```

**Checklist:**

- [ ] `SUPABASE_KEY` (service role) NOT in any frontend `.tsx` / `.ts` files
- [ ] `SUPABASE_KEY` only used in: `backend/main.py` and `.env` / Vercel env vars
- [ ] Verified with grep search
- [ ] Frontend uses `VITE_SUPABASE_ANON_KEY` (anon key), never the service role key

**Current Status:**
- [ ] Verified
- [ ] Issues Found: _________________

---

### ✅ 3.1 Auth Check on All Protected FastAPI Endpoints

**Priority:** 🟠 HIGH
**Impact:** Unprotected API routes accessible to anyone — attacker can burn your Gemini quota
**Effort:** 15 minutes

This project uses FastAPI (not Next.js middleware). Auth is enforced per-endpoint using a reusable `get_current_user` dependency that validates the Supabase JWT from the `Authorization: Bearer <token>` header.

**Verify `backend/main.py` pattern:**

```python
from fastapi import Depends, HTTPException, Header
from supabase import create_client

def get_current_user(authorization: str = Header(...)):
    """Validates Supabase JWT. Raises 401 if missing or invalid."""
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing Bearer token")

    token = authorization.split(" ")[1]

    try:
        user = supabase.auth.get_user(token)
        return user.user
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

# ✅ Protected endpoint — auth check first
@app.post("/audit")
async def audit(file: UploadFile, user=Depends(get_current_user)):
    # user is guaranteed to be authenticated
    ...

# ❌ Unprotected — anyone can call this
@app.post("/audit")
async def audit(file: UploadFile):
    ...
```

**Check all endpoints that call Gemini or return user data:**

```bash
grep -n "^@app\." backend/main.py
# For each route, verify it has: user=Depends(get_current_user)
```

**Checklist:**

- [ ] `get_current_user` dependency defined in `main.py`
- [ ] `/audit` endpoint uses `Depends(get_current_user)`
- [ ] `/logs` endpoint uses `Depends(get_current_user)`
- [ ] `/admin/*` endpoints check `user.role == 'admin'` after auth
- [ ] Tested: Call `/audit` without Authorization header → 401 error
- [ ] Tested: Call with expired token → 401 error

**Current Status:**
- [ ] Verified
- [ ] Issues Found: _________________

---

### ✅ 3.2 All FastAPI Endpoints Audited

**Priority:** 🟠 HIGH
**Impact:** One unprotected endpoint = full Gemini quota abuse
**Effort:** 10 minutes

**List all endpoints:**

```bash
grep -n "^@app\." backend/main.py
```

**Checklist — AuditAI endpoints:**

| Endpoint | Method | Auth Required | Gemini Call? | Status |
|---|---|---|---|---|
| `POST /audit` | POST | ✅ Bearer JWT | ✅ Yes | ✅/⚠️ |
| `GET /logs` | GET | ✅ Bearer JWT | ❌ No | ✅/⚠️ |
| `POST /admin/users` | POST | ✅ Admin JWT | ❌ No | ✅/⚠️ |
| `PUT /admin/users/{id}/password` | PUT | ✅ Admin JWT | ❌ No | ✅/⚠️ |

**All routes should follow this pattern:**

```python
# ✅ Auth check is FIRST thing in the handler
@app.post("/audit")
async def audit(file: UploadFile, user=Depends(get_current_user)):
    # user is guaranteed valid — safe to proceed
    profile = supabase.table("profiles").select("*").eq("id", user.id).single().execute()
    ...
```

**Current Status:**
- [ ] All API routes verified
- [ ] Issues Found: _________________

---

### ✅ 3.3 Use getUser() Not getSession()

**Priority:** 🟠 HIGH  
**Impact:** JWT validation bypassed, fake sessions accepted  
**Effort:** 10 minutes

**Search for getSession():**

```bash
grep -r "getSession()" --include="*.ts" --include="*.tsx" frontend/src/
```

**The difference:**

```typescript
// ❌ DANGEROUS - Only reads local JWT, doesn't verify
const { data: { session } } = await supabase.auth.getSession();

// ✅ SAFE - Validates JWT against Supabase servers
const { data: { user } } = await supabase.auth.getUser();
```

**Replace all server-side security checks:**

```typescript
// Before
const { data: { session } } = await supabase.auth.getSession();
const userId = session?.user?.id;

// After
const { data: { user } } = await supabase.auth.getUser();
const userId = user?.id;
```

**Checklist:**

- [ ] Searched for `getSession()` calls
- [ ] All security-critical calls use `getUser()`
- [ ] API routes use `getUser()` for auth checks
- [ ] Server components use `getUser()` for user data

**Current Status:**
- [ ] Verified
- [ ] Issues Found: _________________

---

### ✅ 4.1 Input Validation Server-Side (Zod/Yup)

**Priority:** 🟠 HIGH  
**Impact:** Invalid data → crashes, bypasses, data corruption  
**Effort:** 30 minutes per route

**Install validation library:**

```bash
npm install zod
# or
pnpm add zod
```

**Create schema for each endpoint:**

```typescript
// lib/schemas.ts
import { z } from 'zod';

export const GenerateTextSchema = z.object({
  prompt: z.string()
    .min(1, 'Prompt required')
    .max(5000, 'Prompt too long'),
  model: z.enum(['gemini-pro']).default('gemini-pro'),
  temperature: z.number().min(0).max(1).default(0.7),
});

export const CreatePostSchema = z.object({
  title: z.string().min(1).max(200),
  content: z.string().min(1).max(10000),
  tags: z.array(z.string()).max(10),
});
```

**Use in API route:**

```typescript
import { GenerateTextSchema } from '@/lib/schemas';

export async function POST(req: Request) {
  const supabase = createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) return new Response('Unauthorized', { status: 401 });

  const body = await req.json();
  
  // Validate input server-side
  const validated = GenerateTextSchema.parse(body);
  
  // Use validated data, not raw body
  const response = await gemini.generate(validated.prompt);
  
  return Response.json(response);
}
```

**Checklist:**

- [ ] Zod/Yup installed
- [ ] Validation schemas created for each endpoint
- [ ] All POST/PUT/PATCH endpoints validate input
- [ ] Validation happens server-side (not just client)
- [ ] Invalid input returns 400 error
- [ ] Tested with invalid data

**Current Status:**
- [ ] Verified - All endpoints validated
- [ ] Issues Found: _________________

---

### ✅ 4.2 User Identity From Session, Not Request Body

**Priority:** 🟠 HIGH  
**Impact:** Attackers impersonate other users, modify/delete their data  
**Effort:** 10 minutes

**The vulnerability:**

```typescript
// ❌ DANGEROUS - User can send any userId
export async function POST(req: Request) {
  const body = await req.json();
  const userId = body.userId; // Attacker can set this to anyone
  
  await db.posts.create({
    userId: userId, // Could be someone else!
    content: body.content,
  });
}

// ✅ SAFE - userId from authenticated session only
export async function POST(req: Request) {
  const supabase = createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) return new Response('Unauthorized', { status: 401 });
  
  const body = await req.json();
  
  await supabase
    .from('posts')
    .insert({
      user_id: user.id, // From session, not request
      content: body.content,
    });
}
```

**Checklist:**

- [ ] Searched for `body.userId`, `body.user_id`, `body.ownerId`
- [ ] User identity always comes from `auth.getUser()`
- [ ] Never use request body to determine user identity
- [ ] Verified all write operations use session user

**Current Status:**
- [ ] Verified
- [ ] Issues Found: _________________

---

### ✅ 4.3 Sanitize User Content (XSS Prevention)

**Priority:** 🟠 HIGH  
**Impact:** Attackers inject JavaScript, steal user sessions  
**Effort:** 15 minutes

**Search for dangerous patterns:**

```bash
grep -r "dangerouslySetInnerHTML" --include="*.tsx"
grep -r "\[innerHTML\]" --include="*.tsx"
grep -r "v-html" --include="*.vue"
```

**The vulnerability:**

```typescript
// ❌ DANGEROUS - Renders untrusted HTML
export function Post({ post }: { post: Post }) {
  return <div dangerouslySetInnerHTML={{ __html: post.content }} />;
}

// ✅ SAFE - React escapes HTML by default
export function Post({ post }: { post: Post }) {
  return <div>{post.content}</div>;
}
```

**If you need rich HTML (from editor), sanitize first:**

```typescript
import DOMPurify from 'isomorphic-dompurify';

export function Post({ post }: { post: Post }) {
  const cleanHtml = DOMPurify.sanitize(post.content);
  return <div dangerouslySetInnerHTML={{ __html: cleanHtml }} />;
}
```

**Checklist:**

- [ ] No `dangerouslySetInnerHTML` without sanitization
- [ ] User content rendered as text by default (not HTML)
- [ ] If HTML needed: using DOMPurify or similar sanitizer
- [ ] Tested: Try posting `<script>alert('xss')</script>` → should display as text

**Current Status:**
- [ ] Verified
- [ ] Issues Found: _________________

---

### ✅ 6.1 Rate Limiting on Gemini API Calls

**Priority:** 🟠 HIGH  
**Impact:** Attackers burn quota in seconds, cost = $$$ on free tier  
**Effort:** 20 minutes

**Why important for free tier:**
- Gemini free tier: ~60 requests/minute
- One malicious user = everyone locked out
- Vercel serverless = no persistent in-memory rate limit

**Install Upstash Redis (free tier available):**

```bash
npm install @upstash/ratelimit @upstash/redis
```

**Create rate limiter:**

```typescript
// lib/ratelimit.ts
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

export const geminiLimiter = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, '1 h'),
  analytics: true,
  prefix: '@upstash/ratelimit',
});
```

**Use in API route:**

```typescript
import { geminiLimiter } from '@/lib/ratelimit';

export async function POST(req: Request) {
  const supabase = createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) return new Response('Unauthorized', { status: 401 });

  // Rate limit by user ID
  const { success, limit, remaining, reset } = await geminiLimiter.limit(
    `gemini:${user.id}`
  );

  if (!success) {
    return new Response(
      `Rate limited. Resets in ${reset - Date.now()}ms`,
      { status: 429 }
    );
  }

  // Safe to call Gemini
  const body = await req.json();
  const response = await gemini.generateText(body.prompt);
  
  return Response.json(response);
}
```

**Checklist:**

- [ ] Identified all routes calling paid APIs (Gemini, etc)
- [ ] Upstash Redis configured (free tier)
- [ ] Rate limiter created per endpoint
- [ ] Rate limiting applied server-side (not just frontend)
- [ ] Tested: Exceed limit → 429 error returned
- [ ] Limit values set appropriately for free tier

**Current Status:**
- [ ] Verified
- [ ] Issues Found: _________________

---

## TIER 3: Important (If Time Permits)

### ✅ 4.4 HTTP Method Enforcement

**Priority:** 🟡 MEDIUM  
**Impact:** State-changing operations triggered by accident (prefetch, image tags)  
**Effort:** 10 minutes

**The vulnerability:**

```typescript
// ❌ DANGEROUS - GET request can delete (triggered by prefetch/img tag)
export async function GET(req: Request) {
  const id = req.nextUrl.searchParams.get('id');
  await db.posts.delete(id);
  return Response.json({ deleted: true });
}

// ✅ SAFE - Delete requires POST
export async function POST(req: Request) {
  const body = await req.json();
  const { id } = body;
  
  // ... auth check ...
  
  await db.posts.delete(id);
  return Response.json({ deleted: true });
}
```

**Checklist:**

- [ ] POST used for create operations
- [ ] PATCH/PUT used for updates
- [ ] DELETE used for deletions
- [ ] No state-changing operations in GET handlers
- [ ] Verified all routes follow REST conventions

**Current Status:**
- [ ] Verified
- [ ] Issues Found: _________________

---

### ✅ 4.5 Don't Leak Internal Errors

**Priority:** 🟡 MEDIUM  
**Impact:** Stack traces reveal code structure, vulnerability hints  
**Effort:** 15 minutes

**The vulnerability:**

```typescript
// ❌ DANGEROUS - Exposes internal error to browser
export async function POST(req: Request) {
  try {
    const response = await gemini.generate(prompt);
    return Response.json(response);
  } catch (error) {
    return Response.json(
      { error: error.message, stack: error.stack },
      { status: 500 }
    );
  }
}

// ✅ SAFE - Generic message to client, detailed log server-side
export async function POST(req: Request) {
  try {
    const response = await gemini.generate(prompt);
    return Response.json(response);
  } catch (error) {
    // Log detailed error server-side
    console.error('API error:', error);
    
    // Return generic message to client
    return new Response('Internal server error', { status: 500 });
  }
}
```

**Checklist:**

- [ ] No `error.stack` sent to client
- [ ] No SQL errors shown to users
- [ ] No file paths exposed in errors
- [ ] No environment variable names in errors
- [ ] Detailed errors logged server-side only
- [ ] Generic error messages returned to client

**Current Status:**
- [ ] Verified
- [ ] Issues Found: _________________

---

### ✅ 5.1 Dependency Audit

**Priority:** 🟡 MEDIUM  
**Impact:** Vulnerable packages with known exploits  
**Effort:** 5-30 minutes (depends on findings)

**Run audit:**

```bash
npm audit
# or
pnpm audit
# or
yarn audit
# or
bun audit
```

**Fix high/critical vulnerabilities:**

```bash
npm audit fix --force
# Review carefully before --force
```

**Checklist:**

- [ ] Ran `npm audit` (or equivalent)
- [ ] 0 CRITICAL vulnerabilities
- [ ] 0 HIGH vulnerabilities (ideally)
- [ ] Documented any MEDIUM vulnerabilities that can't be fixed
- [ ] Lockfile committed (prevents version drift)

**Results:**

```
Vulnerabilities: 
- CRITICAL: ___ (must fix)
- HIGH: ___ (must fix)
- MEDIUM: ___ (should fix)
- LOW: ___ (can defer)
```

**Current Status:**
- [ ] Verified - No critical issues
- [ ] Issues Found: _________________

---

## TIER 4: Can Wait (Post-MVP)

These are important but not exploitable on day one:

### ⬚ 4.6 Webhook Signature Verification
**Only if you:** Receive webhooks from Stripe, GitHub, etc.
**Defer to:** After MVP launch
**Complexity:** 30 minutes

### ⬚ 7.1 CORS Configuration
**Only if you:** Expose API to external origins
**Defer to:** After MVP launch
**Complexity:** 15 minutes

### ⬚ 8.1 File Upload Security
**Only if you:** Allow user file uploads
**Defer to:** After MVP launch
**Complexity:** 45 minutes

### ⬚ Security Headers (CSP, HSTS)
**Impact:** Defense-in-depth, not critical
**Defer to:** After MVP launch
**Complexity:** 20 minutes

### ⬚ Comprehensive Logging/Monitoring
**Impact:** Incident response, not prevention
**Defer to:** After MVP launch (v1.1)
**Complexity:** Ongoing

---

## Quick Launch Checklist (30 minutes)

### Pre-Launch Verification

**Environment (5 min):**

```
[ ] No secrets in frontend source
    grep -r "SUPABASE_KEY\|GEMINI_API_KEY" --include="*.ts" --include="*.tsx" frontend/src/

[ ] Environment validation on startup
    grep -r "validateEnvironment\|Missing required" frontend/src/ backend/main.py

[ ] .env file in .gitignore
    cat .gitignore | grep "^\.env"
```

**Database (10 min):**

```
[ ] All tables have RLS enabled
    SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname='public';
    -- Expected: labour_laws, profiles, api_logs, waiting_list all = true

[ ] All tables have SELECT/INSERT/UPDATE policies
    SELECT tablename, policyname, cmd FROM pg_policies WHERE schemaname='public';

[ ] No auth.jwt()->'user_metadata' in policies
    SELECT * FROM pg_policies WHERE qual LIKE '%user_metadata%';
```

**API Routes (10 min):**

```
[ ] Auth dependency on all endpoints
    grep -n "Depends(get_current_user)" backend/main.py

[ ] Daily audit limit enforced in /audit
    grep -n "daily_audit_limit" backend/main.py

[ ] Admin check on admin endpoints
    grep -n "role.*admin\|admin.*role" backend/main.py
```

**Errors (5 min):**

```
[ ] No stack traces sent to client
    grep -r "traceback\|error.stack\|str(e)" backend/main.py

[ ] No console.log with env vars
    grep -r "console.log.*import.meta.env\|console.log.*VITE_" frontend/src/
```

---

## Implementation Guide

### Step 1: Environment (5 min)

```bash
# 1. Create frontend/src/lib/validate-env.ts (copy from Section 1.6 above)
# 2. Call validateEnvironment() in frontend/src/main.tsx before React mounts
# 3. Add startup env check to backend/main.py (top of file, before app creation)
# 4. Test: Remove GEMINI_API_KEY from .env → backend should exit on startup
```

### Step 2: Supabase Security (15 min)

```bash
# 1. Run RLS check in Supabase SQL Editor (Section 2.1)
#    → Verify labour_laws, profiles, api_logs, waiting_list all have rowsecurity=true
# 2. Enable RLS on any tables without it: ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;
# 3. Verify policies for each table (Section 2.2)
# 4. Verify WITH CHECK clauses on INSERT/UPDATE (Section 2.3)
# 5. Test: Log in as test user, try fetching another user's api_logs → should be empty
```

### Step 3: FastAPI Auth Protection (15 min)

```bash
# 1. Verify get_current_user dependency exists in backend/main.py (Section 3.1)
# 2. Check all @app.post/@app.get endpoints have Depends(get_current_user) (Section 3.2)
# 3. Check admin endpoints verify role == 'admin' after auth
# 4. Test: curl POST /audit without Authorization header → should return 401
# 5. Test: curl GET /logs without auth → should return 401
```

### Step 4: Input Validation (15 min)

```bash
# For each FastAPI endpoint in backend/main.py:
# 1. Use Pydantic request models for POST body validation (Section 4.1)
# 2. Confirm user identity comes from JWT (Depends), never from request body (Section 4.2)
# 3. Test with missing required fields → 422 Unprocessable Entity
```

### Step 5: Rate Limiting (10 min)

```bash
# The app uses daily_audit_limit in the profiles table for per-user rate limiting.
# This is enforced in the /audit endpoint.
# Verify: grep -n "daily_audit_limit" backend/main.py shows the limit check before Gemini call.
# For IP-level rate limiting (DDoS protection), Vercel's built-in protections apply.
```

---

## Verification Checklist Before Launch

**Final Security Sign-Off:**

- [ ] All Tier 1 items ✅ VERIFIED
- [ ] All Tier 2 items ✅ VERIFIED
- [ ] Tested without auth → redirected to login
- [ ] Tested with invalid API input → 400 error
- [ ] Tested rate limit → 429 error
- [ ] Tested other user data access → RLS blocks
- [ ] No secrets in git history: `git log --all -p | grep -i "api_key\|secret"`
- [ ] No secrets in source: `grep -r "sk_\|eyJ\|AKIA" --include="*.ts" --include="*.tsx"`
- [ ] Environment validation passes on startup
- [ ] Dependency vulnerabilities: `npm audit` shows no CRITICAL/HIGH

**Sign-off:**

- Launch Approved By: _________________
- Launch Date: _________________
- Notes: _________________

---

## Post-Launch Monitoring

After launch, monitor for:

```
1. API rate limit alerts → indicates abuse/attack
2. Auth failures spike → indicates brute force
3. Error logs for unusual patterns → indicates exploitation attempt
4. Supabase quota usage anomaly → indicates RLS bypass or API leak
5. Gemini API quota spike → indicates rate limit bypass
```

---

## Document Version Control

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0 | 2026-02-27 | Initial security checklist | Security Team |
|     |      |         |        |
|     |      |         |        |

---

**Last Updated:** February 27, 2026  
**Next Review:** After MVP launch or before production migration  
**Contact:** [Security Team Email]
