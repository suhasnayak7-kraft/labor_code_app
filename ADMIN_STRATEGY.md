# Admin Panel — UX/UI Strategy
### Compliance Suite · Governance Console Redesign

> **Guiding principle for Admin:** The admin is the founder's war room. It should answer 5 questions at a glance — who's using what, who's paying, who's knocking, is the system healthy, what's working. Everything else is noise.

---

## 1. What the Current Admin Gets Right (Keep These)

- The name **"Governance Console"** — authoritative, not technical. Keep it.
- The **two-pillar toggle** (Observability / Governance) — the mental model is correct. Just needs better content inside each pillar.
- The **waitlist → provision → active user** flow — this is production-quality and works well. Don't touch the logic.
- The **lock / soft-delete / daily limit** per user — these are the right controls for early-stage access management.
- `shadcn/ui` Table, Tabs, Dialog, AlertDialog usage — all correct primitives.

---

## 2. What Needs to Change (And Why)

### Problem 1: Observability is infra-facing, not founder-facing
The current Observability view shows RPM/TPM for 3 AI models. This is a DevOps metric. As a founder moving toward paying customers across a 6-tool suite, you need **business-facing metrics** as the primary view — active users today, audits run, which tool is being used, who converted to paid. Model health should be there, but demoted to a secondary section.

### Problem 2: No revenue layer at all
There is zero visibility into subscriptions, plan status, or MRR. As soon as Razorpay goes live, you need to know: who's on the free tier, who's paying, who hit the cap and didn't upgrade. This is the single biggest gap.

### Problem 3: Per-user PieChart (model preferences) is low-value
The donut chart showing which AI model a user preferred is noise. You don't care which model — you care about **compliance score outcomes** (what score did they get?), **which tool they used**, and **whether they hit their limit**. These matter for conversion.

### Problem 4: Dark backgrounds inside expansion rows
The `bg-zinc-950/40` dark background in expanded user rows clashes with Basecamp's calm white aesthetic. The admin should be as calm as the rest of the product.

### Problem 5: Admin isn't tool-aware yet
The current admin only knows about one tool (Labour Code Auditor). When Tool 02 launches, the admin needs to show per-tool usage — how many wage simulations vs. audits, which tool drove a conversion, which tool has zero usage (kill signal).

---

## 3. The New Admin Architecture

### Three Pillars (replaces current two-toggle)

```
[Pulse]  [Governance]  [System]
```

| Pillar | What it answers | Replaces |
|---|---|---|
| **Pulse** | Business overview — users, tool usage, conversions | Observability (currently infra-only) |
| **Governance** | Who has access, who's waiting, controls | Current Governance (keep mostly as-is) |
| **System** | Model health, API latency, error rates | Moved from Observability |

This keeps the two-pillar mental model (business vs. infra) but makes the default view **Pulse**, not model RPM.

---

## 4. Pillar 1: Pulse (The Founder's Dashboard)

This is what you see first when you open Admin. It should be readable in 10 seconds.

### Layout

```
┌─────────────────────────────────────────────────────────────────────┐
│  Governance Console                              [Pulse] [Gov] [Sys] │
│  Logged as Suhasa · Administrator                                    │
└─────────────────────────────────────────────────────────────────────┘

┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│ Active Users │ │ Audits Today │ │  Paying Now  │ │ Queue        │
│     12       │ │      8       │ │   ₹ 2,997    │ │  3 pending   │
│ +2 this week │ │ (cap: 30)    │ │  3 users     │ │  → Review    │
└──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘

┌─────────────────────────────────────┐ ┌───────────────────────────┐
│ Tool Usage (This Week)              │ │ Conversion Funnel         │
│                                     │ │                           │
│  Labour Code    ████████████  47    │ │  Free tier:     12 users  │
│  Wage Sim       ████          14    │ │  Hit cap:        5 users  │
│  Doc Vault      ██             6    │ │  Upgraded:       3 users  │
│  [inactive: Calendar, Penalty, Tax] │ │  Conversion:    60%       │
└─────────────────────────────────────┘ └───────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│  Recent Activity (last 24h)                                          │
│  Priya M · Fintech Corp · Tool 01 · Score: 72 · 3 audits today      │
│  Arjun S · StartupX · Tool 01 · Score: 45 · Hit daily cap           │
│  Rohit K · ABC Ltd  · Tool 02 · Wage sim · 2 today                  │
└─────────────────────────────────────────────────────────────────────┘
```

### Metric Cards (Row 1)
Four shadcn `Card` components, uniform height. Each has:
- Big number (text-3xl font-bold)
- One-line descriptor (text-sm text-zinc-500)
- One supporting data point (text-xs text-zinc-400)
- No charts, no graphs, no sparklines — numbers only (Basecamp rule)

The **"Paying Now"** card should be `border-t-4 border-emerald-500` to visually signal it's the north star metric.

### Tool Usage Bar (Row 2, Left)
Plain horizontal bar list — no Recharts, no animated charts. Just:
```
Labour Code    ████████████████  47 uses
Wage Sim       ██████            14 uses
Doc Vault      ██                 6 uses
```
Use Tailwind `bg-zinc-900` filled divs with `w-[%]` calculated inline. Inactive tools shown in muted text: `text-zinc-300 italic`. This tells you immediately which tools have zero traction (kill signals).

### Conversion Funnel (Row 2, Right)
Three numbers in a simple vertical stack — Free → Hit Cap → Upgraded. No funnel chart. Just:
```
Free tier     12
Hit cap        5   → 42% hit cap (good engagement)
Upgraded       3   → 60% of cap-hitters converted (strong)
```
The conversion % is the one number that tells you if the paywall is working.

### Recent Activity (Row 3)
A simple, scrollable log table — company name, tool used, compliance score, status. Think of it as a Twitter-like feed of what happened today. No pagination needed if capped at 10 rows.

---

## 5. Pillar 2: Governance (Evolved)

This is largely what exists today, with targeted changes.

### Tab Structure (Keep 4 tabs, rename one)

| Current | Proposed | Reason |
|---|---|---|
| Pending Requests | **Access Queue** | More action-oriented name |
| Active Users | **User Roster** | Roster implies a list you manage, not just view |
| Rejected | Rejected | Fine as-is |
| Archive | Archive | Fine as-is |

### Access Queue (formerly Pending Requests) — No changes needed
The approve/reject/provision flow is solid. Keep everything. One small addition: show **which tool they asked about** when they filled the request form — this tells you if word-of-mouth is coming from Tool 01 users or people who heard about a specific feature.

### User Roster (formerly Active Users) — Key changes

**Add columns:**

| Column | Current? | Proposed |
|---|---|---|
| Name / Email | ✅ | Keep |
| Company | ✅ | Keep |
| Plan | ❌ | **Add** — Free / Paid / Admin |
| Tools Active | ❌ | **Add** — pills showing which tools they've touched |
| Audits Today | ✅ | Keep |
| Total Audits | ✅ | Keep |
| Status | ✅ (Lock/Delete) | Keep |

The **Plan column** is the most important addition. Even before Razorpay, you can manually set `plan: 'free' | 'paid'` in the profiles table. This primes the schema for payments.

**Expanded user row — Replace the dark bg and PieChart with:**

```
┌─ Expanded: Priya Mehta · Fintech Corp ────────────────────────────┐
│  Plan: Free  │  Daily Limit: 3  │  Total Audits: 12  │  Joined: 2 Jan
│                                                                    │
│  Tool Usage                   Controls                            │
│  Labour Code    9 audits       [ Daily Limit: 3  ] [Save]         │
│  Wage Sim       3 sessions     [ Plan: Free ▾    ]                │
│  Doc Vault      0 uses         [ Lock Account    ]                │
│                                [ Reset Password  ]                │
│                                [ Archive User    ]                │
│                                                                    │
│  Last 5 Audits                                                    │
│  Jan 28 · policy_v2.pdf · Score: 72 · 3,400 tokens               │
│  Jan 26 · handbook.pdf  · Score: 58 · 2,100 tokens               │
└────────────────────────────────────────────────────────────────────┘
```

Key changes from current:
- **White background** (not dark `zinc-950`) — Basecamp consistency
- **Tool usage table** instead of PieChart — shows which tools they use, not which AI model
- **Plan dropdown** as a control — even if Razorpay isn't live yet, admin can manually set plan
- **Compliance scores shown** in audit trail — this is the most useful signal (is the user getting value?)

---

## 6. Pillar 3: System (Demoted Observability)

Model health stays, but it's no longer the first thing you see. Move to a third tab.

### What to keep from current Observability
- Model health cards (RPM / TPM progress bars) — keep exactly as-is
- Active / Inactive badge per model — keep
- "Resets in 60s" footer — keep

### What to add
- **Per-tool error rate** — "Labour Code: 2 errors last hour / Wage Sim: 0 errors"
- **Average response time** per tool — if audits are taking 30s avg, users will complain
- **API cost estimate** — rough ₹/day based on token consumption (already partially built in Usage dashboard)

### What to remove
- The `animate-scale` pulse effect on model cards during refresh — replace with a simple spinner in the Refresh button
- The `framer-motion x: -20 → 0` slide-in between view modes — replace with instant render

---

## 7. Navigation: From Toggle to Tabs

### Current
```
[Observability] [Governance]  ← segmented control in the header
```

### Proposed
```
[Pulse]  [Governance]  [System]  ← shadcn Tabs component (TabsList)
```

Use the existing `Tabs`, `TabsList`, `TabsTrigger`, `TabsContent` from shadcn — already installed. The Governance tab then uses its own inner TabsList for Access Queue / User Roster / Rejected / Archive.

No sidebar needed. Two levels of tabs is the right depth for admin complexity at this stage.

### Tab Badge Indicators
- **Governance** tab: show a blue dot if `pendingRequests.length > 0` (same as current)
- **Pulse** tab: no badge — it's always the default
- **System** tab: show a red dot if any model `isActive === false`

---

## 8. The "Plan" Column — Priming for Razorpay

Before payments are live, admin manually sets a user's plan. After Razorpay, the plan column is auto-updated by webhook. The schema change needed:

```sql
-- Add to profiles table
ALTER TABLE profiles ADD COLUMN plan TEXT DEFAULT 'free';
-- values: 'free' | 'paid' | 'team' | 'admin'

ALTER TABLE profiles ADD COLUMN plan_expires_at TIMESTAMPTZ;
ALTER TABLE profiles ADD COLUMN razorpay_subscription_id TEXT;
```

In the User Roster, the Plan column shows:
```
[Free]           → zinc badge
[Paid ✓]         → emerald badge
[Expired]        → red badge
[Team · 5 seats] → blue badge
```

This gives you a conversion dashboard built right into user management — no separate analytics tool needed.

---

## 9. Tool Access Control (For When Suite Has 2+ Tools)

When Tool 02 launches, admin needs to control which users can access which tools. This is not per-permission (too granular) — it's per-plan.

**Plan → Tool access mapping (managed in admin, not code):**

| Plan | Tool 01 | Tool 02 | Tool 03+ |
|---|---|---|---|
| Free | 3/month | ❌ | ❌ |
| Paid | Unlimited | Unlimited | As released |
| Team | Unlimited | Unlimited | All tools |

This mapping lives in a config table in Supabase, editable from admin:
```
┌─ Tool Access Config ──────────────────────────────────────────┐
│  Tool               Free Limit    Paid Limit    Team Limit    │
│  Labour Code        3/month       Unlimited     Unlimited     │
│  Wage Simulator     ❌            Unlimited     Unlimited     │
│  Doc Vault          1 download    Unlimited     Unlimited     │
└───────────────────────────────────────────────────────────────┘
```

Admin can edit these inline. No code deploys needed to change limits.

---

## 10. Micro-copy Alignment (Basecamp Voice in Admin)

Even admin copy should be plain and human.

| Current | Proposed |
|---|---|
| "Provision a new Auth account" | "Create their login" |
| "Daily Audit Quota" | "Audits per day" |
| "Soft delete — moved to archive" | "Remove their access" |
| "NODE_ID: GEMINI_01" | Remove this entirely — too DevOps |
| "Infrastructure Controls" | "Account settings" |
| "Access Revoked" (user-facing) | "Your access was removed. Contact us to restore it." |

---

## 11. What NOT to Build in Admin

These would be over-engineering for current stage:

- **Custom role creator** — you only need 3 roles (free, paid, admin). Hard-code them.
- **Analytics graphs / charts** — the Pulse section uses number cards only. No Recharts in admin.
- **Audit log export from admin** — users can already export from their own Audit Logs tab. That's sufficient.
- **Multi-admin roles** — one admin (you) is fine until ₹50K MRR.
- **In-app notification system** — email yourself (Supabase has webhooks). Not worth building.
- **Dark mode for admin** — inconsistent with product-wide light theme.

---

## 12. Build Order for Admin Evolution

```
[NOW — no changes needed]
  Keep admin as-is during user testing of Tool 01
  The current Governance / Observability split is good enough

[WHEN RAZORPAY GOES LIVE]
  Add `plan` column to profiles table (SQL migration, 5 mins)
  Add Plan badge to User Roster table
  Add "Paying Now" metric card to Pulse
  Add Conversion Funnel section to Pulse

[WHEN TOOL 02 LAUNCHES]
  Add Tool Usage bar to Pulse
  Add tool-usage columns to expanded user rows
  Replace PieChart with tool usage table in expanded row

[WHEN 20+ USERS ARE ACTIVE]
  Add Recent Activity feed to Pulse
  Rename Observability → System (demote to third tab)
  Add Tool Access Config section
```

---

## 13. Component Map (shadcn primitives already installed)

| Admin Section | shadcn Components | Notes |
|---|---|---|
| Pillar navigation | `Tabs, TabsList, TabsTrigger, TabsContent` | Already used in Governance |
| Metric cards (Pulse) | `Card, CardHeader, CardTitle, CardContent` | No changes needed |
| Tool Usage bars | Plain Tailwind divs | No Recharts needed |
| User Roster table | `Table, TableHeader, TableBody, TableRow, TableCell` | Already used |
| Plan badge | `Badge` with variant prop | Add `plan` to Badge color logic |
| Expanded user row | `Card` inside `TableRow` | Replace dark bg with white Card |
| Access approval | `Dialog, DialogContent, Input, Button` | Already built, keep as-is |
| Lock/Delete | `AlertDialog` | Already built, keep as-is |
| Tool Access Config | `Table` + inline `Input` | New section, low complexity |

---

*Last updated: February 2026 · Admin Strategy v1.0*
*Companion document to STRATEGY.md — read together.*
