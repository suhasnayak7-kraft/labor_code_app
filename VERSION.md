# 🌌 Project Versioning: The Galactic Trail

> **Current Version:** v1.2 (Centauri)
> **Rule:** Every new version moves one step further away from the Sun.

---

## 🚀 Version Log

| Version | Name | Stage | Date | Description |
| :--- | :--- | :--- | :--- | :--- |
| **v1.2** | **Centauri** | **CURRENT** | 2026-02-27 | **Security Implementation**: Audit, Gitignore, Sourcemaps, and Env Validation. |
| **v1.1** | **Barnard's Star** | Alpha | 2026-02-26 | **Full Vercel Deployment**: Serverless FastAPI + Vite React integration. |
| **v1.0** | **Proxima** | Alpha | 2026-02-26 | **Core Features**: Compliance scoring and PDF reporting. |
| **v0.7** | **Vesta** | Internal | 2026-02-26 | **Admin Lifecycle**: User approval flows and password generation. |
| **v0.5** | **Ceres** | Older | 2026-02-26 | **Infrastructure**: API security hardening and Docker support. |
| **v0.1** | **Mercury** | Early | 2026-02-25 | **Launch**: Initial project scaffolding and context setup. |

---

## 🛠 Naming System: "The Distance Rule"

1. **v0.x (Internal):** Use **Planets** (Mercury, Mars) or **Asteroids** (Ceres, Vesta, Pallas).
2. **v1.x (Alpha):** Use the **Nearest Stars** (Proxima, Barnard's Star, Wolf 359).
3. **v2.0 (Major):** Use **Famous Bright Stars** (Sirius, Canopus, Rigel).

---

## 🛰 Development Details

### [v1.2] Centauri (2026-02-27)
- **Security**: Implemented `SECURITY_CHECKLIST.md`.
- **Validation**: Added `validate-env.ts` for frontend runtime checks.
- **Privacy**: Disabled production sourcemaps in `vite.config.ts`.
- **Sanitization**: Obfuscated raw server exceptions in `backend/main.py`.

### [v1.1] Barnard's Star (2026-02-26)
- **Deployment**: Migrated to Vercel Serverless architecture.
- **Routing**: Fixed 404s by mounting backend under `/api`.

### [v1.0] Proxima (2026-02-26)
- **Engine**: Replaced `risk_score` with `compliance_score`.
- **Features**: Added PDF export for Compliance Auditors.

---
*Next destination: Beyond Alpha Centauri...*
