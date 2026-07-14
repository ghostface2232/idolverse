import { useStore } from "zustand";
import { createStore } from "zustand/vanilla";
import { GAME_BALANCE, getSeasonForWeek } from "@/data/balance";
import { INVESTOR_CONDITIONS } from "@/data/investors";
import { generateWeeklyDecisionCards } from "@/systems/generateWeeklyDecisionCards";
import type { GameStore, GameStoreState } from "@/types/game";

export const initialGameState: GameStoreState = {
  currentWeek: 1,
  currentSeason: getSeasonForWeek(1),
  currentYear: 1,
  currentPhase: "prologue",
  groupGender: "female",
  companyName: "Idolverse Entertainment",
  groupName: "AURORA",
  investorType: "entertainment",
  investorConditions: INVESTOR_CONDITIONS.entertainment,
  investorPenaltyActive: false,
  investorConditionProgress: {},
  investorPressureWeeks: 0,
  investorComplianceCount: 0,
  awardHistory: [],
  weeklyDecisions: generateWeeklyDecisionCards(1, getSeasonForWeek(1)),
  notifications: [
    {
      id: "noti-welcome",
      type: "info",
      title: "Studio Opened",
      message: "Founding week is live. Your first strategic choices are ready.",
      week: 1,
    },
  ],
  trainingSchedule: {
    intensity: "normal",
    focus: null,
    restDay: false,
  },
};

export const gameVanillaStore = createStore<GameStore>()((set) => ({
  ...initialGameState,
  advanceWeek: () =>
    set((state) => {
      const wrapped = state.currentWeek >= GAME_BALANCE.weeksPerYear;
      const nextWeek = wrapped ? 1 : state.currentWeek + 1;
      const nextYear = wrapped ? state.currentYear + 1 : state.currentYear;
      const nextSeason = getSeasonForWeek(nextWeek);

      return {
        currentWeek: nextWeek,
        currentYear: nextYear,
        currentSeason: nextSeason,
        weeklyDecisions: generateWeeklyDecisionCards(nextWeek, nextSeason),
        notifications: wrapped
          ? [
              ...state.notifications,
              {
                id: `noti-year-${nextYear}`,
                type: "success",
                title: `Year ${nextYear} Started`,
                message: "A new annual cycle begins. Seasonal pressure resets.",
                week: nextWeek,
              },
            ]
          : state.notifications,
      };
    }),
  addNotification: (notification) =>
    set((state) => ({
      notifications: [
        ...state.notifications,
        {
          ...notification,
          id:
            notification.id ??
            `notification-${Date.now()}-${state.notifications.length}`,
        },
      ],
    })),
  clearNotifications: () =>
    set(() => ({
      notifications: [],
    })),
  setTrainingSchedule: (schedule) =>
    set((state) => ({
      trainingSchedule: {
        ...state.trainingSchedule,
        ...schedule,
      },
    })),
}));

export const useGameStore = <T>(selector: (state: GameStore) => T) =>
  useStore(gameVanillaStore, selector);
