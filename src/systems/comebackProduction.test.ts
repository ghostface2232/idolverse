import { describe, expect, it } from "vitest";
import { MV_DIRECTIONS_BY_ID, TREND_FORECAST } from "@/data/balance";
import {
  buildAttributionLines,
  buildProductionReleaseEffects,
} from "@/systems/comebackSystem";
import {
  forecastNextSeasonTrend,
  updateSeasonTrend,
} from "@/systems/calendarSystem";
import type { Album, Trainee } from "@/types/game";
import type { ReleaseResult } from "@/systems/evaluationSystem";

function makeAlbum(overrides: Partial<Album> = {}): Album {
  return {
    id: "album-test",
    title: "Test Album",
    concept: { genre: "dancePop", mood: "refreshing" },
    titleTrackCandidates: [],
    titleTrack: {
      id: "track-1",
      name: "테스트곡",
      type: "safe",
      quality: 70,
      description: "",
    },
    progress: { song: 50, visual: 50, choreography: 50, marketing: 50 },
    memberConceptFit: 60,
    seasonFit: 60,
    fandomExpectationFit: 60,
    externalCollaborators: {},
    quality: 0,
    ...overrides,
  };
}

function makeReleaseResult(
  attribution: Partial<ReleaseResult["attribution"]> = {},
): ReleaseResult {
  return {
    chartRank: 12,
    chartPower: 60,
    fandomDelta: 3,
    publicDelta: 4,
    globalDelta: 2,
    industryDelta: 2,
    fandomDisappointmentDelta: 0,
    attribution: {
      trendMult: 1,
      seasonMult: 1,
      luckMult: 1,
      rivalsAhead: [],
      ...attribution,
    },
  };
}

describe("buildProductionReleaseEffects", () => {
  it("결정을 미룬 앨범은 발매 보너스가 없다", () => {
    expect(buildProductionReleaseEffects(makeAlbum())).toEqual({});
  });

  it("MV 방향과 마케팅 배분의 효과가 합산된다", () => {
    const effects = buildProductionReleaseEffects(
      makeAlbum({
        mvDirection: "viral",
        marketingPlan: { sns: 2, global: 1 },
      }),
    );
    const viral = MV_DIRECTIONS_BY_ID.get("viral")!;
    expect(effects.global).toBe(
      (viral.release as Record<string, number>).global + 1,
    );
    expect(effects.public).toBe(
      ((viral.release as Record<string, number>).public ?? 0) + 2,
    );
  });
});

describe("buildAttributionLines", () => {
  const trainees = [
    { id: "t1", name: "가온" },
    { id: "t2", name: "나린" },
  ] as unknown as readonly Trainee[];

  it("중립 요인은 싣지 않는다", () => {
    const lines = buildAttributionLines(
      makeAlbum(),
      makeReleaseResult(),
      trainees,
    );
    expect(lines).toEqual([]);
  });

  it("트렌드·경쟁·제작 선택이 문장으로 분해된다", () => {
    const lines = buildAttributionLines(
      makeAlbum({
        mvDirection: "cinematic",
        marketingPlan: { fanpower: 3 },
        partAssignment: { mode: "ace", pushTraineeIds: ["t1"] },
      }),
      makeReleaseResult({
        trendMult: 1.12,
        rivalsAhead: ["NOVA"],
      }),
      trainees,
    );
    expect(lines.some((line) => line.includes("트렌드 적중"))).toBe(true);
    expect(lines.some((line) => line.includes("NOVA"))).toBe(true);
    expect(lines.some((line) => line.includes("시네마틱"))).toBe(true);
    expect(lines.some((line) => line.includes("3포인트"))).toBe(true);
    expect(lines.some((line) => line.includes("가온"))).toBe(true);
  });
});

describe("forecastNextSeasonTrend", () => {
  it("같은 주에 여러 번 물어도 예보가 흔들리지 않는다", () => {
    const input = {
      currentYear: 1,
      currentWeek: 5,
      currentSeason: "spring" as const,
      campaignSeed: 12345,
    };
    expect(forecastNextSeasonTrend(input)).toEqual(
      forecastNextSeasonTrend(input),
    );
  });

  it("시즌이 흘러도 경계 주 전까지는 같은 예보를 유지한다", () => {
    const early = forecastNextSeasonTrend({
      currentYear: 2,
      currentWeek: 2,
      currentSeason: "spring",
      campaignSeed: 777,
    });
    const late = forecastNextSeasonTrend({
      currentYear: 2,
      currentWeek: 12,
      currentSeason: "spring",
      campaignSeed: 777,
    });
    expect(late.hotMood).toBe(early.hotMood);
    expect(late.hotGenre).toBe(early.hotGenre);
    expect(early.weeksUntil).toBeGreaterThan(late.weeksUntil);
  });

  it("예보 적중률이 설정값 언저리에 있다", () => {
    let hits = 0;
    const samples = 200;
    for (let seedIndex = 0; seedIndex < samples; seedIndex++) {
      const forecast = forecastNextSeasonTrend({
        currentYear: 1,
        currentWeek: 3,
        currentSeason: "spring",
        campaignSeed: seedIndex * 31 + 7,
      });
      // weekProcessor 13.5단계와 같은 시드 공식으로 "실제" 트렌드를 확정한다.
      const actual = updateSeasonTrend(
        "summer",
        13 * 997 + 1 * 31 + (seedIndex * 31 + 7) + 100,
      );
      if (forecast.hotMood === actual.hotMood) hits++;
    }
    const hitRate = hits / samples;
    expect(hitRate).toBeGreaterThan(TREND_FORECAST.accuracy - 0.15);
    expect(hitRate).toBeLessThan(1);
  });
});
