# Roadmap

## Phase 1 — Foundation ✅
- Next.js scaffold
- Prisma
- PostgreSQL
- Clerk-safe local dev fallback
- app shell

## Phase 2 — Identity and Memory ✅
- onboarding
- Profile persistence
- Top Ten CRUD
- redirect guard

## Phase 3 — Daily ESP Coaching ✅
- Daily ESP form
- ESPEntry persistence
- CoachingSession creation
- AI coaching response
- affirmation generation
- LedgerEntry creation
- safety check

## Phase 4 — Performance Routines ✅
- Pregame
- Reset

## Phase 5 — AAR + Dashboard ✅
- AAR form
- AAREntry persistence
- CoachingSession creation
- dashboard aggregation
- recent sessions
- recent affirmations
- recent ESP entries
- friendly AI error handling

## Phase 6 — Stabilization and Testing (in progress)

### 6.1–6.9 — Core Stabilization ✅
- Shared coaching execution shell (runCoachingFlow)
- Atomic transaction-based persistence across all 4 coaching actions
- Input coercion hardening (coerceToNumber)
- Distress detection and withdrawal pipeline
- Ledger mock fidelity corrections (null vs zero semantics)
- 226 automated tests across 16 files

### 6.10 — Deployment Safety Pass ✅
- Environment variable validation at startup (fail-fast)
- AI client timeout (15s) and structured JSON error logging
- UTC-normalized date calculations (timezone/DST safe)

### 6.11 — Release Blocker Triage & Surface Completion ✅
- Audited all user-facing routes
- Simplified V1 navigation (single /settings surface)
- Editable Settings with updateSettings server action and Zod validation
- displayName added to User model
- profile.upsert ensures safe profile creation on first save
- Dev account detection and identity display
- TagInput hardening (case-insensitive dedup, length limits)
- UX feedback (success auto-dismiss, inline errors, button state)
- Dashboard greeting uses user.name with role fallback
- Profile creation audit (null-safety verified across all routes)

## Phase 7 — Insights (initial pass complete) ✅
- Confidence Ledger view with summaries
- 14-day confidence trend visualization
- Ledger withdrawals and recovery tracking

## Phase 8 — Deployment
- CI/CD pipeline
- Prisma migrate deploy
- Production environment configuration
- Monitoring and alerting

## Phase 9 — Real usage + UX improvements
## Phase 10 — Confidence analytics
## Phase 11 — Agent orchestration
