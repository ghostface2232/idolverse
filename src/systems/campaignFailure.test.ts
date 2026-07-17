import { describe, expect, it } from "vitest";
import { CAMPAIGN_FAILURE } from "@/data/balance";
import { processWeek, type PlayerDecisions } from "@/systems/weekProcessor";
import { makeGameSnapshot } from "@/test/gameStateFixture";
import type { GameSnapshot } from "@/systems/weekProcessor";

const NO_DECISIONS: PlayerDecisions = {
  trainingSchedule: { intensity: "normal", restDay: false },
  resolvedDecisions: [],
};

/** 수입이 없고 고정비만 나가는 파산 직전 상태. */
function makeBrokeSnapshot(insolvencyWeeks: number): GameSnapshot {
  const snapshot = makeGameSnapshot({ week: 10 });
  snapshot.finance.money = -1_000_000;
  snapshot.game.insolvencyWeeks = insolvencyWeeks;
  return snapshot;
}

describe("실패 정의: 지속 파산 → 캠페인 종료", () => {
  it("자금이 마이너스면 파산 주차가 쌓이고 카운트다운 경고가 나온다", () => {
    const { newState, weekReport } = processWeek(makeBrokeSnapshot(0), NO_DECISIONS);
    expect(newState.game.insolvencyWeeks).toBe(1);
    expect(newState.game.campaignFailure).toBeNull();
    expect(
      weekReport.warnings.some((w) => w.includes("투자사가 정리 절차")),
    ).toBe(true);
  });

  it("자금이 회복되면 파산 주차가 0으로 돌아간다", () => {
    const snapshot = makeGameSnapshot({ week: 10 });
    snapshot.game.insolvencyWeeks = 5;
    // 픽스처 기본 자금은 넉넉하다 — 흑자 주.
    const { newState } = processWeek(snapshot, NO_DECISIONS);
    expect(newState.game.insolvencyWeeks).toBe(0);
    expect(newState.game.campaignFailure).toBeNull();
  });

  it("한도 주차에 도달하면 캠페인이 종료된다", () => {
    const snapshot = makeBrokeSnapshot(CAMPAIGN_FAILURE.insolvencyLimitWeeks - 1);
    const { newState, weekReport } = processWeek(snapshot, NO_DECISIONS);
    expect(newState.game.campaignFailure).toEqual({
      reason: "bankruptcy",
      year: snapshot.game.currentYear,
      week: snapshot.game.currentWeek,
    });
    expect(
      weekReport.warnings.some((w) => w.includes("자금 회수를 결정")),
    ).toBe(true);
  });
});
