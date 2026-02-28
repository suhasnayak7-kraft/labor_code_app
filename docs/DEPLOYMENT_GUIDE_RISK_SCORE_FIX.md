# Deployment Guide: risk_score → compliance_score Migration

**Status:** Ready to deploy
**Impact:** No downtime, backward compatible
**Risk:** Low (only 6 existing test audit records)
**Time to deploy:** 5 minutes

---

## Summary

This migration fixes the technical debt where the database column `risk_score` was storing inverted compliance data (`100 - compliance_score`). After deployment:

- ✅ Column renamed: `risk_score` → `compliance_score`
- ✅ Data inverted back to actual compliance scores
- ✅ Backend code updated to store real values
- ✅ No API changes (already returns `compliance_score` correctly)
- ✅ Frontend unaffected (already works with `compliance_score` from API)

---

## Step-by-Step Deployment

### Phase 1: Apply Database Migration (2 minutes)

1. **Go to Supabase dashboard**
   - URL: https://supabase.com/dashboard/project/nkctfhrnwhnpfehgbzvn
   - Click: **SQL Editor** (left sidebar)

2. **Create new query**
   - Click: **"New Query"** button

3. **Paste the migration SQL**
   ```sql
   -- Migration: Rename risk_score → compliance_score and fix storage logic

   ALTER TABLE api_logs
   ADD COLUMN compliance_score INT;

   UPDATE api_logs
   SET compliance_score = 100 - risk_score
   WHERE risk_score IS NOT NULL;

   UPDATE api_logs
   SET compliance_score = NULL
   WHERE risk_score IS NULL;

   ALTER TABLE api_logs
   DROP COLUMN risk_score;

   COMMENT ON COLUMN api_logs.compliance_score IS 'Compliance score (0-100, where 100=fully compliant). Stores actual value, not inverted.';
   ```

4. **Execute the query**
   - Click: **Run** button (or Ctrl+Enter)
   - Expected: "Rows affected: 6" (your 6 test audits will be transformed)

5. **Verify the transformation**
   ```sql
   SELECT id, compliance_score, created_at FROM api_logs ORDER BY created_at DESC;
   ```
   - You should see actual compliance scores (e.g., 75, 82, 65, etc.) instead of inverted risk scores

---

### Phase 2: Deploy Backend Code (1 minute)

1. **Verify code changes**
   - File: `backend/main.py`
   - Line 328 changed from: `"risk_score": 100 - comp_score,`
   - Line 328 changed to: `"compliance_score": comp_score,`
   - ✅ Already done in your repo

2. **Push to GitHub**
   ```bash
   git add backend/main.py
   git commit -m "refactor: fix technical debt - store actual compliance_score instead of inverted risk_score"
   git push origin main
   ```
   - Vercel will auto-deploy in 30-60 seconds

3. **Verify deployment**
   - Wait for Vercel deployment to complete
   - Go to: https://audit-ai.vercel.app (your domain)
   - Check deployment status in Vercel dashboard

---

### Phase 3: Test the Fix (2 minutes)

**Option A: Test via UI**
1. Log in to the app
2. Upload a test PDF
3. Verify compliance score is displayed correctly (should be 0-100, not inverted)

**Option B: Test via API**
```bash
# After deployment, run an audit and verify logs
curl -X GET "https://audit-ai.vercel.app/api/logs" \
  -H "Authorization: Bearer <your_jwt_token>"

# Response should show actual compliance_score values, not inverted risk_score
```

**Option C: Check Supabase directly**
```sql
SELECT id, compliance_score, created_at FROM api_logs ORDER BY created_at DESC LIMIT 1;
```

---

## Rollback Plan (If Needed)

If something goes wrong, rollback is simple:

1. **Revert database** (run in Supabase SQL Editor)
   ```sql
   ALTER TABLE api_logs
   ADD COLUMN risk_score INT;

   UPDATE api_logs
   SET risk_score = 100 - compliance_score
   WHERE compliance_score IS NOT NULL;

   ALTER TABLE api_logs
   DROP COLUMN compliance_score;
   ```

2. **Revert backend code**
   ```bash
   git revert HEAD  # Reverts the last commit
   git push origin main
   ```

3. **Vercel will auto-deploy** the reverted version

---

## What Changed

### Before Migration
```python
# Backend stored inverted value
"risk_score": 100 - comp_score  # e.g., stored 25 for compliance_score of 75

# API response (correct)
{
  "compliance_score": 75,  # Correct, from comp_score
  "findings": [...]
}

# Database query (confusing)
SELECT risk_score FROM api_logs;  # Returns 25 (inverted!)
```

### After Migration
```python
# Backend stores actual value
"compliance_score": comp_score  # e.g., stores 75

# API response (same, still correct)
{
  "compliance_score": 75,  # Correct, from comp_score
  "findings": [...]
}

# Database query (intuitive)
SELECT compliance_score FROM api_logs;  # Returns 75 (actual value!)
```

---

## Impact Assessment

| Component | Impact | Notes |
|-----------|--------|-------|
| **Database** | ✅ Minor | Column rename + data inversion. RLS policies unchanged. |
| **Backend API** | ✅ None | API response unchanged (already returns `compliance_score`). |
| **Frontend** | ✅ None | Frontend already uses `compliance_score` from API. No changes needed. |
| **Existing data** | ✅ Safe | 6 test records will be transformed from inverted to actual values. |
| **Future audits** | ✅ Clean | New audits store actual compliance scores directly. |

---

## Success Criteria

After deployment, verify:

- [ ] Migration ran successfully (check Supabase logs)
- [ ] 6 test records transformed correctly
- [ ] Compliance scores are now intuitive (0-100, not inverted)
- [ ] New audit stores actual compliance_score (not inverted)
- [ ] Frontend displays scores correctly
- [ ] No API errors or 500s in Vercel logs

---

## Timeline

- **Execution time:** ~5 minutes
- **Downtime:** 0 (Vercel stays live during code deploy)
- **Risk level:** Low (only 6 test records, easy rollback)
- **Complexity:** Simple (straightforward column rename + data fix)

---

## Questions?

If you encounter issues:

1. Check Supabase SQL Editor for migration errors
2. Check Vercel deployment logs for backend errors
3. Verify both changes applied: DB schema + backend code
4. Use rollback plan if needed

---

## Completion Checklist

- [ ] Database migration applied in Supabase
- [ ] Backend code pushed to GitHub
- [ ] Vercel deployment completed
- [ ] Test audit runs successfully
- [ ] Compliance score displays correctly
- [ ] No errors in logs

**Once all checks pass, the fix is complete! 🎉**
