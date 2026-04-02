import type { ChallengeConfig } from "./types";
import { imposterSyndrome7d } from "./imposter-syndrome-7d";

/**
 * Registry of all available challenges.
 * Add new challenges here as they're created.
 */
export const CHALLENGES: ChallengeConfig[] = [imposterSyndrome7d];

export function getChallengeBySlug(slug: string): ChallengeConfig | undefined {
  return CHALLENGES.find((c) => c.slug === slug);
}
