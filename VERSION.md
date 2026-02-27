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

---
*Next versions will be appended above this line.*
