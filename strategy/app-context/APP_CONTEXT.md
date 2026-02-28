# AuditAI — Complete App Context File

**Last Updated:** February 28, 2026
**Status:** MVP live on Vercel
**Owner:** Suhasa (suhasnayak7@gmail.com)

---

## 📋 1-MINUTE SUMMARY

**AuditAI** is a SaaS compliance auditing tool for Indian CAs, HR consultants, and compliance professionals. Users upload a company's Employee Policy PDF → app checks compliance against India's 4 Labour Codes (2025) → returns a score (0-100) + findings citing specific law sections → generates a downloadable PDF report.

**Current:** Live MVP with single policy upload, basic admin dashboard, basic usage tracking.

**Next:** Bulk processing, white labeling, monetization (₹749-₹7,999/month tiers).

---

## 🎯 PRODUCT OVERVIEW

### What It Does

1. **User logs in** (email/password via Supabase)
2. **Uploads company policy PDF**
3. **App processes:**
   - Extracts text from PDF
   - Generates embedding (Gemini embedding-001, 768-dim)
   - Vector-searches relevant Labour Code sections (cosine similarity, top 5)
   - Sends policy + law context to Gemini 2.5 Flash for analysis
4. **Returns compliance score** (0-100, 100 = fully compliant)
   - 90-100: Fully compliant ✅
   - 70-89: Mostly compliant, minor gaps ⚠️
   - 50-69: Moderate issues, corrective action needed 🔴
   - <50: Critical non-compliance 🚨
5. **Plus detailed findings** citing specific law sections
6. **User downloads print-ready PDF report**
7. **Admins manage** users, set audit limits, lock/unlock accounts

### Target Users

- **CA firms** (chartered accountants) — bulk client audits
- **HR consultants** — compliance due diligence
- **In-house compliance teams** — policy review
- **Legal consultancies** — labour law firms

### Market Opportunity

- **~300,000+ CAs in India**
- **All struggling with compliance** post-2025 Labour Code changes
- **Willing to pay ₹749-₹7,999/month**
- **No major competition yet**

---

## 🏗️ TECH STACK

| Layer | Technology | Notes |
|-------|-----------|-------|
| **Frontend** | React 18 + Vite + TypeScript | ShadCN UI, Framer Motion, Tailwind CSS |
| **Backend** | FastAPI (Python) | Deployed as Vercel serverless function |
| **Database** | Supabase (PostgreSQL + pgvector) | Vector similarity search |
| **AI Models** | Gemini 2.5 Flash + embedding-001 | ~₹0.09 per audit |
| **Auth** | Supabase Auth | Email/password, JWT tokens |
| **Deployment** | Vercel free tier | Frontend static build + backend serverless |
| **Version Control** | GitHub | Auto-deploys on push to `main` |

### Cost Breakdown (Current MVP)

| Item | Cost/Month | Notes |
|------|-----------|-------|
| Vercel | ₹0 | Free tier (handles ~300 audits) |
| Supabase | ₹0 | Free tier (handles ~1,000 audits) |
| Gemini API | ₹0.09 per audit | ~₹27/month at current usage |
| **Total** | **~₹27** | Scales to ₹0 → ₹500/month at 5,000+ audits |

**Margin at ₹999 tier:** ~99% (high margin business)

---

## 📁 PROJECT STRUCTURE

```
labour_code_app/
├── .env                              # Local env vars (never commit)
├── vercel.json                       # Vercel build + routing config
│
├── api/
│   └── index.py                      # Vercel serverless entry point
│                                     # Mounts FastAPI under /api
│
├── backend/
│   ├── main.py                       # ⭐ Core FastAPI app (ALL endpoints here)
│   ├── ingest.py                     # One-time script: PDF → chunks → embeddings
│   ├── labor_code_2025.pdf           # Source of truth (4 Labour Codes PDF)
│   ├── requirements.txt              # Python dependencies
│   └── venv/                         # Local Python venv (macOS only)
│
├── frontend/
│   ├── src/
│   │   ├── App.tsx                   # ⭐ Main app entry (auth, audit flow, results)
│   │   ├── Login.tsx                 # Login screen
│   │   ├── RequestAccess.tsx         # Waitlist signup
│   │   ├── CheckStatus.tsx           # Check waitlist status
│   │   ├── AdminDashboard.tsx        # Admin panel (user management)
│   │   ├── Usage.tsx                 # API usage dashboard
│   │   └── lib/supabase.ts           # Supabase client config
│   ├── index.html
│   ├── vite.config.ts
│   └── package.json
│
├── Strategy Documents/               # Implementation roadmaps
│   ├── REPRODUCIBILITY_STRATEGY.md   # Deterministic results ✅
│   ├── RATE_LIMIT_STRATEGY.md        # Bulk processing without breaking
│   ├── WHITE_LABELING_STRATEGY.md    # Firm branding on reports
│   ├── UI_BULK_RESULTS_STRATEGY.md   # Display bulk results beautifully
│   ├── MODEL_SELECTION_COMMERCIAL... # Cost/quality tradeoffs
│   ├── COMMERCIAL_IMPLEMENTATION...  # 5-week implementation plan
│   ├── REVENUE_SCALING_TO_1_LAKH.md  # Path to ₹1L revenue
│   └── GOVERNANCE_SUITE_STRATEGY.md  # 5-6 tool platform plan
│
└── Documentation/
    ├── README.md                     # Setup & deployment
    ├── PROJECT_CONTEXT.md            # Full architecture (deprecated — use this file instead)
    ├── SECURITY_CHECKLIST.md         # Pre-launch security review
    ├── START_HERE_ACTION_PLAN.md     # Week-by-week 6-week roadmap
    └── VERSION.md                    # Changelog
```

---

## 🗄️ DATABASE SCHEMA (Supabase)

### Project Details
- **Project name:** labour-compliance-db
- **Project ID:** `nkctfhrnwhnpfehgbzvn`
- **Region:** ap-northeast-2 (Seoul)
- **URL:** https://supabase.com/dashboard/project/nkctfhrnwhnpfehgbzvn

### Tables

#### `labour_laws` — Knowledge Base
```sql
id         bigserial PRIMARY KEY
content    text              -- 1000-char chunks from Labour Code PDF
embedding  vector(768)       -- Gemini embedding-001 (768 dimensions)
```
- **122 rows** as of Feb 28, 2026 (do NOT re-run `ingest.py` — will duplicate)
- Source: `backend/labor_code_2025.pdf`
- **RLS:** Enabled. Authenticated users can SELECT. Service key can INSERT/UPDATE/DELETE.

#### `profiles` — User Management
```sql
id                  uuid PRIMARY KEY (refs auth.users)
full_name           text
email               text
role                text              -- 'admin' or 'user'
company_name        text
company_size        text
industry            text
daily_audit_limit   int               -- Default 3 (admin can change)
is_locked           boolean           -- Admin can lock accounts
is_deleted          boolean           -- Soft delete flag
created_at          timestamptz
```
- **Current users:**
  - Admin: `suhasnayak7@gmail.com` (UID: `4c7a380a-cc14-4d53-8216-2e02cca3f018`)
  - Test user: `suhasanayak7@gmail.com` (UID: `9ad0e4fd-1341-494d-8dd1-931357d1d1e9`)
- **Auto-promotion:** First registered user becomes admin via `handle_new_user` trigger

#### `api_logs` — Audit History
```sql
id                bigserial PRIMARY KEY
user_id           uuid (refs profiles.id)
endpoint          text              -- Always '/audit'
filename          text              -- Hashed for privacy (changed from plaintext)
prompt_tokens     int
completion_tokens int
total_tokens      int
risk_score        int               -- Stored as (100 - compliance_score)
created_at        timestamptz
```
- **6 rows** as of Feb 28, 2026 (6 test audits)
- **RLS:** Users see own logs. Admins see all.

#### `waiting_list` — Pre-Launch Signups
```sql
id        bigserial PRIMARY KEY
email     text
status    text              -- 'pending', 'approved'
created_at timestamptz
```
- **Public INSERT allowed** (with email validation)
- **RLS:** Public can insert. Admins can view/update all.

### Database Functions

#### `match_labour_laws(query_embedding, match_threshold, match_count)`
```sql
-- Vector similarity search for relevant law sections
-- Returns top N chunks by cosine similarity
SELECT id, content, 1 - (embedding <=> query_embedding) AS similarity
FROM public.labour_laws
WHERE similarity > match_threshold
ORDER BY embedding <=> query_embedding
LIMIT match_count;
```
- Called with: `match_threshold=0.5`, `match_count=5`
- Returns most relevant Labour Code sections

#### `handle_new_user()` — Auth Trigger
```sql
-- Fires on INSERT to auth.users
-- Creates profile row
-- Makes first user admin
-- SET search_path = '' (security hardening)
```

---

## 🔌 API ENDPOINTS (FastAPI)

All endpoints in `backend/main.py`. Base URL: `/api` (Vercel serverless) or `http://localhost:8000` (local dev).

### `POST /audit`
**Uploads a policy PDF and runs compliance check**

- **Auth:** Bearer token (Supabase JWT) required
- **Input:** Multipart form — `file` (PDF only)
- **Process:**
  1. Check profile exists, not locked, not deleted
  2. Check daily audit limit (`profiles.daily_audit_limit`)
  3. Extract text from PDF (max 5000 chars)
  4. Generate embedding via `gemini-embedding-001`
  5. Vector search: `match_labour_laws(embedding, 0.5, 5)`
  6. Build prompt with law context + policy text
  7. Send to `gemini-2.5-flash` (with `temperature=0.0`, `seed=42`)
  8. Parse JSON response
  9. Log to `api_logs` (stores `risk_score = 100 - compliance_score`)
  10. Return compliance score + findings

- **Response:**
```json
{
  "compliance_score": 75,
  "findings": [
    "Missing gratuity policy section (Section 4(c) of Code on Social Security)",
    "No mention of working hours (Daily hours exceed 8 hours limit)"
  ]
}
```

### `GET /logs`
**Fetch audit history**

- **Auth:** Bearer token required
- **Returns:** All audits for user (admins see all users' audits)
- **Filters:** Optional user_id (admin only)

### `POST /admin/users`
**Create a new user (admin only)**

- **Auth:** Admin JWT required
- **Body:**
```json
{
  "email": "ca@firm.com",
  "password": "SecurePassword123",
  "role": "user",
  "daily_audit_limit": 5,
  "full_name": "John Doe",
  "company_name": "CA Firm",
  "company_size": "10-50",
  "industry": "Professional Services"
}
```
- **Process:** Creates Supabase auth user (pre-confirmed) + updates profile

### `PUT /admin/users/{user_id}/password`
**Reset user password (admin only)**

- **Auth:** Admin JWT required
- **Body:** `{ "new_password": "NewPassword123" }`

### `GET /health`
**Health check**

- Returns: `{ "status": "ok" }`

---

## 🎨 FRONTEND COMPONENTS

### `App.tsx` — Main Entry
- Handles auth state (`onAuthStateChange`)
- Routes between: Login → Audit tab / Usage tab / Admin tab
- **Audit flow:**
  1. File upload (PDF only)
  2. Progress animation
  3. Results with score + findings accordion
  4. Download PDF report button
- **Score display:** Green (≥80) / Yellow (≥50) / Red (<50)
- **Download:** Opens HTML in new tab → `window.print()`
- **Account guards:** Shows "Access Revoked" or "Account Locked" if deleted/locked

### `Login.tsx`
Email + password login via `supabase.auth.signInWithPassword()`

### `RequestAccess.tsx`
Inserts email into `waiting_list` table for pre-launch signups

### `CheckStatus.tsx`
Checks if email is approved on waiting list

### `AdminDashboard.tsx`
- Lists all users from `profiles` table
- Create new users (calls `POST /admin/users`)
- Lock/unlock, delete, reset passwords per user
- Shows per-user audit count

### `Usage.tsx`
- Audit history table from `GET /logs`
- Token usage stats (sum of total_tokens)

### `lib/supabase.ts`
Supabase client configured with `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY`

---

## 🚀 DEPLOYMENT ARCHITECTURE

```
GitHub (main branch)
    ↓ auto-deploy on push
Vercel (free tier)
    ├── Frontend
    │   ├── Build: cd frontend && npm install && npm run build
    │   ├── Output: frontend/dist/
    │   └── Serve: Static files at /* (except /api/*)
    │
    └── Backend
        ├── Entry: api/index.py
        ├── Runtime: Python 3.9+
        ├── Timeout: 60 seconds per request
        ├── Mount: FastAPI at /api prefix
        └── Routes: /api/* → FastAPI endpoints
```

### CORS Configuration
Allowed origins:
- `localhost:5173` (frontend dev)
- `localhost:3000` (alternative dev)
- `*.vercel.app` (production — regex wildcard)

**To add custom domain:** Update `origins` list in `backend/main.py` + CORS setup

---

## 🔐 ENVIRONMENT VARIABLES

### Backend (`.env` in root + Vercel dashboard)

```env
SUPABASE_URL=https://nkctfhrnwhnpfehgbzvn.supabase.co
SUPABASE_KEY=<service_role_key>        # Service role (bypasses RLS for admin ops)
GEMINI_API_KEY=<your_gemini_api_key>
```

### Frontend (Vite — must be prefixed `VITE_`)

```env
VITE_SUPABASE_URL=https://nkctfhrnwhnpfehgbzvn.supabase.co
VITE_SUPABASE_ANON_KEY=<anon_public_key>
VITE_API_URL=                          # LEAVE EMPTY in Vercel (critical!)
```

### ⚠️ **CRITICAL GOTCHA**
If `VITE_API_URL` is set to `http://localhost:8000` in Vercel dashboard, **production will break silently**. The code falls back to `/api` when empty. Leave it empty.

---

## 📊 CURRENT STATUS & METRICS

### What's Working ✅
- Single policy upload and audit
- Compliance score calculation (0-100)
- Detailed findings with law citations
- Print-to-PDF download
- Email/password auth
- Admin user management
- Basic usage logging
- Reproducible results (seed=42 in Gemini calls)
- Private filenames (hashed, not stored plaintext)

### What's NOT Working ❌
- Bulk processing (5+ policies at once)
- White labeling (firm logo/branding on reports)
- Paid monetization (no Stripe/payment system)
- .docx support (PDF only)
- Email notifications
- Custom domains
- Advanced analytics

### Test Data
- **6 test audits completed**
- **2 users (admin + test user)**
- **122 Labour Code chunks ingested**

---

## 🛣️ IMMEDIATE NEXT STEPS (6-WEEK ROADMAP)

### Week 1: Reproducibility + Security (✅ DONE — 3-4 hours)
- ✅ Add `seed=42` to Gemini calls → identical results 3x
- ✅ Hash filenames in database → no plaintext storage
- ✅ Increase `match_threshold` to 0.5 → better law relevance

**Status:** Completed. Ready for production.

### Week 2: Bulk Processing (10-12 hours) ⏳ IN PROGRESS
Why? CAs will upload 5-10 policies at once. Rate limits will break single-file approach.

**Tasks:**
1. Create `audit_queue` + `audit_batches` tables
2. Build `POST /audit/bulk` endpoint
3. Add background worker (1 file per 35 seconds)
4. Build `GET /audit/batch/{batch_id}` status endpoint
5. Test with 15 policies → verify no 429 errors

**Timeline:** 10-12 hours (Week of Mar 3-9)

### Week 3: White Labeling (8-10 hours)
Why? CAs want their firm's logo/brand on reports. This is the revenue hook.

**Tasks:**
1. Add DB columns: `firm_name`, `firm_logo_url`, `primary_color`, etc.
2. Create `WhiteLabelSetup` page (logo upload, color picker)
3. Build PDF generation with reportlab
4. Create `GET /audit/batch/{batch_id}/download` endpoint

**Timeline:** 8-10 hours (Week of Mar 10-16)

### Week 4: Results UI (10-12 hours)
Why? Beautiful UX closes deals.

**Tasks:**
1. Summary view (score card, risk level, quick actions)
2. Detailed view (expandable policy cards, findings by category)
3. Critical issues view (filter by severity)
4. Live progress display

**Timeline:** 10-12 hours (Week of Mar 17-23)

### Week 5: Monetization (8-10 hours)
Why? You need revenue to sustain.

**Tasks:**
1. Add `usage_plan` + `current_month_audits` columns
2. Implement model routing (free → Flash, paid → Pro)
3. Enforce usage limits
4. Stripe integration + pricing page

**Timeline:** 8-10 hours (Week of Mar 24-30)

### Week 6: Polish & Test (5-6 hours)
End-to-end testing, mobile optimization, bug fixes.

**Timeline:** 5-6 hours (Week of Mar 31-Apr 6)

### Total: 54 hours (1.5 weeks full-time or 9 hours/week part-time)

---

## 💰 MONETIZATION TIERS

Target launch: May 2026 (after 6-week build + 2-week beta)

| Tier | Price | Audits/Month | Target | Notes |
|------|-------|--------------|--------|-------|
| **Free** | ₹0 | 1 | Try before buy | Forces upgrade |
| **CA Individual** | ₹749 | 50 | Solo CAs | Most popular |
| **CA Firm** | ₹2,499 | 300 + white-label | CA firms | Bulk discount |
| **HR Consultant** | ₹7,999 | Unlimited + API | Compliance firms | Enterprise features |

**Unit economics:**
- Cost per audit: ₹0.09 (Gemini 2.5 Flash)
- ₹749 tier margin: ~99%
- Break-even: 1 paying customer (₹27 API costs covered)

**Revenue targets:**
- Week 10: ₹749 (1st paying customer)
- Week 12: ₹3,745 (5 customers)
- Week 16: ₹18,725 (25 customers)
- Week 20: ₹37,450 (50 customers) ← **₹1L annual run rate**

---

## 🎯 KEY DECISIONS & RATIONALE

| Decision | Reason |
|----------|--------|
| **Gemini 2.5 Flash** over Claude | 10-30x cheaper. Claude = ₹3.75/audit vs Gemini = ₹0.09 |
| **Vercel serverless** over dedicated server | Free tier. No always-on costs until revenue starts. |
| **browser `window.print()`** for PDF | No new npm dependencies. Puppeteer would need paid infra. |
| **`compliance_score` (0-100 good)** instead of `risk_score` | More intuitive for CA clients expecting "audit score" framing |
| **Service role key in backend** | Required for admin user creation + bypassing RLS |
| **`SET search_path = public`** in `match_labour_laws` | pgvector operators require schema in scope |
| **Bulk processing before monetization** | Market differentiator. CAs won't pay without bulk upload. |
| **White labeling before monetization** | Revenue hook. CAs won't commit to subscription without branding. |

---

## ⚠️ KNOWN ISSUES & GOTCHAS

### 1. **Linux VM venv is broken**
- The `venv/bin/python3.9` symlink points to macOS CommandLineTools
- **Cannot run Python backend locally in VM**
- **Workaround:** Use Supabase MCP for direct DB queries, or test in cloud

### 2. **`VITE_API_URL` must be empty in Vercel**
- If set to `http://localhost:8000`, production breaks silently
- Code falls back to `/api` when empty (correct behavior)

### 4. **Daily limit message is hardcoded**
- Currently: "Please contact Suhasa to increase your quota."
- **TODO:** Automate approval flow or update message before going public

### 5. ✅ **PDF & DOCX support** (COMPLETED Feb 28, 2026)
- Supports both `.pdf` and `.docx` (Word) files
- Extracts text from paragraphs and tables in Word documents
- Automatically detects file type and routes to appropriate extractor
- Backward compatible with existing PDF workflows

### 6. **Policy text truncation at 5000 chars**
- Very long policies (20+ pages) may not get full representation
- **Low priority:** Can increase if needed, but affects embedding cost

### 7. **Do NOT re-run `ingest.py`**
- The Labour Code PDF is already chunked and embedded (122 rows)
- Re-running will create duplicates
- **If PDF needs updating:** First `DELETE FROM labour_laws;` then run script

---

## 🔒 SECURITY STATUS

### Fixed ✅
| Issue | Fix |
|-------|-----|
| `api_logs` RLS missing policies | Added: users see own, admins see all |
| `labour_laws` RLS missing | Added: authenticated users can read, service key for writes |
| `handle_new_user` mutable search_path | Set to `''` (security hardening) |
| `match_labour_laws` mutable search_path | Set to `public` (needed for pgvector) |
| `waiting_list` open INSERT | Added email format validation |
| Plaintext filenames in logs | Changed to SHA256 hash (privacy) |
| `risk_score` inverted storage logic | Refactored to store actual `compliance_score` directly (Feb 28, 2026) |

### Remaining Warnings ⚠️
| Issue | Status | Notes |
|-------|--------|-------|
| `vector` extension in public schema | Low priority | Moving it would break prod. Skip for now. |
| Leaked password protection | Pro plan only | Not available on free tier. Skip. |

---

## 🔧 RECENT IMPROVEMENTS

### Technical Debt Fixed (Feb 28, 2026)
- ✅ **Renamed** `api_logs.risk_score` → `api_logs.compliance_score`
- ✅ **Fixed** inverted storage logic (now stores actual compliance scores)
- ✅ **Updated** backend to store correct values directly
- ✅ **Created** migration SQL + deployment guide
- **Status:** Database migration deployed. Vercel deployed backend changes.

### New Features Added (Feb 28, 2026)
- ✅ **Added .docx support** — Users can now upload Word documents
- ✅ **Automatic format detection** — Routes PDF/DOCX to appropriate extractor
- ✅ **Table extraction** — Extracts text from tables in Word documents
- ✅ **Backward compatible** — Existing PDF workflows unchanged
- **Status:** Live on Vercel (commit `ee13d13`)

---

## 📞 SUPPORT & CONTACT

- **Owner:** Suhasa Nayak
- **Email:** suhasnayak7@gmail.com
- **GitHub Repo:** Connected to Vercel (auto-deploys on push to `main`)
- **Supabase Project:** https://supabase.com/dashboard/project/nkctfhrnwhnpfehgbzvn

---

## 📚 QUICK REFERENCE

### Local Development

**Frontend:**
```bash
cd frontend
npm install
npm run dev        # http://localhost:5173
```

**Backend:**
```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

### Deploy
```bash
git add .
git commit -m "message"
git push origin main   # Auto-deploys to Vercel
```

### Common Commands

**Check current user role:**
```sql
SELECT id, email, role FROM profiles WHERE id = (SELECT auth.uid());
```

**See audit logs:**
```sql
SELECT user_id, endpoint, total_tokens, created_at FROM api_logs ORDER BY created_at DESC;
```

**Count Labour Code chunks:**
```sql
SELECT COUNT(*) FROM labour_laws;
```

**Test vector search:**
```sql
SELECT content, 1 - (embedding <=> '[...]'::vector) AS similarity
FROM labour_laws
ORDER BY embedding <=> '[...]'::vector
LIMIT 5;
```

---

## 🎓 RESOURCES

- **README.md** — Setup & deployment
- **REPRODUCIBILITY_STRATEGY.md** — Deterministic results (seed, thresholds, filenames)
- **RATE_LIMIT_STRATEGY.md** — Bulk processing without breaking free tier
- **WHITE_LABELING_STRATEGY.md** — Firm branding system
- **UI_BULK_RESULTS_STRATEGY.md** — Beautiful results display
- **COMMERCIAL_IMPLEMENTATION_ROADMAP.md** — Full 5-week plan with code
- **REVENUE_SCALING_TO_1_LAKH.md** — Unit economics & acquisition
- **GOVERNANCE_SUITE_STRATEGY.md** — 5-6 tool platform (post-MVP)

---

**Next Action:** Review `START_HERE_ACTION_PLAN.md` for week-by-week checklist.
