# AI Architecture

## Current Agent Loop

Daily ESP reflection flow:

User input
→ validation (Zod)
→ safety scan
→ prompt builder
→ Anthropic API
→ structured JSON response
→ Zod validation
→ persistence:
   - ESPEntry
   - CoachingSession
   - Affirmation
   - LedgerEntry

## Safety Model

If crisis language is detected:

- skip AI call
- show escalation resources
- store flagged CoachingSession