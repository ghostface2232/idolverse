import {
  BACKGROUND_CHART_POWER_SCALE,
  PUBLIC_DECAY_RATE,
  TITLE_TRACK_TYPE_WEIGHTS,
} from "@/data/balance";
import { createSeededRandom } from "@/lib/seededRandom";
import type {
  BackgroundGroup,
  CompetitorGroup,
  EventCompetitor,
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
  market: MarketContext,
  titleTrack: TitleTrack,
): number {
  // 플레이어 팬덤·글로벌은 0~100 스케일이다. /100으로 나누면 만렙이어도
  // 합계 0.25점 기여라 "팬덤을 키워 이긴다"가 산식에서 사라진다 —
  // 성장 축이 차트 경쟁력에 그대로 반영되어야 성장으로 이기는 구조가 성립한다.
  const base =
    albumQuality * 0.4 +
    publicStat * 0.25 +
    fandom * 0.15 +
    industry * 0.1 +
    global * 0.1;

  const typeWeights = TITLE_TRACK_TYPE_WEIGHTS[titleTrack.type];
  const publicMult = "public" in typeWeights ? typeWeights.public : 1.0;

  return base * publicMult;
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

  const playerPower = computeChartPower(
    albumQuality, fandom, publicStat, global, industry, market, titleTrack,
  );

  const chartPool: ChartEntry[] = [
    { name: "PLAYER", power: playerPower, isPlayer: true },
  ];

  for (const c of competitors) {
    if (!c.currentAlbum) continue;
    const power =
      c.currentAlbum.quality * 0.4 +
      c.public * 0.25 +
      (c.fandom / 100) * 0.15 +
      c.industry * 0.1 +
      (c.global / 100) * 0.1;
    chartPool.push({ name: c.name, power, isPlayer: false });
  }

  for (const e of eventRivals) {
    const power =
      e.intensity * 0.5 +
      e.public * 0.25 +
      (e.fandom / 100) * 0.15 +
      e.industry * 0.1;
    chartPool.push({ name: e.name, power, isPlayer: false });
  }

  for (const bg of backgroundGroups) {
    chartPool.push({
      name: bg.name,
      power: bg.chartScore * BACKGROUND_CHART_POWER_SCALE,
      isPlayer: false,
    });
  }

  chartPool.sort((a, b) => b.power - a.power);
  const chartRank = chartPool.findIndex((e) => e.isPlayer) + 1;

  const typeWeights = TITLE_TRACK_TYPE_WEIGHTS[titleTrack.type];
  const fandomMult = typeWeights.fandom;
  const publicMult = "public" in typeWeights ? typeWeights.public : 1.0;
  const globalMult = "global" in typeWeights ? (typeWeights as Record<string, number>).global ?? 1.0 : 1.0;
  const variance = "variance" in typeWeights ? (typeWeights as Record<string, number>).variance ?? 0 : 0;

  const qualityFactor = albumQuality / 50;
  const varianceRoll = variance > 0 ? (random() - 0.5) * 2 * variance * 20 : 0;

  const fandomDelta = Math.round((3 + qualityFactor * 4) * fandomMult + varianceRoll * 0.3);
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
