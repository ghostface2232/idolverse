import { FIVE_YEAR_REVIEW } from "@/data/balance";
import type {
  FiveYearReviewRecord,
  FiveYearReviewRoute,
  StrategicExpansionLevels,
} from "@/types/game";

export type { FiveYearReviewRoute } from "@/types/game";

export const FIVE_YEAR_VICTORY_ROUTE_LABELS: Record<
  FiveYearReviewRoute,
  string
> = {
  hitmaker: "히트 제작",
  fandom: "팬덤",
  global: "글로벌",
  business: "재무",
  awards: "수상",
};

export interface FiveYearReviewInput {
  albumQualities: readonly number[];
  topTenAlbums: number;
  public: number;
  fandom: number;
  fandomLoyalty: number;
  global: number;
  industry: number;
  money: number;
  awards: number;
  strategicExpansion: StrategicExpansionLevels;
}

export interface FiveYearRouteCriterion {
  id: string;
  label: string;
  current: number;
  target: number;
  format: "number" | "money";
}

export interface FiveYearRouteProgress {
  route: FiveYearReviewRoute;
  label: string;
  criteria: FiveYearRouteCriterion[];
  ratio: number;
  achieved: boolean;
}

function routeProgress(
  route: FiveYearReviewRoute,
  criteria: FiveYearRouteCriterion[],
): FiveYearRouteProgress {
  const ratio = criteria.reduce(
    (lowest, criterion) =>
      Math.min(
        lowest,
        criterion.target <= 0 ? 1 : criterion.current / criterion.target,
      ),
    1,
  );

  return {
    route,
    label: FIVE_YEAR_VICTORY_ROUTE_LABELS[route],
    criteria,
    ratio: Math.min(1, Math.max(0, ratio)),
    achieved: criteria.every(
      (criterion) => criterion.current >= criterion.target,
    ),
  };
}

export function getFiveYearRouteProgress(
  input: FiveYearReviewInput,
): FiveYearRouteProgress[] {
  const releases = input.albumQualities.length;
  const bestQuality = releases > 0 ? Math.max(...input.albumQualities) : 0;
  const averageQuality =
    releases > 0
      ? input.albumQualities.reduce((sum, quality) => sum + quality, 0) /
        releases
      : 0;

  return [
    routeProgress("hitmaker", [
      {
        id: "releases",
        label: "앨범",
        current: releases,
        target: FIVE_YEAR_REVIEW.hitmaker.minReleases,
        format: "number",
      },
      {
        id: "average-quality",
        label: "평균 완성도",
        current: averageQuality,
        target: FIVE_YEAR_REVIEW.hitmaker.minAverageQuality,
        format: "number",
      },
      {
        id: "best-quality",
        label: "최고 완성도",
        current: bestQuality,
        target: FIVE_YEAR_REVIEW.hitmaker.minBestQuality,
        format: "number",
      },
    ]),
    routeProgress("fandom", [
      {
        id: "public",
        label: "대중 인지도",
        current: input.public,
        target: FIVE_YEAR_REVIEW.fandom.minPublic,
        format: "number",
      },
      {
        id: "fandom",
        label: "코어 팬덤",
        current: input.fandom,
        target: FIVE_YEAR_REVIEW.fandom.minFandom,
        format: "number",
      },
      {
        id: "loyalty",
        label: "팬 충성도",
        current: input.fandomLoyalty,
        target: FIVE_YEAR_REVIEW.fandom.minLoyalty,
        format: "number",
      },
      {
        id: "fandom-expansion",
        label: "팬 플랫폼 단계",
        current: input.strategicExpansion.fandom,
        target: FIVE_YEAR_REVIEW.fandom.minExpansionLevel,
        format: "number",
      },
    ]),
    routeProgress("global", [
      {
        id: "global",
        label: "해외 팬덤",
        current: input.global,
        target: FIVE_YEAR_REVIEW.global.minGlobal,
        format: "number",
      },
      {
        id: "industry",
        label: "업계 평판",
        current: input.industry,
        target: FIVE_YEAR_REVIEW.global.minIndustry,
        format: "number",
      },
      {
        id: "global-expansion",
        label: "투어 본부 단계",
        current: input.strategicExpansion.global,
        target: FIVE_YEAR_REVIEW.global.minExpansionLevel,
        format: "number",
      },
    ]),
    routeProgress("business", [
      {
        id: "money",
        label: "보유 자금",
        current: input.money,
        target: FIVE_YEAR_REVIEW.business.minMoney,
        format: "money",
      },
      {
        id: "releases",
        label: "앨범",
        current: releases,
        target: FIVE_YEAR_REVIEW.business.minReleases,
        format: "number",
      },
    ]),
    routeProgress("awards", [
      {
        id: "awards",
        label: "수상",
        current: input.awards,
        target: FIVE_YEAR_REVIEW.awards.minAwards,
        format: "number",
      },
      {
        id: "industry",
        label: "업계 평판",
        current: input.industry,
        target: FIVE_YEAR_REVIEW.awards.minIndustry,
        format: "number",
      },
    ]),
  ];
}

export function evaluateFiveYearVictoryRoutes(
  input: FiveYearReviewInput,
): FiveYearReviewRoute[] {
  return getFiveYearRouteProgress(input)
    .filter((progress) => progress.achieved)
    .map((progress) => progress.route);
}

export function createFiveYearReviewRecord(
  input: FiveYearReviewInput,
): FiveYearReviewRecord {
  const progress = getFiveYearRouteProgress(input);
  const releases = input.albumQualities.length;
  const averageAlbumQuality =
    releases > 0
      ? input.albumQualities.reduce((sum, quality) => sum + quality, 0) /
        releases
      : 0;

  return {
    year: FIVE_YEAR_REVIEW.year,
    week: FIVE_YEAR_REVIEW.week,
    score: Math.round(
      progress.reduce((sum, route) => sum + route.ratio, 0) *
        FIVE_YEAR_REVIEW.leaderboardPointsPerRoute,
    ),
    achievedRoutes: progress
      .filter((route) => route.achieved)
      .map((route) => route.route),
    routeProgress: Object.fromEntries(
      progress.map((route) => [route.route, route.ratio]),
    ) as Record<FiveYearReviewRoute, number>,
    metrics: {
      releases,
      topTenAlbums: input.topTenAlbums,
      averageAlbumQuality,
      bestAlbumQuality:
        releases > 0 ? Math.max(...input.albumQualities) : 0,
      public: input.public,
      fandom: input.fandom,
      fandomLoyalty: input.fandomLoyalty,
      global: input.global,
      industry: input.industry,
      money: input.money,
      awards: input.awards,
      strategicExpansion: { ...input.strategicExpansion },
    },
  };
}
