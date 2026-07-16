import type { GameStore, GameStoreState } from "@/types/game";

/** Phase 2 GameShell이 store 구조를 직접 해석하지 않도록 고정한 selector 계약. */
export const weeklyFlowSelectors = {
  flow: (state: GameStoreState) => state.weeklyFlow,
  selectedDecisionIds: (state: GameStoreState) =>
    state.weeklyFlow.selectedDecisionIds,
  remainingDecisionCount: (state: GameStoreState) =>
    state.weeklyDecisions.filter(
      (decision) => !state.weeklyFlow.selectedDecisionIds[decision.id],
    ).length,
  canResolveWeek: (state: GameStoreState) =>
    state.weeklyFlow.state !== "resolving" &&
    state.weeklyFlow.state !== "report_ready" &&
    state.weeklyFlow.state !== "event_focus" &&
    state.weeklyDecisions
      .filter((decision) => decision.lane === "crisis")
      .every((decision) => state.weeklyFlow.selectedDecisionIds[decision.id]),
  activeEventId: (state: GameStoreState) =>
    state.weeklyFlow.eventQueueIds[state.weeklyFlow.activeEventIndex] ?? null,
};

export interface WeeklyFlowCommands {
  selectDecision: GameStore["selectWeeklyDecision"];
  acknowledgeReport: GameStore["acknowledgeWeeklyReport"];
  advanceEvent: GameStore["advanceWeeklyEvent"];
}

export function selectWeeklyFlowCommands(state: GameStore): WeeklyFlowCommands {
  return {
    selectDecision: state.selectWeeklyDecision,
    acknowledgeReport: state.acknowledgeWeeklyReport,
    advanceEvent: state.advanceWeeklyEvent,
  };
}
