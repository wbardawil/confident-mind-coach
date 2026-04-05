# CLAUDE.md

## Project Mission

This repository contains the web application for The Confident Mind Coach.

The product helps users build, protect, and deploy confidence as a trainable skill through structured reflection, preparation routines, and post-performance reviews.

The system focuses on mental performance coaching, not therapy or mental health treatment.

## Product Boundaries

This application must NOT:
- present itself as therapy
- diagnose mental illness
- provide medical advice
- replace crisis support

If user input suggests:
- self harm
- suicidal ideation
- crisis distress

The system must:
1. stop normal coaching
2. show a supportive escalation message
3. encourage human/professional support
4. log the session as flagged

## Tech Stack

Required stack:
- Next.js 14 App Router
- TypeScript
- Tailwind CSS
- shadcn/ui
- Prisma ORM
- PostgreSQL
- Clerk authentication
- Anthropic API
- Zod validation
- React Hook Form
- Vitest testing

## Current Build State

Completed:
- Phase 1 foundation
- Phase 2 onboarding and Top Ten
- Phase 3 Daily ESP
- Phase 4 Pregame and Reset
- Phase 5 AAR and Dashboard
- Phase 6-8 (Conversational Coach, Memory, Deployment)
- Phase 9 (Self-Monitoring, Memory Transparency, Data Export)

All 4 structured coaching flows (ESP, Pregame, Reset, AAR) share a common execution shell
via `runCoachingFlow(...)` in `lib/actions/run-coaching-flow.ts`.
Persistence is atomic (Prisma transactions) across all coaching flows.
Structured flows include retry-on-parse-failure: if Zod validation fails, the flow
retries once with the error appended to the prompt before returning an error.

The conversational coach (`/coach`) provides free-form streaming chat powered by
`streamCoaching()` in `lib/ai/client.ts`. The system prompt is built by
`buildCoachSystemPrompt()` in `lib/coaching/coach.ts` using Dr. Nate Zinsser's methodology.
Chat sessions persist via `ChatSession` and `ChatMessage` models. Crisis detection
runs on every user message before AI processing.

Chat history panel with folders (`ChatFolder` model) lets users organize
conversations. `getChatSessions()` returns sessions grouped by folder.

The Confidence Ledger system is now functional, including:
- deposits
- withdrawals
- recovery tracking
- 14-day confidence trend

Settings allows editing of the coaching profile (role, domain, strengths, challenges, baseline score, display name). The `updateSettings` server action validates input with Zod and uses `db.profile.upsert` to safely create or update the profile. The User model includes an optional `name` field for display name.

Users can upload documents (PDF, DOCX, MD, TXT) via Settings to provide coaching
context (resumes, personality assessments, etc.). Text is extracted server-side
via `pdf-parse` and `mammoth`, stored in the `UserDocument` model, and injected
into coaching prompts.

The coaching memory system (`getCoachingMemory()` in `lib/coaching/memory.ts`)
aggregates past chat sessions, ESP reflections, AARs, coaching feedback,
affirmations, ledger summary, uploaded documents, confidence goals, personality
assessments, vision domains, active systems, coaching journal notes/syntheses,
and structured memory facts into the system prompt. The coach treats this as
its own memory — it recalls past conversations and references them naturally.

Zep-grade memory facts (`MemoryFact` model) are extracted after each chat session
via `extractSessionFacts()` in `lib/coaching/memory-facts.ts`. Facts are stored as
entity-relationship triples (category, subject, predicate, content) with temporal
tracking and conflict detection. When a new fact contradicts an existing one, the
old fact is invalidated (not deleted). Facts include a `confidence` score (0-1)
that is reduced when the memory quality monitor flags inaccuracies.

Session summaries (`ChatSession.summary`) are generated after each conversation
via `generateSessionSummary()` in `lib/coaching/session-summary.ts`. Summaries
are preferred over raw transcripts in coaching memory for token efficiency.

Users can select their coach AI model in Settings (Haiku 4.5, Sonnet 3.5,
Sonnet 4, Opus 3). Model preference is stored in `Profile.coachModel` and
resolved to Anthropic model IDs via `resolveCoachModel()` in `lib/ai/client.ts`.
Structured flows always use Haiku for speed.

Confidence Goals (`/goals`) let users set 1-5 specific outcomes they're working
toward (cash flow, career, personal brand, etc.). Each goal has a self-efficacy
score (1-10) tracked over time. Goals are injected into coaching memory so the
AI coach ties daily work to what matters. The `ConfidenceGoal` model supports
active/achieved/paused lifecycle.

Goal Systems (`GoalSystem` model) are AI-proposed daily/weekly actions linked to
goals. `proposeSystems()` generates actionable systems. Each system tracks streak
count and last completion date. Systems are injected into coaching memory.

10x Vision (`/vision`) with custom domains lets users define their 10x life vision
across career, financial, personal, health, relationship, and custom domains
(`VisionDomain` model with `customLabel` for user-defined categories). Each domain
has a vision, current state, and AI-generated gap analysis. Vision is injected
into coaching memory.

Personality assessments (`PersonalityAssessment` model) are extracted from uploaded
documents. Supported frameworks: DISC, MBTI, Enneagram, StrengthsFinder, VIA, Big5.
Structured dimensions are stored as JSON. AI generates summaries and coaching tips.
Personality data is injected into coaching prompts via `getPersonalityContext()`.

Coaching journal (`CoachingJournal` model) stores AI-authored coaching notes per
session, plus weekly/monthly/quarterly syntheses. Journal entries are injected
into memory with syntheses given highest priority (longest retention).

Challenge system (`ChallengeEnrollment` + `ChallengeDayEntry` models) provides
time-boxed confidence programs (e.g., "imposter-syndrome-7d"). Users progress
through daily prompts with AI coaching feedback.

### Self-Monitoring System

Usage logging (`UsageLog` model) tracks every AI API call with token counts,
cost (in cents), latency, model, feature, and success/error status. Logged
via `logUsage()` in `lib/ai/usage-logger.ts`. Fire-and-forget — never blocks
user responses.

Promise monitor (`lib/monitoring/promise-monitor.ts`) runs a lightweight quality
check after each coach response: checks for context references (user facts),
coaching boundary compliance, response length, and name/role accuracy. No
additional AI calls — string matching only. Logs quality score per response.

Memory quality monitor (`lib/monitoring/memory-monitor.ts`) runs periodic
accuracy checks: loads a user's facts and recent transcripts, asks Haiku to
verify accuracy. Flagged facts get reduced confidence scores. Cost: ~$0.03/day.

Cost monitor (`lib/monitoring/cost-monitor.ts`) provides per-user daily/monthly
cost tracking via `getUserDailyCost()`, `getUserMonthlyCost()`, `getSystemDailyCost()`.

### Memory Transparency

The `/memory` page shows users what their coach knows about them: structured
facts (grouped by subject), session count, topics covered, and coaching memory
stats. Uses existing `getActiveFacts()` and database queries. No additional AI calls.

### Data Export

Users can export all their coaching data (sessions, facts, ESP entries, AARs,
ledger, goals, vision, achievements) as JSON from the Settings page via
`exportCoachingData()` server action in `lib/actions/export-data.ts`.

### Pricing & Cost Guardrails

Restructured pricing tiers:
- Free Trial: 3 sessions/day, 7-day access
- Confident ($9.99/mo): Unlimited structured flows
- Coach ($29.99/mo): + Haiku chat, 900 msgs/mo
- Pro Coach ($79.99/mo): + Sonnet 4, 900 msgs/mo
- Elite Coach ($179.99/mo): + Opus 4, 450 msgs/mo

Cost guardrails: 2000 char input limit, 600 max_tokens for chat, trial message
cap, document content capped at 1000 chars each in memory context.

### Timezone Support

Timezone-aware date handling via `startOfUserDay()`, `isUserToday()`,
`isUserYesterday()`, `userDaysAgo()` in `lib/utils/date.ts`. User timezone
stored in `Profile.timezone` (IANA format). Used for rate limiting, streaks,
and daily coaching windows.

### Language Support

Multi-language coaching via `Profile.language`. Language preference is injected
into both structured flow prompts and conversational coach system prompts.
Default: English.

## Architecture Rules (updated)

Keep layers separate.

UI → Components and Pages
Domain Logic → lib/coaching
AI Integration → lib/ai
Safety → lib/safety
Monitoring → lib/monitoring
Persistence → Prisma

Rules:
- Never call AI directly from UI components
- All AI calls go through lib/ai
- Prompt builders live in lib/coaching
- Safety checks happen server-side
- Validate AI outputs with Zod before rendering
- Usage logging is fire-and-forget (never blocks responses)
- Monitoring code lives in lib/monitoring, not in route handlers

## Deployment

The app is deployed to Vercel at https://confident-mind-coach.vercel.app.
- Production branch: `main`
- Database: Neon PostgreSQL (us-east-1)
- Build: `prisma generate && next build`
- Auth: Clerk development instance (per-user accounts via Google/email sign-up)
- AI: Anthropic API (user-selectable: Haiku 4.5, Sonnet 3.5, Sonnet 4, Opus 3)

Auth note: Clerk is running in development mode. Each user gets their own account
and data. A custom domain + Clerk production instance is needed for production-grade auth.