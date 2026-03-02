# 7. Admin Dashboard Design: Global Control Hub

Complete UI/UX design for founder/admin dashboard to manage tools, users, and metrics.

---

## Dashboard Sections

### **1. Global Metrics Dashboard** (Home view)

```
┌─────────────────────────────────────────────────────┐
│              ADMIN DASHBOARD                         │
│  [Profile] [Settings] [Logout]                      │
└─────────────────────────────────────────────────────┘

┌─ Today's Overview ─────────────────────────────────┐
│                                                      │
│  Total Audits Today: 42        New Users: 3        │
│  Total Tokens Used: 12,450     Revenue: ₹2,100     │
│                                                      │
│  Server Health: ✓ Healthy      Avg Response: 245ms │
│                                                      │
└──────────────────────────────────────────────────────┘

┌─ Tool Usage (Last 7 Days) ──────────────────────────┐
│                                                      │
│  Line Chart: Audits per tool over time              │
│                                                      │
│  Labour Auditor:  1,250 audits  |████████░░|       │
│  GST Checker:      450 audits   |██████░░░░|       │
│  Income Tax Tool:  180 audits   |██░░░░░░░░|       │
│                                                      │
└──────────────────────────────────────────────────────┘

┌─ Revenue (Last 30 Days) ─────────────────────────────┐
│                                                      │
│  Bar Chart: Revenue by subscription tier            │
│                                                      │
│  Free:       ₹0      [Bar]                          │
│  Pro:        ₹15,000 [████████████░░░░]            │
│  Business:   ₹28,000 [██████████████░░░]           │
│                                                      │
│  Total: ₹43,000                                     │
│                                                      │
└──────────────────────────────────────────────────────┘

┌─ User Distribution ────────────────────────────────┐
│                                                     │
│  Free:       245 users  [████░░░░░░]              │
│  Pro:        42 users   [███░░░░░░░]              │
│  Business:   8 users    [░░░░░░░░░░]              │
│  Enterprise: 2 users    [░░░░░░░░░░]              │
│                                                     │
│  Total: 297 users                                  │
│                                                     │
└─────────────────────────────────────────────────────┘
```

---

### **2. Tool Management** (Tool-specific view)

```
┌─ SELECT TOOL ──────────────────────────────────────┐
│  [Labour Auditor ▼]                                │
│   - Labour Auditor (Active)                        │
│   - GST Checker (Active)                           │
│   - Income Tax Tool (Beta)                         │
│   - DPDP Compliance (Coming Soon)                  │
└────────────────────────────────────────────────────┘

┌─ LABOUR AUDITOR DASHBOARD ─────────────────────────┐
│                                                    │
│  Status: ✓ Active      Error Rate: 0.2%           │
│  Users: 187            Avg Response: 240ms        │
│                                                    │
│  ┌─ Settings ────────────────────────────────────┐ │
│  │ Tool Name:        Labour Code Auditor         │ │
│  │ Min Plan Tier:    Free                        │ │
│  │ Max File Size:    50 MB                       │ │
│  │ API Timeout:      30 seconds                  │ │
│  │ Rate Limit:       60 req/min                  │ │
│  │                                                │ │
│  │ [Enable] [Disable] [Save Changes]             │ │
│  └────────────────────────────────────────────────┘ │
│                                                    │
│  ┌─ Knowledge Base Management ───────────────────┐ │
│  │                                               │ │
│  │  Current KB: Labour Code of India 2023        │ │
│  │  Entries: 122                                 │ │
│  │  Last Updated: 2024-02-25                     │ │
│  │                                               │ │
│  │  Upload New KB:                               │ │
│  │  [Choose File] (PDF/MD) ▶ [Upload]           │ │
│  │  Status: Ready                                │ │
│  │                                               │ │
│  └───────────────────────────────────────────────┘ │
│                                                    │
│  ┌─ Usage Statistics ────────────────────────────┐ │
│  │                                               │ │
│  │  Audits This Month:  1,250                   │ │
│  │  Avg Compliance Score: 72%                   │ │
│  │  Total Tokens Used:  125,450                 │ │
│  │  Est. Cost (₹):      ₹11,290                 │ │
│  │                                               │ │
│  └───────────────────────────────────────────────┘ │
│                                                    │
└────────────────────────────────────────────────────┘
```

---

### **3. User Management**

```
┌─ USERS ────────────────────────────────────────────┐
│                                                    │
│  [Search users] [Create New User]                 │
│                                                    │
│  ┌─ Table ─────────────────────────────────────┐ │
│  │ Name  │ Email │ Plan  │ Status │ Actions  │ │
│  ├───────┼───────┼───────┼────────┼──────────┤ │
│  │ John  │ john@ │ Pro   │ Active │ ⋯ [Edit]│ │
│  │ Sarah │ sarah@│ Free  │ Active │ ⋯ [Edit]│ │
│  │ Mike  │ mike@ │ Bus.. │ Locked │ ⋯ [Edit]│ │
│  └───────┴───────┴───────┴────────┴──────────┘ │
│                                                    │
│  Showing 1-10 of 297 users                        │
│  [< Previous] [1] [2] [3] ... [Next >]            │
│                                                    │
└────────────────────────────────────────────────────┘

┌─ User Details Modal ───────────────────────────────┐
│                                                    │
│  User: john@example.com                           │
│                                                    │
│  Full Name: John Doe                              │
│  Company: Acme Corp                               │
│  Industry: Tech                                   │
│                                                    │
│  Subscription Tier:                               │
│  [Free ▼]                                         │
│   - Free                                          │
│   - Pro (₹499/month)                              │
│   - Business (₹1499/month)                        │
│                                                    │
│  Daily Audit Limit: [3] (Admin can override)      │
│                                                    │
│  Account Status:                                  │
│  ☐ Locked      ☐ Deleted                         │
│                                                    │
│  Quick Actions:                                   │
│  [Reset Password] [Lock Account] [Delete]        │
│                                                    │
│  Usage This Month:                                │
│  Audits: 12 / 90 (Free tier limit)               │
│                                                    │
│  [Cancel] [Save Changes]                          │
│                                                    │
└────────────────────────────────────────────────────┘
```

---

### **4. Pricing Tiers Management**

```
┌─ SUBSCRIPTION TIERS ──────────────────────────────┐
│                                                   │
│  [Create New Tier]                               │
│                                                   │
│  ┌─ Free Tier ─────────────────────────────────┐ │
│  │ Price: ₹0/month                             │ │
│  │ Daily Audit Limit: 3                        │ │
│  │ Monthly Request Limit: 90                   │ │
│  │ Max File Size: 10 MB                        │ │
│  │ Tools Included:                             │ │
│  │ ☑ Labour Auditor ☐ GST Checker ☐ Income Tax│ │
│  │ Support: Email                              │ │
│  │ [Edit] [Delete]                             │ │
│  └─────────────────────────────────────────────┘ │
│                                                   │
│  ┌─ Pro Tier ──────────────────────────────────┐ │
│  │ Price: ₹499/month                           │ │
│  │ Daily Audit Limit: 30                       │ │
│  │ Monthly Request Limit: 1000                 │ │
│  │ Max File Size: 50 MB                        │ │
│  │ Tools Included:                             │ │
│  │ ☑ Labour Auditor ☑ GST Checker ☑ Income Tax│ │
│  │ Support: Priority                           │ │
│  │ [Edit] [Delete]                             │ │
│  └─────────────────────────────────────────────┘ │
│                                                   │
│  ┌─ Business Tier ────────────────────────────┐ │
│  │ Price: ₹1499/month                          │ │
│  │ Daily Audit Limit: 100                      │ │
│  │ Monthly Request Limit: 10000                │ │
│  │ Max File Size: 500 MB                       │ │
│  │ Tools Included:                             │ │
│  │ ☑ Labour Auditor ☑ GST Checker ☑ Income Tax│ │
│  │ ☑ DPDP Compliance                           │ │
│  │ Support: Dedicated                          │ │
│  │ [Edit] [Delete]                             │ │
│  └─────────────────────────────────────────────┘ │
│                                                   │
└───────────────────────────────────────────────────┘
```

---

### **5. API Health & Logs**

```
┌─ API HEALTH MONITOR ───────────────────────────────┐
│                                                    │
│  Database:      ✓ Online   Response: 2ms         │
│  Gemini API:    ✓ Healthy  RPM: 450/500          │
│  Supabase:      ✓ Healthy  Storage: 24GB / 200GB │
│  Redis Cache:   ✓ Online   Hit Rate: 87%         │
│                                                    │
│  System Stats:                                    │
│  Error Rate (last 24h):  0.2%                    │
│  Avg Response Time:      245ms                   │
│  Peak RPS:               120 req/sec             │
│                                                    │
└────────────────────────────────────────────────────┘

┌─ ERROR LOGS ───────────────────────────────────────┐
│                                                    │
│  [Filter by Tool] [Filter by Date]                │
│                                                    │
│  Time         │ Tool    │ Error │ Status │ Action│
│  ──────────────────────────────────────────────── │
│  14:32:15     │ Auditor │ File  │ 400   │ [View]│
│  14:28:42     │ GST     │ Timeout│ 504  │ [View]│
│  14:15:00     │ Auditor │ Auth  │ 401   │ [View]│
│                                                    │
│  Showing errors from last 24 hours                │
│                                                    │
└────────────────────────────────────────────────────┘
```

---

## UI Components Used

```typescript
// Dashboard uses all design system components:
<PageLayout
  header={<Header title="Admin Dashboard" />}
  sidebar={<AdminSidebar activeTab={activeTab} />}
>
  {activeTab === 'metrics' && <MetricsDashboard />}
  {activeTab === 'tools' && <ToolManagement />}
  {activeTab === 'users' && <UserManagement />}
  {activeTab === 'tiers' && <TierManagement />}
  {activeTab === 'health' && <ApiHealth />}
</PageLayout>

// Metrics
<Grid columns={{ mobile: 1, tablet: 2, desktop: 4 }}>
  <MetricCard icon={Users} value={297} label="Total Users" />
  <MetricCard icon={TrendingUp} value={1250} label="Audits Today" />
  <MetricCard icon={DollarSign} value="₹43K" label="Revenue (30d)" />
  <MetricCard icon={Zap} value="12.4K" label="Tokens Used" />
</Grid>

// Tool selector
<Select
  options={tools.map(t => ({ value: t.slug, label: t.name }))}
  value={selectedTool}
  onChange={setSelectedTool}
/>

// User table with actions
<Table
  columns={userColumns}
  data={users}
  onRowClick={(user) => openUserModal(user)}
/>

// Modal for user details
<Modal isOpen={isOpen} title="Edit User">
  <Form fields={userFormFields} onSubmit={saveUser} />
</Modal>
```

---

## Sidebar Navigation

```typescript
const adminNavItems = [
  {
    label: 'Dashboard',
    icon: <LayoutDashboard />,
    href: '/admin',
    badge: null,
  },
  {
    label: 'Tools',
    icon: <Wrench />,
    href: '/admin/tools',
    badge: null,
  },
  {
    label: 'Users',
    icon: <Users />,
    href: '/admin/users',
    badge: pendingApprovals > 0 ? pendingApprovals : null,
  },
  {
    label: 'Pricing',
    icon: <DollarSign />,
    href: '/admin/pricing',
    badge: null,
  },
  {
    label: 'API Health',
    icon: <Activity />,
    href: '/admin/health',
    badge: errors > 0 ? 'error' : 'healthy',
  },
  {
    label: 'Settings',
    icon: <Settings />,
    href: '/admin/settings',
    badge: null,
  },
];
```

---

## Key Actions

### **Enable/Disable Tool**

```typescript
async function toggleToolStatus(toolSlug: string, enabled: boolean) {
  const result = await supabase
    .from('tools')
    .update({ enabled })
    .eq('slug', toolSlug);

  // Users with this tool disabled can no longer access it
  toast({
    type: 'success',
    message: `Tool ${enabled ? 'enabled' : 'disabled'}`,
  });
}
```

### **User Tier Upgrade**

```typescript
async function upgradeUserTier(userId: string, newTier: string) {
  const result = await supabase
    .from('profiles')
    .update({ subscription_tier_id: newTier })
    .eq('id', userId);

  // User immediately gains access to new tools
  toast({
    type: 'success',
    message: `User upgraded to ${newTier}`,
  });
}
```

---

## Performance Considerations

1. **Dashboard metrics:** Cached (5-minute TTL)
2. **User list:** Paginated (10 per page)
3. **Tool list:** Cached on component mount
4. **Charts:** Debounced on data refresh

---

## Summary

This admin dashboard provides:
- ✅ Global metrics visibility
- ✅ Per-tool management & configuration
- ✅ User management (create, tier, lock, delete)
- ✅ Pricing tier configuration
- ✅ API health monitoring
- ✅ No-code tool enable/disable

**Next:** Read TOOL_SCAFFOLDING_TEMPLATE.md to build new tools quickly.
