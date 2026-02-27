# Compliance Suite — Build Strategy
### Plug-and-Play Framework for Micro-SaaS Tool Velocity

> **Guiding principle:** Ship one tool. Validate with real users. Add the next only when the signal is clear. Speed beats completeness.

---

## 1. North Star

Build a **Compliance Hub** for Indian businesses — a suite of calm, functional tools that replace the anxiety of legal paperwork with clear, actionable answers. Each tool is independently useful but lives inside a shared shell so that one paying customer gets progressively more value the more tools are live.

The existing **Labour Code Auditor** is the beachhead. Everything else is a door that opens from it.

---

## 2. Current State Snapshot

| What's Built | Status |
|---|---|
| Labour Code PDF Auditor (AI-scored) | ✅ Live |
| Auth system (email/OTP/role-based) | ✅ Production-quality |
| Admin dashboard + usage logs | ✅ Live |
| Supabase backend + FastAPI | ✅ Live |
| shadcn/ui component library | ✅ Installed |
| Hub (3-column card grid) | ❌ Not built |
| Paper View expansion pattern | ❌ Not built |
| Tools 02–06 | ❌ Not built |
| Payments / subscription layer | ❌ Not built |

**The immediate job:** user-test Tool 01 → collect signal → decide which tool to build second.

---

## 3. The Architecture: Hub + Paper View

### Mental Model

```
[Hub]  ──expand──>  [Paper View (Tool)]  ──door──>  [Another Tool]
  ↑                        |
  └──── "← Back to Hub" ───┘
```

### Hub Layout (Level 1)

- Background: `#F3F4F6` / `zinc-100`
- 3-column card grid (2-column on tablet, 1 on mobile)
- Each card: white bg, `1px border-zinc-200`, no shadow, hover → border darkens to `zinc-400`. No lifting.
- Sticky header: `[Logo] Compliance Hub` | `[⌘K Search]` `[🔔]` `[Avatar ▾]`

### Paper View (Level 2)

- Max-width `800px`, centered, white bg
- Feels like a document/form — not a dashboard
- Small breadcrumb: `Hub → Labour Code`
- Small "Door" link in sidebar: *"See how this affects your taxes →"* (links to Tax Tool)
- Back button always visible

### State Pattern (single-page, no routing needed initially)

```
activeTool: null | 'labor' | 'tax' | 'calendar' | 'penalty' | 'docs' | 'wage'
```

`null` renders the Hub. Anything else renders Paper View for that tool. Keep it in `App.tsx` state — no React Router needed until you have 3+ tools live.

---

## 4. The 6 Tools: Priority Stack

> **Rule:** Only build the next tool when the previous one has paying users or clear demand signal from user testing.

### Tier 1 — Already Built, Validate First

| # | Tool | Headline | CTA Copy (Basecamp-style) |
|---|---|---|---|
| 01 | Labour Code Auditor | "Does your policy hold up?" | *"Scan my policy"* |

### Tier 2 — Build if Tool 01 pays

| # | Tool | Headline | CTA Copy | Core Input → Output |
|---|---|---|---|---|
| 02 | Wage Simulator | "What does this hire actually cost?" | *"Calculate my liability"* | Salary inputs → Net pay + PF + ESI breakdown |
| 05 | Doc Vault | "Grab a compliant template" | *"Get this template"* | Select doc type → Download pre-filled contract |

*Rationale: Wage Simulator is a natural upsell from the Labour audit ("you're non-compliant on wages — want to calculate the right amount?"). Doc Vault is low-build-cost (mostly static content) with high perceived value.*

### Tier 3 — Build if Tier 2 validates

| # | Tool | Headline | CTA Copy | Core Input → Output |
|---|---|---|---|---|
| 03 | Compliance Calendar | "What's due this month?" | *"Show my deadlines"* | Industry + state → Filing calendar |
| 04 | Penalty Calculator | "What's the actual risk?" | *"Show me the fine"* | Violation type + severity → Penalty range |

### Tier 4 — Build last, highest complexity

| # | Tool | Headline | CTA Copy | Core Input → Output |
|---|---|---|---|---|
| 06 | Tax Optimizer | "Old or new regime — which wins?" | *"Check my filing"* | Salary slabs + deductions → Regime comparison |

---

## 5. Plug-and-Play: New Tool Checklist

Use this for every tool you build. Copy, fill in the blanks, ship.

```markdown
## Tool: [Name]
**Tier:** [1/2/3/4]
**Validation signal needed before building:** [e.g., "5 users ask for it in testing"]

### Card (Hub view)
- Headline:
- Sub-headline (one line, plain English):
- Icon (lucide-react):
- CTA button text:

### Paper View
- Input: What does the user provide?
- Output: What do they get back?
- API endpoint: POST /[tool-slug]
- Backend logic: [AI prompt / calculation / static lookup]
- Key shadcn components needed: [Card, Input, Table, etc.]

### Door links
- This tool links TO:
- This tool is linked FROM:

### Success metric
- What does "validated" look like? [e.g., "3 users pay for it" / "used 10+ times in a week"]

### Kill condition
- Cut this tool if: [e.g., "no one clicks the card after 2 weeks of live testing"]
```

---

## 6. Payments Strategy

### Don't build a pricing page first. Build a paywall second.

**Phase 1 — Validation (now)**
- Tool 01 is free with a usage cap (e.g., 3 audits/month)
- Collect emails. Watch which users hit the cap and come back.
- Those are your buyers.

**Phase 2 — First Dollar**
- Add Razorpay or Stripe Checkout (single button, no pricing page needed)
- Offer one plan: ₹999/month or ₹799/month billed annually
- Unlock: unlimited audits + access to any additional tools live at the time
- Message: *"You've used your 3 free audits. Unlock everything for ₹999/month."*

**Phase 3 — Per-Seat / Team**
- When 2+ users from same org sign up, offer a team plan
- This is already supported in your Supabase schema (org-level profiles)

### Razorpay vs. Stripe

| | Razorpay | Stripe |
|---|---|---|
| Indian cards / UPI | ✅ Native | ⚠️ Requires setup |
| International billing | ⚠️ Limited | ✅ Native |
| Subscriptions | ✅ | ✅ |
| **Recommendation** | Use for Indian customers (most likely early cohort) | Add later for international |

---

## 7. User Testing Protocol (Before Building Anything New)

**Week 1–2: Give access to 10 people**

Target: HR managers, compliance officers, CA firms, startup founders with >10 employees.

Ask them:
1. Upload your actual policy. What score did you get?
2. Was the finding list useful or confusing?
3. What would you do with this report?
4. What compliance problem do you have that this *didn't* solve?

**The answer to question 4 is your next tool.**

**Signals that tell you to build Tool 02 (Wage Simulator):**
- Users ask "okay I'm non-compliant on wages, what should I be paying?"
- Users mention PF / ESI / TDS confusion in the same breath

**Signals that tell you to build Doc Vault first:**
- Users say "I don't have a policy — can you give me one?"
- Users ask for contract templates

**Kill signal for any planned tool:**
- Nobody mentions it unprompted in 20+ user conversations

---

## 8. The "Door" Navigation — Implementation Plan

The Door is not a feature, it's a **conversion mechanism**. It exists to upsell the next tool at the moment of maximum relevance.

**Example Doors to implement:**

```
Labour Audit result (score < 70%)
  └── "Your wage structure may be contributing to this score.
       Run a Wage Simulation to check. →"  [Door to Tool 02]

Wage Simulator result
  └── "Need a compliant offer letter?
       Grab a template. →"  [Door to Tool 05]

Doc Vault (free template downloaded)
  └── "Want to audit your full policy for free?
       Try the Labour Code Auditor. →"  [Door to Tool 01]
```

Each Door is a single sentence + a right-arrow link. No pop-ups, no banners. Calm.

---

## 9. UI Refactor Checklist (Aligning to Basecamp Philosophy)

These are the changes needed to bring the current UI in line with the strategy. Do this *before* building new tools — the Hub shell needs to be right first.

- [ ] Replace tab-nav (`Auditor / Audit Logs / Admin`) with Hub card grid as the default landing
- [ ] Rename global nav: `AuditAI` → `Compliance Hub` (or keep AuditAI as brand, add "Compliance Hub" as descriptor)
- [ ] Remove `framer-motion` scale/lift animations from buttons and cards
- [ ] Remove `animate-ping` from scanner — replace with a simple progress bar only
- [ ] Change CTA: "Run Compliance Audit" → *"Scan my policy"*
- [ ] Change CTA: "Audit Another Policy" → *"Scan a different policy"*
- [ ] Change nav tab "Auditor" → "Labour Code" (tool name, not function name)
- [ ] Add `⌘K` search stub (even as a non-functional placeholder for now)
- [ ] Add breadcrumb inside Paper View: `Hub → Labour Code`
- [ ] Cap card hover to border color change only — no shadow, no translate

---

## 10. Tech Decisions: What to Keep, What to Add

### Keep as-is
- Supabase auth + profiles table (already handles roles, limits, locking)
- FastAPI backend (add new endpoints per tool, don't refactor)
- shadcn/ui (all needed primitives are already installed)
- Recharts (already in Usage dashboard — reuse for any analytics)
- Framer Motion (keep for *page transitions only*, not micro-interactions)

### Add when payments are needed
- `razorpay` npm package (frontend) + Razorpay webhook handler (FastAPI route)
- New Supabase table: `subscriptions (user_id, plan, status, expires_at)`
- Middleware in FastAPI: check `subscriptions` table before serving paid endpoints

### Add when second tool is ready
- Tool registry pattern in frontend: `TOOLS` config array (id, title, subtitle, icon, component, tier)
- Render Hub grid dynamically from `TOOLS` — adding a new tool = adding one object to the array

### Never add (YAGNI for now)
- React Router (state-based tool switching is fine until 3+ tools)
- Separate microservices per tool (one FastAPI app, one codebase)
- A/B testing framework
- A mobile app

---

## 11. The One-Page Build Sequence

```
[NOW]
  Validate Tool 01 with 10 users
  Fix UI to Basecamp spec (no new features, just alignment)
  Add usage cap + paywall trigger message

[AFTER FIRST PAYING USER]
  Add Razorpay checkout (single plan)
  Build Hub shell (card grid, Paper View pattern, breadcrumb)
  Migrate Tool 01 into Paper View

[AFTER ₹10K MRR OR CLEAR USER SIGNAL]
  Build Tool 02 or 05 (whichever users asked for)
  Add Door link from Tool 01 → new tool

[AFTER ₹25K MRR]
  Build next tool in Tier 3
  Introduce annual plan discount
  Consider team/org pricing

[DEFER INDEFINITELY]
  Any tool with no user demand signal
  Any tool that requires a new data source you don't have
```

---

## 12. Naming & Brand Notes

The current name **AuditAI** is accurate but narrow — it implies only auditing. As the suite grows, it may feel limiting. Options to consider (no action needed now, just log this):

- Keep `AuditAI` as the product family name, call the hub `Compliance Hub by AuditAI`
- Or rename to something suite-first when Tool 02 launches

**Don't rename during user testing.** Brand decisions after revenue signal only.

---

## 13. Visual Design System

**See `DESIGN_SYSTEM.md` for the full token reference, component specs, and implementation guide.**

### Summary: The Japandi × Japanese UI Shift

The current UI uses Tailwind's cold `zinc` scale. The overhaul moves to a warm Japandi + Japanese UI palette. The single most impactful change is replacing the `:root` CSS variables in `index.css` — this updates every shadcn component in the app simultaneously.

**The five decisions that define the new aesthetic:**

**1. Page background: `#F3F3F2` (Shironeri) instead of `#F4F4F5` (zinc-100)**
The warmth difference is subtle but the psychological effect is significant — it reads as "paper" rather than "screen."

**2. Primary brand color: `#606C5A` (Japandi forest green) instead of zinc-900**
Forest green is the defining color of the suite. It signals: natural authority, institutional trust, growth. Not startup-green (#10B981), not government-blue (#1D4ED8) — something occupying the calm space between them.

**3. Card style: chalk white bg + warm 1px border + warm 1pt drop shadow**
```css
background: #FFFFFC;
border: 1px solid #E6E4E0;
box-shadow: 0 1px 3px rgba(95, 87, 80, 0.07), 0 1px 2px rgba(95, 87, 80, 0.04);
border-radius: 8px;
```
The warm-tinted shadow is the detail that separates Japandi from generic "clean UI." Pure `rgba(0,0,0,0.x)` shadows look cold and tech-y.

**4. Typography: DM Serif Display for headings, Inter for body**
Serif headings are the single biggest UX decision in this overhaul. Every institution users trust for compliance — law firms, tax authorities, financial publications — uses serif headings. It creates subconscious authority before a user reads a word.

**5. Interaction freeze: no hover scale, no animate-ping, border-darkens only**
Remove `hover:scale-[1.02]`, `active:scale-[0.98]`, and `animate-ping` entirely. Cards and buttons respond to hover only by changing border color to `#C0B4A8`. Nothing bounces or lifts. This is the Basecamp rule: motion means navigation, not decoration.

### Compliance Score Color Replacement

| State | Current | Replacement |
|---|---|---|
| Compliant (≥80) | `text-emerald-600` / `bg-emerald-50` | `text-[#3D4A38]` / `bg-[#ECF0E8]` |
| Moderate (50–79) | `text-yellow-600` / `bg-yellow-50` | `text-[#7A5C2A]` / `bg-[#F8F0DE]` |
| Critical (<50) | `text-red-600` / `bg-red-50` | `text-[#6B3530]` / `bg-[#F5ECEA]` |

The replacement colors use the Japandi amber and desaturated brick. The visual shift: from "tech dashboard traffic lights" to "institutional document annotations."

---

*Last updated: February 2026 · Strategy version 1.1*
*Companion docs: ADMIN_STRATEGY.md · DESIGN_SYSTEM.md*
*This document should be updated after each user testing round and each tool launch.*
