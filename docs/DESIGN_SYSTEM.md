# Design System — Style Overhaul
### Compliance Suite · Japandi × Japanese UI Tokens

> **Design principle:** Compliance work creates anxiety. The UI's job is to absorb that anxiety — warm surfaces, authoritative type, measured color. The product should feel like a well-organized law firm reading room, not a SaaS dashboard.

---

## 1. Why These Palettes Work for Compliance

### The Problem with the Current Stack
The current app uses Tailwind's pure `zinc` scale — cold gray (#F4F4F5, #E4E4E7, #71717A). This is correct for a generic SaaS product. For a compliance tool, it reads as "government portal" — the exact anxiety you're trying to dissolve.

### What Japandi + Japanese UI Colors Do
Both palettes are built on **warm neutrals with minimal saturation**. The psychological effect:

- **Warm page background** (#F3F3F2 vs cold #F4F4F6) → reduces clinical feel by ~40% visually
- **Forest green (#606C5A) as primary** → signals growth, safety, nature — not "tech green" (#10B981 emerald) which reads as startup
- **Amber (#DCB482) for warnings** → cautionary, not alarming — the difference between a yellow traffic light and a flashing red siren
- **Desaturated brick for destructive** → serious without panic-inducing

The Japanese UI palette (Nuevo.Tokyo) is specifically designed for UI surfaces — the naming tells the story: "Silk White Kneading", "Base Color", "Milky White". These are texture words. For compliance users uploading HR policies, surfaces that feel textured and substantial (not plasticky flat) build subconscious trust.

### The Basecamp Card Reference
What the Basecamp screenshot shows (and what you should copy exactly):
- Category label ("Sample") in a warm accent color — above the title, small caps or medium weight
- Bold dark title — no gradient, no color
- Regular-weight body copy in warm gray — not zinc-500, warmer
- Bottom: context signal (avatar / date / tag) — never icons-only
- **Card itself:** white bg, ~8px radius, 1px warm-gray border, single-point warm drop shadow
- **Critical:** the card does NOT lift on hover. The border darkens. That's it.

---

## 2. Color System

### Surface Hierarchy
The page is built in layers — each layer slightly lighter than the one below it.

```
Layer 0 — Page background:  #F3F3F2  (Shironeri / Silk White)
Layer 1 — Card background:  #FFFFFC  (Gofuniro / Chalk White)
Layer 2 — Muted section:    #EAE5E3  (Soshoku / Base Color)
Layer 3 — Hover / selected: #FBFAF5  (Kinariro / Dough)
```

This is the opposite of the current setup where cards and page background are both close to pure white or zinc. The warm gradient between layers creates **depth without shadows**.

### Full Token Map

```css
/* ─── SURFACES ─────────────────────────────────────────── */
--background:          #F3F3F2   /* Shironeri — page bg */
--card:                #FFFFFC   /* Chalk white — card bg */
--card-hover:          #FBFAF5   /* Kinariro/Dough — card hover bg */
--muted:               #EAE5E3   /* Soshoku — code blocks, muted sections */
--popover:             #FFFFFC   /* Same as card */

/* ─── TEXT ──────────────────────────────────────────────── */
--foreground:          #2C2A28   /* Warm near-black — primary text */
--secondary-text:      #5E5E5E   /* Charcoal (Japandi #5E5E5E) */
--muted-foreground:    #8F837A   /* Warm gray-brown (Japandi #8F837A) */
--placeholder:         #B0B9A8   /* Sage muted (Japandi #B0B9A8) */

/* ─── BORDERS ───────────────────────────────────────────── */
--border:              #E6E4E0   /* Japandi light warm gray */
--border-hover:        #C0B4A8   /* Slightly darker warm gray on hover */
--input:               #E6E4E0

/* ─── BRAND / PRIMARY ───────────────────────────────────── */
--primary:             #606C5A   /* Forest green (Japandi) — CTAs, links */
--primary-hover:       #4F5A4A   /* Darker forest green */
--primary-foreground:  #FFFFFC   /* Chalk white text on primary */
--primary-subtle:      #E8EDE5   /* Light green tint — badge bg, hover states */

/* ─── SEMANTIC STATES ───────────────────────────────────── */
/* Compliant / Success */
--success:             #606C5A   /* Same as primary — consistency */
--success-bg:          #ECF0E8   /* Very light green surface */
--success-border:      #B9B99D   /* Sage green border */
--success-text:        #3D4A38   /* Deep forest text */

/* Warning / Moderate Risk */
--warning:             #DCB482   /* Japandi amber */
--warning-bg:          #F8F0DE   /* Warm amber tint */
--warning-border:      #DCBA7A   /* Amber border */
--warning-text:        #7A5C2A   /* Dark amber text */

/* Critical / Non-compliant */
--destructive:         #8B4A42   /* Desaturated brick red — not aggressive */
--destructive-bg:      #F5ECEA   /* Very light brick tint */
--destructive-border:  #D4908A   /* Muted brick border */
--destructive-text:    #6B3530   /* Deep brick text */

/* Neutral / Info */
--info:                #8F837A   /* Warm gray — informational, not actionable */
--info-bg:             #F0EDE9
--info-border:         #D5CABA

/* ─── RING / FOCUS ──────────────────────────────────────── */
--ring:                #606C5A   /* Forest green focus ring */
--ring-offset:         #FFFFFC   /* Card white */

/* ─── RADIUS ────────────────────────────────────────────── */
--radius:              0.5rem    /* 8px — slightly rounded, matches spec */
```

### HSL Values for `index.css` / shadcn CSS Variables

```css
:root {
  --background:        43 5% 95%;     /* #F3F3F2 */
  --foreground:        30 8% 17%;     /* #2C2A28 */
  --card:              50 33% 100%;   /* #FFFFFC */
  --card-foreground:   30 8% 17%;
  --popover:           50 33% 100%;
  --popover-foreground: 30 8% 17%;
  --primary:           95 8% 39%;     /* #606C5A forest green */
  --primary-foreground: 50 33% 100%;
  --secondary:         35 10% 92%;    /* #EAE5E3 soshoku */
  --secondary-foreground: 30 8% 17%;
  --muted:             35 10% 92%;
  --muted-foreground:  25 6% 52%;     /* #8F837A */
  --accent:            42 25% 97%;    /* #FBFAF5 dough */
  --accent-foreground: 30 8% 17%;
  --destructive:       4 36% 40%;     /* #8B4A42 brick */
  --destructive-foreground: 50 33% 100%;
  --border:            35 8% 89%;     /* #E6E4E0 */
  --input:             35 8% 89%;
  --ring:              95 8% 39%;     /* forest green */
  --radius:            0.5rem;

  /* Custom chart colors — Japandi safe */
  --chart-1:           95 8% 39%;    /* forest green */
  --chart-2:           37 52% 68%;   /* amber #DCB482 */
  --chart-3:           22 30% 64%;   /* copper #C09E85 */
  --chart-4:           0 0% 55%;     /* charcoal #8C8C8C */
  --chart-5:           90 13% 51%;   /* sage #8F837A */
}
```

---

## 3. Card Specification

This is the most important single component in the suite. Every tool card, result card, and admin card follows this spec.

### The Basecamp Card Spec (adapted for compliance)

```css
.card {
  background:       #FFFFFC;                          /* chalk white, not pure white */
  border:           1px solid #E6E4E0;                /* warm light gray */
  border-radius:    8px;                              /* --radius / 0.5rem */
  box-shadow:       0 1px 3px rgba(95, 87, 80, 0.07),
                    0 1px 2px rgba(95, 87, 80, 0.04); /* warm-tinted 1pt drop shadow */
  transition:       border-color 150ms ease;           /* ONLY border transitions */
}

.card:hover {
  border-color:     #C0B4A8;  /* darker warm gray — NO lift, NO scale, NO shadow change */
}
```

**Why warm-tinted shadow, not `rgba(0,0,0,x)`?**
Pure black alpha shadows look like you dropped the card on a fluorescent-lit table. Warm-tinted shadows (`rgba(95, 87, 80, 0.07)`) look like you placed it in afternoon light. The card appears to belong to the surface below it instead of floating above it. This is the entire Japandi aesthetic in one CSS rule.

### Anatomy of a Hub Tool Card

```
┌─────────────────────────────────────┐  ← #FFFFFC bg, 1px #E6E4E0 border
│                                     │     8px radius, warm 1pt shadow
│  [icon]                             │  ← Lucide icon, #606C5A color, 20px
│                                     │
│  Labour Code               →        │  ← DM Serif Display, 17px, #2C2A28
│  State vs. Central codes.           │  ← Inter, 13px, #8F837A
│                                     │
│  ─────────────────────────────────  │  ← 1px #E6E4E0 divider
│                                     │
│  "Show me the differences"          │  ← Ghost link style, #606C5A, 13px
└─────────────────────────────────────┘

Hover state: border → #C0B4A8. Nothing else changes.
```

### Card Variants by Compliance State

```
[Compliant card]
border-top: 3px solid #606C5A  (forest green)
badge: bg #ECF0E8 · text #3D4A38

[Warning card]
border-top: 3px solid #DCB482  (amber)
badge: bg #F8F0DE · text #7A5C2A

[Critical card]
border-top: 3px solid #8B4A42  (brick)
badge: bg #F5ECEA · text #6B3530

[Neutral / not yet run]
no colored border-top
badge: bg #EAE5E3 · text #8F837A
```

---

## 4. Typography

### The Typeface Pair: DM Serif Display + Inter

**Why a serif for compliance headings?**
Every institution that handles law, money, or authority uses serif type in their headings — The Economist, Harvard Law Review, LexisNexis, Supreme Court documents, the Reserve Bank of India publications. Serif type communicates that the subject matter is serious and has historical weight. It creates subconscious trust before a user reads a single word.

**Why Inter for body?**
Inter is engineered for screen legibility. Its letter spacing and x-height make dense compliance findings readable at 13–14px without fatigue.

**Why JetBrains Mono for data?**
Compliance scores, token counts, audit dates — these are data points that users will scan, compare, and remember. Monospace aligns columns naturally and gives numbers a "measured" feel that reinforces accuracy.

### Type Scale

```
Display — Score Number, Hero Headline
  Font:    DM Serif Display
  Size:    48–64px
  Weight:  400 (serif — never bold at display)
  Color:   --foreground #2C2A28
  Usage:   Compliance score "72", page hero H1

Heading 1 — Page Title
  Font:    DM Serif Display
  Size:    28–32px
  Weight:  400
  Color:   #2C2A28
  Usage:   "Labour Code Compliance Auditor"

Heading 2 — Section Header
  Font:    DM Serif Display
  Size:    20–22px
  Weight:  400
  Color:   #2C2A28
  Usage:   "Audit Results", "Detailed Findings"

Label / Category — Tool card category line
  Font:    Inter
  Size:    11px
  Weight:  600
  Color:   #606C5A (forest green) or #DCB482 (amber per category)
  Transform: uppercase
  Tracking: 0.08em
  Usage:   "LABOUR CODE", "TAX", "WAGES" — Basecamp-style above card title

Body — Primary copy
  Font:    Inter
  Size:    14px
  Weight:  400
  Line-height: 1.6
  Color:   #5E5E5E
  Usage:   Card descriptions, finding text, form labels

Small / Caption
  Font:    Inter
  Size:    12px
  Weight:  400
  Color:   #8F837A
  Usage:   Timestamps, file sizes, supporting info

Data / Mono
  Font:    JetBrains Mono (or IBM Plex Mono)
  Size:    13px
  Weight:  500
  Color:   #2C2A28
  Usage:   Compliance scores in tables, token counts, audit IDs, dates in logs
```

### Loading DM Serif Display + JetBrains Mono

Add to `index.html` `<head>`:
```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
```

Add to `index.css`:
```css
body {
  font-family: 'Inter', system-ui, sans-serif;
  background-color: #F3F3F2;
  color: #2C2A28;
}

.font-serif {
  font-family: 'DM Serif Display', Georgia, serif;
}

.font-mono {
  font-family: 'JetBrains Mono', 'Courier New', monospace;
}
```

---

## 5. Animation & Motion Doctrine

> **The rule in one sentence:** The app should feel instant. If an animation makes the user wait, it's wrong. If an animation exists only to look good, it's wrong.

Compliance users are not here to enjoy a product experience. They are here to get an answer and act on it. Every animation that delays, distracts, or adds weight to the page is working against the product's purpose.

### The Three Permitted Animations

Only three animation types are allowed in the entire app. Anything outside this list is cut.

**1. Opacity fade — page/section transitions only**
```css
/* CSS only — no library needed */
.fade-in {
  animation: fadeIn 150ms ease-out;
}
@keyframes fadeIn {
  from { opacity: 0; }
  to   { opacity: 1; }
}
```
Duration: 150ms maximum. Used when: a new view replaces the current view (upload → scanning → results). Not used on: card renders, tab switches, accordion opens.

**2. Progress bar fill — scan state only**
```css
/* Native CSS transition — no library needed */
.progress-bar-fill {
  transition: width 800ms ease-in-out;
}
```
The progress bar already exists. Keep it. Just driven by state, no extra animation libraries.

**3. Accordion open/close — shadcn built-in only**
```css
/* Already in tailwind.config — keep these two, nothing else */
'accordion-down': { from: { height: '0' }, to: { height: 'var(--radix-accordion-content-height)' } }
'accordion-up':   { from: { height: 'var(--radix-accordion-content-height)' }, to: { height: '0' } }
```
This is a native Radix/shadcn behaviour. Zero extra code needed.

---

### Everything Else: Cut

**Complete kill list — remove these from the codebase:**

```tsx
// ❌ Button bounce — remove from ALL buttons everywhere
hover:scale-[1.02]
active:scale-[0.98]
hover:scale-[1.05]
active:scale-[0.95]

// ❌ Scanner pulse ring — remove entirely
<div className="absolute inset-0 bg-zinc-900 rounded-full animate-ping opacity-20 duration-1000" />

// ❌ Framer Motion slide-in on tab/view switches
initial={{ opacity: 0, x: -20 }}   // ← remove x axis entirely
initial={{ opacity: 0, y: 20 }}    // ← remove y axis entirely
exit={{ opacity: 0, x: 20 }}       // ← remove x axis entirely

// ❌ Framer Motion scale pulse on card refresh
animate={{ scale: isRefreshing ? [1, 1.01, 1] : 1 }}

// ❌ Framer Motion staggered card entry
transition={{ delay: idx * 0.1 }}  // ← remove delay stagger

// ❌ Admin expand/collapse dark row animation
initial={{ opacity: 0, height: 0 }}
animate={{ opacity: 1, height: 'auto' }}
exit={{ opacity: 0, height: 0 }}
// Replace with: shadcn Accordion (already installed) or CSS height auto

// ❌ Shadow on button hover
hover:shadow-lg
hover:shadow-md
shadow-md
shadow-xl                          // ← remove from most elements
shadow-2xl                         // ← remove from all elements

// ❌ Backdrop blur on nav (performance cost, low visual benefit)
backdrop-blur-md                   // ← replace with bg-white/95 or solid bg-white

// ❌ Animate-pulse on scan messages
animate-pulse                      // ← remove, replace with static text that updates
```

---

### What Replaces Each Removed Animation

| Removed | Replacement |
|---|---|
| Button scale bounce | Background color change on hover (`#4F5A4A`). Instant, no delay. |
| `animate-ping` pulse | Remove entirely. The progress bar communicates scanning state. |
| Framer `x/y` slide-ins | Opacity fade only: `initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ duration:0.15 }}` |
| Card stagger delay | All cards render simultaneously. Stagger delay makes the UI feel slow. |
| Dark row expand animation | Use shadcn Accordion — it handles height transitions natively via CSS, no JS needed. |
| `backdrop-blur-md` on nav | `bg-white border-b border-[#E6E4E0]`. Solid. No blur. No GPU cost. |
| `animate-pulse` scan message | Static text, updated by state interval. No visual animation needed. |
| `shadow-xl / shadow-2xl` | Remove or replace with the warm 1pt card shadow spec from Section 3. |

---

### Framer Motion: Scope Reduction

Framer Motion is a 43KB gzipped library. Currently it's used for micro-interactions that CSS handles better. Reduce usage to the absolute minimum.

**Keep Framer Motion for:**
```tsx
// Tool/page level transitions ONLY — one location in App.tsx
<AnimatePresence mode="wait">
  <motion.div
    key={activeTool}
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    transition={{ duration: 0.15 }}
  >
    {/* page content */}
  </motion.div>
</AnimatePresence>
```

**Remove Framer Motion from:**
- Every `<motion.div>` wrapping a card
- Every `<motion.div>` wrapping an admin user row
- Every `<motion.div>` wrapping a stat card
- Button hover states (CSS handles this)
- Tab/pillar toggle transitions in Admin (CSS opacity handles this)

**Net result:** Framer Motion is imported once, used in one place (App.tsx transitions). Bundle size impact: saves ~15–20KB in active JS execution depending on how many motion components are removed.

---

### CSS-Only Alternatives (No Library Needed)

For the transitions that remain, use native CSS. These are faster, have no JS execution cost, and don't block rendering.

```css
/* Card hover — border darkens */
.card {
  transition: border-color 120ms ease;
}
.card:hover {
  border-color: #C0B4A8;
}

/* Button hover — bg darkens */
.btn-primary {
  transition: background-color 100ms ease;
}
.btn-primary:hover {
  background-color: #4F5A4A;
}

/* Nav item active indicator */
.nav-item {
  transition: color 100ms ease;
}

/* Input focus ring */
.input:focus {
  outline: 2px solid #606C5A;
  outline-offset: 2px;
  transition: outline-color 100ms ease;
}

/* Tab panel fade — no JS */
.tab-content {
  animation: fadeIn 150ms ease-out;
}
```

All of the above run on the GPU's compositor thread — they do not trigger layout recalculation and have zero JavaScript execution cost.

---

### Loading States: The Spinner Rule

One spinner, one location, one size. No skeleton screens, no shimmer effects, no placeholder cards.

```tsx
// The only loading state in the app:
<Loader2 className="animate-spin text-[#8F837A]" size={24} />

// Where it appears:
// 1. Initial data fetch (center of content area)
// 2. Button action in progress (replaces button icon)
// 3. Admin data refresh (inside the Refresh button only)

// NOT used:
// - Skeleton loading cards
// - Shimmer placeholders
// - Pulsing grey rectangles
// - Loading overlays on top of existing content
```

Skeleton screens are a UX pattern borrowed from social media feeds where content length is unpredictable. For a compliance tool with structured, predictable layouts, a centered spinner is faster to render and clearer in meaning.

---

### Performance Budget

The animation removal above directly improves performance. Here's the target:

```
Framer Motion instances:   1 (was: 15+)
CSS transitions in use:    4 (card hover, button hover, nav, input focus)
animate-* Tailwind classes: 2 (animate-spin on loaders, accordion built-in)
JS animation callbacks:    0 (no requestAnimationFrame, no setInterval for visual effects)
backdrop-filter usage:     0 (GPU layer creation removed from nav)
```

**Specific files to audit:**
```
App.tsx          — Remove motion.div from card wrappers, scanner section, result section
AdminDashboard   — Remove all motion.div wraps, keep 0 Framer Motion instances
Usage.tsx        — No animations needed, remove any that exist
Login.tsx        — No animations needed, static form render is correct
```

---

### The Test: Does it Feel Instant?

After implementing this doctrine, the subjective test is simple. Open the app on a mid-range Android device (Redmi Note 10 or equivalent — your likely user demographic's device) on a 4G connection.

- Tab switching should feel instantaneous
- Card renders should appear with no perceived delay
- The audit scan should feel like work is happening (progress bar) not like the app is performing (pulse animations)
- Scrolling should have no jank

If any of these feel slow, look for: active Framer Motion instances, `backdrop-filter` usage, and elements with both `transition` and `transform` active simultaneously.

---

## 6. Button System

```
Primary — "Scan my policy", "Calculate my liability"
  bg: #606C5A
  text: #FFFFFC
  hover: #4F5A4A
  border: none
  radius: 6px (slightly less than card — visual hierarchy)

Secondary / Outline — "Scan a different policy", "Download Report"
  bg: transparent
  border: 1px solid #E6E4E0
  text: #2C2A28
  hover: bg #FBFAF5, border #C0B4A8

Ghost — "Show me the differences" (card CTA link)
  bg: transparent
  text: #606C5A
  hover: text #4F5A4A, underline
  border: none

Destructive — "Remove access", "Archive"
  bg: #8B4A42
  text: #FFFFFC
  hover: #733C35
```

---

## 7. Badge / Status Pill System

```
Compliant        bg: #ECF0E8   text: #3D4A38   border: #B9B99D
Moderate Risk    bg: #F8F0DE   text: #7A5C2A   border: #DCBA7A
Non-Compliant    bg: #F5ECEA   text: #6B3530   border: #D4908A
Free Plan        bg: #EAE5E3   text: #5E5E5E   border: #D5CABA
Paid             bg: #ECF0E8   text: #3D4A38   border: #B9B99D
Admin            bg: #F3F0E8   text: #8F837A   border: #D5CABA
Pending          bg: #F8F0DE   text: #7A5C2A   border: #DCBA7A
```

All badges: `border-radius: 4px` (even more subtle rounding than cards — pills are too casual for compliance).

---

## 8. Compliance Score Color Logic

Replace the current emerald / yellow / red system with Japandi equivalents:

```tsx
// CURRENT (remove these)
text-emerald-600 / text-yellow-600 / text-red-600
border-t-emerald-500 / border-t-yellow-500 / border-t-red-500
bg-emerald-50 / bg-yellow-50 / bg-red-50

// REPLACE WITH
score >= 80:  text: #3D4A38   border-top: #606C5A   bg: #ECF0E8
score >= 50:  text: #7A5C2A   border-top: #DCB482   bg: #F8F0DE
score < 50:   text: #6B3530   border-top: #8B4A42   bg: #F5ECEA
```

The visual difference: current emerald-600 is "startup green" — bright, tech-forward. `#3D4A38` (deep forest on #ECF0E8 sage) reads as "institutional green" — the color of a stamp of approval on a legal document.

---

## 9. Iconography

Keep Lucide React icons — they're correct. Change their sizes and colors:

```
Hub card icon:      20px, #606C5A (forest green)
Nav icons:          16px, #8F837A (muted)
Active nav icon:    16px, #606C5A (forest green)
Alert icons:        16px, matches semantic color above
Score badge icons:  14px, matches score color
Action icons:       14px, #5E5E5E (charcoal)
```

No icon backgrounds (no `bg-zinc-100 rounded-full` wrapping icons). Icons stand alone. This removes visual noise.

---

## 10. Spacing & Layout Rules

```
Page max-width:      1200px (hub grid)
Paper View max:       800px (tool view)
Page padding:         24px sides on desktop, 16px on mobile
Card padding:         20px (not 24px — tighter, more document-like)
Card gap in grid:     16px (tighter than current 24px — feels like a suite, not scattered cards)
Section spacing:      32px between sections
```

---

## 11. The Compliance Color Palette — Quick Reference

| Token | Hex | Source | Usage |
|---|---|---|---|
| Page bg | `#F3F3F2` | Shironeri/Silk White | Body background |
| Card bg | `#FFFFFC` | Gofuniro/Chalk White | All cards |
| Card hover | `#FBFAF5` | Kinariro/Dough | Card hover bg |
| Muted section | `#EAE5E3` | Soshoku/Base Color | Code blocks, table headers |
| Card border | `#E6E4E0` | Japandi light gray | All borders |
| Border hover | `#C0B4A8` | Japandi mid gray | Hover border |
| Primary | `#606C5A` | Japandi forest green | CTAs, links, active states |
| Primary hover | `#4F5A4A` | Darker forest green | Button hover |
| Primary subtle | `#ECF0E8` | Light sage tint | Badge bg, chip bg |
| Warning | `#DCB482` | Japandi amber | Moderate risk |
| Warning bg | `#F8F0DE` | Light amber tint | Alert bg |
| Destructive | `#8B4A42` | Desaturated brick | Critical / danger |
| Destructive bg | `#F5ECEA` | Light brick tint | Alert bg |
| Primary text | `#2C2A28` | Warm near-black | Body text |
| Secondary text | `#5E5E5E` | Charcoal | Descriptions |
| Muted text | `#8F837A` | Warm gray-brown | Labels, captions |
| Placeholder | `#B0B9A8` | Sage gray | Input placeholders |
| Card shadow | `rgba(95,87,80,0.07)` | Warm tint | 1pt drop shadow |

---

## 12. What to Change in the Current Codebase

### `index.css` — CSS Variables (Single Change, Entire App Updates)

Replace the current `:root` block with the HSL values from Section 2. This alone shifts the entire shadcn component palette from cold zinc to warm Japandi. Every `bg-background`, `bg-card`, `text-muted-foreground`, `border-border` throughout the app updates automatically.

### `index.html` — Add Google Fonts

Add the DM Serif Display + JetBrains Mono import (see Section 4).

### Targeted class replacements across components

```tsx
// Page background
"bg-zinc-50"  →  "bg-background"

// Heavy shadows
"shadow-xl / shadow-2xl"  →  remove or "shadow-sm"

// Cold green status colors
"text-emerald-600"  →  "text-[#3D4A38]"
"bg-emerald-50"     →  "bg-[#ECF0E8]"
"border-emerald-200"  →  "border-[#B9B99D]"

// Button scale animations
"hover:scale-[1.02] active:scale-[0.98]"  →  remove entirely

// Scanner pulse
"animate-ping"  →  remove entirely

// Admin dark backgrounds
"bg-zinc-950/40"  →  "bg-white" or "bg-[#FBFAF5]"
```

### Heading font application

```tsx
// Page titles and score numbers
<h1 className="font-serif text-4xl">Labour Code Compliance Auditor</h1>
<span className="font-serif text-6xl">{result.compliance_score}</span>

// Card titles stay Inter (14px bold) — only page-level H1/H2 use serif
// This hierarchy signals: "you are in a document environment"
```

---

## 13. Things NOT to Change

- shadcn component structure — CSS variables handle the visual shift
- Lucide icons — correct library, just recolor
- `framer-motion` for page-level fades — keep, remove from micro-interactions
- `recharts` in Usage dashboard — fine as-is, recolor with chart tokens
- Component APIs — no structural changes needed

---

*Last updated: February 2026 · Design System v1.0*
*Companion document to STRATEGY.md and ADMIN_STRATEGY.md*
