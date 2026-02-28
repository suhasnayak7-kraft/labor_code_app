# 8. Tool Scaffolding Template: Build New Tools in 1-2 Days

Complete checklist and template for building a new compliance tool in minimal time.

---

## Pre-Build Checklist (Before Day 1)

- [ ] Tool name & slug (e.g., 'gst-checker')
- [ ] Tool description (2-3 sentences)
- [ ] Icon/emoji for tool card
- [ ] Minimum pricing tier (free/pro/business)
- [ ] Knowledge base source(s) (URLs or files)
- [ ] Compliance rules or standards to check
- [ ] Sample test document

---

## Day 1: Setup & Backend (4-5 hours)

### **Step 1: Database Preparation**

```sql
-- 1. Add tool to tools table
INSERT INTO tools (slug, name, description, category, min_plan_tier, enabled)
VALUES (
  'gst-checker',
  'GST Compliance Checker',
  'Verify GST filings for compliance',
  'Tax',
  'pro',
  true
);

-- 2. Create tool-specific audit log table
CREATE TABLE gst_audit_logs (
  id bigserial PRIMARY KEY,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  api_log_id bigint REFERENCES api_logs(id),

  -- GST-specific fields
  gst_number text,
  filing_period text,
  compliance_score int,
  status text,
  issues jsonb,
  recommendations jsonb,

  created_at timestamptz DEFAULT now()
);

ALTER TABLE gst_audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see own gst audits" ON gst_audit_logs
  FOR SELECT USING (auth.uid() = user_id);

CREATE INDEX idx_gst_audit_logs_user_id ON gst_audit_logs(user_id);
```

### **Step 2: Knowledge Base Ingestion**

```python
# backend/tools/knowledge_base_loader.py

async def ingest_gst_knowledge_base():
    """Load GST compliance data into embeddings"""
    from shared.embeddings import generate_embedding
    from shared.db import supabase

    # Option A: Download from public source
    import requests
    response = requests.get("https://www.gst.gov.in/api/...")
    content = response.json()

    # Option B: Load from markdown
    with open("backend/knowledge_base/gst_rules.md") as f:
        content = f.read()

    # Chunk content (max 3000 chars per chunk)
    chunks = chunk_text(content, 3000)

    # Generate embeddings for each chunk
    for i, chunk in enumerate(chunks):
        embedding = await generate_embedding(chunk)

        await supabase.table('embeddings').insert({
            'tool_id': 'gst-checker',
            'content': chunk,
            'source_document': 'GST Rules 2023',
            'embedding': embedding,
            'chunk_index': i,
        })

    print(f"✓ Ingested {len(chunks)} chunks for GST Checker")

# Run once on setup
# python -c "import asyncio; from tools.knowledge_base_loader import ingest_gst_knowledge_base; asyncio.run(ingest_gst_knowledge_base())"
```

### **Step 3: Backend Route** (20 lines)

```python
# backend/tools/gst_checker.py

from fastapi import APIRouter, UploadFile, File, Depends, HTTPException
from shared.auth import get_current_user
from shared.db import supabase
from shared.embeddings import generate_embedding, search_embeddings, call_gemini
from models.gst_checker import GstAuditResponse
import logging

router = APIRouter(tags=["gst-checker"])
logger = logging.getLogger(__name__)

TOOL_ID = "gst-checker"
SYSTEM_PROMPT = """You are a GST compliance expert. Analyze the GST filing document and:
1. Check against current GST rules and procedures
2. Identify compliance issues (if any)
3. Provide recommendations
4. Return JSON: {compliance_score: int 0-100, status: str, issues: list, recommendations: list}"""

@router.post("/gst-checker/verify")
async def verify_gst_filing(
    file: UploadFile = File(...),
    current_user = Depends(get_current_user),
):
    """Verify GST filing document for compliance"""

    try:
        # Gatekeeper
        if current_user.is_locked:
            raise HTTPException(status_code=403, detail="Account locked")
        if current_user.audits_run_today >= current_user.daily_audit_limit:
            raise HTTPException(status_code=429, detail="Daily limit reached")

        # Extract text
        file_bytes = await file.read()
        from shared.storage import extract_text_from_pdf
        text = extract_text_from_pdf(file_bytes)

        # Vector search
        embedding = await generate_embedding(text)
        relevant_rules = await search_embeddings(embedding, TOOL_ID, match_count=5)

        # AI analysis
        result = await call_gemini(
            text=text,
            relevant_context=[rule['content'] for rule in relevant_rules],
            tool_id=TOOL_ID,
            system_prompt=SYSTEM_PROMPT,
        )

        # Log usage & results
        await supabase.table('api_logs').insert({
            'user_id': current_user.id,
            'tool_id': TOOL_ID,
            'endpoint': '/verify',
            'status_code': 200,
            'prompt_tokens': result['prompt_tokens'],
            'completion_tokens': result['completion_tokens'],
            'total_tokens': result['total_tokens'],
        })

        await supabase.table('gst_audit_logs').insert({
            'user_id': current_user.id,
            'compliance_score': result['compliance_score'],
            'status': result['status'],
            'issues': result['issues'],
            'recommendations': result['recommendations'],
        })

        return GstAuditResponse(**result)

    except Exception as e:
        logger.error(f"GST audit error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/gst-checker/status")
async def check_status(current_user = Depends(get_current_user)):
    """Check daily limit"""
    remaining = current_user.daily_audit_limit - current_user.audits_run_today
    return {"audits_remaining": max(0, remaining)}
```

### **Step 4: Pydantic Models** (15 lines)

```python
# backend/models/gst_checker.py

from pydantic import BaseModel
from typing import List

class GstAuditResponse(BaseModel):
    compliance_score: int  # 0-100
    status: str  # 'compliant', 'has_errors'
    issues: List[str]
    recommendations: List[str]
    model_id: str
    response_time_ms: int
```

---

## Day 2: Frontend & Testing (4-5 hours)

### **Step 5: Frontend Component** (50 lines)

```typescript
// frontend/src/tools/gst-checker/GstChecker.tsx

import { useState } from 'react';
import { Card, Tabs, Button, FileUpload, Alert } from '@/components';
import { useGstVerify } from './hooks/useGstVerify';
import { ResultsDisplay } from './components/ResultsDisplay';
import { VerificationHistory } from './components/VerificationHistory';

export function GstChecker() {
  const [activeTab, setActiveTab] = useState<'verify' | 'history'>('verify');
  const { verify, isLoading, error, results } = useGstVerify();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleSubmit = async () => {
    if (!selectedFile) return;
    await verify(selectedFile);
  };

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold">GST Compliance Checker</h1>
        <p className="text-gray-600">Verify GST filings for compliance</p>
      </div>

      <Tabs
        items={[
          {
            id: 'verify',
            label: 'Verify Filing',
            content: (
              <Card>
                <FileUpload
                  accept=".pdf,.xlsx"
                  maxSize={50 * 1024 * 1024}
                  label="Upload GST Filing"
                  onUpload={(files) => setSelectedFile(files[0])}
                />
                {selectedFile && (
                  <Button
                    variant="primary"
                    onClick={handleSubmit}
                    loading={isLoading}
                  >
                    Verify Filing
                  </Button>
                )}
                {error && <Alert type="error">{error}</Alert>}
                {results && <ResultsDisplay results={results} />}
              </Card>
            ),
          },
          {
            id: 'history',
            label: 'Verification History',
            content: <VerificationHistory />,
          },
        ]}
        defaultTab={activeTab}
      />
    </div>
  );
}
```

### **Step 6: Tool Hook** (20 lines)

```typescript
// frontend/src/tools/gst-checker/hooks/useGstVerify.ts

import { useState } from 'react';
import { useMutation } from '@/hooks/useMutation';
import { verifyGstFiling } from '../services/api';

export function useGstVerify() {
  const [results, setResults] = useState(null);
  const [error, setError] = useState<string | null>(null);

  const { mutate, isLoading } = useMutation(
    (file: File) => verifyGstFiling(file),
    {
      onSuccess: (data) => {
        setResults(data);
        setError(null);
      },
      onError: (err: Error) => {
        setError(err.message);
      },
    }
  );

  return { verify: mutate, isLoading, error, results };
}
```

### **Step 7: API Service** (10 lines)

```typescript
// frontend/src/tools/gst-checker/services/api.ts

import { getAuthToken } from '@/services/auth';

export async function verifyGstFiling(file: File) {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch('/api/tools/gst-checker/verify', {
    method: 'POST',
    headers: { Authorization: `Bearer ${getAuthToken()}` },
    body: formData,
  });

  if (!response.ok) throw new Error(await response.text());
  return response.json();
}
```

### **Step 8: Display Components** (30 lines)

```typescript
// frontend/src/tools/gst-checker/components/ResultsDisplay.tsx

import { Card, Badge, Accordion, Alert } from '@/components';

interface ResultsDisplayProps {
  results: {
    compliance_score: number;
    status: string;
    issues: string[];
    recommendations: string[];
  };
}

export function ResultsDisplay({ results }: ResultsDisplayProps) {
  const scoreColor = results.compliance_score >= 80 ? 'success' : 'warning';

  return (
    <Card>
      <div className="space-y-6">
        {/* Score */}
        <div className="text-center">
          <div className="text-4xl font-semibold text-primary">
            {results.compliance_score}%
          </div>
          <Badge variant={scoreColor}>{results.status}</Badge>
        </div>

        {/* Issues */}
        {results.issues.length > 0 && (
          <div>
            <h3 className="font-semibold mb-2">Compliance Issues</h3>
            <Alert type="warning" description={results.issues.join(', ')} />
          </div>
        )}

        {/* Recommendations */}
        {results.recommendations.length > 0 && (
          <Accordion
            items={results.recommendations.map((rec, i) => ({
              id: `rec-${i}`,
              title: `Recommendation ${i + 1}`,
              content: rec,
            }))}
          />
        )}
      </div>
    </Card>
  );
}
```

### **Step 9: Update Tool Registry**

```typescript
// frontend/src/config/tools.ts (add entry)

import { GstChecker } from '@/tools/gst-checker';

tools.push({
  slug: 'gst-checker',
  name: 'GST Compliance Checker',
  description: 'Verify GST filings for compliance',
  icon: '📊',
  category: 'Tax',
  minPlan: 'pro',  // Pricing control
  component: GstChecker,
});
```

### **Step 10: Add to Main Router**

```typescript
// frontend/src/App.tsx (add to if statement)

if (activeTool === 'gst-checker') return <GstChecker />;
```

### **Step 11: Update Backend Router**

```python
# backend/main.py (add include)

from tools import gst_checker
app.include_router(gst_checker.router, prefix="/api/tools")
```

### **Step 12: Test Locally**

```bash
# Backend: Start Uvicorn
python -m uvicorn main:app --reload

# Frontend: Start Vite
npm run dev

# Test
curl -X POST http://localhost:8000/api/tools/gst-checker/verify \
  -H "Authorization: Bearer {token}" \
  -F "file=@test_gst.pdf"

# Expected response:
# {"compliance_score": 85, "status": "compliant", ...}
```

---

## Deployment Checklist

- [ ] Backend code pushed to GitHub
- [ ] Frontend code pushed to GitHub
- [ ] Database schema migrated (SQL)
- [ ] Knowledge base ingested
- [ ] Environment variables set (Gemini key, Supabase URL)
- [ ] Vercel redeploys both frontend & backend
- [ ] Test live endpoint: `https://yourdomain.com/api/tools/gst-checker/verify`
- [ ] Tool appears in user dashboard
- [ ] Admin can enable/disable tool
- [ ] Pricing tier correctly restricts access

---

## Time Breakdown

```
Day 1 (Backend):
  - Database setup:      30 min
  - Knowledge base:      60 min
  - Backend route:       30 min
  - Models & types:      30 min
  - Testing:             60 min
  Total: 4 hours

Day 2 (Frontend):
  - Components:          60 min
  - Hooks & services:    30 min
  - Display UI:          30 min
  - Integration:         30 min
  - Testing & deploy:    60 min
  Total: 3.5 hours

Total: ~7.5 hours (1 day + half day)
```

---

## Summary

This template allows you to build a new tool in 1-2 days by:
- ✅ Reusing all shared infrastructure
- ✅ Following consistent patterns
- ✅ Minimal code (~150 lines total)
- ✅ Copy-paste components from existing tools
- ✅ No design system changes

**Next:** Read DATA_ISOLATION_PRIVACY.md for security details.
