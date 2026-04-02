export const APP_NAME = "The Confident Mind Coach";

export const ROUTES = {
  HOME: "/",
  SIGN_IN: "/sign-in",
  SIGN_UP: "/sign-up",
  DASHBOARD: "/dashboard",
  ONBOARDING: "/onboarding",
  TOP_TEN: "/top-ten",
  DAILY_ESP: "/daily-esp",
  PREGAME: "/pregame",
  RESET: "/reset",
  AAR: "/aar",
  COACH: "/coach",
  INSTANT_RESET: "/instant-reset",
  GOALS: "/goals",
  LEDGER: "/ledger",
  SETTINGS: "/settings",
} as const;

export const CONFIDENCE_MIN = 1;
export const CONFIDENCE_MAX = 10;

export const COACHING_MODES = {
  ESP: "ESP",
  PREGAME: "PREGAME",
  RESET: "RESET",
  AAR: "AAR",
  COACH: "COACH",
} as const;

export const LEDGER_TYPES = {
  DEPOSIT: "DEPOSIT",
  WITHDRAWAL: "WITHDRAWAL",
  ADJUSTMENT: "ADJUSTMENT",
} as const;

export const LEDGER_SOURCE_TYPES = {
  ESP: "ESP",
  PREGAME: "PREGAME",
  RESET: "RESET",
  AAR: "AAR",
  TOP_TEN: "TOP_TEN",
  COACH: "COACH",
  INSTANT_RESET: "INSTANT_RESET",
  MANUAL: "MANUAL",
} as const;
