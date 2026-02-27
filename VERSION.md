# 🌌 Project Versioning: The Galactic Trail

> **Current Version:** v1.3.1 (Rigil Kentaurus B)
> **Mission Stage:** 🔴 ALPHA BUILD (Internal Testing)
> **Rule:** Every **Major Version (vX.0)** jumps to a new star system. **Minor Versions (vX.y)** are planets/objects within that system, moving further from the star.

---

## 🚀 Mission Log

| Version | Object | System | Stage | Date | Mission Summary |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **v1.3.1** | **Rigil Kentaurus B** | **Alpha Centauri** | **ALPHA** | 2026-02-28 | **Singularity-2**: 7-day retention policy and UI privacy polish. |
| **v1.3** | **Rigil Kentaurus** | **Alpha Centauri** | **ALPHA** | 2026-02-28 | **UX & Reporting**: Audit Logs refinements, PDF export, and Role-based UI. |
| **v1.2** | **Proxima c** | **Alpha Centauri** | **ALPHA** | 2026-02-27 | **Security Hardening**: Audit, Sourcemaps, and Env Validation. |
| **v1.1** | **Proxima b** | **Alpha Centauri** | **ALPHA** | 2026-02-26 | **Cloud Integration**: Vercel deployment and routing fixes. |
| **v1.0** | **Proxima Centauri** | **Alpha Centauri** | **ALPHA** | 2026-02-26 | **Core Engine**: Compliance scoring and PDF reporting. |
| **v0.7** | **Vesta** | **Sol System** | **ALPHA** | 2026-02-26 | **Security UX**: Auto-password generation and modal UI. |
| **v0.6** | **Pallas** | **Sol System** | **ALPHA** | 2026-02-26 | **Standardization**: Admin header and state sync alignment. |
| **v0.5** | **Ceres** | **Sol System** | **ALPHA** | 2026-02-26 | **Infra**: Docker support and initial Cloud Run settings. |
| **v0.4** | **Mars** | **Sol System** | **ALPHA** | 2026-02-26 | **Hardening**: API secure refactor and Vercel setup. |
| **v0.3** | **Earth** | **Sol System** | **ALPHA** | 2026-02-26 | **Governance**: Admin user lifecycle and approval tools. |
| **v0.2** | **Venus** | **Sol System** | **ALPHA** | 2026-02-25 | **Foundations**: Establish `PROJECT_CONTEXT.md` and rules. |
| **v0.1** | **Mercury** | **Sol System** | **ALPHA** | 2026-02-25 | **Ignition**: Initial project scaffolding and repository. |

---

## 🛰 Mission Reports

### [v1.3.1] Rigil Kentaurus B (2026-02-28) - ALPHA
- **The 7-Day Rule**: Implemented automated Postgres function `expire_old_audits` to delete logs older than 7 days.
- **Privacy Disclosure**: Added UI caption clarifying data retention policy for auditors.
- **Quota Visibility**: Refactored dashboard to show "Audits Today" count for both Admins and Standard Users.
- **UX Polish**: Standardized primary button transitions to 200ms.

### [v1.3] Rigil Kentaurus (2026-02-28) - ALPHA
- Renamed 'Usage' dashboard to 'Audit Logs' for end-user clarity.
- Implemented role-based conditional rendering (Admin vs. Standard User).
- Added 'View Report' modal containing detailed AI audit findings.
- Integrated `jsPDF` for branded audit result exports.
- Added system-wide button hover scale animations.

### [v1.2] Proxima c (2026-02-27) - ALPHA
- Implemented `SECURITY_CHECKLIST.md` auditing.
- Disabled production sourcemaps in `vite.config.ts`.
- Added runtime `validate-env.ts` for Vite frontend.
- Sanitized backend `main.py` exception responses.

### [v1.1] Proxima b (2026-02-26) - ALPHA
- Migrated backend to Vercel Serverless.
- Fixed frontend-backend routing via `/api` proxy.

### [v1.0] Proxima Centauri (2026-02-26) - ALPHA
- Replaced `risk_score` with `compliance_score` for Indian Labour Codes.
- Added PDF export functionality for auditors.

---

## 🛠 Naming System: "The Interstellar Rule"

- **v0.x (Sol System):** ALPHA BUILD 1. Planets (Mercury → Mars) then Asteroids.
- **v1.x (Alpha Centauri):** ALPHA BUILD 2. The star (Proxima) then its planets (b → c).
- **v2.x (Barnard's Star):** NEXT STAR SYSTEM. Beta Build 1 (When user testing starts).

---
*Next destination: Barnard's Star (v2.0) - Entering THE BETA SECTOR...*
