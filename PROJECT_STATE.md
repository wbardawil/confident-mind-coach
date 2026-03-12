Project: Confident Mind Coach

Current Phase: 4 complete

Completed:
✓ Phase 1 — foundation
✓ Phase 2 — onboarding + Top Ten
✓ Phase 3 — Daily ESP coaching loop
✓ Phase 4 — Pregame + Reset routines
✓ PostgreSQL connected
✓ Prisma schema synced
✓ Clerk-safe local dev fallback working

Next Phase:
Phase 5 — AAR reflection engine

Current Blocker:
- Anthropic API billing credits required for live AI calls

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

Planned Agent Structure:
- ESP ✅
- Pregame ✅
- Reset ✅
- AAR

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