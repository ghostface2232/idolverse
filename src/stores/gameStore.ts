import { useStore } from "zustand";
import { createStore } from "zustand/vanilla";
import { GAME_BALANCE, getSeasonForWeek } from "@/data/balance";
import { INVESTOR_CONDITIONS } from "@/data/investors";
import { DEBUT_PROJECT } from "@/data/debutProject";
import { createProjectInstance } from "@/systems/projectSystem";
import { isWeeklyDecisionComplete } from "@/stores/weeklyFlowSelectors";
import type { GameStore, GameStoreState } from "@/types/game";

export const initialWeeklyFlowState: GameStoreState["weeklyFlow"] = {
  state: "planning_ready",
  selectedDecisionIds: {},
  selectedTargetTraineeIds: {},
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
      const option = card?.options.find((candidate) => candidate.id === optionId);
      if (!card || !option) {
        return state;
      }

      const selectedDecisionIds = {
        ...state.weeklyFlow.selectedDecisionIds,
        [cardId]: optionId,
      };
      const selectedTargetTraineeIds = {
        ...state.weeklyFlow.selectedTargetTraineeIds,
      };
      if (state.weeklyFlow.selectedDecisionIds[cardId] !== optionId) {
        delete selectedTargetTraineeIds[cardId];
      }
      const nextFlow = {
        ...state.weeklyFlow,
        selectedDecisionIds,
        selectedTargetTraineeIds,
      };
      const complete =
        state.weeklyDecisions.length > 0 &&
        state.weeklyDecisions.every((decision) =>
          isWeeklyDecisionComplete(decision, nextFlow),
        );

      return {
        weeklyFlow: {
          ...nextFlow,
          state: complete ? "review_ready" : "planning_active",
          eventQueueIds: [],
          activeEventIndex: 0,
          report: null,
        },
      };
    }),
  setWeeklyDecisionTargets: (cardId, traineeIds) =>
    set((state) => {
      if (
        state.weeklyFlow.state === "resolving" ||
        state.weeklyFlow.state === "report_ready" ||
        state.weeklyFlow.state === "event_focus"
      ) {
        return state;
      }

      const card = state.weeklyDecisions.find((candidate) => candidate.id === cardId);
      const optionId = state.weeklyFlow.selectedDecisionIds[cardId];
      const option = card?.options.find((candidate) => candidate.id === optionId);
      if (!card || !option?.targetSelection) return state;

      const targets = [...new Set(traineeIds)].slice(0, option.targetSelection.max);
      const selectedTargetTraineeIds = {
        ...state.weeklyFlow.selectedTargetTraineeIds,
        [cardId]: targets,
      };

      return {
        weeklyFlow: {
          ...state.weeklyFlow,
          state: "planning_active",
          selectedTargetTraineeIds,
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
      const selectedTargetTraineeIds = {
        ...state.weeklyFlow.selectedTargetTraineeIds,
      };
      delete selectedDecisionIds[cardId];
      delete selectedTargetTraineeIds[cardId];

      return {
        weeklyFlow: {
          ...state.weeklyFlow,
          state: "planning_active",
          selectedDecisionIds,
          selectedTargetTraineeIds,
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
          selectedTargetTraineeIds: {},
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
          selectedTargetTraineeIds: {},
          eventQueueIds: complete ? [] : state.weeklyFlow.eventQueueIds,
          activeEventIndex: complete ? 0 : nextIndex,
        },
      };
    }),
}));

export const useGameStore = <T>(selector: (state: GameStore) => T) =>
  useStore(gameVanillaStore, selector);
