// Shared TypeScript types for The Confident Mind Coach
// Types will be added here as features are built in later phases.

export type CoachingMode = "ESP" | "PREGAME" | "RESET" | "AAR";

export type LedgerType = "DEPOSIT" | "WITHDRAWAL" | "ADJUSTMENT";

export type LedgerSourceType =
  | "ESP"
  | "PREGAME"
  | "RESET"
  | "AAR"
  | "TOP_TEN"
  | "MANUAL";

export type EventStatus = "upcoming" | "completed" | "cancelled";
