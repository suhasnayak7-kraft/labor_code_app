# 🔒 Security Checklist for Vibe-Coded MVP (Free Tier)

**Stack:** Vercel | Gemini API | Supabase | Next.js
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
# Search for exposed secrets
grep -r "GEMINI_API_KEY" --include="*.ts" --include="*.tsx" --include="*.js"
grep -r "sk_live_\|sk_test_\|eyJ" . --include="*.env*" 
grep -r "NEXT_PUBLIC_SUPABASE_ANON_KEY" --include="*.env*"
grep -r "SUPABASE_SERVICE_ROLE_KEY" --include="*.ts" --include="*.tsx"
grep -r "STRIPE_SECRET\|OPENAI_API_KEY" . --include="*.ts"

# Check git history for secrets (even if deleted)
git log --all -p | grep -i "api_key\|sk_live_\|Bearer\|ghp_"
```

**Checklist:**

- [ ] No secrets hardcoded in source files
- [ ] `.env.local` and `.env.*.local` exist in `.gitignore`
- [ ] `.env` file in `.gitignore` (never commit environment files)
- [ ] No API keys in git history (`git log --all -p` contains no secrets)
- [ ] `SUPABASE_SERVICE_ROLE_KEY` does NOT have `NEXT_PUBLIC_` prefix
- [ ] `GEMINI_API_KEY` does NOT have `NEXT_PUBLIC_` prefix
- [ ] No secrets in comments like `// GEMINI_API_KEY=sk_...`
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
.env.local
.env.*.local
.env.development.local
.env.test.local
.env.production.local
```

**Checklist:**

- [ ] `.env` is in `.gitignore`
- [ ] `.env.local` is in `.gitignore`
- [ ] `.env.*.local` is in `.gitignore`
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

**These secrets must NEVER be prefixed with `NEXT_PUBLIC_`:**

```
SUPABASE_SERVICE_ROLE_KEY    ❌ Never public
GEMINI_API_KEY               ❌ Never public
STRIPE_SECRET_KEY            ❌ Never public
OPENAI_API_KEY               ❌ Never public
DATABASE_URL                 ❌ Never public (write access)
SMTP_PASSWORD                ❌ Never public
JWT_SECRET                   ❌ Never public
```

**These are OK to be public (read-only, safe):**

```
NEXT_PUBLIC_SUPABASE_URL     ✅ OK (connection endpoint)
NEXT_PUBLIC_SUPABASE_ANON_KEY ✅ OK (limited read access only)
NEXT_PUBLIC_GEMINI_MODEL     ✅ OK (just a model name)
```

**Checklist:**

- [ ] `SUPABASE_SERVICE_ROLE_KEY` has NO `NEXT_PUBLIC_` prefix
- [ ] `GEMINI_API_KEY` has NO `NEXT_PUBLIC_` prefix
- [ ] All secret keys are in `.env.local` (server-side only)
- [ ] Only read-only public keys use `NEXT_PUBLIC_` prefix
- [ ] Verified in: `.env.local`, `.env.example`, deployment config

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

**Check `next.config.js`:**

```javascript
// ❌ DANGEROUS in production
const nextConfig = {
  productionBrowserSourceMaps: true, // Source maps exposed
};

// ✅ SAFE
const nextConfig = {
  productionBrowserSourceMaps: false, // Disabled in production
};
```

**Checklist:**

- [ ] `productionBrowserSourceMaps` is NOT set to `true` in production
- [ ] Source maps are disabled in `next.config.js`
- [ ] `.env.production` contains no secrets (or doesn't exist)
- [ ] Vercel deployment does NOT have "Generate source maps" enabled

**Current Status:**
- [ ] Verified
- [ ] Issues Found: _________________

---

### ✅ 1.6 Environment Variables Validated on Startup

**Priority:** 🔴 CRITICAL  
**Impact:** Silent failures, undefined behavior, quota burned  
**Effort:** 5 minutes

**Create `lib/validate-env.ts`:**

```typescript
/**
 * Validates required environment variables exist at app startup.
 * This prevents silent failures where the app starts but API calls fail.
 * Call this in your root layout or middleware initialization.
 */

export function validateEnvironment() {
  // Only run on server-side
  if (typeof window !== 'undefined') return;

  const required = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
    'GEMINI_API_KEY',
  ];

  const missing = required.filter(key => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(
      `❌ Missing required environment variables:\n${missing.join('\n')}`
    );
  }

  console.log('✅ Environment validation passed');
}

// Call at startup
if (typeof window === 'undefined') {
  validateEnvironment();
}
```

**Call in `app/layout.tsx`:**

```typescript
import { validateEnvironment } from '@/lib/validate-env';

export default function RootLayout() {
  validateEnvironment();
  
  return (
    <html>
      <body>{/* ... */}</body>
    </html>
  );
}
```

**Checklist:**

- [ ] Environment validation function created
- [ ] Called in root layout or app initialization
- [ ] Fails fast if required env vars missing
- [ ] Tested locally: remove `GEMINI_API_KEY` and verify app fails on startup
- [ ] Prevents silent failures

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
|-----------|-----------|--------|
|            | [ ]       | ✅/⚠️  |
|            | [ ]       | ✅/⚠️  |
|            | [ ]       | ✅/⚠️  |

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
# Should find NOTHING in client code
grep -r "SUPABASE_SERVICE_ROLE_KEY" --include="*.tsx" --include="*.ts" app/

# Should only find it in server-side code
grep -r "SUPABASE_SERVICE_ROLE_KEY" --include="*.ts" lib/server/
grep -r "SUPABASE_SERVICE_ROLE_KEY" --include="*.ts" app/api/
```

**Checklist:**

- [ ] Service role key NOT in any `.tsx` component files
- [ ] Service role key NOT in any client-side modules
- [ ] Service role key only in: `lib/server/*`, `app/api/*`, `.env.local`
- [ ] Verified with grep search
- [ ] Server clients always use `createServerClient()`

**Current Status:**
- [ ] Verified
- [ ] Issues Found: _________________

---

### ✅ 3.1 Auth Middleware Protects Routes

**Priority:** 🟠 HIGH  
**Impact:** Unprotected routes accessible to anyone  
**Effort:** 20 minutes

**Check middleware exists:**

```bash
# Verify middleware file exists
ls -la middleware.ts

# Check matcher config
grep -A 5 "export const config" middleware.ts
```

**Create/verify `middleware.ts`:**

```typescript
import { createServerClient } from '@supabase/ssr';
import { NextRequest, NextResponse } from 'next/server';

// Public routes that don't require authentication
const PUBLIC_ROUTES = ['/login', '/signup', '/forgot-password', '/pricing'];

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  // Default-deny: protect everything except public routes
  if (!user && !PUBLIC_ROUTES.includes(request.nextUrl.pathname)) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return supabaseResponse;
}

// Protect all routes except public ones
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|login|signup|forgot-password|pricing).*)',
  ],
};
```

**Checklist:**

- [ ] `middleware.ts` exists in project root
- [ ] Auth check calls `getUser()` (not just `getSession()`)
- [ ] Uses default-deny pattern (allowlist of public routes)
- [ ] Matcher config covers all protected paths
- [ ] Redirects to `/login` for unauthorized users
- [ ] Tested: Try accessing `/dashboard` without logging in → redirects

**Current Status:**
- [ ] Verified
- [ ] Issues Found: _________________

---

### ✅ 3.2 Every API Route Has Auth Check

**Priority:** 🟠 HIGH  
**Impact:** Unprotected API endpoints → attackers call Gemini API at your quota  
**Effort:** 30 minutes

**List all API routes:**

```bash
find app/api -name "route.ts" -type f
```

**For each route, verify:**

```typescript
// ✅ CORRECT - Auth check comes FIRST
export async function POST(req: Request) {
  const supabase = createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return new Response('Unauthorized', { status: 401 });
  }
  
  // Now safe to process request
  const body = await req.json();
  // ...
}
```

**Checklist:**

| API Route | Auth Check | Gemini Call? | Status |
|-----------|-----------|------------|--------|
| `/api/generate` | [ ] | [ ] | ✅/⚠️ |
| `/api/save-post` | [ ] | [ ] | ✅/⚠️ |
| `/api/get-data` | [ ] | [ ] | ✅/⚠️ |
| `/api/...` | [ ] | [ ] | ✅/⚠️ |

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
grep -r "getSession()" --include="*.ts" --include="*.tsx" app/
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
[ ] No secrets in .gitignore
    grep -r "GEMINI_API_KEY" --include="*.ts"
    
[ ] Environment validation on startup
    grep -r "validateEnvironment\|Missing required env" app/
    
[ ] .env.local exists and is in .gitignore
    cat .gitignore | grep .env
```

**Database (10 min):**

```
[ ] All tables have RLS enabled
    SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname='public';
    
[ ] All tables have SELECT/INSERT/UPDATE policies
    SELECT * FROM pg_policies WHERE tablename='your_table';
    
[ ] No auth.jwt()->'user_metadata' in policies
    SELECT * FROM pg_policies WHERE qual LIKE '%user_metadata%';
```

**API Routes (10 min):**

```
[ ] Auth check on all routes
    grep -r "getUser()" app/api/
    
[ ] Rate limiting on Gemini calls
    grep -r "geminiLimiter\|ratelimit" app/api/
    
[ ] Input validation with Zod
    grep -r "\.parse\|\.safeParse" app/api/
```

**Errors (5 min):**

```
[ ] No error.stack sent to client
    grep -r "error.stack\|error.message" --include="*.ts" app/api/
    
[ ] No console.log(process.env)
    grep -r "console.log.*process.env\|console.log.*secret" .
```

---

## Implementation Guide

### Step 1: Environment (5 min)

```bash
# 1. Create lib/validate-env.ts (copy from Section 1.6 above)
# 2. Add to app/layout.tsx: validateEnvironment()
# 3. Test: Remove GEMINI_API_KEY from .env.local
#    → App should fail on startup
# 4. Add back GEMINI_API_KEY
```

### Step 2: Supabase Security (15 min)

```bash
# 1. Run RLS check in Supabase SQL Editor (Section 2.1)
# 2. Enable RLS on any tables without it (ALTER TABLE ... ENABLE RLS)
# 3. Add policies for each table (Section 2.2)
# 4. Verify WITH CHECK clauses (Section 2.3)
# 5. Test: Try accessing another user's data as different user
#    → Should get empty results (RLS blocking)
```

### Step 3: Auth Middleware (10 min)

```bash
# 1. Create middleware.ts in project root (copy from Section 3.1)
# 2. Configure PUBLIC_ROUTES (login, signup, etc)
# 3. Test: Visit /dashboard without logging in
#    → Should redirect to /login
# 4. Verify matcher config covers all protected routes
```

### Step 4: API Route Protection (15 min per route)

```bash
# For each app/api/*/route.ts:
# 1. Add getUser() check at top (Section 3.2)
# 2. Add Zod schema validation (Section 4.1)
# 3. Use auth user for identity, not request body (Section 4.2)
# 4. Test with invalid/missing auth → 401 error
# 5. Test with invalid data → 400 error
```

### Step 5: Rate Limiting (10 min)

```bash
# 1. Set up Upstash Redis free tier account
# 2. Create lib/ratelimit.ts (copy from Section 6.1)
# 3. Add rate limiter to Gemini API routes
# 4. Test: Call endpoint 11+ times within 1 hour
#    → Should get 429 error
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
- [ ] Dependenciesvulnerabilities: `npm audit` shows no CRITICAL/HIGH

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
