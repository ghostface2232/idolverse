import { describe, expect, it } from "vitest";
import { ROOKIE_COHORT } from "@/data/balance";
import {
  getRookieDebutWeeks,
  retireFadedRivals,
  spawnRookieGroup,
} from "@/systems/competitorSystem";
import { processWeek, type PlayerDecisions } from "@/systems/weekProcessor";
import { makeGameSnapshot } from "@/test/gameStateFixture";
import type { CompetitorGroup } from "@/types/game";

const NO_DECISIONS: PlayerDecisions = {
  trainingSchedule: { intensity: "normal", restDay: false },
  resolvedDecisions: [],
};

function makeRival(
  id: string,
  overrides: Partial<CompetitorGroup> = {},
): CompetitorGroup {
  return {
    id,
    name: `라이벌-${id}`,
    agency: "테스트 기획사",
    gender: "female",
    type: "traditional",
    stats: { vocal: 60, dance: 60, visual: 60, marketing: 60 },
    fandom: 3000,
    public: 40,
    global: 1000,
    industry: 50,
    activeWeeks: 10,
    debutYear: 1,
    strengths: [],
    weaknesses: [],
    ...overrides,
  };
}

describe("연차별 신인 코호트 (F6)", () => {
  it("신인 데뷔 주는 연도·회차 시드만으로 결정된다", () => {
    const weeks = getRookieDebutWeeks(3, 42);
    expect(weeks).toEqual(getRookieDebutWeeks(3, 42));
    expect(weeks).toHaveLength(ROOKIE_COHORT.groupsPerYear);
    for (const week of weeks) {
      expect(week).toBeGreaterThanOrEqual(8);
      expect(week).toBeLessThanOrEqual(46);
    }
    // 회차 시드가 다르면 세계도 다르게 진화한다.
    expect(getRookieDebutWeeks(3, 42)).not.toEqual(getRookieDebutWeeks(3, 777));
  });

  it("신인 그룹은 데뷔 연도를 갖고 얕은 기반으로 시작한다", () => {
    const rookie = spawnRookieGroup(4, 0, "female", 42, new Set());
    expect(rookie.debutYear).toBe(4);
    expect(rookie.activeWeeks).toBe(0);
    // 기성 라이벌 스케일보다 낮은 시작 — 세부 수치는 아키타입에 따르므로 상한만 확인.
    expect(rookie.fandom).toBeLessThanOrEqual(6000 * ROOKIE_COHORT.fandomScale);
    expect(rookie.industry).toBeLessThanOrEqual(100 * ROOKIE_COHORT.industryScale);
  });

  it("이미 쓰인 이름은 피해서 짓는다", () => {
    const first = spawnRookieGroup(4, 0, "female", 42, new Set());
    const second = spawnRookieGroup(4, 0, "female", 42, new Set([first.name]));
    expect(second.name).not.toBe(first.name);
  });

  it("로스터 상한 초과 시 오래되고 존재감 낮은 그룹부터 해체한다", () => {
    const rivals = [
      ...Array.from({ length: ROOKIE_COHORT.maxRoster - 1 }, (_, i) =>
        makeRival(`old-${i}`, { debutYear: 1, fandom: 4000 + i * 100 }),
      ),
      makeRival("fading", { debutYear: 1, fandom: 500, public: 5 }),
      makeRival("fresh", { debutYear: 6, fandom: 300, public: 3 }),
    ];
    const result = retireFadedRivals(rivals, 6);
    expect(result.rivals).toHaveLength(ROOKIE_COHORT.maxRoster);
    expect(result.disbanded.map((r) => r.id)).toEqual(["fading"]);
    // 최소 연차 미만의 신인은 존재감이 낮아도 정리하지 않는다.
    expect(result.rivals.some((r) => r.id === "fresh")).toBe(true);
  });

  it("상한 이내면 아무도 해체하지 않는다", () => {
    const rivals = [makeRival("a"), makeRival("b")];
    const result = retireFadedRivals(rivals, 7);
    expect(result.disbanded).toHaveLength(0);
    expect(result.rivals).toHaveLength(2);
  });

  it("processWeek: 2년차 신인 데뷔 주에 라이벌 풀이 늘고 뉴스가 나온다", () => {
    const year = 2;
    const campaignSeed = 0;
    const [firstDebutWeek] = getRookieDebutWeeks(year, campaignSeed);
    const snapshot = makeGameSnapshot({ week: firstDebutWeek, year });
    snapshot.competitor.permanentRivals = [makeRival("existing")];

    const { newState, weekReport } = processWeek(snapshot, NO_DECISIONS);

    expect(newState.competitor.permanentRivals).toHaveLength(2);
    const rookie = newState.competitor.permanentRivals.find((r) =>
      r.id.startsWith(`rookie-y${year}-`),
    );
    expect(rookie).toBeDefined();
    expect(rookie?.debutYear).toBe(year);
    expect(
      weekReport.news.some((item) => item.headline.includes("신인 그룹")),
    ).toBe(true);
  });

  it("processWeek: 1년차에는 신인이 유입되지 않는다", () => {
    const [firstDebutWeek] = getRookieDebutWeeks(1, 0);
    const snapshot = makeGameSnapshot({ week: firstDebutWeek, year: 1 });
    snapshot.competitor.permanentRivals = [makeRival("existing")];

    const { newState } = processWeek(snapshot, NO_DECISIONS);

    expect(newState.competitor.permanentRivals).toHaveLength(1);
  });
});
