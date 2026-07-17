import { describe, expect, it } from "vitest";
import { evaluateFiveYearVictoryRoutes } from "@/systems/fiveYearReviewSystem";

const base = {
  albumQualities: [40, 45, 50],
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
});
