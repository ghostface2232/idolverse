import { describe, expect, it } from "vitest";
import {
  buildDecisionCardContext,
  generateWeeklyDecisionCards,
  type DecisionCardContext,
} from "@/systems/generateWeeklyDecisionCards";
import { makeTrainee } from "@/test/gameStateFixture";

function healthyContext(
  overrides: Partial<DecisionCardContext> = {},
): DecisionCardContext {
  return {
    phase: "training",
    members: [
      {
        id: "t1",
        name: "멤버 1",
        injuryWeeks: 0,
        condition: 80,
        stress: 10,
        satisfaction: 70,
      },
      {
        id: "t2",
        name: "멤버 2",
        injuryWeeks: 0,
        condition: 80,
        stress: 10,
        satisfaction: 70,
      },
    ],
    conflicts: [],
    investorPressure: false,
    investorComplianceCount: 0,
    money: 1_000_000_000,
    weeklyFixedTotal: 1_000_000,
    fandom: 0,
    fandomLoyalty: 50,
    fandomDisappointment: 0,
    ...overrides,
  };
}

describe("상황 기반 주간 결정 생성", () => {
  it("컨텍스트가 없거나 건강한 정상 주에는 채우기 카드를 만들지 않는다", () => {
    expect(generateWeeklyDecisionCards(1, "spring")).toEqual([]);
    expect(generateWeeklyDecisionCards(1, "spring", healthyContext())).toEqual([]);
  });

  it("부상 멤버가 있을 때만 해당 멤버를 대상으로 한 카드를 만든다", () => {
    const context = healthyContext({
      members: [
        {
          id: "injured",
          name: "부상 멤버",
          injuryWeeks: 2,
          condition: 35,
          stress: 40,
          satisfaction: 60,
        },
        healthyContext().members[1],
      ],
    });

    const cards = generateWeeklyDecisionCards(4, "spring", context);

    expect(cards).toHaveLength(1);
    expect(cards[0]).toMatchObject({
      id: "injury:injured",
      trigger: {
        kind: "injury",
        entityIds: ["injured"],
      },
    });
    expect(
      cards[0].options.every(
        (option) => option.targetTraineeIds?.join() === "injured",
      ),
    ).toBe(true);
  });

  it("실제 상태 projection에서 불화·투자사·경영·팬덤 이슈를 판별한다", () => {
    const a = makeTrainee("a", {
      name: "A",
      chemistry: { b: -70 },
    });
    const b = makeTrainee("b", {
      name: "B",
      chemistry: { a: -70 },
    });
    const context = buildDecisionCardContext({
      phase: "growth",
      trainees: [a, b],
      investorPressure: true,
      investorComplianceCount: 1,
      money: 3_000_000,
      weeklyFixedTotal: 1_000_000,
      fandom: 50,
      fandomLoyalty: 20,
      fandomDisappointment: 65,
    });

    const cards = generateWeeklyDecisionCards(20, "summer", context);
    const triggerKinds = cards.map((card) => card.trigger?.kind);

    expect(cards).toHaveLength(4);
    expect(triggerKinds).toEqual(
      expect.arrayContaining(["investor", "finance", "conflict", "fandom"]),
    );
    expect(cards.every((card) => card.trigger)).toBe(true);
  });

  it("동시에 이슈가 많아도 중요도 순으로 최대 4건만 노출한다", () => {
    const context = healthyContext({
      members: [
        {
          id: "critical",
          name: "위기 멤버",
          injuryWeeks: 4,
          condition: 10,
          stress: 95,
          satisfaction: 5,
        },
        {
          id: "overworked",
          name: "과로 멤버",
          injuryWeeks: 0,
          condition: 40,
          stress: 90,
          satisfaction: 60,
        },
      ],
      conflicts: [
        {
          memberAId: "critical",
          memberAName: "위기 멤버",
          memberBId: "overworked",
          memberBName: "과로 멤버",
          chemistry: -90,
        },
      ],
      investorPressure: true,
      money: -10_000_000,
      weeklyFixedTotal: 1_000_000,
      fandom: 100,
      fandomLoyalty: 10,
      fandomDisappointment: 90,
    });

    const cards = generateWeeklyDecisionCards(30, "fall", context);

    expect(cards).toHaveLength(4);
    expect(cards.map((card) => card.trigger?.kind)).toEqual(
      expect.arrayContaining(["injury", "morale", "investor", "finance"]),
    );
  });
});
