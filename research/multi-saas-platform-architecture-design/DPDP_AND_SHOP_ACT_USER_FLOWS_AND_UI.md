# DPDP & Shop Act Checkers - User Flows & Frontend UI Design

**Tools:** DPDP Act Compliance Checker & Shop/Establishment Act Auditor
**Design System:** Japandi Minimal (Forest Green #606C5A, Warm Cream #F3F3F2, Brick Red #8B4A42)
**Tech Stack:** React + Vite + TypeScript + Tailwind CSS
**Status:** Ready for implementation

---

## 1. User Journey Overview

### **User Personas**

**Persona 1: Startup Founder (DPDP Tool Target)**
- Age: 25-35
- Role: Tech founder, CTO, compliance officer
- Pain: "Is my privacy policy compliant with DPDP? Will I get ₹50 lakh penalty?"
- Time Available: 15 minutes/week
- Budget: ₹500-2000/month

**Persona 2: Small Business Owner (Shop Act Target)**
- Age: 30-50
- Role: Business owner, HR manager
- Pain: "Am I breaking labor laws? What should I fix?"
- Time Available: 30 minutes/month (annual compliance check)
- Budget: ₹200-500/month

**Persona 3: CA/Compliance Officer (Both Tools)**
- Age: 25-45
- Role: Chartered Accountant, Compliance consultant
- Pain: "How do I audit 50 clients' compliance in a week?"
- Time Available: 2-3 hours/week
- Budget: ₹15,000/month for tool suite

---

## 2. Complete User Flow - DPDP Act Checker

### **Flow Diagram (Text-based)**

```
┌─────────────────────────────────────────────────────────────┐
│                    DPDP Checker Journey                     │
└─────────────────────────────────────────────────────────────┘

1. LANDING SCREEN
   ↓ (User sees problem: "Is my Privacy Policy DPDP compliant?")

2. LOGIN/SIGNUP FLOW
   ├─ Email + Password (optional: Sign with Google)
   └─ Accept Privacy Policy & Terms

3. TOOL HUB SCREEN
   ├─ Shows "DPDP Act Checker" tile
   ├─ Shows "Shop Act Auditor" tile (Coming Soon)
   └─ Shows subscription plan: "Pro - ₹499/month"

4. DPDP CHECKER ENTRY SCREEN
   ├─ Option A: Upload Privacy Policy (PDF/DOCX/TXT)
   ├─ Option B: Paste text directly
   └─ Option C: Use template (fill 20-item form)

5. UPLOAD/INPUT SCREEN
   ├─ Drag-drop file upload area
   ├─ Show file size limit (50 MB)
   └─ Show accepted formats (PDF, DOCX, TXT)

6. ANALYZING SCREEN (Loading)
   ├─ Show 4-step progress bar
   │  ├─ Step 1: Uploading file (100%)
   │  ├─ Step 2: Extracting text (in progress)
   │  ├─ Step 3: Checking compliance (waiting)
   │  └─ Step 4: Generating report (waiting)
   └─ Estimated time: 30-60 seconds

7. COMPLIANCE REPORT SCREEN
   ├─ Score: "72/100 - MODERATE RISK"
   ├─ Risk Level Indicator (Visual: Red/Yellow/Green)
   ├─ 20-item Checklist
   │  ├─ ✅ Item 1: Data Collection Disclosure
   │  ├─ ✅ Item 2: User Rights Section
   │  ├─ ⚠️  Item 3: Data Retention (INCOMPLETE)
   │  └─ ❌ Item 4: Grievance Officer (MISSING)
   ├─ Detailed Findings (expandable sections)
   │  ├─ Critical Issues (2)
   │  ├─ Warnings (3)
   │  └─ Tips (5)
   └─ Call-to-Action: "Download Report" / "Share with Team"

8. REPORT DOWNLOAD SCREEN
   ├─ Format options: PDF / CSV / Email
   ├─ Email to team members
   └─ Track: "Report downloaded at 2:45 PM"

9. ACTION ITEMS SCREEN
   ├─ Priority-ranked fixes
   │  ├─ 🔴 CRITICAL: Add Grievance Officer section (2 hours)
   │  ├─ 🟡 WARNING: Expand Data Retention policy (1 hour)
   │  └─ 🟢 TIP: Add Data Localization statement (30 min)
   ├─ Template snippets for each fix
   └─ Re-check button: "Verify again in 1 week"

10. HISTORY & TRACKING SCREEN
    ├─ Show all past audits
    │  ├─ Audit 1: Feb 28, 2026 | Score: 72/100 | Status: ⚠️ Action Items
    │  └─ Audit 2: Feb 20, 2026 | Score: 68/100 | Status: ✅ Improved
    ├─ Trend graph: Compliance score over time
    └─ Comparison: "You improved by 4 points in 8 days"
```

---

## 3. Screen-by-Screen UI Design

### **Screen 1: Tool Hub / Home Screen**

**Purpose:** Show all available tools, current subscription, and quick actions

**Layout:**
```
┌─────────────────────────────────────────────┐
│  🏠 Compliance Hub                    👤    │
├─────────────────────────────────────────────┤
│                                             │
│  Welcome back, Rajesh! 👋                   │
│  Your Pro plan expires on Mar 31, 2026      │
│                                             │
├─────────────────────────────────────────────┤
│                                             │
│  📊 YOUR COMPLIANCE TOOLS                   │
│                                             │
│  ┌──────────────────────┐ ┌──────────────┐ │
│  │ 🔐 DPDP Act Checker  │ │ 📋 Shop Act  │ │
│  │                      │ │ Auditor      │ │
│  │ Privacy Policy Audit │ │              │ │
│  │                      │ │ Coming Soon  │ │
│  │ [Start Audit] ─────► │ │              │ │
│  └──────────────────────┘ └──────────────┘ │
│                                             │
│  ┌──────────────────────┐ ┌──────────────┐ │
│  │ 📈 Income Tax        │ │ 💰 Payroll   │ │
│  │ Auditor              │ │ Auditor      │ │
│  │                      │ │              │ │
│  │ Coming in April      │ │ Coming in May│ │
│  │                      │ │              │ │
│  └──────────────────────┘ └──────────────┘ │
│                                             │
├─────────────────────────────────────────────┤
│                                             │
│  📌 RECENT AUDITS                           │
│                                             │
│  • DPDP Check - Feb 28 - Score: 72/100 ⚠️  │
│  • DPDP Check - Feb 20 - Score: 68/100 ✅  │
│                                             │
│  [View History]                             │
│                                             │
└─────────────────────────────────────────────┘
```

**Design Tokens:**
- Background: #F3F3F2 (Warm Cream)
- Card bg: White (#FFFFFF)
- Border: 2px #E8E8E6 (light gray)
- Text (primary): #1A1A1A (charcoal)
- Text (secondary): #666666 (gray)
- Accent: #606C5A (Forest Green)

**Components Used:**
- CardComponent (tool tiles)
- ButtonComponent (Start Audit)
- BadgeComponent (Coming Soon, expires date)
- Typography (Heading, Body)

---

### **Screen 2: DPDP Checker - Upload/Input Screen**

**Purpose:** Let user upload or paste their privacy policy

**Layout:**
```
┌─────────────────────────────────────────────┐
│  ◄ Back                    DPDP Checker     │
├─────────────────────────────────────────────┤
│                                             │
│  Let's Audit Your Privacy Policy            │
│  We'll check 20 DPDP compliance criteria    │
│                                             │
│  ┌─────────────────────────────────────┐   │
│  │  Choose how to input your policy:   │   │
│  │                                     │   │
│  │  ○ Upload file (PDF/DOCX/TXT)      │   │
│  │  ○ Paste text directly              │   │
│  │  ○ Fill form (20 questions)         │   │
│  └─────────────────────────────────────┘   │
│                                             │
│  ┌─────────────────────────────────────┐   │
│  │                                     │   │
│  │  📁 Drag & drop your file here      │   │
│  │                                     │   │
│  │     Or [Browse Files]               │   │
│  │                                     │   │
│  │  Max size: 50 MB                    │   │
│  │  Formats: PDF, DOCX, TXT            │   │
│  │                                     │   │
│  └─────────────────────────────────────┘   │
│                                             │
│  ├──────────────────────────────────────┤  │
│  Or paste text:                            │
│  │                                      │  │
│  │ [Large textarea for policy text]    │  │
│  │                                      │  │
│  └──────────────────────────────────────┘  │
│                                             │
│  [Cancel]                  [Continue ➜]    │
│                                             │
└─────────────────────────────────────────────┘
```

**Design Tokens:**
- Border: 2px dashed #606C5A (on drag-over)
- Hover: bg #F9F9F8 (slight cream)
- Text area border: 2px solid #E8E8E6
- Focus: border #606C5A, shadow 0 0 0 3px rgba(96, 108, 90, 0.1)

**Components Used:**
- FileUploadComponent (drag-drop)
- TextareaComponent (paste text)
- TabComponent (switch between upload/paste/form)
- ButtonComponent (Cancel, Continue)

---

### **Screen 3: Analyzing Screen (Loading)**

**Purpose:** Show progress while Gemini API analyzes the document

**Layout:**
```
┌─────────────────────────────────────────────┐
│                                             │
│          🔄 Analyzing Your Policy           │
│                                             │
│          Please wait (30-60 seconds)        │
│                                             │
├─────────────────────────────────────────────┤
│                                             │
│  Step 1: Uploading file      ████████ 100% │
│                                             │
│  Step 2: Extracting text     ████░░░░ 60%  │
│                                             │
│  Step 3: Checking compliance ░░░░░░░░ 0%   │
│                                             │
│  Step 4: Generating report   ░░░░░░░░ 0%   │
│                                             │
├─────────────────────────────────────────────┤
│                                             │
│  What we're checking:                       │
│  • Data collection disclosures              │
│  • User rights (access, delete, portability)│
│  • Data retention policies                  │
│  • Grievance officer details                │
│  • Data localization requirements           │
│  • And 15 more DPDP compliance items        │
│                                             │
│  💡 Tip: DPDP penalties can be up to        │
│     ₹50 lakhs per violation                 │
│                                             │
└─────────────────────────────────────────────┘
```

**Design Tokens:**
- Progress bar: #606C5A (Forest Green)
- Background: linear gradient (#F3F3F2 to #FAFAF8)
- Text: #666666 (gray)

**Components Used:**
- ProgressBarComponent (animated)
- SkeletonComponent (placeholder text)
- InfoBoxComponent (tips)

---

### **Screen 4: Compliance Report Screen**

**Purpose:** Show detailed DPDP compliance audit results

**Layout:**
```
┌─────────────────────────────────────────────┐
│  ◄ Back              DPDP Audit Report      │
├─────────────────────────────────────────────┤
│                                             │
│  🔐 Privacy Policy Compliance Score         │
│                                             │
│  ┌───────────────────────────────────────┐  │
│  │                                       │  │
│  │              72 / 100                 │  │
│  │         MODERATE RISK ⚠️              │  │
│  │                                       │  │
│  │   You're 72% compliant with DPDP      │  │
│  │   Act 2023. Fix critical issues       │  │
│  │   to reduce penalty risk.             │  │
│  │                                       │  │
│  └───────────────────────────────────────┘  │
│                                             │
│  ┌───────────────────────────────────────┐  │
│  │ Risk Level Indicator                  │  │
│  │                                       │  │
│  │ ▓▓▓▓▓▓▓░░░ High Risk Items: 3         │  │
│  │ ▓▓▓▓▓▓░░░░ Medium Risk Items: 4       │  │
│  │ ▓▓▓▓▓▓▓▓▓░ Warnings: 2                │  │
│  │                                       │  │
│  └───────────────────────────────────────┘  │
│                                             │
├─────────────────────────────────────────────┤
│  COMPLIANCE CHECKLIST (20 ITEMS)            │
│                                             │
│  ✅ Data Collection Disclosure              │
│     Your policy mentions data collection    │
│                                             │
│  ✅ User Rights Section                     │
│     Covers: Access, deletion, portability   │
│                                             │
│  ⚠️  Data Retention Policy                  │
│     ❌ Missing specific retention periods   │
│     ✅ Mentions backup retention            │
│                                             │
│  ❌ Grievance Officer Details               │
│     ❌ Missing: Name                        │
│     ❌ Missing: Email                       │
│     ❌ Missing: Phone                       │
│                                             │
│  ✅ Data Localization (India)               │
│     States data stored in India             │
│                                             │
│  [Show All 20 Items ▼]                      │
│                                             │
├─────────────────────────────────────────────┤
│  CRITICAL ISSUES (Fix immediately)          │
│                                             │
│  🔴 1. Missing Grievance Officer Section    │
│     Risk: ₹10 lakh penalty per violation    │
│     Fix time: 2 hours                       │
│     [View Fix Template] ➜                   │
│                                             │
│  🔴 2. Incomplete Data Retention Timeline   │
│     Risk: ₹5 lakh per user complaint        │
│     Fix time: 1 hour                        │
│     [View Fix Template] ➜                   │
│                                             │
│  🟡 3. Missing Data Breach Notification     │
│     Risk: ₹3 lakh per incident              │
│     Fix time: 30 minutes                    │
│     [View Fix Template] ➜                   │
│                                             │
├─────────────────────────────────────────────┤
│  AUDIT METADATA                             │
│                                             │
│  Audit Date: Feb 28, 2026                   │
│  File: privacy_policy_v1.pdf                │
│  Auditor: DPDP Compliance Checker           │
│                                             │
│  [📥 Download PDF Report]                   │
│  [📧 Email to Team]  [📋 Copy Link]         │
│                                             │
│  [Re-Check in 1 Week]                       │
│                                             │
└─────────────────────────────────────────────┘
```

**Design Tokens:**
- Score bg: Linear gradient (#606C5A to #4A5545)
- Score text: White
- Risk Bar ▓: #8B4A42 (Brick Red) for high
- Risk Bar ▓: #D4A574 (tan) for medium
- Checkmark (✅): #4CAF50 (green)
- X mark (❌): #8B4A42 (brick red)
- Warning (⚠️): #FFC107 (amber)

**Components Used:**
- CardComponent (report sections)
- ScoreCircleComponent (big 72/100 display)
- ProgressBarComponent (risk level)
- ChecklistComponent (20-item list, collapsible)
- AccordionComponent (critical issues)
- BadgeComponent (Fix time, risk level)
- ButtonComponent (Download, Email, Re-check)

---

### **Screen 5: Action Items Screen**

**Purpose:** Show prioritized fixes with templates

**Layout:**
```
┌─────────────────────────────────────────────┐
│  ◄ Back              Recommended Actions    │
├─────────────────────────────────────────────┤
│                                             │
│  3 Critical Fixes Required                  │
│  Estimated time: 3.5 hours to full comply   │
│                                             │
├─────────────────────────────────────────────┤
│  🔴 CRITICAL - Fix within 7 days            │
│                                             │
│  ┌─────────────────────────────────────┐   │
│  │ Add Grievance Officer Section       │   │
│  │ ───────────────────────────────────  │   │
│  │ Current status: MISSING              │   │
│  │ Estimated fix time: 2 hours         │   │
│  │ Penalty if ignored: ₹10 lakh        │   │
│  │                                     │   │
│  │ Your policy needs:                  │   │
│  │ ✓ Officer name & title              │   │
│  │ ✓ Email & phone number              │   │
│  │ ✓ Response SLA (max 30 days)        │   │
│  │ ✓ Escalation process                │   │
│  │                                     │   │
│  │ [View Template] ➜                   │   │
│  │ [I've Fixed This] ✓                 │   │
│  │                                     │   │
│  └─────────────────────────────────────┘   │
│                                             │
│  🟡 WARNING - Fix within 14 days            │
│                                             │
│  ┌─────────────────────────────────────┐   │
│  │ Specify Data Retention Periods      │   │
│  │ ───────────────────────────────────  │   │
│  │ Current: Vague ("as long as needed")│   │
│  │ Required: Specific timelines         │   │
│  │ Estimated fix time: 1 hour          │   │
│  │                                     │   │
│  │ Your policy should state:           │   │
│  │ ✓ Account data: 90 days after delete│   │
│  │ ✓ Logs: 30 days                     │   │
│  │ ✓ Backups: 90 days                  │   │
│  │ ✓ Legal holds: 7 years              │   │
│  │                                     │   │
│  │ [View Template] ➜                   │   │
│  │ [I've Fixed This] ✓                 │   │
│  │                                     │   │
│  └─────────────────────────────────────┘   │
│                                             │
│  🟢 RECOMMENDATIONS - Fix within 30 days   │
│                                             │
│  ┌─────────────────────────────────────┐   │
│  │ Add AI/Automated Processing Notice  │   │
│  │ ───────────────────────────────────  │   │
│  │ Current: Not mentioned              │   │
│  │ Recommended: Mention in policy      │   │
│  │ Estimated fix time: 30 minutes      │   │
│  │                                     │   │
│  │ "We use AI for content moderation"  │   │
│  │                                     │   │
│  │ [View Template] ➜                   │   │
│  │ [Not Applicable] ✗                  │   │
│  │                                     │   │
│  └─────────────────────────────────────┘   │
│                                             │
│  [All Fixed! Re-check Compliance ➜]        │
│                                             │
└─────────────────────────────────────────────┘
```

**Design Tokens:**
- Red bar: #8B4A42 (CRITICAL)
- Yellow bar: #D4A574 (WARNING)
- Green bar: #4CAF50 (RECOMMENDED)

**Components Used:**
- AccordionComponent (each action item)
- BadgeComponent (fix time, penalty)
- ButtonComponent (View Template, I've Fixed)

---

## 4. Complete User Flow - Shop/Establishment Act Auditor

### **Flow Diagram**

```
┌─────────────────────────────────────────────────────────────┐
│               Shop Act Auditor Journey                      │
└─────────────────────────────────────────────────────────────┘

1. TOOL HUB SCREEN
   └─ User clicks "Shop Act Auditor"

2. SELECT STATE SCREEN
   ├─ Dropdown: Select your state
   └─ States: Karnataka, Maharashtra, Delhi, UP, Gujarat, Tamil Nadu, etc.

3. ENTER BUSINESS DETAILS SCREEN
   ├─ Business name
   ├─ Number of employees
   ├─ Working hours (operating days/hours)
   ├─ Type: Retail, Restaurant, Hospital, Factory
   └─ Estimated compliance: "Let's check 45 compliance items"

4. UPLOADING DOCUMENTS (Optional)
   ├─ Employment contracts (PDF)
   ├─ Wage slips/payroll (PDF)
   ├─ Attendance records (Excel)
   └─ Safety certifications (PDF)

5. ANALYZING SCREEN (Loading)
   ├─ "Analyzing your business for ₹50,000+ in penalties"
   └─ Progress: 45 items checked

6. COMPLIANCE REPORT SCREEN
   ├─ Score: "62/100 - HIGH RISK"
   ├─ 45-item Checklist (state-specific)
   ├─ Critical Issues (8)
   ├─ Warnings (6)
   └─ Compliance Tips (3)

7. ACTION ITEMS SCREEN
   ├─ Priority fixes (state laws vary)
   ├─ Template forms to download
   └─ "Email compliance officer"

8. DOWNLOAD COMPLIANCE PACKAGE
   ├─ Word doc template: "Updated Wage Policy"
   ├─ Excel: "Safety Checklist"
   ├─ PDF: "Compliance Audit Report"
   └─ Email to compliance officer
```

---

### **Screen: Shop Act - Report**

**Layout:**
```
┌─────────────────────────────────────────────┐
│  ◄ Back            Shop Act Compliance      │
├─────────────────────────────────────────────┤
│                                             │
│  🏪 [Karnataka] Retail Shop Compliance      │
│                                             │
│  ┌───────────────────────────────────────┐  │
│  │              62 / 100                 │  │
│  │           HIGH RISK ❌                │  │
│  │                                       │  │
│  │  You may face penalties up to ₹50K   │  │
│  │  Fix critical issues immediately     │  │
│  │                                       │  │
│  └───────────────────────────────────────┘  │
│                                             │
├─────────────────────────────────────────────┤
│  CRITICAL ISSUES (8) - Fix within 7 days   │
│                                             │
│  🔴 1. Missing Wage Board Compliance        │
│     Issue: Not registered with Wage Board   │
│     Penalty: ₹10,000 + prosecution         │
│     Action: [Register Now] ➜               │
│                                             │
│  🔴 2. Improper Working Hours               │
│     Issue: Working > 9 hrs/day allowed      │
│     Penalty: ₹5,000 per employee           │
│     Action: [Update Schedule] ➜             │
│                                             │
│  🔴 3. Missing Safety Certificate           │
│     Issue: No fire safety inspection        │
│     Penalty: ₹25,000                       │
│     Action: [Schedule Inspection] ➜        │
│                                             │
│  🟡 4. Incomplete Wage Records              │
│     Issue: Missing month(s) records         │
│     Penalty: ₹5,000                        │
│     Action: [Download Template] ➜          │
│                                             │
├─────────────────────────────────────────────┤
│  COMPLIANCE CHECKLIST                       │
│                                             │
│  Registration & Licenses:                   │
│  ✅ Shop registered with district office    │
│  ❌ Wage board registration MISSING         │
│  ✅ Trade license valid                     │
│  ⚠️  Safety certificate expiring in 2 mo    │
│                                             │
│  Working Hours & Rest Days:                 │
│  ✅ Posted opening/closing times            │
│  ❌ No rest day (required: 1/week)          │
│  ⚠️  Overtime tracked but not limited       │
│                                             │
│  [Show All 45 Items ▼]                      │
│                                             │
├─────────────────────────────────────────────┤
│  DOWNLOAD COMPLIANCE PACKAGE                │
│                                             │
│  📄 Updated_Wage_Policy.docx                │
│  📄 Safety_Checklist.xlsx                   │
│  📄 Shop_Act_Report_Feb2026.pdf             │
│                                             │
│  [📧 Email to HR Manager]                   │
│  [📧 Email to Compliance Officer]           │
│                                             │
│  [Re-Check in 30 Days]                      │
│                                             │
└─────────────────────────────────────────────┘
```

---

## 5. Frontend Component Structure

### **React Folder Organization**

```
frontend/src/tools/
├── dpdp-checker/
│   ├── components/
│   │   ├── DpdpToolHub.tsx          (entry screen)
│   │   ├── PolicyUploadForm.tsx      (upload/paste)
│   │   ├── AnalyzingScreen.tsx       (loading)
│   │   ├── ComplianceReport.tsx      (results)
│   │   ├── ActionItemsList.tsx       (fixes)
│   │   ├── ChecklistItem.tsx         (reusable)
│   │   ├── RiskIndicator.tsx         (score display)
│   │   └── HistoryTimeline.tsx       (past audits)
│   │
│   ├── hooks/
│   │   ├── useDpdpAudit.ts           (API calls)
│   │   ├── useUploadFile.ts          (file handling)
│   │   └── useReportDownload.ts      (export report)
│   │
│   ├── services/
│   │   ├── dpdpApi.ts                (backend calls)
│   │   └── storageService.ts         (Supabase files)
│   │
│   ├── types/
│   │   └── dpdp.types.ts             (TypeScript interfaces)
│   │
│   └── index.ts                      (export)
│
└── shop-act-auditor/
    ├── components/
    │   ├── ShopActToolHub.tsx        (entry)
    │   ├── StateSelector.tsx          (dropdown)
    │   ├── BusinessDetailsForm.tsx    (form)
    │   ├── ShopActReport.tsx          (results)
    │   ├── ActionItemsList.tsx        (fixes)
    │   └── DownloadPackage.tsx        (exports)
    │
    ├── hooks/
    │   ├── useShopActAudit.ts
    │   └── useDocumentUpload.ts
    │
    ├── services/
    │   ├── shopActApi.ts
    │   ├── stateTemplates.ts          (state-specific rules)
    │   └── pdfGenerator.ts            (report generation)
    │
    ├── types/
    │   └── shopAct.types.ts
    │
    └── index.ts
```

---

## 6. Key React Components (Pseudo-code)

### **DpdpToolHub Component**

```tsx
// File: DpdpToolHub.tsx
import { useState } from 'react'
import { Card, Button, Badge } from '@/components/ui'
import PolicyUploadForm from './PolicyUploadForm'
import ComplianceReport from './ComplianceReport'
import HistoryTimeline from './HistoryTimeline'

export default function DpdpToolHub() {
  const [activeTab, setActiveTab] = useState<'start' | 'history'>('start')
  const [audit, setAudit] = useState(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleAuditStart = async (policyText: string) => {
    setIsLoading(true)
    // Call backend API
    const result = await analyzeDpdpCompliance(policyText)
    setAudit(result)
    setIsLoading(false)
  }

  return (
    <div className="min-h-screen bg-cream-50 p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-charcoal-900">DPDP Act Checker</h1>
        <p className="text-gray-600 mt-2">
          Ensure your Privacy Policy is 100% DPDP Act 2023 compliant
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 mb-8">
        <Button
          variant={activeTab === 'start' ? 'primary' : 'secondary'}
          onClick={() => setActiveTab('start')}
        >
          Start New Audit
        </Button>
        <Button
          variant={activeTab === 'history' ? 'primary' : 'secondary'}
          onClick={() => setActiveTab('history')}
        >
          View History
        </Button>
      </div>

      {/* Content */}
      {activeTab === 'start' && (
        <>
          {!audit ? (
            <PolicyUploadForm
              onSubmit={handleAuditStart}
              isLoading={isLoading}
            />
          ) : (
            <ComplianceReport audit={audit} />
          )}
        </>
      )}

      {activeTab === 'history' && (
        <HistoryTimeline />
      )}
    </div>
  )
}
```

### **ComplianceReport Component**

```tsx
// File: ComplianceReport.tsx
import { Card, Badge, Button, Accordion } from '@/components/ui'
import RiskIndicator from './RiskIndicator'
import ChecklistItem from './ChecklistItem'

export default function ComplianceReport({ audit }) {
  const { score, items, criticalIssues, warnings, tips } = audit

  return (
    <div className="space-y-6">
      {/* Score Display */}
      <Card className="p-8 text-center bg-gradient-to-br from-forest-green to-forest-dark text-white">
        <div className="text-6xl font-bold mb-2">{score}</div>
        <div className="text-2xl mb-2">/ 100</div>
        <RiskIndicator score={score} />
        <p className="mt-4 text-sm">
          You're {score}% compliant. Fix critical issues to reduce penalty risk.
        </p>
      </Card>

      {/* Risk Summary */}
      <Card className="p-6">
        <h2 className="text-xl font-bold text-charcoal-900 mb-4">Risk Summary</h2>
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span>Critical Issues</span>
            <Badge variant="error">{criticalIssues.length}</Badge>
          </div>
          <div className="flex justify-between items-center">
            <span>Warnings</span>
            <Badge variant="warning">{warnings.length}</Badge>
          </div>
          <div className="flex justify-between items-center">
            <span>Tips</span>
            <Badge variant="info">{tips.length}</Badge>
          </div>
        </div>
      </Card>

      {/* Checklist */}
      <Card className="p-6">
        <h2 className="text-xl font-bold text-charcoal-900 mb-4">
          Compliance Checklist (20 items)
        </h2>
        <div className="space-y-2">
          {items.map((item, idx) => (
            <ChecklistItem key={idx} item={item} />
          ))}
        </div>
      </Card>

      {/* Critical Issues */}
      <Card className="p-6">
        <h2 className="text-xl font-bold text-charcoal-900 mb-4">
          Critical Issues (Fix immediately)
        </h2>
        <Accordion items={criticalIssues.map(issue => ({
          title: issue.title,
          content: issue.description,
          action: <Button>View Fix Template</Button>
        }))} />
      </Card>

      {/* Download & Share */}
      <Card className="p-6 flex gap-4">
        <Button variant="primary" onClick={() => downloadReport('pdf')}>
          📥 Download PDF
        </Button>
        <Button variant="secondary" onClick={() => shareReport('email')}>
          📧 Email Report
        </Button>
        <Button variant="secondary" onClick={() => reaudit()}>
          🔄 Re-check in 1 Week
        </Button>
      </Card>
    </div>
  )
}
```

---

## 7. State Management Pattern

### **Redux/Context Structure**

```typescript
// Store structure for DPDP Tool
type DpdpState = {
  currentAudit: {
    id: string
    status: 'idle' | 'analyzing' | 'done' | 'error'
    score: number
    items: ComplianceItem[]
    criticalIssues: Issue[]
    warnings: Issue[]
    tips: Issue[]
    createdAt: string
  } | null

  history: Audit[]

  ui: {
    activeTab: 'start' | 'history'
    isLoading: boolean
    error: string | null
  }
}

// Actions
type DpdpAction =
  | { type: 'START_AUDIT', payload: { policyText: string } }
  | { type: 'AUDIT_LOADING' }
  | { type: 'AUDIT_COMPLETE', payload: { audit: Audit } }
  | { type: 'AUDIT_ERROR', payload: { error: string } }
  | { type: 'FETCH_HISTORY' }
  | { type: 'SET_ACTIVE_TAB', payload: { tab: string } }
```

---

## 8. API Integration Points

### **Backend Endpoints to Call**

```typescript
// DPDP Checker Endpoints

// 1. Analyze Policy
POST /api/tools/dpdp-checker/analyze
{
  policyText: string
  fileUrl?: string  // if uploaded to storage first
}
Response: {
  auditId: string
  score: number
  items: ComplianceItem[]
  criticalIssues: Issue[]
  warnings: Issue[]
}

// 2. Get Audit History
GET /api/tools/dpdp-checker/history
Response: Audit[]

// 3. Download Report
GET /api/tools/dpdp-checker/{auditId}/report?format=pdf|csv|html
Response: File blob

// 4. Email Report
POST /api/tools/dpdp-checker/{auditId}/email
{
  recipients: string[]
  includeTemplate: boolean
}
Response: { success: boolean }
```

---

## 9. Design System Token Usage

### **Color Usage in Screens**

```css
/* Compliance Scores */
.score-high { color: #4CAF50; }        /* Green */
.score-medium { color: #D4A574; }       /* Tan */
.score-low { color: #8B4A42; }          /* Brick Red */

/* Text */
.text-primary { color: #1A1A1A; }       /* Charcoal */
.text-secondary { color: #666666; }     /* Gray */
.text-muted { color: #999999; }         /* Light gray */

/* Backgrounds */
.bg-cream { background-color: #F3F3F2; }
.bg-white { background-color: #FFFFFF; }
.bg-light { background-color: #FAFAF8; }

/* Accents */
.accent-primary { color: #606C5A; }     /* Forest Green */
.accent-error { color: #8B4A42; }       /* Brick Red */
.accent-warning { color: #D4A574; }     /* Tan */

/* Borders */
.border-light { border: 2px solid #E8E8E6; }
.border-accent { border: 2px solid #606C5A; }
.border-error { border: 2px solid #8B4A42; }
```

---

## 10. Responsive Design Breakpoints

```tsx
// Mobile (320px - 640px)
- Single column layout
- Full-width cards
- Bottom action buttons

// Tablet (641px - 1024px)
- Two-column grid for tool tiles
- Sidebar for history
- Floating action button

// Desktop (1025px+)
- Three-column layout
- Left sidebar (navigation)
- Main content (report)
- Right sidebar (actions/tips)
```

---

## 11. Accessibility Requirements

- ✅ WCAG 2.1 AA compliance
- ✅ Keyboard navigation (Tab, Enter, Escape)
- ✅ Screen reader friendly (ARIA labels)
- ✅ Color not the only indicator (✅/❌ symbols + colors)
- ✅ Font size: min 14px
- ✅ Line height: min 1.5x

---

## 12. Performance Optimization

**Frontend:**
- Code splitting per tool
- Lazy load history on scroll
- Cache audit results (IndexedDB)
- Debounce form inputs

**Backend:**
- Supabase query optimization
- API response caching (1 hour)
- Gemini API batching
- File compression for uploads

---

**Status:** Ready for frontend development
**Estimated build time:** 5-7 days
**Next: Frontend implementation guide**

