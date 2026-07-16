import { useStore } from "zustand";
import { createStore } from "zustand/vanilla";
import { GAME_BALANCE, getSeasonForWeek } from "@/data/balance";
import { INVESTOR_CONDITIONS } from "@/data/investors";
import { DEBUT_PROJECT } from "@/data/debutProject";
import { createProjectInstance } from "@/systems/projectSystem";
import type { GameStore, GameStoreState } from "@/types/game";

export const initialWeeklyFlowState: GameStoreState["weeklyFlow"] = {
  state: "planning_ready",
  selectedDecisionIds: {},
  eventQueueIds: [],
  activeEventIndex: 0,
  resolutionId: null,
  report: null,
};

export const initialGameState: GameStoreState = {
  saveRevision: 0,
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
  lastOpportunityWeek: null,
  awardHistory: [],
  milestonesAchieved: [],
  activeProjects: [createProjectInstance(DEBUT_PROJECT, 1)],
  weeklyDecisions: [],
  notifications: [
    {
      id: "noti-welcome",
      type: "info",
      title: "Studio Opened",
      message: "Founding week is live. Decisions will appear when an issue needs you.",
      week: 1,
    },
  ],
  trainingSchedule: {
    intensity: "normal",
    focus: null,
    restDay: false,
  },
  weeklyFlow: initialWeeklyFlowState,
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
        weeklyDecisions: [],
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
  selectWeeklyDecision: (cardId, optionId) =>
    set((state) => {
      if (
        state.weeklyFlow.state === "resolving" ||
        state.weeklyFlow.state === "report_ready" ||
        state.weeklyFlow.state === "event_focus"
      ) {
        return state;
      }

      const card = state.weeklyDecisions.find((candidate) => candidate.id === cardId);
      if (!card?.options.some((option) => option.id === optionId)) {
        return state;
      }

      const selectedDecisionIds = {
        ...state.weeklyFlow.selectedDecisionIds,
        [cardId]: optionId,
      };
      const complete =
        state.weeklyDecisions.length > 0 &&
        state.weeklyDecisions.every((decision) => selectedDecisionIds[decision.id]);

      return {
        weeklyFlow: {
          ...state.weeklyFlow,
          state: complete ? "review_ready" : "planning_active",
          selectedDecisionIds,
          eventQueueIds: [],
          activeEventIndex: 0,
          report: null,
        },
      };
    }),
  clearWeeklyDecision: (cardId) =>
    set((state) => {
      if (
        state.weeklyFlow.state === "resolving" ||
        state.weeklyFlow.state === "report_ready" ||
        state.weeklyFlow.state === "event_focus" ||
        !state.weeklyFlow.selectedDecisionIds[cardId]
      ) {
        return state;
      }

      const selectedDecisionIds = {
        ...state.weeklyFlow.selectedDecisionIds,
      };
      delete selectedDecisionIds[cardId];

      return {
        weeklyFlow: {
          ...state.weeklyFlow,
          state: "planning_active",
          selectedDecisionIds,
        },
      };
    }),
  acknowledgeWeeklyReport: () =>
    set((state) => {
      if (state.weeklyFlow.state !== "report_ready") return state;

      const hasEvents = state.weeklyFlow.eventQueueIds.length > 0;
      return {
        weeklyFlow: {
          ...state.weeklyFlow,
          state: hasEvents ? "event_focus" : "planning_ready",
          selectedDecisionIds: {},
          activeEventIndex: 0,
        },
      };
    }),
  advanceWeeklyEvent: () =>
    set((state) => {
      if (state.weeklyFlow.state !== "event_focus") return state;

      const nextIndex = state.weeklyFlow.activeEventIndex + 1;
      const complete = nextIndex >= state.weeklyFlow.eventQueueIds.length;
      return {
        weeklyFlow: {
          ...state.weeklyFlow,
          state: complete ? "planning_ready" : "event_focus",
          selectedDecisionIds: {},
          eventQueueIds: complete ? [] : state.weeklyFlow.eventQueueIds,
          activeEventIndex: complete ? 0 : nextIndex,
        },
      };
    }),
}));

export const useGameStore = <T>(selector: (state: GameStore) => T) =>
  useStore(gameVanillaStore, selector);
