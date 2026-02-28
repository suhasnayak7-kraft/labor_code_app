# Implementation Checklist: From Wrapper to Product

## Priority 1: Security + Reproducibility (DO FIRST - 2 Days)

### Reproducibility Fix
- [ ] Add `seed=42` to GenerateContentConfig (line ~258)
- [ ] Add `top_p=0.95` and `top_k=40` to GenerateContentConfig
- [ ] Change `match_threshold` from 0.4 to 0.5 (line 203)
- [ ] Sort vector results by ID for determinism
- [ ] Remove fallback to gemini-1.5-flash OR use same seed
- [ ] Run reproducibility test 3x with same PDF ← **VERIFY THIS WORKS**

### File Privacy/Security Fix
- [ ] Change filename storage: use hash instead of plaintext
  ```python
  # In main.py line ~316
  import hashlib
  "filename": hashlib.sha256(file.filename.encode()).hexdigest()[:16],
  ```
- [ ] Update admin dashboard to NOT display filenames
- [ ] Review api_logs table - remove any plaintext filenames from existing records
- [ ] Test: upload policy, verify filename in DB is hashed

---

## Priority 2: Bulk Processing MVP (2 Days)

### Backend
- [ ] Create `/audit/bulk` endpoint
  - [ ] Accept List[UploadFile]
  - [ ] Accept company_name parameter
  - [ ] Generate batch_id immediately
  - [ ] Return batch_id to frontend
  - [ ] Process files asynchronously

- [ ] Create audit_batches table in Supabase
  ```sql
  CREATE TABLE audit_batches (
      batch_id VARCHAR(36) PRIMARY KEY,
      user_id UUID NOT NULL,
      company_name VARCHAR(255),
      total_files INT,
      status VARCHAR(20),
      results JSONB,
      created_at TIMESTAMP,
      completed_at TIMESTAMP
  );
  ```

- [ ] Create `/audit/batch/{batch_id}` endpoint
  - [ ] Returns current status
  - [ ] Returns results when complete
  - [ ] Auth check: verify user owns batch

- [ ] Refactor audit_policy logic into reusable function
  - [ ] `audit_policy_internal(file, user_id)` ← reusable across both endpoints
  - [ ] Both `/audit` and `/audit/bulk` call this

### Frontend
- [ ] Create BulkAuditPage component
- [ ] Implement drag & drop upload
- [ ] Show file count: "3 files selected"
- [ ] Add "Start Bulk Audit" button
- [ ] Show progress during processing
  - [ ] Poll `/audit/batch/{batch_id}` every 2 seconds
  - [ ] Display "3 of 10 complete"
  - [ ] Show estimated time remaining

- [ ] Results display when complete
  - [ ] Table: filename | score | status
  - [ ] Download button for full results (JSON)
  - [ ] "Company Compliance Summary" (average score)

---

## Priority 3: Results Download & Export (1 Day)

### Backend
- [ ] Add `/audit/batch/{batch_id}/export` endpoint
  - [ ] Format results as PDF report
  - [ ] Include company name, audit date, all scores
  - [ ] Include consolidated compliance summary

### Frontend
- [ ] "Download Report" button
- [ ] Format options: JSON, PDF, CSV

---

## Priority 4: Caching Layer (Optional but Recommended - 1 Day)

### Backend
- [ ] Create audit_cache table
  ```sql
  CREATE TABLE audit_cache (
      policy_hash VARCHAR(64) PRIMARY KEY,
      compliance_score INT,
      findings TEXT[],
      model_id VARCHAR(50),
      created_at TIMESTAMP
  );
  ```

- [ ] Before calling Gemini, check cache
  ```python
  policy_hash = hashlib.sha256(policy_text.encode()).hexdigest()
  cached = supabase.table("audit_cache").select("*").eq("policy_hash", policy_hash).execute()
  if cached.data:
      return AuditResponse(...)  # Return cached result
  ```

- [ ] After getting result, save to cache
  ```python
  supabase.table("audit_cache").insert({
      "policy_hash": policy_hash,
      "compliance_score": comp_score,
      "findings": findings,
      "model_id": final_model,
      "created_at": datetime.utcnow().isoformat()
  }).execute()
  ```

---

## Priority 5: Analytics & Admin Dashboard (2 Days)

### Backend
- [ ] Create admin dashboard endpoint `/admin/bulk-stats`
  - [ ] Total bulk audits this month
  - [ ] Average policies per batch
  - [ ] Average compliance score by company
  - [ ] Most common findings (aggregated)

### Frontend
- [ ] Admin dashboard page
- [ ] Show stats: "142 policies audited this month"
- [ ] Show top findings: "Most common issue: Missing safety clause"
- [ ] Show company activity: "10 companies audited"

---

## Priority 6: Monetization Setup (1 Day)

### Backend
- [ ] Add `usage_plan` column to profiles table
  - [ ] "free" = 1 bulk audit/month
  - [ ] "pro" = unlimited
  - [ ] "enterprise" = custom

- [ ] Add usage tracking
  ```python
  # Check if user can audit
  profile = supabase.table("profiles").select("usage_plan").eq("id", user.id).execute()
  if profile.usage_plan == "free":
      # Check monthly bulk audits
      month_start = datetime(now.year, now.month, 1)
      audits = supabase.table("audit_batches").select("id").eq("user_id", user.id).gte("created_at", month_start).execute()
      if len(audits) >= 1:
          raise HTTPException(403, "Free tier limit reached")
  ```

### Frontend
- [ ] Add "Upgrade" button in bulk audit page
- [ ] Show pricing modal
- [ ] Stripe integration (or Razorpay for India)

---

## Testing Checklist

### Before Launch
- [ ] Reproducibility test: Same 5 PDFs → identical results 3x ✓
- [ ] Bulk test: Upload 10 PDFs simultaneously ✓
- [ ] Bulk test: Upload 50 PDFs (stress test) ✓
- [ ] Auth test: User A can't see User B's batches ✓
- [ ] Cache test: Same policy twice → 2nd is instant ✓
- [ ] Error handling: One bad PDF in batch of 10 → rest succeed ✓
- [ ] File privacy: Verify no filenames in logs ✓
- [ ] Performance: 10 PDFs processed in < 5 minutes ✓

---

## Launch Criteria (Minimum Viable Product)

Before claiming "Bulk Audit Ready," you need:

- ✅ Reproducible results (Tier 1)
- ✅ `/audit/bulk` endpoint working
- ✅ `/audit/batch/{id}` status polling
- ✅ Drag & drop UI
- ✅ File privacy (no plaintext filenames)
- ✅ Results export (JSON minimum)
- ✅ 3 beta customers tested
- ✅ Performance: 10 PDFs in < 5 minutes

---

## Timeline Summary

| Week | Priority | Task | Done |
|------|----------|------|------|
| 1 | P1 | Reproducibility + Security | [ ] |
| 2 | P2 | Bulk Processing MVP | [ ] |
| 3 | P3 | Export/Download | [ ] |
| 3 | P4 | Caching (optional) | [ ] |
| 4 | P5 | Analytics Dashboard | [ ] |
| 4 | P6 | Monetization | [ ] |

**4-week sprint to product launch** ← Realistic timeline

---

## Quick Wins (Do Today)

1. **10 minutes**: Hash filenames in api_logs (security fix)
2. **15 minutes**: Add seed=42 to Gemini calls (reproducibility)
3. **20 minutes**: Run reproducibility test
4. **30 minutes**: Plan bulk endpoint structure

**Total: 75 minutes to significantly improve your product**

---

## Sales Pitch (After Implementation)

"Audit all your company policies against Indian Labour Laws in **under 5 minutes**. Get a compliance score for each policy and a professional report you can share with your board."

**Key differentiators:**
- Faster than hiring a lawyer (5 min vs weeks)
- Cheaper than compliance software ($200 vs $500/month)
- Indian Labour Law specific (not generic)
- Bulk processing for multiple policies
- Audit trail for regulators

---

## Success Metrics (After Launch)

Track these:
- Unique users per month
- Bulk audits per user (goal: > 2/month)
- Policies audited per batch (goal: avg 8-10)
- Time to results (goal: < 5 min for 10 PDFs)
- User retention (goal: > 40% month-over-month)
- Conversion to paid (goal: > 20% of users)

---

## What NOT to Do

❌ Don't launch until reproducibility is fixed
❌ Don't charge until you have 5+ beta customers
❌ Don't add complexity (keep MVP simple)
❌ Don't ignore security (file privacy is critical)
❌ Don't forget caching (will kill your costs)

---

## Questions to Answer Before Scaling

1. **Pricing**: Per-audit? Per-company? Per-month?
2. **Market**: LinkedIn sales? Inbound marketing? Partners?
3. **Expansion**: Only India? Or UK/Singapore/UAE labour codes too?
4. **Integrations**: API for other HR tools?
5. **Support**: Will you offer compliance consulting?

Think about these WHILE building, not after.
