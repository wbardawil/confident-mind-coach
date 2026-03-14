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

The project is currently in Phase 6 (Stabilization) with initial Phase 7 insights implemented.

All 4 coaching flows (ESP, Pregame, Reset, AAR) share a common execution shell
via `runCoachingFlow(...)` in `lib/actions/run-coaching-flow.ts`.
Persistence is atomic (Prisma transactions) across all coaching flows.

The Confidence Ledger system is now functional, including:
- deposits
- withdrawals
- recovery tracking
- 14-day confidence trend

Settings allows editing of the coaching profile (role, domain, strengths, challenges, baseline score, display name). The `updateSettings` server action validates input with Zod and uses `db.profile.upsert` to safely create or update the profile. The User model includes an optional `name` field for display name.

Stabilization work remains the priority before deployment.

Do not build new product features until stabilization and testing are complete.