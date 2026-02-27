# ADMIN.md — Governance Console
### Compliance Suite · Admin UX & Architecture

> The admin answers 5 questions at a glance: who's using what, who's paying, who's knocking, is the system healthy, what's working. Everything else is noise.

*Product strategy → BUILD.md · Visual tokens → DESIGN.md*

---

## 1. What the Current Admin Gets Right — Keep These

- Name **"Governance Console"** — authoritative, not technical. Keep it.
- Waitlist → provision → active user flow — production-quality. Don't touch the logic.
- Lock / soft-delete / daily limit per user — correct controls for this stage.
- `shadcn/ui` Table, Tabs, Dialog, AlertDialog — all correct primitives.

---

## 2. What Needs to Change

**Observability is infra-facing, not founder-facing.** RPM/TPM for AI models is a DevOps metric. The default view should show: active users today, tool usage, who converted to paid. Model health stays but moves to a third tab.

**No revenue layer.** Zero visibility into plan status or MRR. This gap is the most important thing to fix when Razorpay goes live (see BUILD.md).

**Per-user PieChart is noise.** Which AI model was used is irrelevant. What matters: compliance score outcomes, which tool they used, whether they hit their limit.

**Dark expansion rows clash with the app's aesthetic.** `bg-zinc-950/40` in expanded user rows needs to become white. See DESIGN.md for the card spec.

**Admin isn't tool-aware.** When Tool 02 launches, admin must show per-tool usage across users.

---

## 3. Architecture: Three Pillars

```
[Pulse]  [Governance]  [System]
```

| Pillar | Answers | Replaces |
|---|---|---|
| **Pulse** | Business: users, usage, conversions, revenue | Current Observability (infra-only) |
| **Governance** | Access: who has it, who's waiting, controls | Current Governance (keep, evolve) |
| **System** | Health: model RPM/TPM, latency, error rates | Moved from Observability |

Default tab on open: **Pulse**. Not model health.

Use the existing `Tabs / TabsList / TabsTrigger / TabsContent` from shadcn — already installed. No new primitives needed.

---

## 4. Pillar 1: Pulse — The Founder's View

Readable in 10 seconds. Numbers only — no charts, no sparklines.

### Wireframe

```
┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│ Active Users │ │ Audits Today │ │  Paying Now  │ │  Queue       │
│     12       │ │      8       │ │   ₹ 2,997    │ │  3 pending   │
│ +2 this week │ │  cap: 30     │ │  3 users     │ │  → Review    │
└──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘

┌─────────────────────────────────────┐  ┌──────────────────────────┐
│ Tool Usage — This Week              │  │ Conversion Funnel        │
│                                     │  │                          │
│  Labour Code  ████████████  47      │  │  Free tier:    12 users  │
│  Wage Sim     ████          14      │  │  Hit cap:       5 users  │
│  Doc Vault    ██             6      │  │  Upgraded:      3 users  │
│  Calendar     —  (inactive)         │  │  Rate:         60%       │
└─────────────────────────────────────┘  └──────────────────────────┘

┌──────────────────────────────────────────────────────────────────┐
│  Recent Activity — last 24h                                       │
│  Priya M · Fintech Corp · Tool 01 · Score: 72 · 3 audits today   │
│  Arjun S · StartupX    · Tool 01 · Score: 45 · Hit daily cap     │
│  Rohit K · ABC Ltd     · Tool 02 · Wage sim · 2 today            │
└──────────────────────────────────────────────────────────────────┘
```

### Row 1: Metric Cards
Four `Card` components, uniform height. Each: large number + one-line descriptor + one supporting data point.

- **"Paying Now"** card: `border-t-4` in forest green `#606C5A` — visually signals the north star metric.
- No sparklines, no micro-charts. Numbers only.

### Row 2 Left: Tool Usage Bars
Plain Tailwind divs. No Recharts. Width calculated inline from usage counts.

```tsx
// Active tool
<div className="h-1.5 bg-[#606C5A] rounded-full" style={{ width: `${pct}%` }} />

// Inactive tool (zero usage = kill signal)
<span className="text-[#B0B9A8] italic text-xs">No usage yet</span>
```

### Row 2 Right: Conversion Funnel
Three numbers stacked vertically. No funnel diagram.

```
Free tier     12 users
Hit cap        5 users   →  42% engagement
Upgraded       3 users   →  60% conversion
```

The conversion % is the one number that tells you if the paywall is working.

### Row 3: Recent Activity
Scrollable log, max 10 rows. No pagination. Columns: company, tool, score, status. This is your daily feed of whether users are getting value.

---

## 5. Pillar 2: Governance — Evolved

### Tab Renames

| Current | New | Reason |
|---|---|---|
| Pending Requests | **Access Queue** | Action-oriented |
| Active Users | **User Roster** | Implies management, not just viewing |
| Rejected | Rejected | Fine |
| Archive | Archive | Fine |

### Access Queue
Keep the approve/reject/provision flow exactly as-is — it works. One addition: capture **which tool they're interested in** when they fill the request form. This tells you whether word-of-mouth is coming from Tool 01 or a different feature.

### User Roster — New Columns

| Column | Status | Notes |
|---|---|---|
| Name / Email | ✅ Keep | — |
| Company | ✅ Keep | — |
| **Plan** | ❌ Add | Free / Paid / Admin — see schema below |
| **Tools Active** | ❌ Add | Pills showing which tools they've touched |
| Audits Today | ✅ Keep | — |
| Total Audits | ✅ Keep | — |
| Status (Lock/Archive) | ✅ Keep | — |

### Expanded User Row — Replace PieChart + Dark Bg

**Remove:** `bg-zinc-950/40`, PieChart (model preferences), "Infrastructure Controls" label.

**Replace with white card, tool usage, and compliance scores:**

```
┌─ Priya Mehta · Fintech Corp ──────────────────────────────────────┐
│  Plan: Free   Daily Limit: 3   Total Audits: 12   Joined: 2 Jan   │
│                                                                    │
│  Tool Usage                    Account Controls                   │
│  Labour Code    9 audits       [ Audits/day:  3   ] [Save]        │
│  Wage Sim       3 sessions     [ Plan: Free ▾     ]               │
│  Doc Vault      0 uses         [ Lock account     ]               │
│                                [ Reset password   ]               │
│                                [ Archive user     ]               │
│                                                                    │
│  Last 5 Audits                                                     │
│  Jan 28  policy_v2.pdf   Score: 72   3,400 tokens                 │
│  Jan 26  handbook.pdf    Score: 58   2,100 tokens                 │
└────────────────────────────────────────────────────────────────────┘
```

Key changes from current:
- White bg (`bg-[#FBFAF5]`) — not dark
- Tool usage table instead of PieChart
- Plan dropdown — even pre-Razorpay, manually settable
- Compliance scores in audit trail — the real signal: is this user getting value?

---

## 6. Pillar 3: System — Demoted Observability

Keep the current model health cards (RPM / TPM progress bars, Active/Inactive badge, "Resets in 60s" footer). Move them here — they're not gone, just not the first thing you see.

**Add:**
- Per-tool error rate: "Labour Code: 2 errors last hour / Wage Sim: 0"
- Average response time per tool (if audits average 30s, users will churn)
- Rough API cost estimate in ₹/day (partially built in Usage dashboard already)

**Remove:**
- `animate-scale` pulse on model cards during refresh → single spinner in Refresh button
- `framer-motion x-slide` between view modes → instant render (see DESIGN.md)
- `NODE_ID: GEMINI_01` labels → too DevOps, no user value

---

## 7. Tab Badges

- **Governance** tab → blue dot when `pendingRequests.length > 0`
- **Pulse** tab → no badge, always the default
- **System** tab → red dot when any model `isActive === false`

---

## 8. Plan Column — Schema

Run this migration when Razorpay goes live (or before, to prime the UI):

```sql
ALTER TABLE profiles ADD COLUMN plan TEXT DEFAULT 'free';
-- values: 'free' | 'paid' | 'team' | 'admin'

ALTER TABLE profiles ADD COLUMN plan_expires_at TIMESTAMPTZ;
ALTER TABLE profiles ADD COLUMN razorpay_subscription_id TEXT;
```

Plan badge colours in User Roster:

```
Free      bg: #EAE5E3   text: #5E5E5E   border: #D5CABA
Paid ✓    bg: #ECF0E8   text: #3D4A38   border: #B9B99D
Expired   bg: #F5ECEA   text: #6B3530   border: #D4908A
Team      bg: #EAF0F8   text: #2A4A6B   border: #B9CDE0
```

---

## 9. Tool Access Control (When Suite Has 2+ Tools)

Managed via a Supabase config table — no code deploys to change limits.

| Plan | Tool 01 | Tool 02 | Tool 03+ |
|---|---|---|---|
| Free | 3/month | ❌ | ❌ |
| Paid | Unlimited | Unlimited | As released |
| Team | Unlimited | Unlimited | All tools |

Admin edits limits inline from the System tab. One table, one form, no deploys.

---

## 10. Micro-copy

| Current | Replace with |
|---|---|
| "Provision a new Auth account" | "Create their login" |
| "Daily Audit Quota" | "Audits per day" |
| "Soft delete — moved to archive" | "Remove their access" |
| "NODE_ID: GEMINI_01" | Remove entirely |
| "Infrastructure Controls" | "Account settings" |
| "Access Revoked" (user-facing) | "Your access was removed. Contact us to restore it." |

---

## 11. What NOT to Build in Admin

- Custom role creator — 3 roles (free, paid, admin) is enough. Hard-code them.
- Charts / graphs in Pulse — numbers only. No Recharts.
- Audit log export from admin — users export from their own Audit Logs tab.
- Multi-admin roles — one admin is fine until ₹50K MRR.
- In-app notification system — use Supabase webhooks to email yourself.
- Dark mode — inconsistent with product-wide light theme.

---

## 12. Build Order

```
NOW
  Keep admin as-is during Tool 01 user testing
  Current Governance / Observability split is sufficient

WHEN RAZORPAY GOES LIVE
  Add plan column SQL migration
  Add Plan badge to User Roster
  Add "Paying Now" card to Pulse
  Add Conversion Funnel to Pulse

WHEN TOOL 02 LAUNCHES
  Add Tool Usage bars to Pulse
  Add tool-usage table to expanded user rows
  Replace PieChart entirely

WHEN 20+ ACTIVE USERS
  Add Recent Activity feed to Pulse
  Rename Observability tab → System
  Add Tool Access Config section
```

---

## 13. Component Map

| Section | shadcn Components | Notes |
|---|---|---|
| Pillar nav | `Tabs, TabsList, TabsTrigger, TabsContent` | Already in use |
| Metric cards | `Card, CardHeader, CardTitle, CardContent` | No changes needed |
| Tool Usage bars | Plain Tailwind divs | No Recharts |
| User Roster | `Table, TableHeader, TableBody, TableRow, TableCell` | Already in use |
| Plan badge | `Badge` | Add plan-specific color logic |
| Expanded user row | `Card` inside `TableRow` | White bg, replace dark |
| Access approval | `Dialog, Input, Button` | Already built — keep |
| Lock / Archive | `AlertDialog` | Already built — keep |
| Tool Access Config | `Table` + inline `Input` | New, low complexity |

---

*v1.1 · Feb 2026*
*Product strategy → BUILD.md · Visual tokens → DESIGN.md*
