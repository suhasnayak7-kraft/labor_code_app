# 10. Pricing & Feature Gating: Control Tool Access by Plan

How to tie tool availability to subscription tier without code changes.

---

## Pricing Model

```
Free Tier (₹0/month):
  - Daily limit: 3 audits
  - Tools: Labour Auditor only
  - Support: Email

Pro Tier (₹499/month):
  - Daily limit: 30 audits
  - Tools: Labour Auditor, GST Checker, Income Tax
  - Support: Priority email

Business Tier (₹1499/month):
  - Daily limit: 100 audits
  - Tools: All 4 tools + custom integrations
  - Support: Dedicated Slack channel

Enterprise (Custom):
  - Unlimited audits
  - All tools + SSO, API access
  - Support: Dedicated CSM
```

---

## Database Schema

### **subscription_tiers Table**

```sql
CREATE TABLE subscription_tiers (
  id text PRIMARY KEY,  -- 'free', 'pro', 'business', 'enterprise'
  name text,
  price_inr int,
  daily_audit_limit int,
  monthly_request_limit int,
  tools_included text[],  -- Array: ['labour-auditor', 'gst-checker', ...]
  support_tier text,
  ...
);

-- Data
INSERT INTO subscription_tiers VALUES
('free', 'Free', 0, 3, 90, ARRAY['labour-auditor'], 'email', ...),
('pro', 'Pro', 499, 30, 1000, ARRAY['labour-auditor', 'gst-checker', 'income-tax'], 'priority', ...),
('business', 'Business', 1499, 100, 10000, ARRAY['labour-auditor', 'gst-checker', 'income-tax', 'dpdp'], 'dedicated', ...);
```

### **profiles Table**

```sql
ALTER TABLE profiles ADD COLUMN subscription_tier_id text REFERENCES subscription_tiers(id);
ALTER TABLE profiles ADD COLUMN subscription_started_at timestamptz;
ALTER TABLE profiles ADD COLUMN subscription_renews_at timestamptz;
```

### **tools Table**

```sql
CREATE TABLE tools (
  id bigserial,
  slug text UNIQUE,
  name text,
  min_plan_tier text REFERENCES subscription_tiers(id),  -- 'free', 'pro', 'business'
  enabled boolean DEFAULT true,
  ...
);

-- Data
INSERT INTO tools VALUES
(1, 'labour-auditor', 'Labour Code Auditor', 'free', true),
(2, 'gst-checker', 'GST Compliance Checker', 'pro', true),
(3, 'dpdp-compliance', 'DPDP Privacy Compliance', 'business', true);
```

---

## Feature Gating Logic

### **Frontend: Show/Hide Tools Based on Plan**

```typescript
// frontend/src/components/common/ToolHub.tsx

import { getToolsByPlan } from '@/config/tools';

interface ToolHubProps {
  userPlan: string;  // 'free', 'pro', 'business'
  onSelectTool: (toolSlug: string) => void;
}

export function ToolHub({ userPlan, onSelectTool }: ToolHubProps) {
  const availableTools = getToolsByPlan(userPlan);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {availableTools.map((tool) => (
        <Card
          key={tool.slug}
          onClick={() => onSelectTool(tool.slug)}
          className="cursor-pointer hover:shadow-lg"
        >
          <div className="text-3xl mb-2">{tool.icon}</div>
          <h3 className="font-semibold text-lg">{tool.name}</h3>
          <p className="text-gray-600">{tool.description}</p>
          <Button className="mt-4" variant="primary">
            Open Tool
          </Button>
        </Card>
      ))}

      {/* Locked tools */}
      {getAllTools()
        .filter((t) => !availableTools.find((a) => a.slug === t.slug))
        .map((tool) => (
          <Card
            key={tool.slug}
            className="opacity-50 cursor-not-allowed"
            onClick={() => {
              toast({
                type: 'info',
                message: `Available on ${tool.minPlan} plan. Upgrade now?`,
              });
            }}
          >
            <div className="relative">
              <div className="text-3xl mb-2 opacity-50">{tool.icon}</div>
              <Lock className="absolute top-0 right-0 w-6 h-6 text-error" />
            </div>
            <h3 className="font-semibold text-lg">{tool.name}</h3>
            <p className="text-gray-600">{tool.description}</p>
            <Badge variant="warning">
              Upgrade to {tool.minPlan} to unlock
            </Badge>
            <Button className="mt-4" variant="secondary">
              Upgrade Plan
            </Button>
          </Card>
        ))}
    </div>
  );
}

// config/tools.ts
export function getToolsByPlan(planTier: string): ToolConfig[] {
  const tierRanking = { free: 0, pro: 1, business: 2, enterprise: 3 };
  const userRank = tierRanking[planTier] || 0;

  return allTools.filter((tool) => {
    const toolRank = tierRanking[tool.minPlan] || 0;
    return userRank >= toolRank;
  });
}
```

### **Backend: Enforce Rate Limits & Tool Access**

```python
# backend/shared/auth.py

async def check_feature_access(user_id: str, tool_id: str):
    """Check if user has access to tool"""

    user = await supabase.table('profiles') \
        .select('subscription_tier_id') \
        .eq('id', user_id) \
        .single() \
        .execute()

    tier = user.data.subscription_tier_id

    tool = await supabase.table('tools') \
        .select('min_plan_tier') \
        .eq('slug', tool_id) \
        .single() \
        .execute()

    min_tier = tool.data.min_plan_tier

    # Tier ranking
    tier_ranking = {'free': 0, 'pro': 1, 'business': 2, 'enterprise': 3}

    if tier_ranking.get(tier, -1) < tier_ranking.get(min_tier, -1):
        raise HTTPException(
            status_code=403,
            detail=f"Tool requires {min_tier} plan. Upgrade to access."
        )

# backend/tools/labour_auditor.py

@router.post("/labour-auditor/audit")
async def audit_policy(
    file: UploadFile = File(...),
    current_user = Depends(get_current_user),
):
    # Check tool access
    await check_feature_access(current_user.id, 'labour-auditor')

    # Get tier limits
    tier = await supabase.table('subscription_tiers') \
        .select('daily_audit_limit') \
        .eq('id', current_user.subscription_tier_id) \
        .single() \
        .execute()

    daily_limit = tier.data.daily_audit_limit

    # Enforce daily limit
    if current_user.audits_run_today >= daily_limit:
        raise HTTPException(
            status_code=429,
            detail=f"Daily limit ({daily_limit}) reached. Upgrade for more audits."
        )

    # ... proceed with audit
```

---

## Pricing API Endpoints

### **Get User's Available Tools**

```python
@router.get("/api/my-tools")
async def get_my_tools(current_user = Depends(get_current_user)):
    """Return tools available for user's plan"""

    tier = await supabase.table('subscription_tiers') \
        .select('tools_included') \
        .eq('id', current_user.subscription_tier_id) \
        .single() \
        .execute()

    available_tools = tier.data.tools_included

    tools = await supabase.table('tools') \
        .select('slug, name, description, icon') \
        .in_('slug', available_tools) \
        .eq('enabled', True) \
        .execute()

    return {
        'tier': current_user.subscription_tier_id,
        'tools': tools.data,
        'daily_limit': current_user.daily_audit_limit,
        'audits_run_today': current_user.audits_run_today,
    }
```

### **Get Subscription Plans**

```python
@router.get("/api/pricing")
async def get_pricing():
    """Public endpoint: show all pricing plans"""

    tiers = await supabase.table('subscription_tiers') \
        .select('id, name, price_inr, daily_audit_limit, tools_included, support_tier') \
        .eq('is_active', True) \
        .order('price_inr') \
        .execute()

    return {'plans': tiers.data}
```

### **Upgrade Plan**

```python
@router.post("/api/upgrade-plan")
async def upgrade_plan(
    plan_tier: str,
    current_user = Depends(get_current_user),
):
    """Upgrade user to new plan"""

    # Validate plan exists
    tier = await supabase.table('subscription_tiers') \
        .select('id') \
        .eq('id', plan_tier) \
        .single() \
        .execute()

    if not tier.data:
        raise HTTPException(status_code=404, detail="Plan not found")

    # Update user tier
    await supabase.table('profiles').update({
        'subscription_tier_id': plan_tier,
        'subscription_started_at': datetime.now(),
        'subscription_renews_at': datetime.now() + timedelta(days=30),
    }).eq('id', current_user.id)

    # Log action
    await supabase.table('admin_actions').insert({
        'admin_id': current_user.id,
        'action': 'plan_upgraded',
        'affected_user_id': current_user.id,
        'changes': {'new_tier': plan_tier},
    })

    return {'status': 'upgraded', 'new_tier': plan_tier}
```

---

## Admin: Enable/Disable Tools

### **Toggle Tool Visibility**

```python
@router.put("/api/admin/tools/{tool_id}")
async def update_tool(
    tool_id: str,
    enabled: bool,
    current_user = Depends(get_current_user),
):
    """Admin can enable/disable tool"""

    if current_user.role != 'admin':
        raise HTTPException(status_code=403)

    # Update tool
    await supabase.table('tools').update({
        'enabled': enabled,
    }).eq('slug', tool_id)

    # Log action
    await supabase.table('admin_actions').insert({
        'admin_id': current_user.id,
        'action': 'tool_toggled',
        'changes': {'tool_id': tool_id, 'enabled': enabled},
    })

    return {'status': 'updated', 'enabled': enabled}
```

### **Change Tool's Minimum Plan**

```python
@router.put("/api/admin/tools/{tool_id}/min-plan")
async def update_tool_min_plan(
    tool_id: str,
    min_plan_tier: str,
    current_user = Depends(get_current_user),
):
    """Admin can change tool's minimum plan requirement"""

    if current_user.role != 'admin':
        raise HTTPException(status_code=403)

    # Update tool
    await supabase.table('tools').update({
        'min_plan_tier': min_plan_tier,
    }).eq('slug', tool_id)

    # Log action
    await supabase.table('admin_actions').insert({
        'admin_id': current_user.id,
        'action': 'tool_plan_changed',
        'changes': {'tool_id': tool_id, 'new_min_plan': min_plan_tier},
    })

    return {'status': 'updated', 'min_plan': min_plan_tier}
```

---

## Upgrade Prompts

### **Show Upgrade CTA When Limit Reached**

```typescript
// frontend/src/components/UpgradePrompt.tsx

export function UpgradePrompt() {
  const { user } = useAuth();
  const { data: plans } = useQuery(['pricing'], fetchPricing);

  if (!user || user.subscription_tier_id === 'enterprise') return null;

  const currentPlanIndex = planRanking[user.subscription_tier_id];
  const nextPlan = plans[currentPlanIndex + 1];

  if (!nextPlan) return null;

  return (
    <Alert type="info" title="Upgrade Your Plan">
      <p>
        You've reached your daily limit of {user.daily_audit_limit} audits.
        Upgrade to {nextPlan.name} for {nextPlan.daily_audit_limit} audits/day.
      </p>
      <Button
        onClick={() => navigate(`/upgrade?plan=${nextPlan.id}`)}
        variant="primary"
      >
        Upgrade Now (₹{nextPlan.price_inr}/month)
      </Button>
    </Alert>
  );
}
```

---

## Billing & Payments

### **Integration with Razorpay** (Example)

```python
# backend/services/payments.py

import razorpay

client = razorpay.Client(auth=(RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET))

async def create_subscription(user_id: str, plan_id: str):
    """Create Razorpay subscription for user"""

    plan = await supabase.table('subscription_tiers') \
        .select('price_inr') \
        .eq('id', plan_id) \
        .single() \
        .execute()

    # Create subscription via Razorpay
    subscription = client.subscription.create({
        "plan_id": f"plan_{plan_id}",
        "customer_notify": 1,
        "quantity": 1,
        "total_count": 12,  # 12 months
    })

    # Update user in DB
    await supabase.table('profiles').update({
        'subscription_tier_id': plan_id,
        'razorpay_subscription_id': subscription['id'],
    }).eq('id', user_id)

    return subscription
```

---

## Testing

```python
# tests/test_pricing.py

def test_free_user_cannot_access_pro_tool():
    """Free user should get 403 when trying to access Pro tool"""

    # Create free user
    user = create_user(tier='free')

    # Try to access GST Checker (requires Pro)
    response = post(
        '/api/tools/gst-checker/verify',
        headers={'Authorization': f'Bearer {user.token}'},
        files={'file': test_file}
    )

    assert response.status_code == 403
    assert 'pro plan' in response.json()['detail'].lower()

def test_pro_user_can_access_gst_checker():
    """Pro user should access GST Checker successfully"""

    user = create_user(tier='pro')

    response = post(
        '/api/tools/gst-checker/verify',
        headers={'Authorization': f'Bearer {user.token}'},
        files={'file': test_file}
    )

    assert response.status_code == 200

def test_daily_limit_enforced():
    """User should not exceed daily audit limit"""

    user = create_user(tier='free', daily_limit=3)

    for i in range(3):
        response = post('/api/tools/labour-auditor/audit', ...)
        assert response.status_code == 200

    # 4th audit should fail
    response = post('/api/tools/labour-auditor/audit', ...)
    assert response.status_code == 429
```

---

## Summary

This pricing system allows:
- ✅ No-code tool enable/disable (via admin UI)
- ✅ Tier-based tool access (configured in DB, not code)
- ✅ Daily/monthly audit limits per tier
- ✅ Upgrade prompts at UI level
- ✅ Backend enforcement of tier access

**Next:** Read MIGRATION_STRATEGY.md to convert from single-tool.
