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

## Architecture Rules

Keep layers separate.

UI → Components and Pages  
Domain Logic → lib/coaching  
AI Integration → lib/ai  
Safety → lib/safety  
Persistence → Prisma  

Rules:
- Never call AI directly from UI components
- All AI calls go through lib/ai
- Prompt builders live in lib/coaching
- Safety checks happen server-side
- Validate AI outputs with Zod before rendering

## Current Build State

Completed:
- Phase 1 foundation
- Phase 2 onboarding and Top Ten
- Phase 3 Daily ESP
- Phase 4 Pregame and Reset
- Phase 5 AAR and Dashboard

The project has completed Phase 8 (Conversational Coach + Deployment).

All 4 structured coaching flows (ESP, Pregame, Reset, AAR) share a common execution shell
via `runCoachingFlow(...)` in `lib/actions/run-coaching-flow.ts`.
Persistence is atomic (Prisma transactions) across all coaching flows.

The conversational coach (`/coach`) provides free-form streaming chat powered by
`streamCoaching()` in `lib/ai/client.ts`. The system prompt is built by
`buildCoachSystemPrompt()` in `lib/coaching/coach.ts` using Dr. Nate Zinsser's methodology.
Chat sessions persist via `ChatSession` and `ChatMessage` models. Crisis detection
runs on every user message before AI processing.

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
affirmations, ledger summary, uploaded documents, and confidence goals into the
system prompt. The coach treats this as its own memory — it recalls past
conversations and references them naturally.

Users can select their coach AI model in Settings (Haiku 4.5, Sonnet 3.5,
Sonnet 4, Opus 3). Model preference is stored in `Profile.coachModel` and
resolved to Anthropic model IDs via `resolveCoachModel()` in `lib/ai/client.ts`.
Structured flows always use Haiku for speed.

Confidence Goals (`/goals`) let users set 1-5 specific outcomes they're working
toward (cash flow, career, personal brand, etc.). Each goal has a self-efficacy
score (1-10) tracked over time. Goals are injected into coaching memory so the
AI coach ties daily work to what matters. The `ConfidenceGoal` model supports
active/achieved/paused lifecycle.

## Deployment

The app is deployed to Vercel at https://confident-mind-coach.vercel.app.
- Production branch: `main`
- Database: Neon PostgreSQL (us-east-1)
- Build: `prisma generate && next build`
- Auth: Clerk development instance (per-user accounts via Google/email sign-up)
- AI: Anthropic API (user-selectable: Haiku 4.5, Sonnet 3.5, Sonnet 4, Opus 3)

Auth note: Clerk is running in development mode. Each user gets their own account
and data. A custom domain + Clerk production instance is needed for production-grade auth.