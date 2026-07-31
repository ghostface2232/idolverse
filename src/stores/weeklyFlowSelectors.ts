import type {
  GameStore,
  GameStoreState,
  WeeklyDecision,
  WeeklyFlowSnapshot,
} from "@/types/game";

export function isWeeklyDecisionComplete(
  decision: WeeklyDecision,
  flow: WeeklyFlowSnapshot,
): boolean {
  const optionId = flow.selectedDecisionIds[decision.id];
  const option = decision.options.find((candidate) => candidate.id === optionId);
  if (!option) return false;
  if (!option.targetSelection) return true;

  const targets = flow.selectedTargetTraineeIds[decision.id] ?? [];
  const uniqueCount = new Set(targets).size;
  return (
    uniqueCount === targets.length &&
    uniqueCount >= option.targetSelection.min &&
    uniqueCount <= option.targetSelection.max
  );
}

/** Phase 2 GameShell이 store 구조를 직접 해석하지 않도록 고정한 selector 계약. */
export const weeklyFlowSelectors = {
  flow: (state: GameStoreState) => state.weeklyFlow,
  selectedDecisionIds: (state: GameStoreState) =>
    state.weeklyFlow.selectedDecisionIds,
  remainingDecisionCount: (state: GameStoreState) =>
    state.weeklyDecisions.filter(
      (decision) =>
        !(state.weeklyFlow.skippedDecisionIds ?? []).includes(decision.id) &&
        (!(state.weeklyFlow.confirmedDecisionIds ?? []).includes(decision.id) ||
          !isWeeklyDecisionComplete(decision, state.weeklyFlow)),
    ).length,
  canResolveWeek: (state: GameStoreState) =>
    state.weeklyFlow.state !== "resolving" &&
    state.weeklyFlow.state !== "report_ready" &&
    state.weeklyFlow.state !== "event_focus" &&
    state.weeklyDecisions.every(
      (decision) =>
        (state.weeklyFlow.skippedDecisionIds ?? []).includes(decision.id) ||
        ((state.weeklyFlow.confirmedDecisionIds ?? []).includes(decision.id) &&
          isWeeklyDecisionComplete(decision, state.weeklyFlow)),
    ),
  activeEventId: (state: GameStoreState) =>
    state.weeklyFlow.eventQueueIds[state.weeklyFlow.activeEventIndex] ?? null,
};

export interface WeeklyFlowCommands {
  selectDecision: GameStore["selectWeeklyDecision"];
  setDecisionTargets: GameStore["setWeeklyDecisionTargets"];
  confirmDecision: GameStore["confirmWeeklyDecision"];
  clearDecision: GameStore["clearWeeklyDecision"];
  skipDecision: GameStore["skipWeeklyDecision"];
  acknowledgeReport: GameStore["acknowledgeWeeklyReport"];
  advanceEvent: GameStore["advanceWeeklyEvent"];
}

export function selectWeeklyFlowCommands(state: GameStore): WeeklyFlowCommands {
  return {
    selectDecision: state.selectWeeklyDecision,
    setDecisionTargets: state.setWeeklyDecisionTargets,
    confirmDecision: state.confirmWeeklyDecision,
    clearDecision: state.clearWeeklyDecision,
    skipDecision: state.skipWeeklyDecision,
    acknowledgeReport: state.acknowledgeWeeklyReport,
    advanceEvent: state.advanceWeeklyEvent,
  };
}
