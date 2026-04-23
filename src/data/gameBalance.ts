import type { ConceptMood, Season } from "@/types/game";

export const GAME_BALANCE = {
  baseWidth: 360,
  baseHeight: 640,
  weeksPerYear: 52,
  weeksPerSeason: 13,
  weeklyDecisionCount: 3,
  maxStatValue: 100,
} as const;

export function getSeasonForWeek(week: number): Season {
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

export const SEASON_CONCEPT_BONUSES: Record<Season, Record<ConceptMood, number>> = {
  spring: {
    fresh: 14,
    cute: 8,
    dark: -6,
    retro: 4,
    girlCrush: -2,
    emotional: 1,
    artsy: 0,
    y2k: 10,
    summer: -8,
    winter: -12,
  },
  summer: {
    fresh: 6,
    cute: 3,
    dark: -4,
    retro: 2,
    girlCrush: 7,
    emotional: -6,
    artsy: -2,
    y2k: 4,
    summer: 16,
    winter: -14,
  },
  fall: {
    fresh: -4,
    cute: -2,
    dark: 4,
    retro: 9,
    girlCrush: 2,
    emotional: 14,
    artsy: 10,
    y2k: 1,
    summer: -10,
    winter: 3,
  },
  winter: {
    fresh: -6,
    cute: 3,
    dark: 5,
    retro: 4,
    girlCrush: -1,
    emotional: 8,
    artsy: 3,
    y2k: -4,
    summer: -16,
    winter: 16,
  },
};
