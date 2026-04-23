import { getSeasonForWeek } from "@/data/gameBalance";
import type { GameStoreState } from "@/types/game";

export const initialGameState: GameStoreState = {
  currentWeek: 1,
  season: getSeasonForWeek(1),
  investorType: "entertainment",
  simulationPaused: false,
  simulationFocus: "practice-room",
};

