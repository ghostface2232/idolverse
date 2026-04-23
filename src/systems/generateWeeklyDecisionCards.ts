import { WEEKLY_DECISION_POOL } from "@/data/decisionCards";
import { GAME_BALANCE } from "@/data/gameBalance";
import { pickUniqueItems } from "@/lib/seededRandom";
import type { Season, WeeklyDecision } from "@/types/game";

export function generateWeeklyDecisionCards(
  week: number,
  season: Season,
): WeeklyDecision[] {
  const seasonalPool = WEEKLY_DECISION_POOL.filter(
    (card) => !card.seasons || card.seasons.includes(season),
  );

  return pickUniqueItems(
    seasonalPool,
    GAME_BALANCE.weeklyDecisionCount,
    week * 101 + season.length,
  );
}
