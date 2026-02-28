# 3. Design System: Visual Consistency Across Tools

Complete design system for multi-tool SaaS platform. Inspired by Japandi minimalism with Apple's subtle motion and interaction patterns.

**Core Principle:** All tools share the same visual language. Only content changes, not the design system itself.

---

## Color System (Japandi Palette)

### **Primary Colors**

```
Primary: #606C5A (Forest Green)
  - Used for: CTAs, buttons, focus states, primary actions
  - Variants:
    Light: #7A8473
    Dark: #4A5047
    Hover: #505A50 (slightly darker)

Secondary: #F3F3F2 (Warm Cream/Off-white)
  - Used for: Backgrounds, cards, surfaces
  - Warmth: Slightly yellowish (not pure white)

Text: #2C2A28 (Deep Charcoal)
  - Body text, headings, primary foreground
  - Slightly warm (not pure black)
```

### **Status Colors**

```
Success: #4A7C59 (Muted Green)
  Light: #6A9C79
  Dark: #2A5C39

Warning: #DCB482 (Warm Amber)
  Light: #F5D9B5
  Dark: #B88D52

Error: #8B4A42 (Brick Red)
  Light: #A86660
  Dark: #6B2A22

Info: #5B8FA3 (Muted Blue-gray)
  Light: #7BA5C3
  Dark: #3B6F83
```

### **Neutral Scale**

```
White: #FFFFFC (Pure white with micro warmth)
Black: #1A1918 (Pure black with micro warmth)

Grays:
  50:   #F8F8F7
  100:  #E8E8E5
  200:  #D8D8D3
  300:  #C0C0BB
  400:  #A0A095
  500:  #808077
  600:  #606055
  700:  #404037
  800:  #262421
  900:  #1A1918
```

---

## Typography

### **Font Stack**

```css
/* Body & UI */
font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', sans-serif;
/* Fallback: Inter, Open Sans */

/* Code/Monospace */
font-family: 'Monaco', 'Courier New', monospace;
```

### **Scale**

```
Display:     32px / 1.2 / 600 weight  (headings)
Title:       24px / 1.3 / 600 weight  (page title)
Headline:    20px / 1.4 / 600 weight  (section titles)
Body Large:  16px / 1.5 / 400 weight  (main content)
Body:        14px / 1.5 / 400 weight  (default)
Body Small:  12px / 1.5 / 400 weight  (secondary text)
Label:       12px / 1.4 / 500 weight  (form labels, badges)
Code:        13px / 1.6 / 400 weight  (code blocks)
```

### **Weight**

```
400 (Regular):  Main body text
500 (Medium):   Labels, buttons, emphasis
600 (Semibold): Headings, section titles
700 (Bold):     Never used (maintain minimalism)
```

### **Line Height**

```
1.2  - Headings (tight, confident)
1.3  - Subheadings (balance)
1.4  - Small labels (compact)
1.5  - Body text (readable, comfortable)
1.6  - Code blocks (scannable)
```

---

## Spacing System

**Base unit: 8px grid**

```
xs:    4px   (micro-interactions, icon spacing)
sm:    8px   (compact spacing)
md:   16px   (default spacing)
lg:   24px   (generous spacing)
xl:   32px   (section spacing)
2xl:  48px   (major spacing, page sections)
3xl:  64px   (hero, large sections)
```

### **Application**

```
Padding:
  Button:       12px 16px (vertical × horizontal)
  Card:         16px
  Form input:   12px 16px
  Modal:        24px
  Page:         16px on mobile, 32px on desktop

Margin:
  Sections:     24px-32px apart
  Form fields:  16px apart
  List items:   8px apart
```

---

## Border Radius

**Principle: Flat with minimal rounding (Japandi minimalism)**

```
None:      0px      (rare, for very minimal designs)
Minimal:   2px      (cards, inputs, buttons - primary)
Small:     4px      (chip badges, small buttons)
Medium:    8px      (modals, larger containers)
Large:    12px      (not used - maintain minimalism)
Full:     999px     (only for circular avatars, icons)
```

### **What Gets 2px Radius**

```
✓ Cards
✓ Input fields
✓ Buttons
✓ Modals/dialogs
✓ Dropdowns
✓ Tab bars
✗ Never: Icons, small badges, avatars (use full radius)
```

---

## Shadow System

**Principle: Subtle, functional shadows (Apple style)**

### **Elevation Levels**

```
Shadow Lv1 (Cards at rest):
  box-shadow: 0 1px 2px rgba(0,0,0,0.04)
  Used for: Cards, panels (subtle presence)

Shadow Lv2 (Cards on hover):
  box-shadow: 0 2px 4px rgba(0,0,0,0.06)
  Used for: Cards on hover, floating elements

Shadow Lv3 (Modals, dropdowns):
  box-shadow: 0 4px 12px rgba(0,0,0,0.08)
  Used for: Modals, dropdowns, popovers

Shadow Lv4 (Prominent elements):
  box-shadow: 0 8px 24px rgba(0,0,0,0.10)
  Used for: Large modals, hero sections (rare)

No Shadow (Default):
  Flat design. Shadow on hover only.
```

### **Hover & Focus States**

```
Hover: Subtle shadow increase (Lv1 → Lv2)
  Transition: 150ms ease-in-out
  Border: Darken border color slightly (no border color change for most)

Focus: Border + subtle shadow
  Border: 1px #606C5A (primary color)
  Shadow: Lv1 or Lv2 depending on element
  Outline: None (custom border instead)

Active: Shadow Lv1, slight scale 0.98
  Gives tactile feedback without drama
```

---

## Component Styles

### **Buttons**

```
Primary Button:
  Background: #606C5A
  Text: #FFFFFC
  Padding: 12px 16px
  Border: None
  Radius: 2px
  Font: 14px / 500
  Hover: Background #505A50, Shadow Lv2
  Focus: Border 1px #404037, Shadow Lv1
  Disabled: Opacity 0.5, cursor not-allowed

Secondary Button:
  Background: #F3F3F2
  Text: #2C2A28
  Border: 1px #C0C0BB
  Padding: 12px 16px
  Radius: 2px
  Font: 14px / 500
  Hover: Background #E8E8E5
  Focus: Border 1px #606C5A, Shadow Lv1

Tertiary Button (Text-only):
  Background: Transparent
  Text: #606C5A
  Border: None
  Font: 14px / 500
  Hover: Text #505A50
  Focus: Underline or subtle background

Danger Button:
  Background: #8B4A42
  Text: #FFFFFC
  Padding: 12px 16px
  Radius: 2px
  Hover: Background #6B2A22, Shadow Lv2
  Focus: Border 1px #2C2A28
```

### **Input Fields**

```
Text Input:
  Background: #FFFFFC
  Border: 1px #C0C0BB
  Padding: 12px 16px
  Radius: 2px
  Font: 14px / 400
  Focus: Border 1px #606C5A, Shadow Lv1
  Error: Border 1px #8B4A42
  Placeholder: #808077, font-weight 400
  Label: 12px / 500 #2C2A28, above input, 8px gap

Select/Dropdown:
  Same as text input, with dropdown arrow icon on right
  Option hover: Background #F3F3F2

Checkbox/Radio:
  Size: 16px × 16px
  Border: 1px #C0C0BB
  Radius: 2px (checkbox), full (radio)
  Checked: Background #606C5A, icon/dot #FFFFFC
  Focus: Border 1px #606C5A

Textarea:
  Same as text input, but multi-line
  Min height: 120px
  Resize: vertical only
```

### **Cards**

```
Standard Card:
  Background: #FFFFFC
  Border: 1px #E8E8E5
  Padding: 16px
  Radius: 2px
  Shadow: Lv1 (at rest), Lv2 (on hover)
  Transition: 150ms ease-in-out

Hover Card:
  Cursor: pointer
  Shadow: Increase to Lv2
  Border: Slight color change (optional)
  Scale: None (maintain flat design)

Disabled Card:
  Opacity: 0.5
  Cursor: not-allowed
```

### **Modals/Dialogs**

```
Background overlay:
  Color: rgba(0,0,0,0.4)
  Blur: None (let background show through)

Modal container:
  Background: #FFFFFC
  Border: 1px #C0C0BB
  Padding: 24px
  Radius: 2px
  Shadow: Lv3
  Max-width: 600px
  Animation: Fade in 150ms

Close button:
  Icon: X or close symbol
  Size: 24px × 24px
  Position: Top-right corner
  Padding: 8px
  Opacity: 60% (hover 100%)
```

### **Tabs**

```
Tab bar:
  Background: #F3F3F2
  Border-bottom: 1px #C0C0BB
  Padding: 0

Tab item:
  Padding: 12px 16px
  Color: #808077 (inactive), #2C2A28 (active)
  Font: 14px / 500
  Border-bottom: 2px solid transparent (inactive), 2px #606C5A (active)
  Hover: Color #2C2A28
  Cursor: pointer
  Transition: 150ms ease-in-out
```

### **Forms**

```
Form group:
  Margin-bottom: 16px

Form label:
  Font: 12px / 500
  Color: #2C2A28
  Margin-bottom: 8px
  Display: block

Form error:
  Color: #8B4A42
  Font: 12px / 400
  Margin-top: 4px
  Icon: ⚠️ (optional)

Form success:
  Color: #4A7C59
  Font: 12px / 400
  Icon: ✓ (optional)

Field group (multiple inputs):
  Gap: 16px
  Flex direction: row or column (responsive)
```

### **Tables**

```
Table header:
  Background: #F3F3F2
  Border-bottom: 1px #C0C0BB
  Padding: 12px 16px
  Font: 12px / 600
  Color: #2C2A28
  Text-align: left

Table row:
  Border-bottom: 1px #E8E8E5
  Padding: 12px 16px
  Font: 14px / 400
  Color: #2C2A28
  Hover: Background #F8F8F7 (subtle)

Table data:
  Padding: 12px 16px
  Vertical-align: middle
  Text-align: left

Striped rows (optional):
  Even rows: Background #FAFAF9 (barely noticeable)
```

### **Badges**

```
Badge:
  Padding: 4px 8px
  Radius: full (rounded)
  Font: 12px / 500
  Display: inline-flex
  Gap: 4px (if icon present)

Variants:
  Default: Background #F3F3F2, Text #2C2A28
  Primary: Background #606C5A, Text #FFFFFC
  Success: Background #4A7C59, Text #FFFFFC
  Warning: Background #DCB482, Text #2C2A28
  Error: Background #8B4A42, Text #FFFFFC
```

### **Alerts/Toasts**

```
Alert container:
  Padding: 12px 16px
  Radius: 2px
  Border-left: 3px (colored by type)
  Shadow: Lv1
  Font: 14px / 400

Types:
  Info: Border #5B8FA3, Icon ℹ️, Background #F0F5F9
  Success: Border #4A7C59, Icon ✓, Background #F0F8F4
  Warning: Border #DCB482, Icon ⚠️, Background #FFFBF0
  Error: Border #8B4A42, Icon ✕, Background #FFF5F3

Toast (notification):
  Position: Bottom-right, 16px from edges
  Animation: Slide up 200ms, fade out 300ms at end
  Auto-dismiss: 5 seconds (unless action needed)
```

---

## Motion & Transitions

### **Timing**

```
Micro-interactions: 100-150ms
  Used for: Button hover, icon changes, quick toggles

Medium interactions: 200-300ms
  Used for: Modal open, tab switch, list item expand

Macro interactions: 300-500ms
  Used for: Page transitions, large animations (rare)
```

### **Easing**

```
Default: ease-in-out (most natural)
  cubic-bezier(0.4, 0, 0.2, 1)

Quick respond: ease-out
  cubic-bezier(0, 0, 0.2, 1)

Entering: ease-out
  cubic-bezier(0, 0, 0.2, 1)

Exiting: ease-in
  cubic-bezier(0.4, 0, 1, 1)
```

### **Common Animations**

```
Fade: Opacity 0 → 1 (150ms ease-out)
Scale: Transform scale 0.95 → 1 (150ms ease-out)
Slide-up: Transform translateY(4px) → 0 (150ms ease-out)
Pulse: Opacity 1 → 0.5 → 1 (infinite, 2s)
Shimmer: Background position animation (loading placeholder)
```

---

## Responsive Breakpoints

```
Mobile:     < 640px   (phones)
Tablet:     640px-1024px
Desktop:    1024px+

Layout:
  Mobile:   Single column, 16px padding
  Tablet:   2 columns, 20px padding
  Desktop:  3+ columns, 32px padding

Typography:
  Mobile:   Scale down by 10-15%
  Desktop:  Full scale
```

---

## Accessibility

### **Color Contrast**

```
Text on background: 4.5:1 minimum (WCAG AA)
Primary text (#2C2A28) on #FFFFFC: 13:1 ✓
Primary text (#2C2A28) on #F3F3F2: 12:1 ✓
White text (#FFFFFC) on #606C5A: 7:1 ✓
```

### **Focus States**

```
All interactive elements must have visible focus state:
  Option 1: 1px border (#606C5A)
  Option 2: 2px border (lighter)
  Option 3: Subtle background change + border

Avoid: outline: none without replacement
```

### **Icon System**

```
Icons: Lucide React or Heroicons
Size: 16px (sm), 20px (md), 24px (lg)
Stroke-width: 2 (consistency)
Color: Inherit from text color
Always pair with text label (not icon-only buttons)
```

---

## Use Across Tools

### **Labour Code Auditor**

Uses all component styles as-is. Only content differs (upload form, results display).

```
✓ Same buttons, inputs, cards
✓ Same colors, spacing, typography
✓ Same shadows, borders, radius
✓ Different: Form labels ("Upload company policy" vs "Upload GST filing")
✓ Different: Result display ("Compliance Score" vs "Filing Status")
```

### **GST Checker**

Uses all component styles as-is. Only content differs.

```
✓ Same buttons, inputs, cards
✓ Same layout structure
✗ Different content (GST-specific fields, results format)
```

### **Any New Tool**

Same pattern: Use design system, change only content.

```
New Tool Template:
1. Copy component library (buttons, forms, cards)
2. Use design tokens (colors, spacing, typography)
3. Build tool-specific UI by combining components
4. No design system changes needed
```

---

## CSS Variables (Tailwind Config)

```javascript
// tailwind.config.js
export default {
  theme: {
    extend: {
      colors: {
        primary: '#606C5A',
        secondary: '#F3F3F2',
        text: '#2C2A28',
        background: '#FFFFFC',
        success: '#4A7C59',
        warning: '#DCB482',
        error: '#8B4A42',
        // ... grays and neutrals
      },
      borderRadius: {
        xs: '2px',
        sm: '4px',
        md: '8px',
        DEFAULT: '2px', // Most elements use 2px
      },
      spacing: {
        xs: '4px',
        sm: '8px',
        md: '16px',
        lg: '24px',
        xl: '32px',
      },
      boxShadow: {
        sm: '0 1px 2px rgba(0,0,0,0.04)',
        md: '0 2px 4px rgba(0,0,0,0.06)',
        lg: '0 4px 12px rgba(0,0,0,0.08)',
        xl: '0 8px 24px rgba(0,0,0,0.10)',
      },
      transitionDuration: {
        fast: '150ms',
        normal: '200ms',
        slow: '300ms',
      },
    },
  },
};
```

---

## Summary

This design system ensures:
- ✅ Visual consistency across all tools
- ✅ Minimal, flat Japandi aesthetic
- ✅ Apple-like subtle interactions
- ✅ Accessibility compliance (WCAG AA)
- ✅ Fast development (reuse components)
- ✅ Professional appearance

**Next:** Read COMPONENT_LIBRARY.md for reusable component specs.
