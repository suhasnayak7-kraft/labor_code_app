# 🔐 Enterprise-Grade Security Enhancements

**For:** Solo founder, Bangalore/Udupi, No revenue yet
**Cost:** Mostly FREE, some minimal budget options
**Effort:** Phased approach (implement over time)
**Status:** Complementary to existing Security Checklist

---

## Why Enterprise Security for Early-Stage?

- ✅ **Free tier options exist** — Cloudflare, Supabase, GitHub Actions, Sentry
- ✅ **Prevents catastrophic failures** — Once compromised, rebuilding trust takes months
- ✅ **Early habit formation** — Security practices now = easy to maintain at scale
- ✅ **No legacy debt** — Fixing later is 10x harder
- ✅ **India-specific** — DPDP Act (2023) requires basic security + data localization

---

## 🏆 Tier 0: Enterprise Foundations (Free/Minimal Cost)

### **0.1 Production Environment Isolation**

**Why:** Prevents development accidents affecting live users (and your revenue when you have it)

**Implementation (FREE):**

```bash
# Git branching strategy
main              → Production (only deploy-tested commits)
staging           → Staging environment
develop           → Development (all branches PR into this first)

# Vercel deployment rules
main      → Deploy to production.yourdomain.com
staging   → Deploy to staging.yourdomain.com
```

**Supabase project separation:**

```
Project 1: production-labour-compliance
  - Real user data
  - Backup enabled
  - RLS enforced
  - Admin access limited

Project 2: staging-labour-compliance
  - Test data only
  - Can be wiped daily
  - Same schema as prod
  - Full access for testing

Project 3: development-labour-compliance
  - Local development
  - No real data
```

**GitHub Deployment Rules:**

```yaml
# .github/workflows/deploy.yml
name: Deploy

on:
  push:
    branches: [main, staging]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Deploy to Production
        if: github.ref == 'refs/heads/main'
        run: vercel --prod --token ${{ secrets.VERCEL_TOKEN }}

      - name: Deploy to Staging
        if: github.ref == 'refs/heads/staging'
        run: vercel --token ${{ secrets.VERCEL_TOKEN }}
```

**Checklist:**
- [ ] Three Supabase projects created (prod, staging, dev)
- [ ] Different API keys for each project
- [ ] GitHub branch protection: require PR reviews before merging to main
- [ ] Deployment automation via GitHub Actions
- [ ] Staging environment used for testing before production

---

### **0.2 Secrets Management (Vault-Level Security)**

**Why:** Even if git is compromised, secrets remain safe

**Best Option for India + No Cost: GitHub Secrets**

```yaml
# Store in GitHub Secrets (free, encrypted)
Settings → Secrets and variables → Actions

PROD_SUPABASE_URL
PROD_SUPABASE_KEY
PROD_GEMINI_API_KEY
STAGING_SUPABASE_URL
STAGING_SUPABASE_KEY
STAGING_GEMINI_API_KEY
```

**Rotate Secrets Quarterly:**

```bash
# 1. Generate new API key in Supabase
# 2. Update GitHub secret
# 3. Verify app still works
# 4. Delete old key

# Schedule: 1st week of every 3 months
```

**Alternative (Paid but Better): HashiCorp Vault Cloud** ($0 for free tier)

Or **Doppler** (free tier):
```bash
npm install @doppler/doppler

# Use secrets from Doppler dashboard, not env files
```

**Checklist:**
- [ ] All secrets migrated from .env to GitHub Secrets
- [ ] Rotation schedule documented
- [ ] Team members know NOT to use local .env files
- [ ] .env.example exists with placeholders (no values)
- [ ] Local .env.local file added to .gitignore

---

### **0.3 Network Security: Cloudflare WAF (FREE)**

**Why:** Blocks malicious traffic before it reaches your server (saves Vercel egress bandwidth)

**Setup (10 minutes):**

1. Move domain to Cloudflare (or add as subdomain)
2. Enable these FREE security features:

```
Security Level: High
Challenge Page: Enable (blocks bots)
Web Application Firewall: Enable
Rate Limiting: 100 requests/10 seconds per IP
DDoS Protection: Managed by Cloudflare (built-in)
```

**Custom WAF Rules (Advanced):**

```
Block:
  - Requests with SQL injection patterns
  - XSS attempts
  - Path traversal attacks

Allow:
  - Your legitimate IPs
  - API clients (Upstash, etc.)
```

**Benefits:**
- Blocks 95% of bot traffic automatically
- DDOS protection included
- SSL/TLS always encrypted
- Free globally distributed CDN

**Checklist:**
- [ ] Domain added to Cloudflare (free plan)
- [ ] Nameservers updated
- [ ] SSL/TLS mode set to "Full"
- [ ] Web Application Firewall enabled
- [ ] Verified app still works (test api.yourdomain.com)

---

### **0.4 Audit Logging at Database Level (Supabase pgAudit)**

**Why:** Know who accessed what, when, and from where — GDPR/DPDP requirement

**Enable in Supabase (FREE, built-in):**

```sql
-- Create audit log table
CREATE TABLE audit_log (
  id bigserial PRIMARY KEY,
  user_id uuid REFERENCES profiles(id),
  table_name text,
  operation text,  -- SELECT, INSERT, UPDATE, DELETE
  old_data jsonb,
  new_data jsonb,
  ip_address inet,
  timestamp timestamptz DEFAULT now()
);

-- RLS: Only admins see audit logs
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admins_see_audit_logs" ON audit_log
  FOR SELECT
  USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');

-- Trigger on each table to log changes
CREATE OR REPLACE FUNCTION audit_trigger()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO audit_log (user_id, table_name, operation, old_data, new_data, ip_address)
  VALUES (
    auth.uid(),
    TG_TABLE_NAME,
    TG_OP,
    row_to_json(OLD),
    row_to_json(NEW),
    inet_client_addr()
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Attach to sensitive tables
CREATE TRIGGER audit_profiles AFTER UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION audit_trigger();

CREATE TRIGGER audit_api_logs AFTER INSERT ON api_logs
  FOR EACH ROW EXECUTE FUNCTION audit_trigger();
```

**Access Audit Logs:**

```sql
-- Admin dashboard query
SELECT user_id, table_name, operation, timestamp
FROM audit_log
ORDER BY timestamp DESC
LIMIT 100;

-- Suspicious activity detection
SELECT user_id, COUNT(*) as changes
FROM audit_log
WHERE timestamp > now() - INTERVAL '1 hour'
GROUP BY user_id
HAVING COUNT(*) > 50;  -- Flag high-activity users
```

**Checklist:**
- [ ] Audit log table created
- [ ] Triggers added to critical tables
- [ ] RLS policies restrict to admins only
- [ ] Admin dashboard shows audit logs
- [ ] Rotation policy: Archive logs older than 90 days

---

## 🛡️ Tier 1: Observability & Incident Response (Mostly Free)

### **1.1 Error Tracking & Alerting (Sentry — FREE Tier)**

**Why:** Catch bugs in production before users report them

**Setup:**

```bash
npm install @sentry/react @sentry/tracing

# Backend
pip install sentry-sdk
```

**Frontend (`frontend/src/main.tsx`):**

```typescript
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,  // Get from Sentry.io
  environment: import.meta.env.MODE,
  tracesSampleRate: 0.1,  // 10% of errors tracked (save quota)
  integrations: [
    new Sentry.Replay({
      maskAllText: true,
      blockAllMedia: true,  // Don't leak user content
    }),
  ],
});

// Wrap app
const SentryApp = Sentry.withProfiler(App);
ReactDOM.createRoot(document.getElementById('root')!).render(<SentryApp />);
```

**Backend (`backend/main.py`):**

```python
import sentry_sdk
from sentry_sdk.integrations.fastapi import FastApiIntegration

sentry_sdk.init(
    dsn=os.getenv('SENTRY_DSN'),
    integrations=[FastApiIntegration()],
    traces_sample_rate=0.1,
    environment=os.getenv('ENVIRONMENT', 'production'),
)

# Errors automatically captured
@app.post("/audit")
async def audit(file: UploadFile, user=Depends(get_current_user)):
    try:
        # If error occurs, Sentry captures it automatically
        ...
    except Exception as e:
        # Optional: manually capture with context
        sentry_sdk.capture_exception(e)
        raise
```

**Alert Rules (in Sentry dashboard):**

```
Alert: Error rate > 1% in production
  → Send email + Slack message

Alert: New error signature
  → Send email (flag new bugs immediately)

Alert: Gemini API quota exceeded
  → Send email (before service outage)
```

**FREE Sentry Tier includes:**
- 10K errors/month
- Unlimited projects
- Basic alerting
- 30-day retention

**Checklist:**
- [ ] Sentry.io account created (free tier)
- [ ] DSN added to env vars
- [ ] Sentry integrated in frontend
- [ ] Sentry integrated in backend
- [ ] Alert rules configured
- [ ] Tested: Create error → verify in Sentry dashboard

---

### **1.2 Uptime Monitoring (StatusPage.io FREE)**

**Why:** Know immediately if your app goes down (so you don't hear about it from users)

**Setup:**

```bash
# Monitor endpoint every 5 minutes
GET https://yourdomain.com/api/health

# Expected response:
{"status": "healthy", "timestamp": "2026-02-28T10:00:00Z"}
```

**Simple health check endpoint:**

```python
# backend/main.py
@app.get("/api/health")
async def health():
    # Check all critical services
    try:
        # Database connection test
        await supabase.table('profiles').select('count').execute()

        # Gemini API test (cached)
        # Don't call live, just check endpoint is reachable

        return {
            "status": "healthy",
            "database": "ok",
            "api": "ok",
            "timestamp": datetime.now().isoformat(),
        }
    except Exception as e:
        return {
            "status": "degraded",
            "error": str(e),
            "timestamp": datetime.now().isoformat(),
        }, 503
```

**StatusPage.io (FREE):**
- 50 monitors free
- Slack/email alerts
- Public status page (builds trust)

**Checklist:**
- [ ] Health check endpoint created
- [ ] StatusPage.io account created
- [ ] Monitor setup: check /api/health every 5 min
- [ ] Slack alert configured
- [ ] Public status page enabled

---

### **1.3 Request Logging & Debugging (Free Tier)**

**Why:** Debug production issues without modifying code

**Implement request logging:**

```python
# backend/middleware.py
import logging
from datetime import datetime

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@app.middleware("http")
async def log_requests(request: Request, call_next):
    start = datetime.now()

    response = await call_next(request)

    duration = (datetime.now() - start).total_seconds()

    logger.info(
        f"{request.method} {request.url.path} "
        f"→ {response.status_code} ({duration:.2f}s)",
        extra={
            "user_id": getattr(request.state, "user_id", "anonymous"),
            "ip": request.client.host,
        }
    )

    return response
```

**View logs in Vercel dashboard:**
- Deployment → Logs
- See all requests in real-time

**Checklist:**
- [ ] Request logging middleware added
- [ ] All endpoints logged
- [ ] User ID included in logs (for debugging)
- [ ] Sensitive data NOT logged (passwords, tokens)
- [ ] Tested: Make request → verify in Vercel logs

---

## 🔑 Tier 2: Data Security & Privacy (India-Specific)

### **2.1 DPDP Act Compliance (2023 — Mandatory for India)**

**What is DPDP?** India's new privacy law (like GDPR)

**Minimum Implementation:**

```markdown
# Privacy Policy (add to website)

## Data Collection
- We collect: email, name, company, compliance audit results
- We do NOT collect: personal government IDs, financial data

## Data Storage
- Stored on Supabase (encrypted, EU region closest to India)
- Backed up automatically
- Deleted on request (right to erasure)

## User Rights
- Right to access your data
- Right to delete your data
- Right to correct your data
- Right to data portability

## Data Breach Notification
- In case of breach, users notified within 72 hours
- Authorities notified if significant risk

## Contact
- Privacy: privacy@yourdomain.com
- Grievance: grievance@yourdomain.com (within 30 days of complaint)
```

**Implement Right to Erasure:**

```python
# backend/api/delete_account.py
@app.post("/api/user/delete-account")
async def delete_account(current_user = Depends(get_current_user)):
    """User can request complete account deletion (DPDP right to erasure)"""

    # 1. Anonymize all user data
    await supabase.table('api_logs').update({
        'user_id': None,  # Remove reference
        'filename': 'DELETED',
    }).eq('user_id', current_user.id)

    # 2. Delete from auth
    await supabase.auth.admin.delete_user(current_user.id)

    # 3. Soft delete from profiles
    await supabase.table('profiles').update({
        'is_deleted': True,
        'email': f'deleted_{uuid.uuid4()}@deleted.local',
    }).eq('id', current_user.id)

    # 4. Log deletion request for compliance
    logger.info(f"Account deletion requested by {current_user.id}")

    return {"status": "Account deletion scheduled. Completion in 30 days."}
```

**Checklist:**
- [ ] Privacy Policy published on website
- [ ] Terms of Service published
- [ ] Delete account endpoint implemented
- [ ] Data retention policy documented (e.g., "Audit logs kept 90 days, then deleted")
- [ ] Breach notification procedure documented
- [ ] Grievance email setup (grievance@yourdomain.com)

---

### **2.2 Data Localization (India Requires)**

**Why:** DPDP Act requires personal data be processed in India (at minimum, not outside India exclusively)

**Current Setup Risk:**

```
Supabase default: Hosted in EU
Gemini API: Hosted in US
Result: Data crosses borders → DPDP violation
```

**Solution:**

```sql
-- Add data residency flag to profiles
ALTER TABLE profiles ADD COLUMN data_residency_country text DEFAULT 'India';

-- Add policy to ensure India users' data isn't exported
CREATE POLICY "india_users_data_stays_in_india" ON api_logs
  FOR SELECT
  USING (
    (SELECT data_residency_country FROM profiles WHERE id = auth.uid()) = 'India'
    AND server_location = 'India'  -- Ensure query runs in India
  );
```

**Practical Implementation:**

```
Option 1: Use Supabase with explicit India region (if available)
Option 2: Use Firebase (supports India region)
Option 3: Use local Indian cloud: OVHcloud Asia, Linode Mumbai
Option 4: Add local processing layer in India
```

**For now (MVP):** Document in Privacy Policy:
```markdown
## Data Residency
Due to tech limitations, some personal data may temporarily transit through
US servers (Gemini API). However, core data (email, audit logs) is stored
in EU Supabase. We are upgrading to India-resident infrastructure by [Q3 2026].
```

**Checklist:**
- [ ] Privacy Policy mentions data residency approach
- [ ] Plan documented to move to India residency by [date]
- [ ] Gemini API flagged as US processing (document in Privacy Policy)
- [ ] RLS policies validate user's data residency preferences

---

### **2.3 Encryption at Rest (Supabase Default)**

**Status:** ✅ Already enabled by Supabase

**Verify:**

```sql
-- In Supabase SQL Editor, check
SELECT * FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('profiles', 'api_logs', 'labour_laws');

-- All tables automatically encrypted (AES-256 by Supabase)
```

**Manual Encryption for Extra Sensitive Fields:**

```python
from cryptography.fernet import Fernet
import os

cipher = Fernet(os.getenv('FIELD_ENCRYPTION_KEY'))

# Encrypt before storing
def encrypt_field(value: str) -> str:
    return cipher.encrypt(value.encode()).decode()

# Decrypt when reading
def decrypt_field(encrypted: str) -> str:
    return cipher.decrypt(encrypted.encode()).decode()

# Use in API
await supabase.table('profiles').update({
    'phone_number': encrypt_field(request.phone_number),
}).eq('id', user.id)
```

**Checklist:**
- [ ] Verify Supabase encryption status (built-in)
- [ ] For extra-sensitive fields: implement field-level encryption
- [ ] Encryption key stored in env variable (never committed)
- [ ] Key rotation plan: rotate annually

---

## 🔍 Tier 3: Advanced Threat Detection

### **3.1 Anomaly Detection (AI-Powered, Free with Supabase)**

**Detect suspicious patterns automatically:**

```python
# backend/services/anomaly_detection.py
async def detect_anomalies(user_id: str):
    """Flag unusual user behavior"""

    # Get user's normal pattern
    normal_audits = await supabase.table('api_logs') \
        .select('response_time_ms', 'created_at') \
        .eq('user_id', user_id) \
        .gte('created_at', 'now-30 days') \
        .execute()

    # Calculate baselines
    import statistics
    avg_response = statistics.mean([log['response_time_ms'] for log in normal_audits.data])

    # Get latest request
    latest = await supabase.table('api_logs') \
        .select('*') \
        .eq('user_id', user_id) \
        .order('created_at', desc=True) \
        .limit(1) \
        .execute()

    if latest.data:
        current = latest.data[0]

        # Flag if anomalies detected
        anomalies = []

        if current['response_time_ms'] > avg_response * 5:
            anomalies.append('slow_response')

        if current['status_code'] >= 400:
            anomalies.append('error')

        if len(normal_audits.data) > 10 and len(normal_audits.data) < 5:
            anomalies.append('unusual_frequency')

        if anomalies:
            await log_security_event(user_id, 'anomaly_detected', {
                'anomalies': anomalies,
                'baseline_response_time': avg_response,
            })

            # Email admin
            send_alert(f"Anomaly detected for user {user_id}: {anomalies}")

# Call after each API request
```

**Checklist:**
- [ ] Anomaly detection queries created
- [ ] Called after each `/audit` endpoint
- [ ] Admin alerts sent for suspicious patterns
- [ ] Tested: Make unusual requests → verify alert

---

### **3.2 Rate Limiting with IP Blocking (Advanced)**

**Current:** Per-user daily limit
**Enhancement:** IP-based rate limiting + auto-blocking

```python
# backend/services/rate_limiting.py
import redis
from fastapi import Request

redis_client = redis.Redis(host='localhost', port=6379, db=0)

async def check_ip_rate_limit(request: Request):
    """Block IPs making too many requests"""

    ip = request.client.host
    key = f"rate_limit:ip:{ip}"

    # Increment counter
    count = redis_client.incr(key)

    if count == 1:
        redis_client.expire(key, 60)  # Reset every minute

    # 1000 requests per minute = suspicious
    if count > 1000:
        # Log suspicious IP
        await log_security_event('system', 'ip_rate_limit_exceeded', {
            'ip': ip,
            'count': count,
        })

        # Block for 1 hour
        redis_client.setex(f"blocked_ip:{ip}", 3600, True)

        # Email admin
        send_alert(f"IP {ip} rate limited ({count} requests/min)")

        raise HTTPException(status_code=429, detail="Too many requests")

    # Check if IP is blocked
    if redis_client.exists(f"blocked_ip:{ip}"):
        raise HTTPException(status_code=403, detail="IP blocked")

# Middleware
@app.middleware("http")
async def rate_limit_middleware(request: Request, call_next):
    await check_ip_rate_limit(request)
    return await call_next(request)
```

**Checklist:**
- [ ] Upstash Redis setup for rate limiting
- [ ] IP rate limiting implemented
- [ ] Auto-blocking of suspicious IPs
- [ ] Admin alerts for blocked IPs
- [ ] Whitelist important IPs (monitoring tools, etc.)

---

## 💰 Cost Summary (Per Month)

| Service | Cost | Why |
|---------|------|-----|
| Supabase | Free ($0) | 500K API calls/month |
| Vercel | Free ($0) | 100GB bandwidth/month |
| Cloudflare | Free ($0) | WAF, DDoS, CDN |
| Sentry | Free ($0) | 10K errors/month |
| StatusPage | Free ($0) | 50 monitors |
| GitHub | Free ($0) | Actions, Secrets |
| Upstash Redis | Free ($0) | 10K commands/month |
| Gemini API | Free ($0) | 15 req/min, 3.5K free tokens |
| **Total** | **$0** | Everything free at MVP scale |

**When revenue arrives:**
- Supabase: Upgrade to $25/mo (enterprise support)
- Sentry: Upgrade to $29/mo (100K errors/month)
- Cloudflare: Keep free (grows with business)

---

## 🚀 Implementation Roadmap

### **Week 1: Foundations**
- [ ] GitHub Secrets for all env vars
- [ ] Cloudflare WAF enabled
- [ ] Health check endpoint

### **Week 2: Observability**
- [ ] Sentry integrated (frontend + backend)
- [ ] StatusPage monitors setup
- [ ] Request logging middleware

### **Week 3: Compliance**
- [ ] Privacy Policy drafted
- [ ] Delete account endpoint
- [ ] Audit logging enabled

### **Month 2: Advanced**
- [ ] Anomaly detection
- [ ] IP rate limiting
- [ ] Key rotation schedule

---

## 📋 Final Security Checklist

**Before any revenue/production:**

- [ ] All Tier 1 items from base checklist ✅
- [ ] All Tier 0 items from this doc ✅
- [ ] Secrets rotation schedule set ✅
- [ ] Incident response plan written ✅
- [ ] Data deletion process tested ✅
- [ ] Privacy policy published ✅
- [ ] DPDP compliance assessed ✅
- [ ] Sentry + StatusPage monitoring live ✅
- [ ] Cloudflare WAF enabled ✅
- [ ] Audit logs active ✅

**Monthly recurring:**
- [ ] Review Sentry errors (first Friday of month)
- [ ] Check StatusPage uptime (first Friday of month)
- [ ] Rotate secrets (quarterly)
- [ ] Update dependencies (weekly via Dependabot)
- [ ] Review audit logs for anomalies (monthly)

---

## 🎯 Why This Matters for India SaaS

1. **DPDP Act (2023)** — Now mandatory, no grace period
2. **Founder liability** — Personal legal responsibility for data breaches
3. **Trust = Revenue** — In B2B (your target), security is the #1 decision factor
4. **Cheap to prevent** — Expensive to recover from breach
5. **Competitive advantage** — Most Indian SaaS founders skip this → you stand out

---

## Summary

This document adds **enterprise-grade security** without enterprise costs by leveraging:
- ✅ Free tiers of paid tools (Sentry, Cloudflare, StatusPage)
- ✅ Open-source tools (pgAudit, Sentry SDKs)
- ✅ Built-in features (Supabase encryption, Vercel logging)
- ✅ Good practices (RLS, audit logging, secrets rotation)

**Result:** Production-ready security posture at $0/month, scalable to $100+/month only when you have revenue.

**Recommended approach for solo founder:**
1. Implement all Tier 0 items immediately (1-2 hours)
2. Add Sentry + StatusPage (30 minutes)
3. Document privacy + DPDP compliance (1 hour)
4. Later: Add anomaly detection + advanced monitoring

**Total initial time: ~3 hours for enterprise-grade security.**

---

**Last Updated:** February 28, 2026
**Recommended For:** Solo founders, early-stage SaaS, India-based
**Next Update:** After first 1000 users or $10K MRR
