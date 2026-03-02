# Copy-Paste Template Guide: Launch a New Tool in 2 Weeks

**This is the exact checklist to clone AuditAI for a different industry.**

---

## PART 1: Prep Phase (Days 1-3, 3 hours)

### Step 1: Choose Your Industry & Collect Knowledge Base

**Example: Data Privacy Auditor**

```
Industry: Data Privacy / GDPR / CCPA
Domain name: data-privacy.auditai.com
Knowledge base sources:
  - GDPR articles 1-99 (full text)
  - CCPA sections (full text)
  - Privacy Shield docs
  - NIST Privacy Framework
  - ISO 27001 Privacy sections
```

**Task:** Download all relevant PDFs/docs → 50-100MB of text

### Step 2: Prepare Knowledge Base

```bash
# Create folder for new tool
mkdir data-privacy
cd data-privacy

# Create knowledge base file
cat > data_privacy_knowledge_base.pdf << 'EOF'
[Paste all GDPR articles, CCPA sections, etc.]
EOF

# Or use: ingest script that chunks + embeds
```

### Step 3: Prepare Domain & GitHub Repo

```
New Vercel domain: data-privacy.auditai.com
New GitHub repo: github.com/suhasnayak7-kraft/data-privacy-auditor
Database: Same Supabase project (multi-tenant via knowledge base table)
```

---

## PART 2: Copy Backend (Days 4-5, 4 hours)

### Step 1: Copy Folder Structure

```bash
# Clone labour code repo
cp -r labour_code_app data-privacy-auditor

# Keep these (unchanged):
├── api/index.py                 ✅ SAME
├── vercel.json                  ⚠️ Change domain name
├── backend/requirements.txt      ✅ SAME
├── backend/ingest.py           ⚠️ Modify source PDF
├── frontend/                    ✅ Copy, modify branding
└── .env                         ⚠️ New env vars
```

### Step 2: Update Knowledge Base (backend/main.py)

**Original (Labour Code):**
```python
# Line ~200
similar_docs = supabase.rpc(
    "match_labour_laws",
    {
        "query_embedding": query_embedding,
        "match_threshold": 0.5,
        "match_count": 3
    }
).execute()
```

**New (Data Privacy):**
```python
# Change ONLY the function name
similar_docs = supabase.rpc(
    "match_data_privacy_laws",    # ← RENAMED
    {
        "query_embedding": query_embedding,
        "match_threshold": 0.5,
        "match_count": 3
    }
).execute()
```

**That's it.** Everything else stays the same.

### Step 3: Update System Prompt (backend/main.py)

**Original (Line ~252):**
```python
system_instructions = """You are an expert Indian Labour Law Compliance Auditor...
Review the provided Employee Policy and identify specific compliance gaps.
Cite specific sections of the codes."""
```

**New (Data Privacy):**
```python
system_instructions = """You are an expert Data Privacy & GDPR Compliance Auditor.
Review the provided Privacy Policy and identify specific GDPR/CCPA compliance gaps.
Cite specific articles of GDPR, CCPA, or Privacy Shield standards."""
```

**That's it.** Copy-paste, change domain + regulations.

### Step 4: Update Error Messages (backend/main.py)

**Original (Line ~219):**
```python
raise HTTPException(status_code=400,
    detail="Could not extract sufficient text from the PDF. It may be a scanned/image-based document. Please use a text-based PDF.")
```

**New:**
```python
raise HTTPException(status_code=400,
    detail="Could not extract sufficient text from the Privacy Policy. Please use a text-based PDF or Word document.")
```

---

## PART 3: Update Database (Days 4-5, 2 hours)

### Step 1: Create New Knowledge Base Table

**In Supabase SQL Editor:**

```sql
-- Run this ONCE per new tool

CREATE TABLE data_privacy_knowledge_base (
    id BIGSERIAL PRIMARY KEY,
    content TEXT NOT NULL,
    embedding VECTOR(768) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE data_privacy_knowledge_base ENABLE ROW LEVEL SECURITY;

-- RLS: Authenticated users can read
CREATE POLICY "Authenticated users can read"
  ON data_privacy_knowledge_base
  FOR SELECT USING (auth.role() = 'authenticated');

-- RLS: Service role can insert/update/delete
CREATE POLICY "Service role can manage"
  ON data_privacy_knowledge_base
  FOR ALL USING (auth.role() = 'service_role');

-- Create vector search function
CREATE OR REPLACE FUNCTION match_data_privacy_laws(
    query_embedding VECTOR,
    match_threshold FLOAT,
    match_count INT
)
RETURNS TABLE (
    id BIGINT,
    content TEXT,
    similarity FLOAT
)
LANGUAGE SQL
STABLE
SET search_path = 'public'
AS $$
    SELECT
        id,
        content,
        1 - (embedding <=> query_embedding) AS similarity
    FROM data_privacy_knowledge_base
    WHERE 1 - (embedding <=> query_embedding) > match_threshold
    ORDER BY embedding <=> query_embedding
    LIMIT match_count;
$$;
```

That's it. Copy the table creation code, just change:
- `labour_laws` → `data_privacy_knowledge_base`
- `match_labour_laws` → `match_data_privacy_laws`

### Step 2: Ingest Knowledge Base

**Modify backend/ingest.py:**

```python
# BEFORE:
pdf_path = "labor_code_2025.pdf"
table_name = "labour_laws"

# AFTER:
pdf_path = "data_privacy_knowledge_base.pdf"  # Your new PDF
table_name = "data_privacy_knowledge_base"    # Your new table name
```

Then run:
```bash
cd backend
python ingest.py
```

This will:
- Read your PDF
- Chunk into ~1000 char segments
- Generate embeddings
- Insert into `data_privacy_knowledge_base` table

---

## PART 4: Update Frontend (Days 5-6, 3 hours)

### Step 1: Update Branding

**File: frontend/src/App.tsx**

```typescript
// Original
const appTitle = "AuditAI — Labour Code Compliance";
const appDescription = "Check compliance against India's 4 Labour Codes";

// New
const appTitle = "DataGuard — GDPR & CCPA Compliance";
const appDescription = "Check privacy policy compliance against GDPR, CCPA, Privacy Shield";
```

### Step 2: Update File Upload Message

**File: frontend/src/App.tsx (audit section)**

```typescript
// Original
<p>Upload your company's Employee Policy (PDF or Word)</p>
<p>Get instant compliance score against India's Labour Codes</p>

// New
<p>Upload your Privacy Policy (PDF or Word)</p>
<p>Get instant GDPR & CCPA compliance score</p>
```

### Step 3: Update Score Interpretation

**File: frontend/src/App.tsx (results section)**

```typescript
// Original
const getScoreColor = (score: number) => {
  if (score >= 80) return "green";   // Fully compliant
  if (score >= 50) return "yellow";  // Mostly compliant
  return "red";                      // Critical gaps
}

// New (same code, just update labels)
const getScoreInterpretation = (score: number) => {
  if (score >= 80) return "✅ Fully GDPR Compliant";
  if (score >= 60) return "⚠️ Minor GDPR gaps detected";
  return "🚨 Critical GDPR compliance issues";
}
```

### Step 4: Update Login Page

**File: frontend/src/Login.tsx**

```typescript
// Original heading
<h1>Labour Code Auditor</h1>
<p>AI-powered compliance auditing for CAs and HR consultants</p>

// New
<h1>DataGuard - GDPR Auditor</h1>
<p>AI-powered privacy compliance auditing for SaaS companies and legal teams</p>
```

### Step 5: Update Admin Dashboard

**File: frontend/src/AdminDashboard.tsx**

```typescript
// Original
<h2>Labour Code Audit Logs</h2>
<p>Total audits completed: {logs.length}</p>

// New
<h2>Privacy Compliance Audits</h2>
<p>Total GDPR audits completed: {logs.length}</p>
```

---

## PART 5: Deploy (Days 6-7, 2 hours)

### Step 1: Update GitHub Repo Settings

```bash
# Create new repo
git init
git remote add origin https://github.com/suhasnayak7-kraft/data-privacy-auditor

# Push code
git add .
git commit -m "Initial commit: Data Privacy Auditor based on AuditAI template"
git push origin main
```

### Step 2: Update Vercel

**In Vercel dashboard:**

```
Project name: data-privacy-auditor
Domain: data-privacy.auditai.com
Build command: cd frontend && npm install && npm run build
Environment variables:
  - SUPABASE_URL: [same as labour-code]
  - SUPABASE_KEY: [same as labour-code]
  - GEMINI_API_KEY: [same as labour-code]
  - VITE_SUPABASE_URL: [same]
  - VITE_SUPABASE_ANON_KEY: [same]
  - VITE_API_URL: [leave empty]
```

Vercel auto-deploys from GitHub. Done.

### Step 3: Update Environment Variables

```env
# .env (local testing)
SUPABASE_URL=https://nkctfhrnwhnpfehgbzvn.supabase.co  [same]
SUPABASE_KEY=[same service role key]
GEMINI_API_KEY=[same API key]

# Frontend uses same Supabase project (multi-tenant)
VITE_SUPABASE_URL=[same]
VITE_SUPABASE_ANON_KEY=[same]
VITE_API_URL=[empty for production]
```

---

## PART 6: Testing (Day 7, 1 hour)

### Step 1: Test PDF Upload

```
1. Go to https://data-privacy.auditai.com
2. Create test account
3. Upload a privacy policy PDF
4. Verify:
   - Score displays (0-100)
   - Findings show compliance gaps
   - Results mention GDPR/CCPA
   - No errors in console
```

### Step 2: Test DOCX Upload

```
1. Create test Word document with privacy policy text
2. Upload it
3. Verify same as PDF test
```

### Step 3: Test Admin Panel

```
1. Log in as admin
2. View user list
3. Check audit logs
4. Verify tool-specific data shows (GDPR findings, etc.)
```

---

## CHECKLIST: What to Change

### Backend (30 seconds)
- [ ] Change knowledge base table name (`labour_laws` → `data_privacy_knowledge_base`)
- [ ] Change RPC function name (`match_labour_laws` → `match_data_privacy_laws`)
- [ ] Update system prompt (2 sentences)
- [ ] Update error messages (1-2 messages)

### Frontend (2 minutes)
- [ ] Update app title
- [ ] Update app description
- [ ] Update score interpretation
- [ ] Update login page copy
- [ ] Update admin dashboard labels

### Database (5 minutes)
- [ ] Copy table creation SQL (change table name)
- [ ] Copy function creation SQL (change function name)
- [ ] Run ingest.py with new PDF

### Deployment (5 minutes)
- [ ] Push to GitHub
- [ ] Configure Vercel domain
- [ ] Set environment variables (reuse same Supabase)

**Total: ~15 minutes of actual changes. Rest is ingesting knowledge base (~1-2 hours).**

---

## WHAT STAYS EXACTLY THE SAME

```
✅ Authentication system (0 changes)
✅ User profiles (0 changes)
✅ Admin dashboard structure (0 changes)
✅ Audit flow UX (0 changes)
✅ PDF/DOCX extraction (0 changes)
✅ Embedding generation (0 changes)
✅ Gemini 2.5 Flash call (0 changes)
✅ JSON response format (0 changes)
✅ Download PDF report (0 changes)
✅ API logging (0 changes)
✅ Usage tracking (0 changes)
✅ Rate limiting (0 changes)
✅ Vercel deployment (0 changes)
✅ Supabase project (same database)
```

**95% of code is reused. Only 5% changes per tool.**

---

## SCALING: How to Do This 15 Times

Once you've built 2-3 tools, you'll see the pattern. Create a **template generator script**:

```bash
# generate-tool.sh
./generate-tool.sh "data-privacy" "GDPR/CCPA Auditor" "data_privacy_kb.pdf"

This would:
1. Copy folder structure
2. Rename all tables/functions
3. Update prompts
4. Deploy to Vercel
5. Return live URL

That's it. 5 minutes to launch a new tool.
```

---

## ESTIMATED TIMELINE

```
Day 1-3: Collect knowledge base (3 hours)
Day 4-5: Update backend + database (2 hours)
Day 5-6: Update frontend (1.5 hours)
Day 6-7: Deploy + test (1 hour)
Day 7: Get first users

Total: ~8 hours development per tool
Total: 2 weeks from idea to launch (includes learning, testing, promotion)
```

**Next tool: 3-4 days (familiar process)**

---

## EXAMPLE: Tax Compliance Auditor (2nd Tool)

By the 2nd tool, this becomes a template:

```python
# backend/main.py (change only these lines)
"match_tax_compliance_laws"  # Line ~200
"You are an expert Indian Tax Compliance Auditor..."  # Line ~252
"Check compliance against Income Tax Act, GST laws, TDS rules"  # Error message
```

```sql
-- Supabase
CREATE TABLE tax_compliance_knowledge_base (...)
CREATE FUNCTION match_tax_compliance_laws(...) (...)
```

```typescript
// frontend
<h1>TaxGuard — Tax Compliance Auditor</h1>
"Check compliance against India's Income Tax Act and GST laws"
```

Done. Deployed. Next.

---

## SUCCESS METRICS

After launch, track:
- Signups: Target 100 in first month
- Paying users: Target 20 in month 2
- MRR: Target ₹5-10K by month 3
- If <₹2K by month 3: Kill it, try next tool
- If >₹5K by month 3: Double down (add features, marketing)

---

**That's it. This is how you build 15 tools using the same template.**

**Start with Data Privacy Auditor tomorrow. Ship in 2 weeks.**
