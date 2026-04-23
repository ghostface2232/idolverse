import { GAME_BALANCE, getSeasonForWeek } from "@/data/gameBalance";
import type { GameStoreState } from "@/types/game";

export function advanceWeekState(gameState: GameStoreState): GameStoreState {
  const wrapped = gameState.currentWeek >= GAME_BALANCE.weeksPerYear;
  const nextWeek = wrapped ? 1 : gameState.currentWeek + 1;
  const nextYear = wrapped ? gameState.currentYear + 1 : gameState.currentYear;

  return {
    ...gameState,
    currentWeek: nextWeek,
    currentYear: nextYear,
    currentSeason: getSeasonForWeek(nextWeek),
  };
}
