Project: Confident Mind Coach

Current Phase: Phase 6 — Stabilization & Testing (in progress)

Completed:
✓ Phase 1 — foundation
✓ Phase 2 — onboarding + Top Ten
✓ Phase 3 — Daily ESP coaching loop
✓ Phase 4 — Pregame + Reset routines
✓ Phase 5 — AAR + Dashboard
✓ PostgreSQL connected
✓ Prisma schema synced
✓ Clerk-safe local dev fallback working

Recent Progress:
- Implemented Confidence Ledger page
- Added ledger summaries and 14-day trend
- Introduced withdrawal support for Reset sessions
- Added distress detection rules
- Hardened server action input coercion
- Introduced atomic ledger persistence using Prisma transactions
- Replaced string literals with ledger constants
- Improved validation behavior
- Expanded automated test coverage (183 tests passing)

Current Focus:
- Stabilization of persistence patterns across all coaching actions
- Integration testing
- Ledger accuracy validation
- Preparing system for production deployment

Current Blocker:

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
- Dashboard
- Top Ten CRUD
- Redirect guard
- Daily ESP
- Pregame
- Reset
- AAR
- Confidence Ledger

Implemented Agent Modes:
- ESP ✅
- Pregame ✅
- Reset ✅
- AAR ✅

Memory tables:
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