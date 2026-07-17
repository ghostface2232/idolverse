import { describe, expect, it } from "vitest";
import {
  createFiveYearReviewRecord,
  evaluateFiveYearVictoryRoutes,
  getFiveYearRouteProgress,
} from "@/systems/fiveYearReviewSystem";
import { processWeek } from "@/systems/weekProcessor";
import { makeGameSnapshot } from "@/test/gameStateFixture";

const base = {
  albumQualities: [40, 45, 50],
  topTenAlbums: 0,
  public: 50,
  fandom: 50,
  fandomLoyalty: 50,
  global: 50,
  industry: 10,
  money: 200_000_000,
  awards: 2,
  strategicExpansion: { production: 0, fandom: 0, global: 0 },
};

describe("5년 경영 평가", () => {
  it("히트 제작, 팬덤, 글로벌, 재무, 수상 경로를 각각 독립적인 승리로 인정한다", () => {
    expect(
      evaluateFiveYearVictoryRoutes({
        ...base,
        albumQualities: [47, 47, 47, 47, 47, 47, 47, 47, 47, 75],
      }),
    ).toContain("hitmaker");
    expect(
      evaluateFiveYearVictoryRoutes({
        ...base,
        public: 80,
        fandom: 85,
        fandomLoyalty: 75,
        strategicExpansion: { ...base.strategicExpansion, fandom: 1 },
      }),
    ).toContain("fandom");
    expect(
      evaluateFiveYearVictoryRoutes({
        ...base,
        global: 85,
        industry: 20,
        strategicExpansion: { ...base.strategicExpansion, global: 1 },
      }),
    ).toContain("global");
    expect(
      evaluateFiveYearVictoryRoutes({
        ...base,
        albumQualities: Array(8).fill(40),
        money: 1_000_000_000,
      }),
    ).toContain("business");
    expect(
      evaluateFiveYearVictoryRoutes({ ...base, awards: 15, industry: 20 }),
    ).toContain("awards");
  });

  it("아무 기준도 만족하지 못하면 평가를 통과시키지 않는다", () => {
    expect(evaluateFiveYearVictoryRoutes(base)).toEqual([]);
  });

  it("목표 안내와 기록이 같은 경로 조건과 점수를 사용한다", () => {
    const progress = getFiveYearRouteProgress({
      ...base,
      albumQualities: Array(8).fill(40),
      money: 310_000_000,
      awards: 6,
      topTenAlbums: 2,
    });
    const business = progress.find((route) => route.route === "business")!;
    expect(business.criteria.map((criterion) => criterion.label)).toEqual([
      "보유 자금",
      "앨범",
    ]);
    expect(business.ratio).toBeCloseTo(0.31);

    const record = createFiveYearReviewRecord({
      ...base,
      albumQualities: Array(8).fill(40),
      money: 310_000_000,
      awards: 6,
      topTenAlbums: 2,
    });
    expect(record.metrics.topTenAlbums).toBe(2);
    expect(record.score).toBeGreaterThan(0);
    expect(record.routeProgress.business).toBeCloseTo(business.ratio);
  });

  it("5년차 마지막 주는 기록을 확정하고 6년차 플레이를 계속한다", () => {
    const snapshot = makeGameSnapshot({ year: 5, week: 52 });
    snapshot.finance.money = 310_000_000;

    const result = processWeek(snapshot, {
      trainingSchedule: { intensity: "normal", restDay: false },
      resolvedDecisions: [],
    });

    expect(result.newState.game.campaignFailure).toBeNull();
    expect(result.newState.game.currentYear).toBe(6);
    expect(result.newState.game.currentWeek).toBe(1);
    expect(result.newState.game.fiveYearReview).not.toBeNull();
    expect(
      result.weekReport.events.some(
        (event) => event.id === "five-year-review-5",
      ),
    ).toBe(true);
  });
});
