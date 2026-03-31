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

✓ Phase 8 — Conversational Coach + Deployment
  - Free-form conversational coach via streaming chat (/coach)
  - Anthropic SDK streaming (messages.stream) with SSE protocol
  - Multi-turn conversation with persistent chat sessions
  - Dr. Nate Zinsser methodology embedded in system prompt
  - Profile + Top Ten achievements injected as coaching context
  - Crisis detection on every message (escalation banner inline)
  - ChatSession + ChatMessage models added to Prisma schema
  - Coach added to navigation (sidebar, mobile nav, dashboard)
  - Voice-dictation friendly (10k char input limit, auto-expanding textarea)
  - Deployed to Vercel with Neon PostgreSQL

Release Blockers:
  (none remaining)

Stack:
Next.js 14
TypeScript
Tailwind CSS
shadcn/ui
Prisma
PostgreSQL 16 (Neon serverless in production)
Anthropic API (user-selectable: Haiku 4.5, Sonnet 3.5, Sonnet 4, Opus 3)
Clerk authentication (dev fallback mode, placeholder keys)

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
- Settings (editable profile, display name, coaching config, model selector, document uploads, sign out)
- Coach (streaming conversational AI, multi-turn, crisis-safe, cross-session memory)
- Goals (1-5 confidence goals with efficacy scoring, achieve/pause lifecycle)

Implemented Agent Modes:
- ESP ✅
- Pregame ✅
- Reset ✅
- AAR ✅
- Coach (conversational) ✅

Memory tables:
- User (name, email, clerkId)
- Profile (includes coachModel preference)
- Achievement
- ConfidenceGoal (goal-directed confidence with efficacy scoring)
- UserDocument (uploaded context files with extracted text)
- ESPEntry
- IPREntry
- AAREntry
- CoachingSession
- LedgerEntry (includes optional goalId for goal tagging)
- Affirmation
- Event
- ChatSession (conversational coach sessions)
- ChatMessage (user + assistant messages, flagged support)

Database State:
- Prisma schema synced
- Local: PostgreSQL via Docker (port 5433)
- Production: Neon PostgreSQL (us-east-1)
- Schema pushed to both environments via prisma db push

Deployment:
- Platform: Vercel (Hobby plan)
- URL: https://confident-mind-coach.vercel.app
- Production branch: main
- Database: Neon PostgreSQL (project: confident-mind-coach)
- Build command: prisma generate && next build
- Auth: Clerk in dev fallback mode (placeholder keys bypass auth)
- Environment variables configured in Vercel dashboard:
  - DATABASE_URL (Neon connection string)
  - ANTHROPIC_API_KEY
  - NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY (placeholder)
  - CLERK_SECRET_KEY (placeholder)

Environment:
- Clerk running in dev fallback mode (shared dev user)
- Anthropic API key configured
- Neon PostgreSQL connected in production

Recent additions (this session):
- Document uploads on Settings (PDF, DOCX, MD, TXT with text extraction)
- Coaching memory system (cross-session recall of conversations, ESP, AARs, goals, documents)
- Model selector (Haiku 4.5, Sonnet 3.5, Sonnet 4, Opus 3) with per-user preference
- Dashboard Suspense streaming (fixes mobile freeze)
- Confidence Goals (/goals) with efficacy scoring and coaching integration

Future:
- Goal tagging on ESP, Pregame, AAR, Ledger entries
- Weekly efficacy check-in flow
- Book tools: Mental Rehearsal, Identity Statement, Motivational Scripting
- Clerk production auth (requires custom domain)
- Family feature (parent/child accounts with separate access)
- Per-user data isolation (currently shared dev user)
