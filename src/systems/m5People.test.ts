import { describe, expect, it } from "vitest";
import { MEMBER_CONTRACT } from "@/data/balance";
import { updateMemberPopularity } from "@/systems/popularitySystem";
import { updateSatisfaction } from "@/systems/satisfactionSystem";
import { processWeek, type PlayerDecisions } from "@/systems/weekProcessor";
import { makeGameSnapshot, makeTrainee } from "@/test/gameStateFixture";

const NO_DECISIONS: PlayerDecisions = {
  trainingSchedule: { intensity: "normal", restDay: false },
  resolvedDecisions: [],
};

describe("M5 사람 — 인기·계약·이탈", () => {
  it("재계약 도래 시 협상 카드가 다음 주 결정에 올라온다", () => {
    const snapshot = makeGameSnapshot({ week: 5 });
    snapshot.trainee.trainees[0].contract = { tier: 1, nextRenegotiationWeek: 6 };

    const result = processWeek(snapshot, NO_DECISIONS);
    const card = result.newState.game.weeklyDecisions.find((decision) =>
      decision.id.startsWith("recontract:t1"),
    );
    expect(card?.lane).toBe("crisis");
    expect(card?.trigger?.kind).toBe("contract");
    expect(card?.options.map((option) => option.id)).toEqual([
      "raise",
      "bonus",
      "freeze",
    ]);
  });

  it("인기가 높아도 즉시 계약금은 회사 현금의 5%와 절대 상한을 넘지 않는다", () => {
    const snapshot = makeGameSnapshot({ week: 5 });
    snapshot.finance.money = 300_000_000;
    snapshot.trainee.trainees[0].popularity = 100;
    snapshot.trainee.trainees[0].contract = { tier: 1, nextRenegotiationWeek: 6 };

    const result = processWeek(snapshot, NO_DECISIONS);
    const card = result.newState.game.weeklyDecisions.find((decision) =>
      decision.id.startsWith("recontract:t1"),
    );

    const signing = card?.options.find((option) => option.id === "raise")?.effects.money;
    expect(signing).toBeLessThanOrEqual(-MEMBER_CONTRACT.signingBase);
    expect(Math.abs(signing ?? 0)).toBeLessThanOrEqual(15_000_000);
  });

  it("조건 인상은 처우 등급과 다음 협상 주를 갱신한다", () => {
    const snapshot = makeGameSnapshot({ week: 5 });
    snapshot.trainee.trainees[0].contract = { tier: 1, nextRenegotiationWeek: 5 };

    const result = processWeek(snapshot, {
      trainingSchedule: { intensity: "normal", restDay: false },
      resolvedDecisions: [
        {
          cardId: "recontract:t1:w5",
          optionId: "raise",
          effects: { money: -20_000_000, satisfaction: 12 },
          targetTraineeIds: ["t1"],
        },
      ],
    });
    const member = result.newState.trainee.trainees.find((t) => t.id === "t1");
    expect(member?.contract.tier).toBe(2);
    expect(member?.contract.nextRenegotiationWeek).toBe(
      5 + MEMBER_CONTRACT.renegotiationIntervalWeeks,
    );
  });

  it("과로하고 인기 있는 멤버는 협상을 앞당긴다", () => {
    const snapshot = makeGameSnapshot({ week: 5 });
    snapshot.trainee.trainees[0].popularity = 50;
    snapshot.trainee.trainees[0].stress = 80;
    snapshot.trainee.trainees[0].contract = {
      tier: 1,
      nextRenegotiationWeek: 100,
    };

    const result = processWeek(snapshot, NO_DECISIONS);
    const member = result.newState.trainee.trainees.find((t) => t.id === "t1");
    expect(member?.contract.nextRenegotiationWeek).toBe(
      5 + MEMBER_CONTRACT.earlyTriggerLeadWeeks,
    );
    expect(
      result.weekReport.warnings.some((warning) => warning.includes("앞당겨")),
    ).toBe(true);
  });

  it("조건 격차는 낮은 처우 멤버의 만족도를 갉아먹고 야심가가 더 민감하다", () => {
    const ambitious = makeTrainee("low", {
      temperament: "ambitious",
      contract: { tier: 1, nextRenegotiationWeek: 78 },
    });
    const devoted = makeTrainee("low2", {
      temperament: "devoted",
      contract: { tier: 1, nextRenegotiationWeek: 78 },
    });
    const top = makeTrainee("top", {
      contract: { tier: 3, nextRenegotiationWeek: 78 },
    });
    const result = updateSatisfaction([ambitious, devoted, top], {
      currentPhase: "debut",
      albumConcept: null,
      trainingIntensity: "normal",
      dormLevel: 2,
      livingExpenseLevel: 2,
      weeksSinceDebut: 0,
      debutWeek: 1,
      currentWeek: 30,
      debutDelayWeeks: 0,
      recentAward: false,
      musicShowWin: false,
      goodFanReaction: false,
    });

    const ambitiousDelta = result.deltas.find((d) => d.traineeId === "low");
    const devotedDelta = result.deltas.find((d) => d.traineeId === "low2");
    const topDelta = result.deltas.find((d) => d.traineeId === "top");
    expect(ambitiousDelta?.reasons).toContain("조건 격차");
    expect(topDelta?.reasons).not.toContain("조건 격차");
    expect(ambitiousDelta!.after).toBeLessThan(devotedDelta!.after);
  });

  it("만족도 바닥이 지속되면 실제로 떠나고 팬덤이 타격을 받는다", () => {
    const snapshot = makeGameSnapshot({ week: 10 });
    snapshot.trainee.trainees.push(makeTrainee("t3"), makeTrainee("t4"));
    snapshot.fandom.fandom = 40;
    snapshot.trainee.trainees[0].satisfaction = 1;
    snapshot.trainee.trainees[0].leaveCountdown = 3;

    const result = processWeek(snapshot, NO_DECISIONS);
    expect(result.newState.trainee.trainees).toHaveLength(3);
    expect(
      result.newState.trainee.trainees.some((t) => t.id === "t1"),
    ).toBe(false);
    expect(result.newState.fandom.fandom).toBeLessThan(40);
    expect(
      result.weekReport.events.some((event) => event.title.includes("탈퇴")),
    ).toBe(true);
  });

  it("최소 인원이면 이탈 대신 간신히 붙잡는다", () => {
    const snapshot = makeGameSnapshot({ week: 10 });
    snapshot.trainee.trainees[0].satisfaction = 1;
    snapshot.trainee.trainees[0].leaveCountdown = 3;

    const result = processWeek(snapshot, NO_DECISIONS);
    expect(result.newState.trainee.trainees).toHaveLength(2);
    expect(
      result.weekReport.warnings.some((warning) => warning.includes("붙잡")),
    ).toBe(true);
  });

  it("활동기에는 개인 인기도가 쌓이고 노출 포지션이 더 빨리 오른다", () => {
    const center = makeTrainee("c", { position: "center" });
    const dancer = makeTrainee("d", { position: "mainDancer" });
    const result = updateMemberPopularity([center, dancer], {
      inActivityPeriod: true,
      musicShowWon: true,
      viralMemberId: null,
      promotionMemberIds: [],
    });
    const centerAfter = result.trainees.find((t) => t.id === "c");
    const dancerAfter = result.trainees.find((t) => t.id === "d");
    expect(centerAfter!.popularity).toBeGreaterThan(dancerAfter!.popularity);
    expect(dancerAfter!.popularity).toBeGreaterThan(0);

    // 비활동 주에는 서서히 식는다.
    const cooled = updateMemberPopularity(result.trainees, {
      inActivityPeriod: false,
      musicShowWon: false,
      viralMemberId: null,
      promotionMemberIds: [],
    });
    expect(cooled.trainees.find((t) => t.id === "c")!.popularity).toBeLessThan(
      centerAfter!.popularity,
    );
  });
});
