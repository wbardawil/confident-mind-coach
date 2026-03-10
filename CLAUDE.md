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

Next:
- Phase 3 Daily ESP only

Do not build Pregame, Reset, AAR, or dashboard analytics until Phase 3 is complete and validated.