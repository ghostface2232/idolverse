import { GAME_BALANCE, getSeasonForWeek } from "@/data/gameBalance";
import type { GameStoreState } from "@/types/game";

export function advanceWeekState(gameState: GameStoreState): GameStoreState {
  const nextWeek =
    gameState.currentWeek >= GAME_BALANCE.weeksPerYear
      ? 1
      : gameState.currentWeek + 1;

  return {
    ...gameState,
    currentWeek: nextWeek,
    season: getSeasonForWeek(nextWeek),
  };
}

