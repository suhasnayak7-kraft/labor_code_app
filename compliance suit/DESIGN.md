# DESIGN.md — Design System
### Compliance Suite · Japandi × Japanese UI

> Compliance work creates anxiety. The UI's job is to absorb it — warm surfaces, authoritative type, measured color. The product should feel like a well-organized law firm reading room, not a SaaS dashboard.

*Product strategy → BUILD.md · Admin UX → ADMIN.md*

---

## 1. Why These Palettes Work for Compliance

The current app uses Tailwind's cold `zinc` scale — correct for generic SaaS, wrong for compliance. It reads as "government portal" — the exact anxiety you're trying to dissolve.

**What the Japandi + Japanese UI palettes do:**
- Warm backgrounds reduce the clinical feel without losing professionalism
- Forest green (`#606C5A`) signals authority + nature + calm — not "startup green" (#10B981) and not "government navy"
- Amber (`#DCB482`) for warnings reads as cautionary, not alarming — a yellow light, not a siren
- Desaturated brick (`#8B4A42`) for critical states is serious without triggering panic

The Japanese UI palette (Nuevo.Tokyo) is built specifically for UI surfaces — names like "Silk White Kneading" and "Base Color" signal texture. For users uploading HR policies, surfaces that feel substantial build subconscious trust.

---

## 2. Color System

### Surface Hierarchy (page → card → hover — each layer slightly lighter)

```
Page bg:       #F3F3F2   Shironeri / Silk White
Card bg:       #FFFFFC   Gofuniro / Chalk White
Card hover bg: #FBFAF5   Kinariro / Dough
Muted section: #EAE5E3   Soshoku / Base Color  (table headers, code blocks)
```

### Full Token Map

```
SURFACES
--background:          #F3F3F2   page bg
--card:                #FFFFFC   card bg
--card-hover:          #FBFAF5   card hover bg
--muted:               #EAE5E3   muted sections

TEXT
--foreground:          #2C2A28   primary text (warm near-black)
--secondary-text:      #5E5E5E   descriptions
--muted-foreground:    #8F837A   labels, captions
--placeholder:         #B0B9A8   input placeholders

BORDERS
--border:              #E6E4E0   default border
--border-hover:        #C0B4A8   hover border
--input:               #E6E4E0

BRAND / PRIMARY
--primary:             #606C5A   forest green — CTAs, links, active
--primary-hover:       #4F5A4A   darker forest green
--primary-fg:          #FFFFFC   text on primary bg
--primary-subtle:      #ECF0E8   badge bg, chip bg

SEMANTIC — COMPLIANT
--success:             #606C5A
--success-bg:          #ECF0E8
--success-border:      #B9B99D
--success-text:        #3D4A38

SEMANTIC — WARNING
--warning:             #DCB482   Japandi amber
--warning-bg:          #F8F0DE
--warning-border:      #DCBA7A
--warning-text:        #7A5C2A

SEMANTIC — CRITICAL
--destructive:         #8B4A42   desaturated brick
--destructive-bg:      #F5ECEA
--destructive-border:  #D4908A
--destructive-text:    #6B3530

FOCUS
--ring:                #606C5A   forest green focus ring
```

### HSL Values for `index.css`

Replace the entire `:root` block with this. Every shadcn component updates automatically.

```css
:root {
  --background:         43 5% 95%;      /* #F3F3F2 */
  --foreground:         30 8% 17%;      /* #2C2A28 */
  --card:               50 33% 100%;    /* #FFFFFC */
  --card-foreground:    30 8% 17%;
  --popover:            50 33% 100%;
  --popover-foreground: 30 8% 17%;
  --primary:            95 8% 39%;      /* #606C5A */
  --primary-foreground: 50 33% 100%;
  --secondary:          35 10% 92%;     /* #EAE5E3 */
  --secondary-foreground: 30 8% 17%;
  --muted:              35 10% 92%;
  --muted-foreground:   25 6% 52%;      /* #8F837A */
  --accent:             42 25% 97%;     /* #FBFAF5 */
  --accent-foreground:  30 8% 17%;
  --destructive:        4 36% 40%;      /* #8B4A42 */
  --destructive-foreground: 50 33% 100%;
  --border:             35 8% 89%;      /* #E6E4E0 */
  --input:              35 8% 89%;
  --ring:               95 8% 39%;
  --radius:             0.5rem;         /* 8px — keep as-is */

  --chart-1:            95 8% 39%;      /* forest green */
  --chart-2:            37 52% 68%;     /* amber #DCB482 */
  --chart-3:            22 30% 64%;     /* copper #C09E85 */
  --chart-4:            0 0% 55%;       /* charcoal */
  --chart-5:            90 13% 51%;     /* sage */
}
```

### Quick Reference Table

| Token | Hex | Source | Used for |
|---|---|---|---|
| Page bg | `#F3F3F2` | Shironeri | Body background |
| Card bg | `#FFFFFC` | Gofuniro | All cards |
| Card hover | `#FBFAF5` | Kinariro | Hover bg |
| Muted | `#EAE5E3` | Soshoku | Table heads, code |
| Border | `#E6E4E0` | Japandi | All borders |
| Border hover | `#C0B4A8` | Japandi | Hover border |
| Primary | `#606C5A` | Japandi forest green | CTAs, links, active |
| Primary hover | `#4F5A4A` | — | Button hover |
| Warning | `#DCB482` | Japandi amber | Moderate risk |
| Critical | `#8B4A42` | Desaturated brick | Danger / non-compliant |
| Primary text | `#2C2A28` | Warm near-black | Body text |
| Secondary text | `#5E5E5E` | Charcoal | Descriptions |
| Muted text | `#8F837A` | Warm gray-brown | Labels |
| Card shadow | `rgba(95,87,80,0.07)` | Warm tint | 1pt drop shadow |

---

## 3. Card Specification

The most important single component in the suite.

### The Spec

```css
.card {
  background:    #FFFFFC;
  border:        1px solid #E6E4E0;
  border-radius: 8px;
  box-shadow:    0 1px 3px rgba(95, 87, 80, 0.07),
                 0 1px 2px rgba(95, 87, 80, 0.04);
  transition:    border-color 120ms ease;
}
.card:hover {
  border-color:  #C0B4A8;
  /* NO lift. NO shadow change. NO scale. Border only. */
}
```

**Why warm-tinted shadow (`rgba(95,87,80,x)`) not `rgba(0,0,0,x)`?**
Pure black alpha shadows look like a card under fluorescent lights. Warm-tinted shadows look like afternoon light. The card belongs to the surface below it instead of floating above it. This is the entire Japandi aesthetic in one CSS rule.

### Hub Tool Card Anatomy

```
┌─────────────────────────────────────┐
│                                     │
│  [icon 20px #606C5A]                │
│                                     │
│  LABOUR CODE          (label, caps) │
│  Labour Comparison    (title, serif)│
│  State vs. Central codes.           │
│                                     │
│  ───────────────────────────────    │
│  Show me the differences  →         │
└─────────────────────────────────────┘
```

- Label: Inter 11px, 600 weight, uppercase, `#606C5A`
- Title: DM Serif Display 17px, `#2C2A28`
- Sub: Inter 13px, `#8F837A`
- CTA: Ghost link, `#606C5A`, 13px

### Compliance State Variants (border-top strip)

```
Compliant     border-top: 3px solid #606C5A   badge bg: #ECF0E8   text: #3D4A38
Warning       border-top: 3px solid #DCB482   badge bg: #F8F0DE   text: #7A5C2A
Critical      border-top: 3px solid #8B4A42   badge bg: #F5ECEA   text: #6B3530
Neutral       no border-top                   badge bg: #EAE5E3   text: #8F837A
```

---

## 4. Typography

### The Pair: DM Serif Display + Inter

**Why serif headings for compliance?**
Every institution users trust for legal and financial matters uses serif headings — The Economist, LexisNexis, RBI publications, CA firm letterheads. Serif type signals authority and weight before a word is read. `DM Serif Display` is elegant without being stuffy — the right register for a modern compliance tool.

**Why Inter for body?**
Engineered for screen legibility. Makes dense compliance findings readable at 13–14px without fatigue.

**Why JetBrains Mono for data?**
Compliance scores, dates, token counts — monospace aligns columns and gives numbers a "measured" authority. Use for any data the user will scan and compare.

### Load (add to `index.html` `<head>`)

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
```

### Add to `index.css`

```css
body {
  font-family: 'Inter', system-ui, sans-serif;
  background-color: #F3F3F2;
  color: #2C2A28;
}
.font-serif { font-family: 'DM Serif Display', Georgia, serif; }
.font-mono  { font-family: 'JetBrains Mono', 'Courier New', monospace; }
```

### Type Scale

```
Display — compliance score, hero H1
  DM Serif Display · 48–64px · weight 400 · #2C2A28
  (serif: never bold at display sizes)

H1 — page title
  DM Serif Display · 28–32px · weight 400 · #2C2A28

H2 — section header
  DM Serif Display · 20–22px · weight 400 · #2C2A28

Label — card category (Basecamp-style above title)
  Inter · 11px · weight 600 · uppercase · tracking 0.08em · #606C5A

Body
  Inter · 14px · weight 400 · line-height 1.6 · #5E5E5E

Caption / Small
  Inter · 12px · weight 400 · #8F837A

Data / Mono
  JetBrains Mono · 13px · weight 500 · #2C2A28
```

**Rule:** Only page-level H1/H2 and score numbers use DM Serif. Card titles stay Inter bold. This maintains hierarchy — serif = you're in a document, sans = you're reading UI.

---

## 5. Animation & Motion Doctrine

> The app should feel instant. If an animation makes the user wait, it's wrong. If it exists only to look good, it's wrong.

Compliance users want an answer and an action. Every animation that delays, distracts, or adds JS weight is working against the product.

### The Three Permitted Animations

**1. Opacity fade — page/section transitions only**
```css
.fade-in {
  animation: fadeIn 150ms ease-out;
}
@keyframes fadeIn {
  from { opacity: 0; }
  to   { opacity: 1; }
}
```
150ms max. Used only when a full view replaces another (upload → scanning → results). Not on: card renders, tab switches, accordion opens.

**2. Progress bar fill — scan state only**
```css
.progress-bar-fill {
  transition: width 800ms ease-in-out;
}
```
Already exists. Keep it — it communicates real work happening. No other scan animation needed.

**3. Accordion — shadcn built-in only**
```css
/* Already in tailwind.config. Keep, add nothing. */
accordion-down / accordion-up
```

---

### Kill List — Remove These From the Codebase

```tsx
// ❌ Button bounce — remove from every button
hover:scale-[1.02]  active:scale-[0.98]
hover:scale-[1.05]  active:scale-[0.95]

// ❌ Scanner pulse ring
<div className="absolute inset-0 bg-zinc-900 rounded-full animate-ping opacity-20 duration-1000" />

// ❌ Framer Motion axis movement on tab/view switches
initial={{ opacity: 0, x: -20 }}    // remove x
initial={{ opacity: 0, y: 20 }}     // remove y
exit={{ opacity: 0, x: 20 }}        // remove x

// ❌ Framer Motion scale pulse on card refresh
animate={{ scale: isRefreshing ? [1, 1.01, 1] : 1 }}

// ❌ Staggered card entry delay
transition={{ delay: idx * 0.1 }}

// ❌ Admin dark expand/collapse
initial={{ opacity: 0, height: 0 }}
animate={{ opacity: 1, height: 'auto' }}
exit={{ opacity: 0, height: 0 }}
// → Replace with shadcn Accordion (already installed)

// ❌ Heavy shadows
shadow-md  shadow-xl  shadow-2xl

// ❌ Nav backdrop blur (GPU cost, low benefit)
backdrop-blur-md
// → Replace with: bg-white border-b border-[#E6E4E0]

// ❌ Animate-pulse on scan messages
animate-pulse
// → Static text updated by state. No animation needed.
```

### What Replaces Each

| Removed | Replacement |
|---|---|
| Button scale | bg darkens on hover (`#4F5A4A`). CSS only. |
| `animate-ping` | Remove entirely. Progress bar covers scanning state. |
| Framer x/y slide | Opacity fade: `initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ duration:0.15 }}` |
| Stagger delay | All cards render simultaneously. Stagger = perceived lag. |
| Dark row expand | shadcn Accordion — CSS height transition, zero JS. |
| `backdrop-blur-md` | `bg-white border-b border-[#E6E4E0]`. Solid. No GPU layer. |
| `animate-pulse` on text | State-driven text update. Static. |
| `shadow-xl/2xl` | Warm 1pt shadow from card spec, or removed entirely. |

---

### Framer Motion: One Place Only

Framer Motion is 43KB gzipped. Currently used in 15+ locations for things CSS does better.

**Keep Framer Motion for — App.tsx only:**
```tsx
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

**Remove from:**
- Every `<motion.div>` wrapping a card
- Every `<motion.div>` wrapping an admin row or stat card
- All button hover states
- All tab/pillar toggle transitions in Admin

Net result: ~15–20KB less active JS execution.

---

### CSS-Only Replacements (No Library)

```css
/* Card hover */
.card { transition: border-color 120ms ease; }
.card:hover { border-color: #C0B4A8; }

/* Button hover */
.btn-primary { transition: background-color 100ms ease; }
.btn-primary:hover { background-color: #4F5A4A; }

/* Nav active */
.nav-item { transition: color 100ms ease; }

/* Input focus */
.input:focus {
  outline: 2px solid #606C5A;
  outline-offset: 2px;
}

/* Tab panel */
.tab-content { animation: fadeIn 150ms ease-out; }
```

All run on the GPU compositor thread. Zero JS execution cost. Zero layout recalculation.

---

### Loading States: One Spinner

```tsx
// The only loading indicator in the app
<Loader2 className="animate-spin text-[#8F837A]" size={24} />

// Used in:
// 1. Initial page data fetch (center of content area)
// 2. Button action in progress (replaces button icon)
// 3. Admin refresh (inside Refresh button only)

// Never use:
// Skeleton screens, shimmer placeholders, pulsing grey rectangles
```

Skeleton screens are for social feeds with unpredictable layouts. Compliance tools have structured, predictable layouts — a centered spinner is faster to render and clearer in meaning.

---

### Performance Budget

```
Framer Motion instances:    1  (was 15+)
CSS transitions in use:     4  (card, button, nav, input)
Tailwind animate-* classes: 2  (animate-spin, accordion built-in)
JS animation callbacks:     0
backdrop-filter usage:      0
```

**Files to audit:**
```
App.tsx         — remove motion.div from card, scanner, result wrappers
AdminDashboard  — remove all motion.div, 0 Framer instances
Usage.tsx       — no animations needed
Login.tsx       — static form, no animations needed
```

**The test:** Open on a Redmi Note 10 (mid-range Android, 4G). Your users are Indian HR managers and CAs — this is their device class. Tab switches should feel instant. No jank on scroll. If slow: look for active Framer instances, backdrop-filter, and simultaneous transition + transform on the same element.

---

## 6. Button System

```
Primary
  bg: #606C5A   text: #FFFFFC   hover: #4F5A4A
  radius: 6px   no border   transition: background 100ms

Secondary / Outline
  bg: transparent   border: 1px solid #E6E4E0   text: #2C2A28
  hover: bg #FBFAF5, border #C0B4A8

Ghost (card CTA link)
  bg: transparent   text: #606C5A
  hover: text #4F5A4A, underline   no border

Destructive
  bg: #8B4A42   text: #FFFFFC   hover: #733C35
```

No scale animations on any button. Background darkens. That is the full interaction.

---

## 7. Badge / Status Pill

```
Compliant       bg: #ECF0E8   text: #3D4A38   border: #B9B99D
Moderate Risk   bg: #F8F0DE   text: #7A5C2A   border: #DCBA7A
Non-Compliant   bg: #F5ECEA   text: #6B3530   border: #D4908A
Free            bg: #EAE5E3   text: #5E5E5E   border: #D5CABA
Paid            bg: #ECF0E8   text: #3D4A38   border: #B9B99D
Admin           bg: #F3F0E8   text: #8F837A   border: #D5CABA
Pending         bg: #F8F0DE   text: #7A5C2A   border: #DCBA7A
```

`border-radius: 4px` — more subtle than cards. Rounded pills are too casual for compliance.

---

## 8. Compliance Score Colors

Replace the current emerald / yellow / red system:

```tsx
// Remove
text-emerald-600 / bg-emerald-50 / border-emerald-200
text-yellow-600  / bg-yellow-50  / border-yellow-200
text-red-600     / bg-red-50     / border-red-200

// Replace
score >= 80:  text: #3D4A38   bg: #ECF0E8   border-top: #606C5A
score >= 50:  text: #7A5C2A   bg: #F8F0DE   border-top: #DCB482
score < 50:   text: #6B3530   bg: #F5ECEA   border-top: #8B4A42
```

Current emerald-600 reads as "startup green." `#3D4A38` on `#ECF0E8` reads as "institutional stamp of approval." The difference is the entire product positioning.

---

## 9. Iconography

Keep Lucide React. Recolor:

```
Hub card icon:    20px  #606C5A
Nav icons:        16px  #8F837A
Active nav icon:  16px  #606C5A
Alert icons:      16px  match semantic color
Score icons:      14px  match score color
Action icons:     14px  #5E5E5E
```

Remove all icon background wrappers (`bg-zinc-100 rounded-full`). Icons stand alone. Wrappers add visual noise.

---

## 10. Spacing & Layout

```
Page max-width:    1200px  (hub grid)
Paper View max:     800px  (tool view — document feel)
Page padding:       24px   desktop   16px mobile
Card padding:       20px   (tighter than 24px — more document-like)
Card grid gap:      16px   (tighter than current 24px — feels like a suite)
Section spacing:    32px
```

---

## 11. Implementation Checklist

Three changes, in order of impact:

**Step 1 — `index.css` CSS variables** (one edit, entire app shifts)
Replace the `:root` block with the HSL values in Section 2. Every `bg-background`, `bg-card`, `text-muted-foreground`, `border-border` in the app updates automatically.

**Step 2 — `index.html` fonts**
Add DM Serif Display + JetBrains Mono from Section 4.

**Step 3 — Targeted class replacements**
```tsx
"bg-zinc-50"            →  "bg-background"
"shadow-xl / shadow-2xl" →  remove
"text-emerald-600"       →  "text-[#3D4A38]"
"bg-emerald-50"          →  "bg-[#ECF0E8]"
"border-emerald-200"     →  "border-[#B9B99D]"
"hover:scale-[1.02]"     →  remove
"active:scale-[0.98]"    →  remove
"animate-ping"           →  remove
"backdrop-blur-md"       →  remove (nav: use bg-white + border-b)
"bg-zinc-950/40"         →  "bg-[#FBFAF5]"  (admin expansion rows)
```

**Heading font — apply to page titles and score numbers only:**
```tsx
<h1 className="font-serif text-4xl">Labour Code Compliance Auditor</h1>
<span className="font-serif text-6xl">{result.compliance_score}</span>
// Card titles remain Inter bold — only page H1/H2 and display numbers use serif
```

---

## 12. What NOT to Change

- shadcn component structure — CSS variables handle everything
- Lucide icons — correct library, just recolor
- Framer Motion import — keep, scope to App.tsx page transitions only
- Recharts in Usage dashboard — fine as-is, recolor using chart tokens
- Component APIs — no structural changes needed

---

*v1.1 · Feb 2026*
*Product strategy → BUILD.md · Admin UX → ADMIN.md*
