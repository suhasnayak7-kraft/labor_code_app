# Project Context: Labour Code Auditor

## Status: 🏗️ INITIALIZATION
- Supabase Tables: `labour_laws`, `api_logs` (Created)
- API Keys: Supabase & Gemini (Ready)
- Environment: Python 3.13 / React 18 / TypeScript

## Database Schema (Supabase)
- **Table: `labour_laws`**
  - `id`: bigserial
  - `content`: text
  - `embedding`: vector(768) (Optimized for Gemini text-embedding-004)
- **Table: `api_logs`**
  - `id`: bigserial
  - `created_at`: timestamptz
  - `endpoint`: text
  - `prompt_tokens`, `completion_tokens`, `total_tokens`: int

## Planned Architecture
- **Backend:** FastAPI (Port 8000)
- **Frontend:** Vite + React + Shadcn (Port 5173)
- **Primary AI Model:** Gemini 1.5 Flash

