# BUILD.md — Product & Business Strategy
### Compliance Suite · Plug-and-Play Micro-SaaS Framework

> Ship one tool. Validate with real users. Add the next only when the signal is clear. Speed beats completeness.

*Design tokens → DESIGN.md · Admin UX → ADMIN.md*

---

## 1. North Star

Build a **Compliance Hub** for Indian businesses — a suite of calm, functional tools that replace the anxiety of legal paperwork with clear, actionable answers. Each tool is independently useful but lives inside a shared shell, so one paying customer gets progressively more value as more tools go live.

The existing **Labour Code Auditor** is the beachhead. Everything else is a door that opens from it.

---

## 2. Current State

| What's Built | Status |
|---|---|
| Labour Code PDF Auditor (AI-scored) | ✅ Live |
| Auth system (email / OTP / role-based) | ✅ Production-quality |
| Admin dashboard + usage logs | ✅ Live |
| Supabase backend + FastAPI | ✅ Live |
| shadcn/ui component library | ✅ Installed |
| Hub card grid | ❌ Not built |
| Paper View expansion pattern | ❌ Not built |
| Tools 02–06 | ❌ Not built |
| Payments / subscription layer | ❌ Not built |

**Immediate job:** user-test Tool 01 → collect signal → decide which tool to build second.

---

## 3. Architecture: Hub + Paper View

```
[Hub]  ──expand──>  [Paper View (Tool)]  ──door──>  [Another Tool]
  ↑                        |
  └──── "← Back to Hub" ───┘
```

### Hub (Level 1)
- Page bg: `#F3F3F2`, 3-column card grid (2-col tablet, 1-col mobile)
- Sticky header: `[Logo] Compliance Hub` · `[⌘K]` `[🔔]` `[Avatar ▾]`
- Card hover: border darkens only. No shadow, no lift. See DESIGN.md.

### Paper View (Level 2)
- Max-width `800px`, centered, white bg
- Breadcrumb: `Hub → Labour Code`
- Door link in-content: *"See how this affects your taxes →"*
- Back button always visible

### State Pattern — No Router Needed Yet
```ts
activeTool: null | 'labor' | 'tax' | 'calendar' | 'penalty' | 'docs' | 'wage'
```
`null` = Hub grid. Anything else = Paper View for that tool. Lives in `App.tsx` state. Add React Router only when 3+ tools are live.

---

## 4. The 6 Tools — Priority Stack

> **Rule:** Only build the next tool when the previous one has paying users or a clear demand signal.

### Tier 1 — Built. Validate now.

| # | Tool | Headline | CTA |
|---|---|---|---|
| 01 | Labour Code Auditor | "Does your policy hold up?" | *"Scan my policy"* |

### Tier 2 — Build when Tool 01 pays

| # | Tool | Headline | CTA | Input → Output |
|---|---|---|---|---|
| 02 | Wage Simulator | "What does this hire actually cost?" | *"Calculate my liability"* | Salary → Net pay + PF + ESI |
| 05 | Doc Vault | "Grab a compliant template" | *"Get this template"* | Select type → Download contract |

*Wage Simulator is the natural upsell from a Labour audit ("non-compliant on wages — want to see the right number?"). Doc Vault is low build cost, high perceived value.*

### Tier 3 — Build when Tier 2 validates

| # | Tool | Headline | CTA | Input → Output |
|---|---|---|---|---|
| 03 | Compliance Calendar | "What's due this month?" | *"Show my deadlines"* | Industry + state → Filing dates |
| 04 | Penalty Calculator | "What's the actual risk?" | *"Show me the fine"* | Violation + severity → Penalty range |

### Tier 4 — Build last

| # | Tool | Headline | CTA | Input → Output |
|---|---|---|---|---|
| 06 | Tax Optimizer | "Old or new regime — which wins?" | *"Check my filing"* | Salary + deductions → Regime comparison |

---

## 5. Plug-and-Play: New Tool Template

Copy this for every new tool. Fill in, ship.

```markdown
## Tool: [Name]
Tier: [1–4]
Validation signal needed: [e.g. "5 users ask for it unprompted"]

### Card
- Headline:
- Sub (one line):
- Icon (lucide-react):
- CTA text:

### Paper View
- Input:
- Output:
- API endpoint: POST /[slug]
- Backend: [AI prompt / calculation / static lookup]
- shadcn components: [Card, Input, Table…]

### Doors
- Links TO:
- Linked FROM:

### Validated when:
### Kill if:
```

---

## 6. User Testing Protocol

**Week 1–2: 10 people, real policies**

Target: HR managers, compliance officers, CA firms, founders with >10 employees.

Ask:
1. Upload your actual policy. What score did you get?
2. Was the finding list useful or confusing?
3. What would you do with this report?
4. **What compliance problem did this not solve?**

Question 4 is your next tool brief.

**Build Tool 02 (Wage Sim) if users say:**
- "Okay I'm non-compliant on wages — what should I actually be paying?"
- They mention PF / ESI / TDS in the same breath

**Build Doc Vault first if users say:**
- "I don't even have a policy — can you give me one?"
- They ask for contract templates

**Kill signal:** Nobody mentions a planned tool unprompted in 20+ conversations.

---

## 7. The Door Navigation

The Door is a **conversion mechanism**, not a UX nicety. It surfaces the next tool at the moment of maximum relevance — when the user just got a result and is most primed to act.

```
Labour Audit result (score < 70%)
  └── "Your wage structure may be contributing to this.
       Run a Wage Simulation to check. →"

Wage Simulator result
  └── "Need a compliant offer letter?
       Grab a template. →"

Doc Vault (template downloaded)
  └── "Want to audit your full policy?
       Try the Labour Code Auditor. →"
```

Each Door = one sentence + right-arrow link. No pop-ups, no banners, no modals. Plain text.

---

## 8. Payments Strategy

### Phase 1 — Validation (now)
- Tool 01 free, capped at 3 audits/month
- Watch who hits the cap and comes back — those are buyers
- Collect nothing. Just observe.

### Phase 2 — First Dollar
- Add Razorpay Checkout (one button, no pricing page)
- One plan: ₹999/month or ₹799/year
- Paywall message: *"You've used your 3 free audits. Unlock everything for ₹999/month."*
- Unlocks: unlimited audits + all tools currently live

### Phase 3 — Team
- When 2+ users from same org sign up, offer team pricing
- Schema already supports org-level profiles in Supabase

### Razorpay vs Stripe

| | Razorpay | Stripe |
|---|---|---|
| Indian cards / UPI | ✅ Native | ⚠️ Extra setup |
| International | ⚠️ Limited | ✅ Native |
| **Use for** | First Indian cohort | Add later for international |

**Schema changes needed when Razorpay goes live:**
```sql
ALTER TABLE profiles ADD COLUMN plan TEXT DEFAULT 'free';
ALTER TABLE profiles ADD COLUMN plan_expires_at TIMESTAMPTZ;
ALTER TABLE profiles ADD COLUMN razorpay_subscription_id TEXT;
```

---

## 9. Tech Decisions

### Keep as-is
- Supabase auth + profiles (roles, limits, locking all done)
- FastAPI (add endpoints per tool, don't restructure)
- shadcn/ui (all primitives installed)
- Recharts (in Usage — reuse for any analytics)
- Framer Motion (page transitions only — see DESIGN.md)

### Add when payments are ready
- `razorpay` npm + webhook handler in FastAPI
- `subscriptions` table: `(user_id, plan, status, expires_at)`
- FastAPI middleware: check subscriptions before serving paid endpoints

### Add when Tool 02 is ready
- `TOOLS` config array: `{ id, title, subtitle, icon, component, tier }`
- Hub renders dynamically from this array — adding a tool = one object

### Never add (YAGNI)
- React Router — state switching is fine until 3+ tools
- Separate microservices per tool
- A/B testing framework
- Mobile app

---

## 10. Build Sequence

```
NOW
  └── User-test Tool 01 with 10 people
  └── Apply DESIGN.md changes (CSS vars + font, no new features)
  └── Add usage cap + paywall trigger message

AFTER FIRST PAYING USER
  └── Razorpay checkout (single plan)
  └── Build Hub grid + Paper View shell
  └── Migrate Tool 01 into Paper View

AFTER ₹10K MRR OR CLEAR SIGNAL
  └── Build Tool 02 or 05 (whichever users asked for)
  └── Add Door from Tool 01 → new tool
  └── Admin: add Pulse pillar (see ADMIN.md)

AFTER ₹25K MRR
  └── Build next Tier 3 tool
  └── Annual plan discount
  └── Team pricing

DEFER
  └── Any tool with no user demand signal
  └── Any tool needing a data source you don't have
```

---

## 11. Naming

**AuditAI** is accurate but narrow — it implies auditing only. As the suite grows it may feel limiting.

Options (no action needed now):
- Keep `AuditAI` as brand, add "Compliance Hub" as descriptor in the nav
- Rename suite-first when Tool 02 launches

**Don't rename during user testing.** Brand decisions after revenue signal.

---

*v1.1 · Feb 2026 · Updated after each testing round and tool launch*
