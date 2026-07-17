import {
  BACKGROUND_CHART_POWER_SCALE,
  CHART_POWER_WEIGHTS,
  PUBLIC_DECAY_RATE,
  RELEASE_MARKET_SWING,
  SYNTHETIC_CHART_MARKET,
  TITLE_TRACK_TYPE_WEIGHTS,
} from "@/data/balance";
import { SEASON_MOOD_FIT } from "@/data/concepts";
import { createSeededRandom } from "@/lib/seededRandom";
import type {
  BackgroundGroup,
  CompetitorGroup,
  ConceptMood,
  EventCompetitor,
  Genre,
  Season,
  TitleTrack,
} from "@/types/game";

export interface MarketContext {
  hotMood: string;
  coldMood: string;
  hotGenre: string;
  coldGenre: string;
}

export interface ReleaseInput {
  albumQuality: number;
  titleTrack: TitleTrack;
  /** 트렌드·계절 스윙 판정에 쓰는 앨범 콘셉트. */
  concept: { genre: Genre; mood: ConceptMood };
  season: Season;
  fandom: number;
  public: number;
  global: number;
  industry: number;
  competitors: readonly CompetitorGroup[];
  eventRivals: readonly EventCompetitor[];
  backgroundGroups: readonly BackgroundGroup[];
  market: MarketContext;
  seed: number;
}

/**
 * 트렌드 적중·계절 적합·발매 주 운의 곱 — 성적이 실력의 선형 함수가
 * 되지 않게 하는 시장 배율. 성장은 기대값을 올릴 뿐 결과를 보장하지 않는다.
 */
export function computeMarketSwing(
  concept: { genre: Genre; mood: ConceptMood },
  season: Season,
  market: MarketContext,
  luckRoll: number,
): { mult: number; trendMult: number; seasonMult: number; luckMult: number } {
  let trendMult = 1;
  if (concept.mood === market.hotMood) trendMult *= RELEASE_MARKET_SWING.hotMoodMult;
  if (concept.mood === market.coldMood) trendMult *= RELEASE_MARKET_SWING.coldMoodMult;
  if (concept.genre === market.hotGenre) trendMult *= RELEASE_MARKET_SWING.hotGenreMult;
  if (concept.genre === market.coldGenre) trendMult *= RELEASE_MARKET_SWING.coldGenreMult;

  const seasonMult =
    1 +
    (SEASON_MOOD_FIT[season]?.[concept.mood] ?? 0) *
      RELEASE_MARKET_SWING.seasonFitScale;

  const luckMult =
    1 - RELEASE_MARKET_SWING.luckSpread + luckRoll * RELEASE_MARKET_SWING.luckSpread * 2;

  return { mult: trendMult * seasonMult * luckMult, trendMult, seasonMult, luckMult };
}

export interface ChartEntry {
  name: string;
  power: number;
  isPlayer: boolean;
}

export interface ReleaseResult {
  chartRank: number;
  chartPower: number;
  fandomDelta: number;
  publicDelta: number;
  globalDelta: number;
  industryDelta: number;
  fandomDisappointmentDelta: number;
}

function computeChartPower(
  albumQuality: number,
  fandom: number,
  publicStat: number,
  global: number,
  industry: number,
  titleTrack: TitleTrack,
): number {
  const typeWeights = TITLE_TRACK_TYPE_WEIGHTS[titleTrack.type];
  const publicMult = "public" in typeWeights ? typeWeights.public : 1.0;
  const craftPower = albumQuality * CHART_POWER_WEIGHTS.quality;
  const reachPower =
    publicStat * CHART_POWER_WEIGHTS.public +
    fandom * CHART_POWER_WEIGHTS.fandom +
    industry * CHART_POWER_WEIGHTS.industry +
    Math.min(global, 100) * CHART_POWER_WEIGHTS.global;

  // 곡 완성도는 차트의 바닥을 만든다. 트렌드와 타이틀 전략은 얼마나 넓게
  // 퍼지는지를 바꾸되, 높은 완성도 자체를 운이 통째로 지우지는 않는다.
  return craftPower + reachPower * publicMult;
}

export function evaluateRelease(input: ReleaseInput): ReleaseResult {
  const {
    albumQuality,
    titleTrack,
    fandom,
    public: publicStat,
    global,
    industry,
    competitors,
    eventRivals,
    backgroundGroups,
    market,
    seed,
  } = input;

  const random = createSeededRandom(seed);

  const swing = computeMarketSwing(input.concept, input.season, market, random());
  const craftPower = albumQuality * CHART_POWER_WEIGHTS.quality;
  const unswungPower = computeChartPower(
    albumQuality, fandom, publicStat, global, industry, titleTrack,
  );
  const playerPower = craftPower + (unswungPower - craftPower) * swing.mult;

  const chartPool: ChartEntry[] = [
    { name: "PLAYER", power: playerPower, isPlayer: true },
  ];

  for (const c of competitors) {
    if (!c.currentAlbum) continue;
    const power =
      c.currentAlbum.quality * CHART_POWER_WEIGHTS.quality +
      c.public * CHART_POWER_WEIGHTS.public +
      (c.fandom / 100) * CHART_POWER_WEIGHTS.fandom +
      c.industry * CHART_POWER_WEIGHTS.industry +
      (c.global / 100) * CHART_POWER_WEIGHTS.global;
    chartPool.push({ name: c.name, power, isPlayer: false });
  }

  for (const e of eventRivals) {
    const power =
      e.intensity * CHART_POWER_WEIGHTS.quality +
      e.public * CHART_POWER_WEIGHTS.public +
      (e.fandom / 100) * CHART_POWER_WEIGHTS.fandom +
      e.industry * CHART_POWER_WEIGHTS.industry +
      (e.global / 100) * CHART_POWER_WEIGHTS.global;
    chartPool.push({ name: e.name, power, isPlayer: false });
  }

  for (const bg of backgroundGroups) {
    chartPool.push({
      name: bg.name,
      power: bg.chartScore * BACKGROUND_CHART_POWER_SCALE,
      isPlayer: false,
    });
  }

  for (let index = 0; index < SYNTHETIC_CHART_MARKET.entryCount; index++) {
    const position =
      SYNTHETIC_CHART_MARKET.entryCount <= 1
        ? 0
        : index / (SYNTHETIC_CHART_MARKET.entryCount - 1);
    chartPool.push({
      name: `MARKET-${index + 1}`,
      power:
        SYNTHETIC_CHART_MARKET.minPower +
        (1 - position) ** SYNTHETIC_CHART_MARKET.curve *
          SYNTHETIC_CHART_MARKET.powerRange +
        random() * SYNTHETIC_CHART_MARKET.noise,
      isPlayer: false,
    });
  }

  chartPool.sort((a, b) => b.power - a.power);
  const chartRank = Math.min(100, chartPool.findIndex((e) => e.isPlayer) + 1);

  const typeWeights = TITLE_TRACK_TYPE_WEIGHTS[titleTrack.type];
  const fandomMult = typeWeights.fandom;
  const publicMult = "public" in typeWeights ? typeWeights.public : 1.0;
  const globalMult = "global" in typeWeights ? (typeWeights as Record<string, number>).global ?? 1.0 : 1.0;
  const variance = "variance" in typeWeights ? (typeWeights as Record<string, number>).variance ?? 0 : 0;

  const qualityFactor = albumQuality / 50;
  const varianceRoll = variance > 0 ? (random() - 0.5) * 2 * variance * 20 : 0;

  // 발매 한 번의 팬덤 보상은 작게 — 팬덤 100은 여러 해의 누적이어야 한다
  // (기성 역전 3~7년차 페이싱). 활동기 음방 승리·콘서트가 나머지를 쌓는다.
  const fandomDelta = Math.round((2 + qualityFactor * 2) * fandomMult + varianceRoll * 0.3);
  const publicDelta = Math.round((2 + qualityFactor * 5) * publicMult + varianceRoll);
  const globalDelta = Math.round((1 + qualityFactor * 3) * globalMult);
  const industryDelta = Math.round(1 + qualityFactor * 2);

  const rankPenalty = Math.max(0, (chartRank - 3) * 0.5);
  const adjustedPublicDelta = Math.round(publicDelta - rankPenalty);

  let fandomDisappointmentDelta = 0;
  if (titleTrack.type === "bold" && varianceRoll < -5) {
    fandomDisappointmentDelta = 8;
  }

  return {
    chartRank,
    chartPower: playerPower,
    fandomDelta: Math.max(0, fandomDelta),
    publicDelta: adjustedPublicDelta,
    globalDelta: Math.max(0, globalDelta),
    industryDelta: Math.max(0, industryDelta),
    fandomDisappointmentDelta,
  };
}

export interface ChartDecayResult {
  melonDelta: number;
  spotifyDelta: number;
  youtubeDelta: number;
}

export function weeklyChartDecay(
  weeksAfterRelease: number,
  seed: number,
): ChartDecayResult {
  const random = createSeededRandom(seed);
  const baseDrop = 2 + Math.floor(random() * 4);
  const ageFactor = Math.min(weeksAfterRelease * 0.5, 5);

  return {
    melonDelta: -(baseDrop + Math.round(ageFactor)),
    spotifyDelta: -(baseDrop - 1 + Math.round(ageFactor * 0.7)),
    youtubeDelta: -(baseDrop - 1 + Math.round(ageFactor * 0.5)),
  };
}
