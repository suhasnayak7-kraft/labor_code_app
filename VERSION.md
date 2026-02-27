# Version History

## [1.0.1] - 2026-02-27
### Added
- Created `VERSION.md` to track project changes.
- Added `SECURITY_CHECKLIST.md` for comprehensive security auditing.
- Created `frontend/src/lib/validate-env.ts` for runtime environment variable validation.
- Created `context/AuditAI_App_Context.md` for global project context.

### Changed
- Updated `.gitignore` to include detailed environment file exclusions (`.env.*.local`).
- Modified `frontend/vite.config.ts` to disable source maps in production for better security.
- Updated `frontend/src/main.tsx` to integrate environment validation on startup.
- Sanitized backend `main.py` exception handling to prevent internal error leakage to clients.
- Automated GitHub push for security implementation.

## [1.0.0] - 2026-02-26
### Added
- **Full Vercel Deployment**: Integrated serverless FastAPI backend with Vite React frontend.
- **Compliance Scoring**: Implemented `compliance_score` logic to replace old `risk_score` metric.
- **Reporting**: Added PDF report download functionality for Compliance Auditors (CAs).

### Fixed
- **Vercel Routing**: Mounted backend under `/api` prefix to resolve 404 routing issues on Vercel.
- **Runtime Errors**: Removed invalid Python runtime specifications from `vercel.json`.

## [0.9.0] - 2026-02-26
### Added
- **Password UX Enhancements**: Added old/new password fields with show/hide functionality to the Edit Profile modal.
- **Admin UX**: Implemented pre-filling of the "Old Password" field from `admin_password_ref` for easier reference by admins.

## [0.8.0] - 2026-02-26
### Added
- **Containerization**: Added `Dockerfile` and `.dockerignore` for Cloud Run deployment support.
- **Infrastructure**: Initial `vercel.json` configuration for frontend deployment.

## [0.7.0] - 2026-02-26
### Added
- **Admin Lifecycle**: Implemented user approval flows, role management, and request status tooling.
- **UI Consistency**: Standardized admin dashboard headers and improved state synchronization.
- **Password Generation**: Added auto-generation for new user passwords in the provisioning modal.

## [0.6.0] - 2026-02-26
### Added
- **API Security**: Initial security hardening for the API layer.
- **Vercel Prep**: Refactored project structure to support Vercel deployment.

## [0.5.0] - 2026-02-25
### Added
- **Project Structure**: Initial commit and project scaffolding.
- **Context**: Established `PROJECT_CONTEXT.md` for team-wide tracking.

---
*Next versions will be appended above this line.*
