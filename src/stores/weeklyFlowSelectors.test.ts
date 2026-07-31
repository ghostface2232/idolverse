import { beforeEach, describe, expect, it } from "vitest";
import {
  gameVanillaStore,
  initialGameState,
  initialWeeklyFlowState,
} from "@/stores/gameStore";
import { weeklyFlowSelectors } from "@/stores/weeklyFlowSelectors";
import type { WeeklyDecision } from "@/types/game";

const requiredCard: WeeklyDecision = {
  id: "required",
  lane: "crisis",
  category: "test",
  title: "필수 안건",
  summary: "확인이 필요합니다.",
  options: [
    {
      id: "accept",
      label: "수락",
      description: "",
      tradeoff: "",
      effects: { satisfaction: 2 },
    },
  ],
};

const opportunityCard: WeeklyDecision = {
  ...requiredCard,
  id: "opportunity",
  lane: "opportunity",
  title: "선택 기회",
};

describe("weekly decision confirmation flow", () => {
  beforeEach(() => {
    gameVanillaStore.setState(
      {
        ...initialGameState,
        weeklyDecisions: [requiredCard, opportunityCard],
        weeklyFlow: {
          ...initialWeeklyFlowState,
          selectedDecisionIds: {},
          selectedTargetTraineeIds: {},
          confirmedDecisionIds: [],
          skippedDecisionIds: [],
        },
      },
      false,
    );
  });

  it("라디오 선택만으로는 완료 처리하지 않고 확인 후 완료한다", () => {
    gameVanillaStore.getState().selectWeeklyDecision("required", "accept");

    expect(
      weeklyFlowSelectors.remainingDecisionCount(gameVanillaStore.getState()),
    ).toBe(2);
    expect(weeklyFlowSelectors.canResolveWeek(gameVanillaStore.getState())).toBe(
      false,
    );

    gameVanillaStore.getState().confirmWeeklyDecision("required");

    expect(
      weeklyFlowSelectors.remainingDecisionCount(gameVanillaStore.getState()),
    ).toBe(1);
  });

  it("선택 기회 넘김을 주간 상태에 유지하고 진행 가능하게 한다", () => {
    gameVanillaStore.getState().selectWeeklyDecision("required", "accept");
    gameVanillaStore.getState().confirmWeeklyDecision("required");
    gameVanillaStore.getState().skipWeeklyDecision("opportunity");

    const state = gameVanillaStore.getState();
    expect(state.weeklyFlow.skippedDecisionIds).toContain("opportunity");
    expect(weeklyFlowSelectors.remainingDecisionCount(state)).toBe(0);
    expect(weeklyFlowSelectors.canResolveWeek(state)).toBe(true);
  });

  it("확정한 선택을 바꾸면 다시 확인을 요구한다", () => {
    gameVanillaStore.getState().selectWeeklyDecision("required", "accept");
    gameVanillaStore.getState().confirmWeeklyDecision("required");
    gameVanillaStore.getState().selectWeeklyDecision("required", "accept");

    const state = gameVanillaStore.getState();
    expect(state.weeklyFlow.confirmedDecisionIds).not.toContain("required");
    expect(weeklyFlowSelectors.canResolveWeek(state)).toBe(false);
  });
});
