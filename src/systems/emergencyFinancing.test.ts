import { describe, expect, it } from "vitest";
import { EMERGENCY_FINANCING } from "@/data/balance";
import { makeGameSnapshot } from "@/test/gameStateFixture";
import { processWeek, type PlayerDecisions } from "@/systems/weekProcessor";

const NO_DECISIONS: PlayerDecisions = {
  trainingSchedule: { intensity: "normal", restDay: false },
  resolvedDecisions: [],
};

describe("긴급 조달과 상환", () => {
  it("긴급 대출을 받으면 104주 만기 채무와 현금 원장 수입을 기록한다", () => {
    const snapshot = makeGameSnapshot({ week: 20 });
    const result = processWeek(snapshot, {
      ...NO_DECISIONS,
      resolvedDecisions: [
        {
          cardId: "financial-crisis",
          optionId: "emergency-loan",
          effects: {
            money: EMERGENCY_FINANCING.loan.principal,
            investorPressure: 4,
            industry: -2,
          },
        },
      ],
    });

    expect(result.newState.game.emergencyFinancing).toEqual([
      expect.objectContaining({
        kind: "loan",
        principal: EMERGENCY_FINANCING.loan.principal,
        repaymentAmount: EMERGENCY_FINANCING.loan.repayment,
        borrowedAtWeek: 20,
        dueWeek: 124,
        repaidAtWeek: null,
      }),
    ]);
    expect(result.weekReport.finance.income.emergencyFinancing).toBe(
      EMERGENCY_FINANCING.loan.principal,
    );
  });

  it("만기까지 갚지 않으면 자동 상환하고 미상환 슬롯을 회복한다", () => {
    const snapshot = makeGameSnapshot({ year: 3, week: 1 });
    snapshot.finance.money = 300_000_000;
    snapshot.game.emergencyFinancing = [
      {
        id: "loan-w1",
        kind: "loan",
        principal: EMERGENCY_FINANCING.loan.principal,
        repaymentAmount: EMERGENCY_FINANCING.loan.repayment,
        borrowedAtWeek: 1,
        dueWeek: 105,
        repaidAtWeek: null,
      },
    ];

    const result = processWeek(snapshot, NO_DECISIONS);

    expect(result.newState.game.emergencyFinancing[0].repaidAtWeek).toBe(105);
    expect(result.weekReport.finance.expenses.financingRepayment).toBe(
      EMERGENCY_FINANCING.loan.repayment,
    );
    expect(
      result.weekReport.warnings.some((warning) => warning.includes("만기 상환")),
    ).toBe(true);
  });
});
