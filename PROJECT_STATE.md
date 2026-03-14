Project: Confident Mind Coach

Current Phase: Phase 6 — Stabilization (final audit complete)

Completed:
✓ Phase 1 — foundation
✓ Phase 2 — onboarding + Top Ten
✓ Phase 3 — Daily ESP coaching loop
✓ Phase 4 — Pregame + Reset routines
✓ Phase 5 — AAR + Dashboard
✓ Phase 6.1–6.9 — Stabilization core
  - Shared execution shell (runCoachingFlow)
  - Atomic transaction-based persistence across all coaching flows
  - Input coercion hardening (coerceToNumber)
  - Distress detection and withdrawal pipeline
  - 239 automated tests passing across 17 test files
✓ Phase 6.10 — Deployment Safety Pass
  - Environment variable validation (fail-fast at startup)
  - AI client timeout (15s) and structured error logging
  - UTC-normalized date calculations (timezone/DST safe)
✓ Phase 7 — Insights (initial)
  - Confidence Ledger view with summaries
  - 14-day confidence trend visualization
  - Ledger withdrawals and recovery tracking
✓ PostgreSQL connected
✓ Prisma schema synced
✓ Clerk-safe local dev fallback working

✓ Phase 6.11 — Release Blocker Triage & Surface Completion
  - Settings page fully implemented with editable coaching profile
  - displayName field added to User model
  - updateSettings server action with Zod validation and profile upsert
  - Simplified V1 navigation (single /settings surface, no duplicate Account)
  - Dev account detection (shows "Development Account" instead of fake email)
  - TagInput hardened (case-insensitive dedup, per-tag length limit, array max)
  - UX feedback: success auto-dismiss, inline errors, button state management
  - Dashboard greeting uses user.name with role fallback
  - Profile upsert guards onboardingCompleted flag
✓ Final stability audit
  - Dashboard UTC date fix (was using local time for 14-day window)
  - Ledger trend chart fix (bars invisible due to CSS percentage height bug)
  - All coaching flows verified: auth, validation, safety, transactions
  - Settings isolation confirmed (no ledger/session side effects)

Release Blockers:
  (none remaining)

Stack:
Next.js 14
TypeScript
Tailwind CSS
shadcn/ui
Prisma
PostgreSQL 16
Anthropic API

Working Flows:
- Landing page
- Onboarding
- Dashboard (full data queries, personalized greeting)
- Top Ten CRUD
- Redirect guard
- Daily ESP (form + AI + persistence)
- Pregame (form + AI + persistence)
- Reset (form + AI + distress detection + persistence)
- AAR (form + AI + persistence)
- Confidence Ledger (summaries + trend + entries)
- Settings (editable profile, display name, coaching config, sign out)

Implemented Agent Modes:
- ESP ✅
- Pregame ✅
- Reset ✅
- AAR ✅

Memory tables:
- User (name, email, clerkId)
- Profile
- Achievement
- ESPEntry
- IPREntry
- AAREntry
- CoachingSession
- LedgerEntry
- Affirmation
- Event

Database State:
- Prisma schema synced
- Database pushed via prisma db push

Environment:
- Clerk running in dev fallback mode
- Anthropic API key configured
- Environment validation enforced at startup (check-env.ts)
