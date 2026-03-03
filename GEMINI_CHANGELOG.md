# Gemini Developer Log

> **Assistant Instructions**: After thoroughly completing a user prompt, the assistant MUST automatically run `git add . && git commit -m "..." && git push`. Then, in its final response, the assistant MUST provide the local testing link (e.g., `http://localhost:5173`) and the Vercel deployment link for easy testing.

This file documents the changes made by the Gemini assistant.

## [2026-03-03]
### Added
- **Reset Password Flow**: Added a "Forgot Password" flow to the `LoginPage` using Supabase's `resetPasswordForEmail`.
- **Reset Password Page**: Created `ResetPasswordPage.tsx` to handle the password update and redirect to login.
- **Knowledge Base Storage Separation**: Added a `tool_id` to the `labour_laws` database table and backend API routes. The Admin panel now allows selecting which tool to upload knowledge base documents to, and the Labour Code Auditor only queries context tagged with `labour-audit`. Included migration script `phase18_tool_kb.sql`.

### Fixed
- **Onboarding Flash on Logging In**: Increased the profile fetch timeout in `useAuth.tsx` from 2 seconds to 8 seconds. This prevents a premature fallback to the "Approval Pending" (`OnboardingPage`) screen on slow networks or cold Supabase starts.
- **Onboarding Flash on Login**: Modified the `useAuth.tsx` hook to explicitly set `loading` back to `true` momentarily during sign-in while the `profile` object is fetching. This safely prevents the Router from prematurely directing the user to the `OnboardingPage` "Approval Pending" screen while their profile data is in transit.
- **Admin User Approval**: Corrected the logic in `handleApproveCreation` on `AdminPage.tsx`. Instead of incorrectly creating a new user with a password via the API, it now correctly updates the existing authenticated user's `is_approved` status in the `profiles` table.

