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

## Deployment

The app is deployed to Vercel at https://confident-mind-coach.vercel.app.
- Production branch: `main`
- Database: Neon PostgreSQL (us-east-1)
- Build: `prisma generate && next build`
- Auth: Clerk in dev fallback mode (placeholder keys, shared dev user)
- AI: Anthropic API (claude-haiku-4-5-20251001)

Auth note: Clerk development instances don't support provider domains (vercel.app).
A custom domain is needed to enable Clerk production auth with per-user accounts.
Until then, all users share a single dev user account.