# The Confident Mind Coach

AI-powered mental performance coaching system.

The app helps users build, protect, and deploy confidence through structured routines.

## Tech Stack

- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- shadcn/ui
- Prisma ORM + PostgreSQL
- Clerk Authentication
- Anthropic API
- Zod validation
- React Hook Form
- Vitest

## Setup

1. Install dependencies:

```bash
npm install
```

2. Copy environment variables:

```bash
copy .env.example .env.local
```

3. Fill in your `.env.local` with real values (see `.env.example` for required keys).

4. Generate Prisma client:

```bash
npx prisma generate
```

5. Run database migrations:

```bash
npx prisma db push
```

6. Run development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

## Testing

```bash
npm test
```

## Current Phase

Phase 3 complete:
- Daily ESP reflection form
- AI coaching response
- affirmation generation
- confidence ledger deposit
- safety escalation flow

### Known Issue

Anthropic API billing must be enabled for live coaching responses.
Until credits are added, the Daily ESP flow will show an API error.

## What Works Now

- Landing page
- Onboarding flow
- Profile persistence
- Top Ten CRUD
- Dashboard navigation
- Redirect guard
- PostgreSQL + Prisma connection

## In Progress

Phase 3 – Daily ESP Coaching Engine
