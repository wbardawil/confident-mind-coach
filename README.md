# The Confident Mind Coach

AI-powered mental performance coaching system.

The app helps users build, protect, and deploy confidence through structured routines.

## Current Development Status

The Confident Mind Coach application currently includes:

- Core coaching flows (ESP, Pregame, Reset, AAR)
- Shared coaching execution shell across all flows
- Confidence Ledger tracking deposits and withdrawals
- Recovery coaching with reset support
- 14-day confidence trend insights
- Transaction-safe atomic persistence across all coaching actions
- Editable Settings with coaching profile management
- Dev-safe authentication with Clerk fallback mode
- 239 automated tests across 17 test files

The system is completing stabilization before production deployment.

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



