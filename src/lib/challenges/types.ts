/**
 * Challenge curriculum types.
 * Challenges are defined as static JSON configs — no database needed for the curriculum itself.
 * Only enrollment and day entries are persisted.
 */

export interface ChallengeDay {
  day: number;
  title: string;
  theme: string;
  prompt: string; // The reflection question for the user
  lesson: string; // Short micro-lesson (2-3 sentences)
  aiInstruction: string; // Instructions for the AI when coaching this day's response
}

export interface ChallengeConfig {
  slug: string;
  title: string;
  subtitle: string;
  description: string;
  duration: number; // days
  category: string;
  icon: string; // lucide icon name
  days: ChallengeDay[];
}
