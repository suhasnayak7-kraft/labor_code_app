# AuditAI — Labour Code Compliance App
## Full Context Document for New Sessions

> **Purpose of this doc:** Drop this into any new Claude session along with the project folder to get full context instantly. Last updated: Feb 28, 2026.

---

## 1. What the App Does

**AuditAI** is a SaaS tool for Indian CAs, HR consultants, and compliance professionals. It lets users upload a company's Employee Policy PDF and instantly checks how compliant it is against India's 4 new Labour Codes (2025 consolidation of 44 laws).

**Core user flow:**
1. User logs in (email/password auth via Supabase)
2. Uploads a company policy PDF
3. App extracts text → generates embedding → vector-searches relevant Labour Code sections → sends to Gemini 2.5 Flash for analysis
4. Returns a **Compliance Score (0–100, 100 = fully compliant)** + detailed findings citing specific law sections
5. User can download a print-ready PDF report
6. Admins can manage users, set daily audit limits, lock/unlock accounts

**Current status:** Live on Vercel free tier. Connected to Supabase (PostgreSQL + pgvector). GitHub-connected auto-deploy.

---

## 2. Tech Stack

| Layer | Technology | Notes |
|---|---|---|
| Frontend | React + Vite + TypeScript | ShadCN UI, Framer Motion, Tailwind CSS |
| Backend | FastAPI (Python) | Deployed as Vercel serverless function |
| Database | Supabase (PostgreSQL + pgvector) | Vector similarity search |
| AI Model | Gemini 2.5 Flash | ~₹0.09 per audit |
| Embeddings | gemini-embedding-001 | 768 dimensions, free at MVP scale |
| Auth | Supabase Auth | Email/password, JWT tokens |
| Deployment | Vercel free tier | Frontend static + backend serverless at `/api/*` |
| Version Control | GitHub | Auto-deploys on push to `main` |

---

## 3. Project File Structure

```
labour_code_app/
├── .env                          # Local env vars (never commit)
├── vercel.json                   # Vercel build + routing config
├── api/
│   └── index.py                  # Vercel serverless entry — mounts FastAPI under /api
├── backend/
│   ├── main.py                   # Core FastAPI app — ALL API endpoints live here
│   ├── ingest.py                 # One-time script: PDF → chunks → embeddings → Supabase
│   ├── labor_code_2025.pdf       # The actual 4 Labour Codes PDF (source of truth)
│   ├── requirements.txt          # Python dependencies
│   └── venv/                     # Local Python venv (macOS path — won't work in Linux VM)
└── frontend/
    ├── src/
    │   ├── App.tsx               # Main app — auth flow, audit UI, results, download report
    │   ├── Login.tsx             # Login screen component
    │   ├── RequestAccess.tsx     # Waiting list signup form
    │   ├── CheckStatus.tsx       # Check waiting list status by email
    │   ├── AdminDashboard.tsx    # Admin panel — user management, create users
    │   ├── Usage.tsx             # API usage/token dashboard
    │   └── lib/
    │       └── supabase.ts       # Supabase client (uses VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY)
    ├── index.html
    ├── vite.config.ts
    └── package.json
```

---

## 4. Environment Variables

### Backend (`.env` in root, also set in Vercel dashboard)

```env
SUPABASE_URL=https://nkctfhrnwhnpfehgbzvn.supabase.co
SUPABASE_KEY=<service_role_key>        # Service role — bypasses RLS for admin ops
GEMINI_API_KEY=<your_gemini_api_key>
```

### Frontend (Vite — must be prefixed VITE_)

```env
VITE_SUPABASE_URL=https://nkctfhrnwhnpfehgbzvn.supabase.co
VITE_SUPABASE_ANON_KEY=<anon_public_key>
VITE_API_URL=                          # LEAVE EMPTY in Vercel — falls back to /api (correct)
                                       # If set to localhost:8000 it will break production!
```

> ⚠️ **Known gotcha:** If `VITE_API_URL` is set to `http://localhost:8000` in the Vercel dashboard, production will break. It must be empty so the code falls back to `/api`.

---

## 5. Supabase Project Details

- **Project name:** labour-compliance-db
- **Project ID:** `nkctfhrnwhnpfehgbzvn`
- **Region:** ap-northeast-2 (Seoul)
- **Dashboard:** https://supabase.com/dashboard/project/nkctfhrnwhnpfehgbzvn

### Database Tables

#### `labour_laws` — The Knowledge Base
```sql
id        bigserial PRIMARY KEY
content   text                    -- 1000-char chunks of the Labour Code PDF
embedding vector(768)             -- Gemini embedding-001 embeddings
```
- **122 rows** as of Feb 28, 2026 (ingest.py has been run — do NOT run again or you'll duplicate)
- Source PDF: `backend/labor_code_2025.pdf`
- **RLS:** Enabled. Authenticated users can SELECT. Only service key can INSERT/UPDATE/DELETE.

#### `profiles` — User Management
```sql
id                uuid PRIMARY KEY (references auth.users)
full_name         text
email             text
role              text        -- 'admin' or 'user'
company_name      text
company_size      text
industry          text
daily_audit_limit int         -- default 3 (admin can change per user)
is_locked         boolean     -- admin can lock accounts
is_deleted        boolean     -- soft delete
created_at        timestamptz
```
- **2 users** as of Feb 28, 2026
  - Admin: `suhasnayak7@gmail.com` (UID: `4c7a380a-cc14-4d53-8216-2e02cca3f018`)
  - Test user: `suhasanayak7@gmail.com` (UID: `9ad0e4fd-1341-494d-8dd1-931357d1d1e9`)
- First user registered automatically becomes admin (via `handle_new_user` trigger)

#### `api_logs` — Audit History
```sql
id                bigserial PRIMARY KEY
user_id           uuid (references profiles.id)
endpoint          text        -- always '/audit'
filename          text        -- uploaded PDF filename
prompt_tokens     int
completion_tokens int
total_tokens      int
risk_score        int         -- stored as (100 - compliance_score) for backward compat
created_at        timestamptz
```
- **6 rows** as of Feb 28, 2026 (6 test audits done)
- **RLS:** Users see only their own logs. Admins see all.

#### `waiting_list` — Pre-launch Signups
```sql
id          bigserial PRIMARY KEY
email       text
status      text        -- e.g. 'pending', 'approved'
created_at  timestamptz
```
- Public INSERT allowed (with email validation)
- Admins can view/update all entries

### Database Functions

#### `match_labour_laws(query_embedding, match_threshold, match_count)` — Vector Search
```sql
-- Fixed search_path = public (required for vector operators to work)
-- Returns top N law chunks by cosine similarity to the query embedding
SELECT id, content, 1 - (embedding <=> query_embedding) AS similarity
FROM public.labour_laws
WHERE similarity > match_threshold
ORDER BY embedding <=> query_embedding
LIMIT match_count;
```
Called with: `match_threshold=0.5`, `match_count=5`

#### `handle_new_user()` — Auth Trigger
```sql
-- Fires on INSERT to auth.users
-- Creates profile row, makes first user admin
-- Fixed: SET search_path = '' (security hardening)
```

---

## 6. API Endpoints (FastAPI — `backend/main.py`)

### `POST /audit`
- **Auth:** Bearer token (Supabase JWT) required
- **Input:** Multipart form — `file` (PDF only)
- **Process:**
  1. Check profile exists, not locked, not deleted
  2. Check daily audit limit (from `profiles.daily_audit_limit`)
  3. Extract text from PDF (`pypdf`)
  4. Generate embedding for first 5000 chars (`gemini-embedding-001`, 768-dim)
  5. Vector search: `match_labour_laws(embedding, 0.5, 5)`
  6. Build prompt with law context + policy text → send to `gemini-2.5-flash`
  7. Parse JSON response → extract `compliance_score` + `findings`
  8. Log to `api_logs` (stores `risk_score = 100 - compliance_score` for DB compat)
  9. Return `{ compliance_score: int, findings: string[] }`
- **Score interpretation:**
  - 90–100: Fully compliant
  - 70–89: Mostly compliant, minor gaps
  - 50–69: Moderate issues, corrective action needed
  - < 50: Critical non-compliance, immediate legal risk

### `GET /logs`
- **Auth:** Bearer token required
- **Returns:** All audit logs for the user (admins get all users' logs)

### `POST /admin/users`
- **Auth:** Admin JWT required
- **Body:** `{ email, password, role, daily_audit_limit, full_name, company_name, company_size, industry }`
- **Process:** Creates Supabase auth user (pre-confirmed) + updates profile with limits/industry

### `PUT /admin/users/{user_id}/password`
- **Auth:** Admin JWT required
- **Body:** `{ new_password }`
- **Process:** Resets password via Supabase admin API

---

## 7. Frontend Components (`frontend/src/`)

### `App.tsx` — Main Entry Point
- Handles auth state (Supabase `onAuthStateChange`)
- Fetches user `profile` on login
- Routes between: Login → Audit tab / Usage tab / Admin tab
- **Audit flow:** File upload → progress animation → results with score + findings accordion
- **Score display:** Green (≥80) / Yellow (≥50) / Red (<50)
- **Download Report:** Opens print-ready HTML in new tab → triggers `window.print()`. No new npm dependencies. Includes score, color-coded band, all findings, legal disclaimer.
- **Account guards:** Shows "Access Revoked" or "Account Locked" screens if `is_deleted` or `is_locked`

### `Login.tsx`
- Email + password login via `supabase.auth.signInWithPassword()`

### `RequestAccess.tsx`
- Inserts email into `waiting_list` table for pre-launch signups

### `CheckStatus.tsx`
- Lets users check if their email is on the waiting list

### `AdminDashboard.tsx`
- Lists all users (from `profiles` table)
- Create new users (calls `POST /admin/users`)
- Lock/unlock, delete, reset passwords per user
- Shows per-user audit count

### `Usage.tsx`
- Shows audit history table from `GET /logs`
- Token usage stats (sum of total_tokens across all audits)

### `lib/supabase.ts`
- Supabase client initialized with `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY`
- Used for auth and direct Supabase queries from frontend

---

## 8. Deployment Architecture

```
GitHub (main branch)
    ↓ auto-deploy
Vercel (free tier)
    ├── Frontend: React/Vite static build
    │   └── Output: frontend/dist/
    │   └── Build command: cd frontend && npm install && npm run build
    │
    └── Backend: Python serverless function
        └── Entry: api/index.py (maxDuration: 60s)
        └── Routes: /api/* → FastAPI backend
        └── Rewrites: /* → frontend SPA

api/index.py mounts FastAPI app under /api prefix:
    app.mount("/api", backend_app)

CORS allows:
    - localhost:5173 (dev)
    - localhost:3000 (dev)
    - *.vercel.app (regex, prod)
```

---

## 9. How Ingest Works (One-time, Already Done)

`backend/ingest.py`:
1. Reads `backend/labor_code_2025.pdf`
2. Extracts all text with `pypdf`
3. Chunks into ~1000 character segments
4. For each chunk: generates 768-dim embedding via `gemini-embedding-001`
5. Inserts `{ content, embedding }` into `labour_laws` table

**Status: Already run. 122 rows in DB. Do NOT run again** — it will create duplicates. If you need to re-ingest (e.g. updated PDF), first `DELETE FROM labour_laws;` then run the script.

Run command (from backend dir with venv active):
```bash
python ingest.py
```

---

## 10. Security Status (as of Feb 2026)

### Fixed ✅
| Issue | Fix |
|---|---|
| `api_logs` RLS — no policies | Added: users see own logs, admins see all |
| `labour_laws` RLS — no policies | Added: authenticated users can read, service key for writes |
| `handle_new_user` — mutable search_path | `SET search_path = ''` |
| `match_labour_laws` — mutable search_path | `SET search_path = public` (needed for vector operators) |
| `waiting_list` — open INSERT | Tightened with email format validation |

### Remaining Warnings ⚠️
| Issue | Status |
|---|---|
| `vector` extension in public schema | Low priority — moving it would break production. Skip for now. |
| Leaked password protection disabled | **Pro plan only** — not available on free tier. Skip. |

---

## 11. Known Issues & Gotchas

1. **`venv/bin/python3.9` is broken in Linux VM** — it's a symlink to macOS `CommandLineTools` path. Cannot run Python backend locally in the VM. Use Supabase MCP for DB queries instead.

2. **`VITE_API_URL` must be empty in Vercel** — The code falls back to `/api` in production. If someone accidentally sets it to `localhost:8000`, production breaks silently.

3. **`risk_score` column in `api_logs`** — The DB column is called `risk_score` but the app now uses `compliance_score` (inverse logic). Backend stores `100 - compliance_score` in DB for backward compat. Frontend works with `compliance_score` from the API response.

4. **Daily limit message** — Currently hardcoded to say "Please contact Suhasa to increase your quota." Update this before going to real customers.

5. **CORS** — Only `*.vercel.app` and localhost are allowed. If you add a custom domain, you must add it to the `origins` list in `main.py`.

6. **PDF only** — Only `.pdf` files accepted. No `.docx` support yet.

7. **Truncation** — Policy text is truncated to 5000 chars for embedding generation. Very long policies (20+ pages) may not get full representation in the vector search.

---

## 12. Next Features to Build (Priority Order)

### For CA Monetization (High Priority)
1. **Multi-client dashboard** — Admin/CA can see all their client companies' audit scores in one view
2. **White-label reports** — CA's own logo/brand on the downloaded PDF report
3. **Bulk upload** — Upload 5–10 policies at once, get a summary table
4. **Audit history per company** — Track score changes over time (company → policy version history)

### Product Improvements
5. **`.docx` support** — Many companies share policies as Word docs
6. **Custom domain** — Move off `*.vercel.app` for credibility
7. **Email notification** — Send audit report to user's email automatically
8. **Shareable report link** — Generate a URL to share with clients without logging in

### Monetization Infrastructure
9. **Razorpay integration** — Accept payments for subscription tiers
10. **Usage-based billing** — Track audits per client, auto-restrict when limit hit
11. **Waitlist approval flow** — Admin approves waitlist → user gets email with login credentials

---

## 13. Monetization Plan

| Tier | Price | Audits/month | Target |
|---|---|---|---|
| CA Individual | ₹999/mo | 50 | Solo practicing CAs |
| CA Firm | ₹3,499/mo | 300 + white-label | CA firms, boutique consultancies |
| HR Consultant | ₹7,999/mo | Unlimited + API | Labour law consultancies |

**Cost per audit (Gemini 2.5 Flash):** ~₹0.09
**Supabase + Vercel free until ~1,000 audits/month**
**Margin at ₹999 tier: ~99%**

**Distribution strategy:**
- CA WhatsApp groups (Bangalore, Mumbai, Delhi CA associations)
- Contra and LinkedIn cold outreach to HR compliance heads
- Free 5-audit trial, no credit card

---

## 14. Git Status

- **Repo:** Connected to GitHub, auto-deploys to Vercel on push to `main`
- **Last commit:** `981c894` — Fixed compliance_score direction + added Download Report button
- **Git config set:**
  ```bash
  git config user.email "suhasnayak7@gmail.com"
  git config user.name "Suhasa"
  ```

---

## 15. Key Decisions Made (and Why)

| Decision | Reason |
|---|---|
| Gemini 2.5 Flash over Claude | 10–30x cheaper. Claude Sonnet = ₹3.75/audit vs Gemini = ₹0.09/audit |
| Vercel serverless over separate server | Free tier. No always-on cost until real revenue. |
| Browser `window.print()` for PDF report | No new npm dependencies, works on Vercel free tier. jsPDF/puppeteer would need paid infra. |
| `compliance_score` (0–100 good) instead of `risk_score` | More intuitive for CA clients who expect "audit score" framing |
| Service role key used in backend | Required for admin user creation and bypassing RLS for admin ops |
| `SET search_path = public` for `match_labour_laws` | `SET search_path = ''` broke vector operators — pgvector operators require schema in scope |
