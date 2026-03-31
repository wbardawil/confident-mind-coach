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

## Phase 6 — Stabilization and Testing ✅

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

## Phase 8 — Conversational Coach + Deployment ✅
- Free-form conversational coach (/coach) with streaming AI
- Anthropic SDK streaming (messages.stream) with SSE protocol
- Multi-turn conversation persistence (ChatSession + ChatMessage)
- Dr. Nate Zinsser methodology in system prompt
- Profile + achievements context injection
- Crisis detection on every message
- Coach added to sidebar, mobile nav, and dashboard
- Deployed to Vercel (confident-mind-coach.vercel.app)
- Neon PostgreSQL as production database
- Build: prisma generate && next build
- Clerk in dev fallback mode (placeholder keys)

## Phase 9 — Goal-Directed Confidence (in progress)
- ✅ Confidence Goals CRUD (1-5 active goals with efficacy scoring)
- ✅ Goal context injected into coaching memory
- ✅ Goals page with category, efficacy slider, achieve/pause lifecycle
- Goal tagging on ESP, Pregame, AAR, Reset, and Ledger entries
- Weekly efficacy check-in flow (rate progress on each goal)
- Goal-specific evidence bank (linked ledger deposits per goal)
- Confidence forecast (efficacy trend projection)

## Phase 10 — Book Tools (from "The Confident Mind")

### Built ✅
- ESP (Effort, Success, Progress) — daily reflection
- Top Ten Memory Bank — 10 confidence memories
- Pregame Routine — pre-performance mental prep
- Reset / Flat Tire Drill — mid-performance recovery
- After Action Review (What / So What / Now What)
- Confidence Ledger — deposits, withdrawals, trends
- Affirmations — auto-generated from coaching sessions

### Not Yet Built
**High Priority:**
- Mental Rehearsal / Envisioning — guided multi-sensory visualization of performing successfully
- Identity Statement — "I am a..." declaration that shapes self-image
- Motivational Scripting — longer narratives beyond single affirmations
- Constructive Thinking Filter — catch and reframe negative self-talk in real-time

**Medium Priority:**
- C-B-A Pre-Performance Trigger — Cue conviction → Breathe body → Attach attention
- Reframing Setbacks — structured temporary/specific/external reframe exercise
- Performance Imagery Script — written screenplay of ideal performance (Appendix I)
- 80/20 Visualization Rule — 80% positive imagery, 20% contingency planning
- "Enough" Statement — prepared statement of sufficiency for high-pressure moments

**Lower Priority:**
- First-Person Narrative Recording — audio recording of your perfect day
- Visualization Board — digital vision board
- Four Realities Acceptance — guided exercise accepting imperfection, nerves, plateaus
- Energy State Management — breathing and activation level regulation
- Mid-Performance Celebration Prompts — notice and celebrate small wins during performance
- Learned Optimism / Explanatory Style — Seligman's permanent/temporary reframing training

## Phase 11 — Auth + Multi-user
- Custom domain for Clerk production auth
- Per-user accounts and data isolation
- Family feature (parent/child accounts with separate access)

## Phase 12 — Business & Analytics
- Subscription tiers (Haiku free, Sonnet/Opus premium)
- Confidence analytics dashboard
- Goal-specific progress reports
- Usage tracking and engagement metrics

## Phase 13 — Agent Orchestration
- Multi-agent coaching flows
- Automated weekly check-ins
- Smart nudges based on activity patterns
