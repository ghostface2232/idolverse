import { describe, expect, it } from "vitest";
import {
  CRISIS_CARD_COOLDOWN_WEEKS,
  DECISION_TRIGGER_THRESHOLDS,
} from "@/data/balance";
import { generateWeeklyDecisionCards } from "@/systems/generateWeeklyDecisionCards";
import { processWeek, type PlayerDecisions } from "@/systems/weekProcessor";
import { makeGameSnapshot } from "@/test/gameStateFixture";

const NO_DECISIONS: PlayerDecisions = {
  trainingSchedule: { intensity: "normal", restDay: false },
  resolvedDecisions: [],
};

// 쿨다운은 카드가 "제시된" 주가 아니라 "대응을 고른" 주에 시작한다. 정식
// 플로우에서는 위기 카드를 미해소로 넘길 수 없지만(weekRunner가 거부),
// 엔진을 직접 모는 호출자(시뮬레이션, 매니저 위임 진행)에서는 무응답이
// 위기를 침묵시키는 통로가 되면 안 된다.
describe("위기 카드 쿨다운은 대응 시점에 시작한다", () => {
  function overworkSnapshot() {
    const snapshot = makeGameSnapshot({ week: 5 });
    // highStress(70) 이상, 재계약 조기 트리거(85)와 critical(90) 미만으로
    // 유지되는 시작값 — 몇 주가 지나도 overwork 경고 조건만 계속 참이다.
    snapshot.trainee.trainees[0].stress = 80;
    return snapshot;
  }

  it("대응 없이 주가 넘어간 위기 카드는 다음 주 곧바로 다시 올라온다", () => {
    const first = processWeek(overworkSnapshot(), NO_DECISIONS);
    expect(
      first.newState.game.weeklyDecisions.some((card) =>
        card.id.startsWith("overwork:"),
      ),
    ).toBe(true);

    // 카드가 제시됐지만 해소하지 않았다 — 스탬프도, 침묵도 없어야 한다.
    const second = processWeek(first.newState, NO_DECISIONS);
    expect(second.newState.game.crisisCardCooldowns).toEqual({});
    expect(
      second.newState.game.weeklyDecisions.some((card) =>
        card.id.startsWith("overwork:"),
      ),
    ).toBe(true);
  });

  it("대응을 고르면 그 주에 스탬프가 찍히고 지표가 임계 위여도 쿨다운 동안 침묵한다", () => {
    const first = processWeek(overworkSnapshot(), NO_DECISIONS);
    const card = first.newState.game.weeklyDecisions.find((candidate) =>
      candidate.id.startsWith("overwork:"),
    );
    expect(card).toBeDefined();
    // "강행" 대응 — 스트레스를 낮추지 않는 선택이라, 다음 주 카드 부재가
    // 조건 해소 때문이 아니라 쿨다운 때문임을 격리할 수 있다.
    const option = card!.options.find(
      (candidate) => candidate.id === "push-through",
    );
    expect(option).toBeDefined();

    const resolved = processWeek(first.newState, {
      trainingSchedule: { intensity: "normal", restDay: false },
      resolvedDecisions: [
        {
          cardId: card!.id,
          optionId: option!.id,
          effects: option!.effects,
          targetTraineeIds: option!.targetTraineeIds,
          activityOverride: option!.activityOverride,
        },
      ],
    });

    // 스탬프는 대응한 주(6주차)에 찍힌다.
    expect(resolved.newState.game.crisisCardCooldowns).toEqual({ overwork: 6 });
    // 스트레스는 여전히 임계 위 — 다음 주 카드 부재는 조건 해소가 아니라
    // 쿨다운의 효과다.
    const member = resolved.newState.trainee.trainees.find(
      (trainee) => trainee.id === "t1",
    );
    expect(member!.stress).toBeGreaterThanOrEqual(
      DECISION_TRIGGER_THRESHOLDS.highStress,
    );
    expect(
      resolved.newState.game.weeklyDecisions.some((candidate) =>
        candidate.id.startsWith("overwork:"),
      ),
    ).toBe(false);
  });

  it("critical로 악화된 위기는 절반 주기로 앞당겨 재소환된다", () => {
    const baseCooldown = CRISIS_CARD_COOLDOWN_WEEKS.overwork;
    const halfCooldown = Math.ceil(baseCooldown / 2);
    const member = (stress: number) => ({
      id: "t1",
      name: "멤버 1",
      injuryWeeks: 0,
      condition: 60,
      stress,
      satisfaction: 60,
    });
    const context = (stress: number, lastShownWeek: number) => ({
      phase: "growth" as const,
      members: [member(stress)],
      conflicts: [],
      investorPressure: false,
      investorComplianceCount: 0,
      money: 1_000_000_000,
      weeklyFixedTotal: 1_000_000,
      fandom: 0,
      fandomLoyalty: 50,
      fandomDisappointment: 0,
      lastOpportunityWeek: null,
      competitorComebacks: [],
      projectDeadlineWeeks: null,
      crisisCardCooldowns: { overwork: lastShownWeek },
    });

    const hasOverwork = (stress: number, week: number) =>
      generateWeeklyDecisionCards(week, "spring", context(stress, 10)).some(
        (card) => card.id.startsWith("overwork:"),
      );

    // warning(90 미만)은 기본 주기, critical(90 이상)은 절반 주기.
    expect(hasOverwork(80, 10 + halfCooldown)).toBe(false);
    expect(hasOverwork(80, 10 + baseCooldown)).toBe(true);
    expect(hasOverwork(95, 10 + halfCooldown)).toBe(true);
  });
});
