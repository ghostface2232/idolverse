import type { SeasonKey } from "@/types/game";

export const GAME_BALANCE = {
  baseWidth: 360,
  baseHeight: 640,
  weeksPerYear: 52,
  weeklyDecisionCount: 3,
  maxStatValue: 100,
} as const;

export function getSeasonForWeek(week: number): SeasonKey {
  if (week <= 13) {
    return "spring";
  }

  if (week <= 26) {
    return "summer";
  }

  if (week <= 39) {
    return "fall";
  }

  return "winter";
}

