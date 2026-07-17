import { describe, expect, it } from "vitest";
import { processWeek, type GameSnapshot, type PlayerDecisions } from "@/systems/weekProcessor";
import { applyEffects } from "@/systems/applyEffects";
import { applyInvestorPenalty } from "@/systems/economySystem";
import {
  INVESTOR_INTERVENTION,
  INVESTOR_PENALTY_GRACE_WEEKS,
} from "@/data/balance";
import { INVESTOR_COMPANIES } from "@/data/investors";
import { makeGameSnapshot } from "@/test/gameStateFixture";
import type { Album } from "@/types/game";

const NO_DECISIONS: PlayerDecisions = {
  trainingSchedule: { intensity: "normal", restDay: false },
  resolvedDecisions: [],
};

function countPenaltyWarnings(warnings: string[]): number {
  return warnings.filter((w) => w.includes("투자사 조치")).length;
}

function makeReleasedAlbum(concept: Album["concept"]): Album {
  return {
    id: "album-investor-test",
    title: "Investor Test",
    concept,
    titleTrackCandidates: [],
    titleTrack: null,
    progress: { song: 100, visual: 100, choreography: 100, marketing: 100 },
    memberConceptFit: 60,
    seasonFit: 60,
    fandomExpectationFit: 60,
    externalCollaborators: {},
    quality: 60,
    releaseWeek: 38,
  };
}

describe("투자사 조건 체크 (P0-3)", () => {
  it("게임 시작 후 36주 전에는 투자사 개입을 시작하지 않는다", () => {
    const state = makeGameSnapshot({ week: 35, investorType: "vc" });
    const result = processWeek(state, NO_DECISIONS);

    expect(result.newState.game.investorPenaltyActive).toBe(false);
    expect(result.newState.game.investorConditionProgress).toEqual({});
    expect(
      result.newState.game.weeklyDecisions.some(
        (card) => card.id === "emergency-investor",
      ),
    ).toBe(false);
    expect(
      result.weekReport.warnings.some((warning) =>
        warning.includes("투자사 조건 미달"),
      ),
    ).toBe(false);
  });

  it("36주가 지나면 첫 앨범 발매 여부와 무관하게 계약 평가를 시작한다", () => {
    const state = makeGameSnapshot({ week: 36, investorType: "vc" });
    const result = processWeek(state, NO_DECISIONS);

    expect(result.newState.game.investorPenaltyActive).toBe(true);
    expect(
      result.newState.game.investorConditionProgress["summit-quarterly"],
    ).toEqual({ firstFailedWeek: 36, penaltyApplied: false });
    expect(
      result.newState.game.weeklyDecisions.some(
        (card) => card.id === "emergency-investor",
      ),
    ).toBe(true);
  });

  it("직전 개입 후 36주가 지나기 전에는 새 조건 실패 국면을 열지 않는다", () => {
    const coolingDown = makeGameSnapshot({
      week: 52,
      year: 2,
      investorType: "vc",
    });
    coolingDown.game.lastInvestorDemandWeek = 80;
    coolingDown.game.investorConditionProgress = {
      "summit-quarterly": {
        firstFailedWeek: 36,
        penaltyApplied: false,
        completedAtWeek: 40,
      },
    };

    const deferred = processWeek(coolingDown, NO_DECISIONS);
    expect(
      deferred.newState.game.investorConditionProgress["summit-payback"],
    ).toBeUndefined();
    expect(deferred.newState.game.investorPenaltyActive).toBe(false);

    const reviewDue = makeGameSnapshot({
      week: 11,
      year: 3,
      investorType: "vc",
    });
    reviewDue.game.lastInvestorDemandWeek = 80;
    reviewDue.game.investorConditionProgress = {
      "summit-quarterly": {
        firstFailedWeek: 36,
        penaltyApplied: false,
        completedAtWeek: 40,
      },
    };

    const opened = processWeek(reviewDue, NO_DECISIONS);
    expect(
      opened.newState.game.investorConditionProgress["summit-payback"],
    ).toEqual({ firstFailedWeek: 115, penaltyApplied: false });
    expect(
      opened.newState.game.weeklyDecisions.some(
        (card) => card.id === "emergency-investor",
      ),
    ).toBe(true);
  });

  it("유예 기간 동안 경고만 하고, 종료 시 페널티를 1회만 집행한다", () => {
    const vc = INVESTOR_COMPANIES.find((c) => c.type === "vc")!;
    // VC의 첫 투자 검토는 최소 운영 기간 뒤인 36주다.
    let state: GameSnapshot = makeGameSnapshot({ week: 36, investorType: "vc" });
    let totalPenalties = 0;
    let interventionCards = 0;
    let conditionNotices = 0;

    // 13주차(첫 미달) + 유예 기간에는 페널티가 없어야 한다
    for (let i = 0; i < INVESTOR_PENALTY_GRACE_WEEKS; i++) {
      const { newState, weekReport } = processWeek(state, NO_DECISIONS);
      totalPenalties += countPenaltyWarnings(weekReport.warnings);
      interventionCards += newState.game.weeklyDecisions.filter(
        (card) => card.id === "emergency-investor",
      ).length;
      conditionNotices += weekReport.warnings.filter(
        (warning) =>
          warning.includes("투자사 조건 미달") ||
          warning.includes("투자사 최종 통보"),
      ).length;
      expect(newState.game.investorPenaltyActive).toBe(true);
      state = newState;
    }
    expect(totalPenalties).toBe(0);
    expect(interventionCards).toBe(1);
    expect(conditionNotices).toBe(2);

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
    expect(next.newState.game.investorPenaltyActive).toBe(false);
  });

  it("여러 조건의 유예가 같은 주에 끝나도 페널티 패키지는 1회만 집행한다", () => {
    const it_ = INVESTOR_COMPANIES.find((c) => c.type === "it")!;
    // 넥스트비트: 팔로워/스트리밍 마감이 둘 다 26주 — 동시 미달·동시 유예 종료.
    let state: GameSnapshot = makeGameSnapshot({ week: 36, investorType: "it" });

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

  it("조건이 회복되면 압박이 해제되고 달성 상태가 고정된다", () => {
    let state: GameSnapshot = makeGameSnapshot({ week: 36, investorType: "vc" });
    state = processWeek(state, NO_DECISIONS).newState;
    expect(state.game.investorPenaltyActive).toBe(true);

    // 분기 수익 발생 → 조건 회복
    state.finance.incomeHistory = [
      { week: 36, breakdown: { streaming: 50000000 } },
    ];
    const { newState } = processWeek(state, NO_DECISIONS);

    expect(newState.game.investorPenaltyActive).toBe(false);
    expect(
      newState.game.investorConditionProgress["summit-quarterly"]?.completedAtWeek,
    ).toBe(37);
    expect(
      newState.game.weeklyDecisions.some((c) => c.id === "emergency-investor"),
    ).toBe(false);
  });

  it("광고 계약은 프로모션 수입이 아니라 실제 광고 제안 수락만 집계한다", () => {
    const promotionOnly = makeGameSnapshot({ week: 52, investorType: "cosmetic" });
    promotionOnly.finance.incomeHistory = [
      { week: 51, breakdown: { promotions: 100_000_000 } },
    ];
    const promotionResult = processWeek(promotionOnly, NO_DECISIONS);
    expect(
      promotionResult.newState.game.investorConditionProgress["lumiere-model"]
        ?.completedAtWeek,
    ).toBeUndefined();

    const accepted = makeGameSnapshot({ week: 52, investorType: "cosmetic" });
    const acceptedResult = processWeek(accepted, {
      trainingSchedule: { intensity: "normal", restDay: false },
      resolvedDecisions: [
        {
          cardId: "opportunity:advertising-offer:w52",
          optionId: "sign-campaign",
          effects: { money: 30_000_000 },
        },
      ],
    });
    expect(
      acceptedResult.newState.game.investorConditionProgress["lumiere-model"]
        ?.completedAtWeek,
    ).toBe(52);
  });

  it("앞선 주에 체결한 광고 계약도 마감 주까지 누적 집계한다", () => {
    const state = makeGameSnapshot({ week: 52, investorType: "cosmetic" });
    state.game.adContractsSigned = 1;

    const result = processWeek(state, NO_DECISIONS);
    expect(
      result.newState.game.investorConditionProgress["lumiere-model"]
        ?.completedAtWeek,
    ).toBe(52);
  });

  it("패션 트렌드 목표는 업계 평판이 아니라 앨범 콘셉트와 시장의 적합도로 판정한다", () => {
    const cold = makeGameSnapshot({ week: 39, investorType: "fashion" });
    cold.fandom.industry = 100;
    cold.album.releasedAlbums = [
      makeReleasedAlbum({
        genre: cold.calendar.marketTrend.coldGenre,
        mood: cold.calendar.marketTrend.coldMood,
      }),
    ];
    const coldResult = processWeek(cold, NO_DECISIONS);
    expect(
      coldResult.newState.game.investorConditionProgress["maison-trend"]
        ?.completedAtWeek,
    ).toBeUndefined();

    const hot = makeGameSnapshot({ week: 39, investorType: "fashion" });
    hot.fandom.industry = 0;
    hot.album.releasedAlbums = [
      makeReleasedAlbum({
        genre: hot.calendar.marketTrend.hotGenre,
        mood: hot.calendar.marketTrend.hotMood,
      }),
    ];
    const hotResult = processWeek(hot, NO_DECISIONS);
    expect(
      hotResult.newState.game.investorConditionProgress["maison-trend"]
        ?.completedAtWeek,
    ).toBe(39);
  });

  it("마감 주의 결산을 분기 흑자와 투자금 회수에 즉시 포함한다", () => {
    const quarterly = makeGameSnapshot({ week: 36, investorType: "vc" });
    const quarterlyResult = processWeek(quarterly, {
      trainingSchedule: { intensity: "normal", restDay: false },
      resolvedDecisions: [
        {
          cardId: "weekly-focus",
          optionId: "current-week-profit",
          effects: { money: 20_000_000 },
        },
      ],
    });
    expect(
      quarterlyResult.newState.game.investorConditionProgress["summit-quarterly"]
        ?.completedAtWeek,
    ).toBe(36);

    const payback = makeGameSnapshot({ week: 52, year: 2, investorType: "vc" });
    const paybackResult = processWeek(payback, {
      trainingSchedule: { intensity: "normal", restDay: false },
      resolvedDecisions: [
        {
          cardId: "weekly-focus",
          optionId: "current-week-payback",
          effects: { money: 1_600_000_000 },
        },
      ],
    });
    expect(
      paybackResult.newState.game.investorConditionProgress["summit-payback"]
        ?.completedAtWeek,
    ).toBe(104);
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
    expect(
      result.newState.game.weeklyDecisions.some(
        (card) => card.id === "emergency-investor",
      ),
    ).toBe(false);

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

  it("투자사 재협상 선택은 기존 조건의 페널티 유예를 실제로 3주 연장한다", () => {
    const state = makeGameSnapshot({ week: 37, investorType: "vc" });
    state.game.investorConditionProgress = {
      "summit-quarterly": { firstFailedWeek: 36, penaltyApplied: false },
    };

    const result = processWeek(state, {
      trainingSchedule: { intensity: "normal", restDay: false },
      resolvedDecisions: [
        {
          cardId: "emergency-investor",
          optionId: "negotiate",
          effects: { money: -20_000_000, industry: -4, satisfaction: 2 },
        },
      ],
    });

    expect(
      result.newState.game.investorConditionProgress["summit-quarterly"]
        ?.firstFailedWeek,
    ).toBe(39);
  });

  it("금액 중심 투자사의 계약 조치는 초기 투자금의 의미 있는 비율을 회수한다", () => {
    const vc = INVESTOR_COMPANIES.find((company) => company.type === "vc")!;
    const penalties = applyInvestorPenalty(vc);
    const recalled = penalties.reduce(
      (total, penalty) => total + (penalty.effects.money ?? 0),
      0,
    );

    expect(recalled).toBe(
      -Math.round(
        vc.fundAmount *
          (INVESTOR_INTERVENTION.penalty.cashRecallShare +
            INVESTOR_INTERVENTION.penalty.equityPressureShare),
      ),
    );
    expect(Math.abs(recalled)).toBeGreaterThanOrEqual(vc.fundAmount * 0.3);
  });
});
