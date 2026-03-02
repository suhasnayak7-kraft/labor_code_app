# 9. Data Isolation & Privacy: User Data Protection

How to ensure user data from Tool A never leaks to Tool B, and admins never see PII.

---

## Core Principle

**RLS (Row-Level Security) at database layer enforces data isolation.** Application code is secondary.

---

## RLS Policies: User Audit Logs

### **Rule 1: Users See Only Own Logs**

```sql
-- Users can only see their own audit logs
CREATE POLICY "users_see_own_logs" ON api_logs
  FOR SELECT
  USING (auth.uid() = user_id);
```

**Effect:** When user queries `SELECT * FROM api_logs`, the database automatically adds `WHERE user_id = {auth.uid()}`. No manual filtering needed.

### **Rule 2: Admins See Aggregated Data Only (No PII)**

```sql
-- Admins see aggregated stats, not individual records
CREATE POLICY "admins_see_aggregated_logs" ON api_logs
  FOR SELECT
  USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
    AND false  -- Block direct select
  );
```

Instead, admins query a VIEW:

```sql
CREATE VIEW admin_audit_logs_aggregated AS
SELECT
  DATE(created_at) as audit_date,
  tool_id,
  COUNT(*) as audit_count,
  AVG(response_time_ms) as avg_response_time,
  SUM(total_tokens) as tokens_used,
  COUNT(CASE WHEN status_code >= 400 THEN 1 END) as error_count
FROM api_logs
GROUP BY DATE(created_at), tool_id
ORDER BY audit_date DESC;

-- Grant admin access to view (not raw table)
CREATE POLICY "admins_see_aggregated_stats" ON admin_audit_logs_aggregated
  FOR SELECT
  USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
  );
```

**Result:** Admin sees "Labour Auditor had 1,250 audits today", not "User john@example.com uploaded employee_handbook.pdf with compliance_score=85".

---

## RLS Policies: Tool-Specific Audit Logs

```sql
-- Labour Auditor logs
CREATE POLICY "users_see_own_labour_logs" ON labour_audit_logs
  FOR SELECT
  USING (auth.uid() = user_id);

-- GST Checker logs
CREATE POLICY "users_see_own_gst_logs" ON gst_audit_logs
  FOR SELECT
  USING (auth.uid() = user_id);

-- Income Tax logs
CREATE POLICY "users_see_own_income_tax_logs" ON income_tax_audit_logs
  FOR SELECT
  USING (auth.uid() = user_id);
```

**Effect:** User A cannot query `SELECT * FROM gst_audit_logs` and see User B's data.

---

## RLS Policies: User Profiles

```sql
-- Users see only their own profile
CREATE POLICY "users_see_own_profile" ON profiles
  FOR SELECT
  USING (auth.uid() = id);

-- Admins see all profiles (necessary for user management)
CREATE POLICY "admins_see_all_profiles" ON profiles
  FOR SELECT
  USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
  );

-- Users cannot update role or subscription tier (prevent escalation)
CREATE POLICY "users_update_own_profile_limited" ON profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id
    AND role = (SELECT role FROM profiles WHERE id = auth.uid())  -- Can't change role
    AND subscription_tier_id = (SELECT subscription_tier_id FROM profiles WHERE id = auth.uid())  -- Can't change tier
  );
```

---

## RLS Policies: Knowledge Base (Public)

```sql
-- All authenticated users can read knowledge base (it's public)
ALTER TABLE embeddings DISABLE ROW LEVEL SECURITY;
-- OR
CREATE POLICY "authenticated_read_kb" ON embeddings
  FOR SELECT
  USING (auth.role() = 'authenticated');
```

**No RLS needed** — knowledge base is same for all users.

---

## Backend Validation (Defense in Depth)

Even with RLS, add application-level checks:

```python
# backend/shared/auth.py

async def get_current_user(token: str):
    """Validate token, return user"""
    user = await supabase.auth.get_user(token)
    profile = await supabase.table('profiles') \
        .select('*') \
        .eq('id', user.id) \
        .single() \
        .execute()

    if profile.data.is_deleted:
        raise Exception("User deleted")

    return profile.data

# backend/tools/labour_auditor.py

@router.get("/labour-auditor/logs")
async def get_logs(current_user = Depends(get_current_user)):
    """Get audit history"""

    # Double-check: Only retrieve logs for current user
    logs = await supabase.table('labour_audit_logs') \
        .select('*') \
        .eq('user_id', current_user.id) \  # ESSENTIAL: Filter by user_id
        .execute()

    return {"logs": logs.data}
```

**Never do:**
```python
# WRONG: Admin can see all logs
logs = await supabase.table('labour_audit_logs').select('*').execute()
```

---

## Admin Audit Log: Separate Table

Admins need their own audit trail (who did what):

```sql
CREATE TABLE admin_actions (
  id bigserial PRIMARY KEY,
  admin_id uuid REFERENCES profiles(id),
  action text,  -- 'user_locked', 'tool_enabled', 'tier_changed'
  affected_user_id uuid,
  changes jsonb,  -- {old: {...}, new: {...}}
  created_at timestamptz DEFAULT now()
);

-- RLS: Only admins see admin actions
CREATE POLICY "admins_see_admin_actions" ON admin_actions
  FOR SELECT
  USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
  );

-- Log every admin action
INSERT INTO admin_actions (admin_id, action, affected_user_id, changes)
VALUES (
  admin_user.id,
  'user_tier_changed',
  user_id,
  jsonb_build_object(
    'old', jsonb_build_object('tier', old_tier),
    'new', jsonb_build_object('tier', new_tier)
  )
);
```

---

## Data Access Audit Trail

Never delete audit logs. Archive instead:

```sql
-- Keep all logs for 1 year, then archive
CREATE TABLE api_logs_archived AS
SELECT * FROM api_logs WHERE created_at < CURRENT_DATE - INTERVAL '365 days';

DELETE FROM api_logs WHERE created_at < CURRENT_DATE - INTERVAL '365 days';
```

---

## GDPR Compliance: Right to Erasure

If user requests account deletion:

```python
async def delete_user_account(user_id: str):
    """Soft delete user and anonymize logs"""

    # 1. Mark user as deleted (don't hard delete)
    await supabase.table('profiles').update({
        'is_deleted': True,
        'email': f'deleted_{uuid.uuid4()}@example.com',  # Anonymize
    }).eq('id', user_id)

    # 2. Anonymize audit logs (keep for compliance, but remove PII)
    await supabase.table('api_logs').update({
        'user_id': None,  # Remove user reference
        'filename': 'REDACTED',
    }).eq('user_id', user_id)

    # 3. Optionally delete from auth
    await supabase.auth.admin.delete_user(user_id)
```

---

## Data Residency & Encryption

```
At Rest:
  - Supabase encrypts all data at rest (AES-256)
  - Database backups encrypted

In Transit:
  - All API calls use HTTPS
  - TLS 1.3 minimum

In Memory:
  - FastAPI doesn't store sensitive data in memory
  - Token validated per request (no session cache)
```

---

## Third-Party Access Control

Never expose user data to third parties:

```python
# WRONG: Expose API to external partner
@router.get("/partners/stats")
async def get_partner_stats(partner_key: str):
    logs = supabase.table('api_logs').select('*').execute()
    return logs.data  # EXPOSED!

# CORRECT: Aggregate, anonymize, then share
@router.get("/partners/stats")
async def get_partner_stats(partner_key: str):
    if not verify_partner(partner_key):
        raise HTTPException(403)

    # Only aggregate stats, no user details
    stats = supabase.table('admin_audit_logs_aggregated') \
        .select('*') \
        .eq('partner_id', partner_key) \
        .execute()

    return stats.data  # Safe: no PII
```

---

## Testing Data Isolation

```python
# tests/test_data_isolation.py

import pytest

@pytest.mark.asyncio
async def test_user_cannot_see_other_user_logs():
    """User A should not see User B's audit logs"""

    # User A login
    user_a_token = await login('user_a@example.com', 'password')

    # User B creates audit log
    user_b_token = await login('user_b@example.com', 'password')
    await create_audit(user_b_token, 'test.pdf')

    # User A queries logs (should not see User B's log)
    response = await get_logs(user_a_token)

    assert len(response['logs']) == 0  # User A sees only own logs
    assert 'user_b' not in str(response)  # No User B data leaked

@pytest.mark.asyncio
async def test_user_cannot_see_other_user_profile():
    """User A should not see User B's profile"""

    user_a_token = await login('user_a@example.com', 'password')
    user_b_id = 'user-b-uuid'

    response = await get_profile(user_a_token, user_b_id)

    assert response.status_code == 403  # Forbidden

@pytest.mark.asyncio
async def test_admin_sees_aggregated_only():
    """Admin should see aggregated stats, not user-level details"""

    admin_token = await login('admin@example.com', 'password')

    response = await get_admin_logs(admin_token)
    logs = response['logs']

    # Admin sees aggregated stats
    assert 'audit_count' in logs[0]  # ✓
    assert 'avg_response_time' in logs[0]  # ✓

    # Admin does NOT see PII
    assert 'filename' not in logs[0]  # ✗ No PII
    assert 'user_id' not in logs[0]  # ✗ No PII
```

---

## Security Checklist

- [ ] RLS policies enabled on all user-facing tables
- [ ] RLS policies tested (unit tests)
- [ ] Application code filters by `user_id` (defense in depth)
- [ ] Admin cannot see raw user audit logs (only aggregates)
- [ ] Audit logs archived after 1 year
- [ ] HTTPS enforced (no HTTP)
- [ ] JWT tokens validated on every request
- [ ] User deletion anonymizes data
- [ ] Third-party access controlled (partner API)
- [ ] Database backups encrypted
- [ ] Secrets (API keys) in environment only (never in code)

---

## Summary

Data isolation is enforced via:
1. **RLS Policies** (database layer) - Primary defense
2. **Application Filtering** (backend layer) - Secondary defense
3. **Audit Logging** (tracking layer) - Compliance & debugging
4. **Anonymization** (deletion) - GDPR compliance

**No PII ever leaks to admins or third parties.**

**Next:** Read PRICING_FEATURE_GATING.md for pricing control.
