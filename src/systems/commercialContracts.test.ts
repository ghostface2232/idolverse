import { describe, expect, it } from "vitest";
import { processWeek, type PlayerDecisions } from "@/systems/weekProcessor";
import { makeGameSnapshot } from "@/test/gameStateFixture";

describe("외부 활동 계약", () => {
  it("체결 주부터 활동 공백에도 매주 계약 수입을 정산한다", () => {
    const snapshot = makeGameSnapshot({ week: 20 });
    snapshot.game.currentPhase = "growth";
    snapshot.game.weeklyDecisions = [
      {
        id: "opportunity:ost-offer:w20",
        lane: "opportunity",
        category: "OST",
        title: "드라마 OST",
        summary: "테스트 제안",
        options: [
          {
            id: "record-ost",
            label: "OST를 녹음한다",
            description: "드라마 방영 중 매주 정산된다.",
            tradeoff: "녹음 일정이 생깁니다.",
            effects: { money: 15_000_000 },
            contractOffer: {
              kind: "ost",
              title: "드라마 OST 음원 계약",
              durationWeeks: 12,
              weeklyIncome: 1_800_000,
            },
          },
        ],
      },
    ];
    const decisions: PlayerDecisions = {
      trainingSchedule: { intensity: "normal", restDay: false },
      resolvedDecisions: [
        {
          cardId: "opportunity:ost-offer:w20",
          optionId: "record-ost",
          effects: { money: 15_000_000 },
        },
      ],
    };

    const signed = processWeek(snapshot, decisions);
    expect(signed.weekReport.finance.income.commercialContracts).toBe(1_800_000);
    expect(signed.newState.game.activeCommercialContracts).toEqual([
      expect.objectContaining({
        definitionId: "ost-offer",
        signedAtWeek: 20,
        endsAtWeek: 31,
        weeklyIncome: 1_800_000,
      }),
    ]);

    const inactiveWeek = processWeek(signed.newState, {
      trainingSchedule: { intensity: "normal", restDay: true },
      resolvedDecisions: [],
    });
    expect(inactiveWeek.weekReport.finance.income.commercialContracts).toBe(
      1_800_000,
    );
  });
});
