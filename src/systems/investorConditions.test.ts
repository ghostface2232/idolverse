import { describe, expect, it } from "vitest";
import { processWeek, type GameSnapshot, type PlayerDecisions } from "@/systems/weekProcessor";
import { applyEffects } from "@/systems/applyEffects";
import { INVESTOR_PENALTY_GRACE_WEEKS } from "@/data/balance";
import { INVESTOR_COMPANIES } from "@/data/investors";
import { makeGameSnapshot } from "@/test/gameStateFixture";

const NO_DECISIONS: PlayerDecisions = {
  trainingSchedule: { intensity: "normal", restDay: false },
  resolvedDecisions: [],
};

function countPenaltyWarnings(warnings: string[]): number {
  return warnings.filter((w) => w.includes("투자사 조치")).length;
}

describe("투자사 조건 체크 (P0-3)", () => {
  it("유예 기간 동안 경고만 하고, 종료 시 페널티를 1회만 집행한다", () => {
    const vc = INVESTOR_COMPANIES.find((c) => c.type === "vc")!;
    // VC 분기 조건 마감 13주. 수입 0 → 미달.
    let state: GameSnapshot = makeGameSnapshot({ week: 13, investorType: "vc" });
    let totalPenalties = 0;

    // 13주차(첫 미달) + 유예 기간에는 페널티가 없어야 한다
    for (let i = 0; i < INVESTOR_PENALTY_GRACE_WEEKS; i++) {
      const { newState, weekReport } = processWeek(state, NO_DECISIONS);
      totalPenalties += countPenaltyWarnings(weekReport.warnings);
      expect(newState.game.investorPenaltyActive).toBe(true);
      state = newState;
    }
    expect(totalPenalties).toBe(0);

    // 유예 종료 주에 패키지 전체가 1회 집행된다
    const { newState, weekReport } = processWeek(state, NO_DECISIONS);
    expect(countPenaltyWarnings(weekReport.warnings)).toBe(vc.penaltyEffects.length);
    expect(
      newState.game.investorConditionProgress["summit-quarterly"]?.penaltyApplied,
    ).toBe(true);
    state = newState;

    // 다음 주에는 재집행하지 않는다 (1회성)
    const next = processWeek(state, NO_DECISIONS);
    expect(countPenaltyWarnings(next.weekReport.warnings)).toBe(0);
    expect(next.newState.game.investorPenaltyActive).toBe(true);
  });

  it("여러 조건의 유예가 같은 주에 끝나도 페널티 패키지는 1회만 집행한다", () => {
    const it_ = INVESTOR_COMPANIES.find((c) => c.type === "it")!;
    // 넥스트비트: 팔로워/스트리밍 마감이 둘 다 26주 — 동시 미달·동시 유예 종료.
    let state: GameSnapshot = makeGameSnapshot({ week: 26, investorType: "it" });

    const first = processWeek(state, NO_DECISIONS);
    expect(
      first.weekReport.warnings.filter((w) => w.includes("투자사 조건 미달")),
    ).toHaveLength(2);
    state = first.newState;

    for (let i = 0; i < INVESTOR_PENALTY_GRACE_WEEKS - 1; i++) {
      state = processWeek(state, NO_DECISIONS).newState;
    }

    const exitWeek = processWeek(state, NO_DECISIONS);
    // 조건 2건이 함께 유예를 벗어나도 투자사 단위 패키지(현금 회수 포함)는 1회
    expect(countPenaltyWarnings(exitWeek.weekReport.warnings)).toBe(
      it_.penaltyEffects.length,
    );
    expect(
      exitWeek.newState.game.investorConditionProgress["nextbeat-followers"]
        ?.penaltyApplied,
    ).toBe(true);
    expect(
      exitWeek.newState.game.investorConditionProgress["nextbeat-streams"]
        ?.penaltyApplied,
    ).toBe(true);
  });

  it("조건이 회복되면 압박이 해제되고 진행 상태가 초기화된다", () => {
    let state: GameSnapshot = makeGameSnapshot({ week: 13, investorType: "vc" });
    state = processWeek(state, NO_DECISIONS).newState;
    expect(state.game.investorPenaltyActive).toBe(true);

    // 분기 수익 발생 → 조건 회복
    state.finance.incomeHistory = [
      { week: 13, breakdown: { streaming: 50000000 } },
    ];
    const { newState } = processWeek(state, NO_DECISIONS);

    expect(newState.game.investorPenaltyActive).toBe(false);
    expect(newState.game.investorConditionProgress["summit-quarterly"]).toBeUndefined();
    expect(
      newState.game.weeklyDecisions.some((c) => c.id === "emergency-investor"),
    ).toBe(false);
  });

  it("이벤트발 압박(investorPressureWeeks)은 조건 재계산에 지워지지 않고 지속 주 수만큼 유지된다", () => {
    // VC 마감(13주) 이전이라 조건 체크로는 압박이 걸릴 수 없는 시점
    const base = makeGameSnapshot({ week: 3, investorType: "vc" });
    let state: GameSnapshot = {
      ...base,
      game: { ...base.game, investorPressureWeeks: 2 },
    };

    // 1주차: 압박 유지 + 위기 카드 등장
    let result = processWeek(state, NO_DECISIONS);
    expect(result.newState.game.investorPenaltyActive).toBe(true);
    expect(
      result.newState.game.weeklyDecisions.some((c) => c.id === "emergency-investor"),
    ).toBe(true);
    expect(result.newState.game.investorPressureWeeks).toBe(1);

    // 2주차: 마지막 압박 주
    result = processWeek(result.newState, NO_DECISIONS);
    expect(result.newState.game.investorPenaltyActive).toBe(true);
    expect(result.newState.game.investorPressureWeeks).toBe(0);

    // 3주차: 압박 자연 만료 — 영구 고착되지 않는다
    result = processWeek(result.newState, NO_DECISIONS);
    expect(result.newState.game.investorPenaltyActive).toBe(false);
    expect(
      result.newState.game.weeklyDecisions.some((c) => c.id === "emergency-investor"),
    ).toBe(false);
  });

  it("investorPressure 효과 값은 압박 지속 주 수로 해석된다", () => {
    const base = makeGameSnapshot({ week: 3 });
    const targets = {
      money: 0,
      fandom: {
        public: 10,
        fandom: 5,
        fandomLoyalty: 50,
        fandomDisappointment: 0,
        global: 2,
        industry: 20,
      },
      trainees: base.trainee.trainees,
      album: null,
      investorPressureWeeks: 0,
    };

    expect(applyEffects(targets, { investorPressure: 2 }).investorPressureWeeks).toBe(2);
    // 더 짧은 압박이 기존 압박을 줄이지 못한다
    expect(
      applyEffects({ ...targets, investorPressureWeeks: 3 }, { investorPressure: 1 })
        .investorPressureWeeks,
    ).toBe(3);
    // 0 이하 값은 즉시 해제
    expect(
      applyEffects({ ...targets, investorPressureWeeks: 3 }, { investorPressure: 0 })
        .investorPressureWeeks,
    ).toBe(0);
  });

  it("투자사 재협상 선택은 기존 조건의 페널티 유예를 실제로 2주 연장한다", () => {
    const state = makeGameSnapshot({ week: 14, investorType: "vc" });
    state.game.investorConditionProgress = {
      "summit-quarterly": { firstFailedWeek: 13, penaltyApplied: false },
    };

    const result = processWeek(state, {
      trainingSchedule: { intensity: "normal", restDay: false },
      resolvedDecisions: [
        {
          cardId: "emergency-investor",
          optionId: "negotiate",
          effects: { money: -10000000, industry: -2, satisfaction: 2 },
        },
      ],
    });

    expect(
      result.newState.game.investorConditionProgress["summit-quarterly"]
        ?.firstFailedWeek,
    ).toBe(15);
  });
});
