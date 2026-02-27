# AuditAI — Labour Code Compliance App

AI-powered compliance auditing tool for Indian CAs, HR consultants, and compliance professionals. Upload a company's Employee Policy PDF and get an instant compliance score against India's 4 new Labour Codes (2025), with detailed findings citing specific law sections.

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React + Vite + TypeScript (ShadCN UI, Tailwind CSS) |
| Backend | FastAPI (Python) — deployed as Vercel serverless function |
| Database | Supabase (PostgreSQL + pgvector) |
| AI Model | Gemini 2.5 Flash |
| Auth | Supabase Auth (email/password, JWT) |
| Deployment | Vercel free tier |

## Project Structure

```
labour_code_app/
├── vercel.json           # Vercel build + routing config
├── api/
│   └── index.py          # Vercel serverless entry — mounts FastAPI under /api
├── backend/
│   ├── main.py           # Core FastAPI app — all API endpoints
│   ├── ingest.py         # One-time script: PDF → embeddings → Supabase
│   ├── labor_code_2025.pdf
│   └── requirements.txt
└── frontend/
    ├── src/
    │   ├── App.tsx       # Main app — auth, audit flow, results, PDF report
    │   ├── Login.tsx
    │   ├── AdminDashboard.tsx
    │   ├── Usage.tsx
    │   └── lib/supabase.ts
    └── package.json
```

## Local Development

### Frontend

```bash
cd frontend
npm install
npm run dev       # Starts at http://localhost:5173
```

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate   # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

### Environment Variables

Create a `.env` file in the project root (never commit this):

```env
# Backend
SUPABASE_URL=https://nkctfhrnwhnpfehgbzvn.supabase.co
SUPABASE_KEY=<service_role_key>
GEMINI_API_KEY=<your_gemini_api_key>

# Frontend (Vite — must be prefixed VITE_)
VITE_SUPABASE_URL=https://nkctfhrnwhnpfehgbzvn.supabase.co
VITE_SUPABASE_ANON_KEY=<anon_public_key>
VITE_API_URL=http://localhost:8000   # Dev only — leave EMPTY in Vercel
```

> ⚠️ **Production gotcha:** `VITE_API_URL` must be **empty** in the Vercel dashboard. The code falls back to `/api` (the correct serverless path). If set to `localhost:8000`, production silently breaks.

## Deployment (Vercel)

The repo is GitHub-connected with auto-deploy on push to `main`.

**Required Vercel environment variables (set in dashboard):**

| Variable | Where | Notes |
|---|---|---|
| `SUPABASE_URL` | Backend | Supabase project URL |
| `SUPABASE_KEY` | Backend | Service Role Key — bypasses RLS for admin ops |
| `GEMINI_API_KEY` | Backend | Gemini API access key |
| `VITE_SUPABASE_URL` | Frontend | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Frontend | Anon/public key |
| `VITE_API_URL` | Frontend | **Leave empty** — falls back to `/api` |

## Key Notes

- **Do NOT re-run `ingest.py`** — the Labour Code PDF has already been embedded (122 rows in Supabase). Re-running will create duplicates. If the PDF is updated, first run `DELETE FROM labour_laws;` then re-ingest.
- **Adding a custom domain** requires updating the `origins` CORS list in `backend/main.py`.
- **Compliance score** is 0–100 (100 = fully compliant). Stored as `risk_score = 100 - compliance_score` in the DB for backward compatibility — the API returns `compliance_score`.

## Documentation

- [`PROJECT_CONTEXT.md`](./PROJECT_CONTEXT.md) — Full architecture, DB schema, API docs, known issues, roadmap
- [`SECURITY_CHECKLIST.md`](./SECURITY_CHECKLIST.md) — Pre-launch security review
- [`VERSION.md`](./VERSION.md) — Version history and changelog
