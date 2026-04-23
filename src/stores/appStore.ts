import { useStore } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";
import { createStore } from "zustand/vanilla";
import { initialAlbumState } from "@/stores/albumStore";
import { initialCalendarState } from "@/stores/calendarStore";
import { initialCompetitorState } from "@/stores/competitorStore";
import { initialEventState } from "@/stores/eventStore";
import { initialFandomState } from "@/stores/fandomStore";
import { initialFinanceState } from "@/stores/financeStore";
import { initialGameState } from "@/stores/gameStore";
import { initialStaffState } from "@/stores/staffStore";
import { initialTraineeState } from "@/stores/traineeStore";
import { advanceWeekState } from "@/systems/advanceWeek";
import { generateWeeklyDecisionCards } from "@/systems/generateWeeklyDecisionCards";
import { pickMarketHeadline } from "@/systems/pickMarketHeadline";
import type { SimulationFocus } from "@/types/game";

function createInitialState() {
  return {
    game: initialGameState,
    trainee: initialTraineeState,
    staff: initialStaffState,
    album: initialAlbumState,
    fandom: initialFandomState,
    competitor: initialCompetitorState,
    finance: initialFinanceState,
    calendar: initialCalendarState,
    event: {
      ...initialEventState,
      marketHeadline: pickMarketHeadline(
        initialGameState.currentWeek,
        initialGameState.season,
      ),
      weeklyDecisionCards: generateWeeklyDecisionCards(
        initialGameState.currentWeek,
        initialGameState.season,
      ),
    },
  };
}

type AppStoreState = ReturnType<typeof createInitialState>;

type AppStoreActions = {
  advanceWeek: () => void;
  toggleSimulationPause: () => void;
  setSimulationFocus: (focus: SimulationFocus) => void;
};

export type AppStore = AppStoreState & AppStoreActions;

export const appStore = createStore<AppStore>()(
  subscribeWithSelector((set) => ({
    ...createInitialState(),
    advanceWeek: () =>
      set((state) => {
        const nextGame = advanceWeekState(state.game);

        return {
          game: nextGame,
          event: {
            ...state.event,
            marketHeadline: pickMarketHeadline(
              nextGame.currentWeek,
              nextGame.season,
            ),
            weeklyDecisionCards: generateWeeklyDecisionCards(
              nextGame.currentWeek,
              nextGame.season,
            ),
          },
        };
      }),
    toggleSimulationPause: () =>
      set((state) => ({
        game: {
          ...state.game,
          simulationPaused: !state.game.simulationPaused,
        },
      })),
    setSimulationFocus: (focus) =>
      set((state) => ({
        game: {
          ...state.game,
          simulationFocus: focus,
        },
      })),
  })),
);

export function useAppStore<T>(selector: (store: AppStore) => T) {
  return useStore(appStore, selector);
}

