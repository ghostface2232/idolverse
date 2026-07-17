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
    lastOpportunityWeek: null,
    competitorComebacks: [],
    projectDeadlineWeeks: null,
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

    const injuryCard = cards.find((card) => card.lane === "crisis");
    expect(injuryCard).toMatchObject({
      id: "injury:injured",
      trigger: {
        kind: "injury",
        entityIds: ["injured"],
      },
    });
    expect(
      injuryCard?.options.every(
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

  it("건강한 주에는 누적 주차 기준 2~3주 간격으로 선택 기회를 제시한다", () => {
    let lastOpportunityWeek: number | null = null;
    const offeredWeeks: number[] = [];

    for (let week = 1; week <= 14; week++) {
      const cards = generateWeeklyDecisionCards(
        week,
        "spring",
        healthyContext({ lastOpportunityWeek }),
      );
      const opportunity = cards.find((card) => card.lane === "opportunity");
      if (!opportunity) continue;
      offeredWeeks.push(week);
      lastOpportunityWeek = week;
      expect(opportunity.expiresAtWeek).toBe(week);
      expect(opportunity.trigger?.kind).toBe("opportunity");
    }

    expect(offeredWeeks.length).toBeGreaterThanOrEqual(4);
    expect(
      offeredWeeks.slice(1).every((week, index) => {
        const gap = week - offeredWeeks[index];
        return gap >= 2 && gap <= 3;
      }),
    ).toBe(true);
  });

  it("긴급 자금 조정은 연 2회와 동시 미상환 2건 한도를 지킨다", () => {
    const lowCash = healthyContext({
      money: -10_000_000,
      emergencyFinancing: [
        {
          id: "loan-w10",
          kind: "loan",
          principal: 80_000_000,
          repaymentAmount: 100_000_000,
          borrowedAtWeek: 10,
          dueWeek: 114,
          repaidAtWeek: null,
        },
        {
          id: "investment-w20",
          kind: "investment",
          principal: 120_000_000,
          repaymentAmount: 150_000_000,
          borrowedAtWeek: 20,
          dueWeek: 124,
          repaidAtWeek: 30,
        },
      ],
    });

    expect(
      generateWeeklyDecisionCards(35, "summer", lowCash).some(
        (card) => card.id === "financial-crisis",
      ),
    ).toBe(false);
    expect(
      generateWeeklyDecisionCards(53, "spring", lowCash).some(
        (card) => card.id === "financial-crisis",
      ),
    ).toBe(true);
  });

  it("데뷔 준비기와 성장기에 서로 다른 phase 기회 풀을 사용한다", () => {
    const trainingCard = generateWeeklyDecisionCards(
      20,
      "summer",
      healthyContext({ phase: "training", lastOpportunityWeek: 17 }),
    ).find((card) => card.lane === "opportunity");
    const growthCard = generateWeeklyDecisionCards(
      20,
      "summer",
      healthyContext({ phase: "growth", lastOpportunityWeek: 17 }),
    ).find((card) => card.lane === "opportunity");

    expect(trainingCard?.id).toMatch(/variety-offer|viral-cover/);
    expect(growthCard?.id).toMatch(
      /variety-offer|advertising-offer|collaboration-offer|viral-cover/,
    );
    expect(growthCard?.id).not.toBe(trainingCard?.id);
  });

  it("라이벌 컴백을 감지하면 성장기 대응 카드와 세 가지 전략을 우선한다", () => {
    const card = generateWeeklyDecisionCards(
      30,
      "fall",
      healthyContext({
        phase: "growth",
        lastOpportunityWeek: 27,
        competitorComebacks: ["NEON-X"],
      }),
    ).find((candidate) => candidate.lane === "opportunity");

    expect(card?.id).toContain("rival-comeback-overlap");
    expect(card?.title).toContain("NEON-X");
    expect(card?.options.map((option) => option.id)).toEqual([
      "face-head-on",
      "delay-schedule",
      "differentiate-concept",
    ]);
  });

  it("긴급 위기가 있으면 기회를 억제한다", () => {
    const critical = healthyContext({
      lastOpportunityWeek: 1,
      members: [
        {
          id: "injured",
          name: "부상 멤버",
          injuryWeeks: 3,
          condition: 20,
          stress: 30,
          satisfaction: 60,
        },
      ],
    });

    expect(
      generateWeeklyDecisionCards(10, "spring", critical).some(
        (card) => card.lane === "opportunity",
      ),
    ).toBe(false);
  });

  it("피로 누적과 프로젝트 마감 직전에는 거절 근거를 카드에 표시한다", () => {
    const card = generateWeeklyDecisionCards(
      12,
      "spring",
      healthyContext({
        lastOpportunityWeek: 9,
        projectDeadlineWeeks: 1,
        members: healthyContext().members.map((member) => ({
          ...member,
          stress: 60,
        })),
      }),
    ).find((candidate) => candidate.lane === "opportunity");

    expect(card?.summary).toContain("평균 스트레스 60");
    expect(card?.summary).toContain("마감 D-1");
  });

  it("성장 3년차부터 연 1회 서로 다른 장기 확장 경로를 제시한다", () => {
    const context = healthyContext({
      phase: "growth",
      releasedAlbumCount: 5,
      strategicExpansion: { production: 0, fandom: 0, global: 0 },
      lastStrategicExpansionWeek: null,
    });

    const card = generateWeeklyDecisionCards(105, "spring", context).find(
      (candidate) => candidate.id === "strategic-expansion",
    );

    expect(card?.options.map((option) => option.id)).toEqual([
      "strategic-production",
      "strategic-fandom",
      "strategic-global",
    ]);
    expect(
      generateWeeklyDecisionCards(156, "winter", {
        ...context,
        lastStrategicExpansionWeek: 105,
      }).some((candidate) => candidate.id === "strategic-expansion"),
    ).toBe(false);
    expect(
      generateWeeklyDecisionCards(157, "spring", {
        ...context,
        lastStrategicExpansionWeek: 105,
      }).some((candidate) => candidate.id === "strategic-expansion"),
    ).toBe(true);
  });
});
