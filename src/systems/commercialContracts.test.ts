import { describe, expect, it } from "vitest";
import { processWeek, type PlayerDecisions } from "@/systems/weekProcessor";
import { makeGameSnapshot } from "@/test/gameStateFixture";
import { COMMERCIAL_CONTRACTS, GAME_BALANCE } from "@/data/balance";
import type { ActiveCommercialContract, CommercialContractOffer } from "@/types/game";

const OST_OFFER: CommercialContractOffer = {
  kind: "ost",
  title: "드라마 OST 음원 계약",
  durationWeeks: 12,
  weeklyIncome: 1_800_000,
  scheduleSlots: 1,
  weeklyStress: 2,
};

function activeContract(
  id: string,
  overrides: Partial<ActiveCommercialContract> = {},
): ActiveCommercialContract {
  return {
    ...OST_OFFER,
    id,
    definitionId: id,
    signedAtWeek: 1,
    endsAtWeek: 52,
    targetTraineeIds: [],
    ...overrides,
  };
}

function contractDecisionCard(
  week: number,
  definitionId: string,
  offer: CommercialContractOffer,
) {
  return {
    id: `opportunity:${definitionId}:w${week}`,
    lane: "opportunity" as const,
    category: "외부 계약",
    title: offer.title,
    summary: "테스트 제안",
    options: [{
      id: "sign",
      label: "계약한다",
      description: "외부 일정을 맡습니다.",
      tradeoff: "일정과 체력을 씁니다.",
      effects: {},
      contractOffer: offer,
    }],
  };
}

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
            contractOffer: OST_OFFER,
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

    // 휴식일 없는 주로 계약 피로를 확인한다 — 휴식일은 이제 실제 회복
    // 수단(-5/주)이라 계약 스트레스(+2)를 상쇄해 비교가 성립하지 않는다.
    const inactiveWeek = processWeek(signed.newState, {
      trainingSchedule: { intensity: "normal", restDay: false },
      resolvedDecisions: [],
    });
    expect(inactiveWeek.weekReport.finance.income.commercialContracts).toBe(
      1_800_000,
    );
    expect(inactiveWeek.newState.trainee.trainees[0].stress).toBeGreaterThan(
      signed.newState.trainee.trainees[0].stress,
    );
  });

  it("만료 주까지 정산하고 다음 주 슬롯과 계약 목록을 비운다", () => {
    const snapshot = makeGameSnapshot({ week: 4 });
    snapshot.game.activeCommercialContracts = [
      activeContract("ending", { signedAtWeek: 3, endsAtWeek: 4 }),
    ];

    const result = processWeek(snapshot, {
      trainingSchedule: { intensity: "normal", restDay: false },
      resolvedDecisions: [],
    });

    expect(result.weekReport.finance.income.commercialContracts).toBe(1_800_000);
    expect(result.weekReport.warnings).toContain("드라마 OST 음원 계약이 종료됐습니다");
    expect(result.newState.game.activeCommercialContracts).toEqual([]);
  });

  it("일정 한도 안에서는 서로 다른 계약을 중첩한다", () => {
    const snapshot = makeGameSnapshot({ week: 20 });
    snapshot.game.currentPhase = "growth";
    snapshot.game.activeCommercialContracts = [activeContract("existing")];
    snapshot.game.weeklyDecisions = [contractDecisionCard(20, "acting", {
      ...OST_OFFER,
      kind: "acting",
      title: "드라마 출연",
      weeklyIncome: 3_000_000,
    })];

    const result = processWeek(snapshot, {
      trainingSchedule: { intensity: "normal", restDay: false },
      resolvedDecisions: [{ cardId: "opportunity:acting:w20", optionId: "sign", effects: {} }],
    });

    expect(result.newState.game.activeCommercialContracts).toHaveLength(2);
    expect(result.weekReport.finance.income.commercialContracts).toBe(4_800_000);
  });

  it("최대 일정 슬롯을 넘는 계약은 효과와 수입까지 거절한다", () => {
    const snapshot = makeGameSnapshot({ week: 20 });
    snapshot.game.currentPhase = "growth";
    snapshot.game.activeCommercialContracts = [
      activeContract("full", { scheduleSlots: COMMERCIAL_CONTRACTS.maxScheduleSlots }),
    ];
    snapshot.game.weeklyDecisions = [contractDecisionCard(20, "extra", OST_OFFER)];
    const beforeMoney = snapshot.finance.money;

    const result = processWeek(snapshot, {
      trainingSchedule: { intensity: "normal", restDay: false },
      resolvedDecisions: [{
        cardId: "opportunity:extra:w20",
        optionId: "sign",
        effects: { money: 99_000_000 },
      }],
    });

    expect(result.newState.game.activeCommercialContracts).toHaveLength(1);
    expect(result.weekReport.warnings).toContain(
      `외부 계약 일정은 최대 ${COMMERCIAL_CONTRACTS.maxScheduleSlots}칸까지 맡을 수 있습니다`,
    );
    expect(result.weekReport.finance.income.decisionSupport ?? 0).toBe(0);
    expect(result.newState.finance.money - beforeMoney).toBeLessThan(99_000_000);
  });

  it("브랜드 전속과 앰배서더 계약은 양방향으로 중첩되지 않는다", () => {
    for (const [activeKind, offeredKind] of [
      ["brand-exclusive", "ambassador"],
      ["ambassador", "brand-exclusive"],
    ] as const) {
      const snapshot = makeGameSnapshot({ week: 20 });
      snapshot.game.activeCommercialContracts = [activeContract("brand", { kind: activeKind })];
      const offer = {
        ...OST_OFFER,
        kind: offeredKind,
        title: "브랜드 계약",
        scheduleSlots: offeredKind === "brand-exclusive" ? 2 : 1,
      };
      snapshot.game.weeklyDecisions = [contractDecisionCard(20, "brand-new", offer)];
      const result = processWeek(snapshot, {
        trainingSchedule: { intensity: "normal", restDay: false },
        resolvedDecisions: [{ cardId: "opportunity:brand-new:w20", optionId: "sign", effects: {} }],
      });
      expect(result.newState.game.activeCommercialContracts).toHaveLength(1);
      expect(result.weekReport.warnings).toContain(
        "진행 중인 브랜드 독점 조건과 겹쳐 이 계약을 받을 수 없습니다",
      );
    }
  });

  it("계약 우선 자동 플레이도 5년 동안 슬롯 한도를 넘지 않고 피로 대가를 치른다", () => {
    let snapshot = makeGameSnapshot({ year: 1, week: 1 });
    snapshot.game.currentPhase = "growth";
    let maxActiveSlots = 0;
    let contractIncome = 0;

    for (let turn = 0; turn < GAME_BALANCE.weeksPerYear * 5; turn++) {
      const cumulativeWeek =
        (snapshot.game.currentYear - 1) * GAME_BALANCE.weeksPerYear + snapshot.game.currentWeek;
      const freeSlots = COMMERCIAL_CONTRACTS.maxScheduleSlots -
        snapshot.game.activeCommercialContracts.reduce((sum, contract) => sum + contract.scheduleSlots, 0);
      const definitionId = `autoplay-${cumulativeWeek}`;
      const canOffer = freeSlots > 0;
      snapshot.game.weeklyDecisions = canOffer
        ? [contractDecisionCard(cumulativeWeek, definitionId, { ...OST_OFFER, durationWeeks: 26 })]
        : [];
      const result = processWeek(snapshot, {
        trainingSchedule: { intensity: "normal", restDay: false },
        resolvedDecisions: canOffer ? [{
          cardId: `opportunity:${definitionId}:w${cumulativeWeek}`,
          optionId: "sign",
          effects: {},
        }] : [],
      });
      contractIncome += result.weekReport.finance.income.commercialContracts ?? 0;
      maxActiveSlots = Math.max(
        maxActiveSlots,
        result.newState.game.activeCommercialContracts.reduce(
          (sum, contract) => sum + contract.scheduleSlots,
          0,
        ),
      );
      snapshot = result.newState;
    }

    expect(maxActiveSlots).toBe(COMMERCIAL_CONTRACTS.maxScheduleSlots);
    expect(contractIncome).toBeGreaterThan(0);
    expect(snapshot.trainee.trainees.every((member) => member.stress >= 90)).toBe(true);
    expect(snapshot.trainee.trainees.every((member) => member.condition <= 5)).toBe(true);
  });
});
