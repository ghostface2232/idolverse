import { DECISION_CARD_POOL } from "@/data/decisionCards";
import { GAME_BALANCE } from "@/data/gameBalance";
import { pickUniqueItems } from "@/lib/seededRandom";
import type { DecisionCard, SeasonKey } from "@/types/game";

export function generateWeeklyDecisionCards(
  week: number,
  season: SeasonKey,
): DecisionCard[] {
  const seasonalPool = DECISION_CARD_POOL.filter(
    (card) => !card.seasons || card.seasons.includes(season),
  );

  return pickUniqueItems(
    seasonalPool,
    GAME_BALANCE.weeklyDecisionCount,
    week * 101 + season.length,
  );
}

