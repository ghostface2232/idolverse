import { describe, expect, it } from "vitest";
import { CONTRACT_TERM_WEEKS } from "@/data/balance";
import { MILESTONES_BY_ID } from "@/data/milestones";
import {
  buildGoalLanes,
  buildMilestoneMetrics,
  evaluateMilestones,
  evaluatePhaseGate,
  getMilestoneProgress,
} from "@/systems/progressionSystem";
import { processWeek } from "@/systems/weekProcessor";
import { makeGameSnapshot, makeTrainee } from "@/test/gameStateFixture";

function makeMetrics(overrides: Partial<ReturnType<typeof buildMilestoneMetrics>> = {}) {
  return {
    ...buildMilestoneMetrics({
      trainees: [makeTrainee("t1"), makeTrainee("t2")],
      fandom: { public: 10, fandom: 5, fandomLoyalty: 50, global: 2, industry: 20 },
      money: 100000000,
      currentAlbum: null,
      releasedAlbums: [],
    }),
    ...overrides,
  };
}

describe("progressionSystem", () => {
  it("이정표 지표를 게임 상태에서 산출한다", () => {
    const metrics = makeMetrics();
    expect(metrics.averageVocal).toBe(50);
    expect(metrics.fandom).toBe(5);
    // digitalIndex는 시상식 후보 산식과 같은 공식(public*0.6 + 앨범품질*0.4)
    expect(metrics.digitalIndex).toBeCloseTo(6);
  });

  it("요건을 충족한 미달성 이정표만 달성으로 판정한다", () => {
    const metrics = makeMetrics({ fandom: 16 });
    const achieved = evaluateMilestones(metrics, new Set());
    const ids = achieved.map((m) => m.id);
    expect(ids).toContain("fan-cafe-open");
    expect(ids).toContain("fan-sign-open");
    expect(ids).not.toContain("small-concert-open");

    // 이미 달성한 이정표는 다시 나오지 않는다
    const again = evaluateMilestones(
      metrics,
      new Set(["fan-cafe-open", "fan-sign-open"]),
    );
    expect(again).toHaveLength(0);
  });

  it("복수 요건 이정표는 병목 요건을 진행률로 보고한다", () => {
    const definition = MILESTONES_BY_ID.get("debut-showcase-ready")!;
    const metrics = makeMetrics({ averageVocal: 50, debutReadiness: 20 });
    const progress = getMilestoneProgress(definition, metrics);
    // 준비도 20/80(25%)이 보컬 50/55(91%)보다 덜 채워진 병목이다
    expect(progress.bottleneck.metric).toBe("debutReadiness");
    expect(progress.ratio).toBeCloseTo(0.25);
  });

  it("PHASE_GATES가 비어 있는 동안 phase 전이는 발생하지 않는다", () => {
    expect(evaluatePhaseGate("training", makeMetrics())).toBeNull();
  });

  it("3레인 목표를 파생한다: 프로젝트는 가장 가까운 이정표, 장기는 투자사·계약 시계", () => {
    const lanes = buildGoalLanes({
      phase: "training",
      currentWeek: 5,
      currentYear: 1,
      metrics: makeMetrics(),
      achievedIds: new Set(),
      weeklyDecisions: [],
      investorConditions: [
        {
          id: "cond-1",
          metric: "quarterlyRevenue",
          target: 1,
          deadlineWeeks: 13,
          description: "분기 손익 개선",
        },
      ],
      });
    expect(lanes.weekly.title).toContain("한 주");
    expect(lanes.project).not.toBeNull();
    expect(lanes.project?.unlocks).toBeTruthy();
    expect(lanes.longTerm.some((item) => item.id === "investor:cond-1")).toBe(true);
    const contract = lanes.longTerm.find((item) => item.id === "contract-term");
    expect(contract?.deadlineLabel).toBe(`W-${CONTRACT_TERM_WEEKS - 4}`);
  });

  it("주간 처리에서 이정표 달성이 기록·통지되고 상태에 영속화된다", () => {
    const snapshot = makeGameSnapshot({ week: 5 });
    snapshot.fandom.fandom = 16;
    const result = processWeek(snapshot, {
      trainingSchedule: { intensity: "normal", restDay: false },
      resolvedDecisions: [],
    });

    const achievedIds = result.newState.game.milestonesAchieved.map((m) => m.id);
    expect(achievedIds).toContain("fan-cafe-open");
    expect(achievedIds).toContain("fan-sign-open");
    expect(
      result.weekReport.warnings.some((w) => w.includes("이정표 달성")),
    ).toBe(true);
    expect(
      result.weekReport.deltas.some((d) => d.source.kind === "milestone"),
    ).toBe(true);

    // 다음 주에는 같은 이정표가 다시 달성되지 않는다
    const nextWeek = processWeek(result.newState, {
      trainingSchedule: { intensity: "normal", restDay: false },
      resolvedDecisions: [],
    });
    expect(
      nextWeek.newState.game.milestonesAchieved.filter(
        (m) => m.id === "fan-cafe-open",
      ),
    ).toHaveLength(1);
  });
});
