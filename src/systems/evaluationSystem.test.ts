import { describe, expect, it } from "vitest";
import { evaluateRelease, type ReleaseInput } from "@/systems/evaluationSystem";

const BASE_RELEASE: Omit<ReleaseInput, "albumQuality"> = {
  titleTrack: {
    id: "track-safe",
    name: "테스트 타이틀",
    type: "safe",
    quality: 70,
    description: "동일 조건 품질 회귀 테스트",
  },
  concept: { genre: "rnb", mood: "sophisticated" },
  season: "spring",
  fandom: 70,
  public: 70,
  global: 70,
  industry: 30,
  competitors: [],
  eventRivals: [],
  backgroundGroups: [],
  market: {
    hotMood: "refreshing",
    coldMood: "dark",
    hotGenre: "edm",
    coldGenre: "rock",
  },
  seed: 20260717,
};

describe("앨범 품질의 차트 보상", () => {
  it("같은 팬덤과 시장 조건에서는 높은 품질이 큰 차트 파워·순위 차이를 만든다", () => {
    const intermediate = evaluateRelease({ ...BASE_RELEASE, albumQuality: 50 });
    const expert = evaluateRelease({ ...BASE_RELEASE, albumQuality: 92 });

    expect(expert.chartPower - intermediate.chartPower).toBeGreaterThan(20);
    expect(intermediate.chartRank - expert.chartRank).toBeGreaterThanOrEqual(10);
  });
});
