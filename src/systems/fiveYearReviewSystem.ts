import { FIVE_YEAR_REVIEW } from "@/data/balance";
import type { StrategicExpansionLevels } from "@/types/game";

export type FiveYearVictoryRoute =
  | "hitmaker"
  | "fandom"
  | "global"
  | "business"
  | "awards";

export const FIVE_YEAR_VICTORY_ROUTE_LABELS: Record<
  FiveYearVictoryRoute,
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
  public: number;
  fandom: number;
  fandomLoyalty: number;
  global: number;
  industry: number;
  money: number;
  awards: number;
  strategicExpansion: StrategicExpansionLevels;
}

export function evaluateFiveYearVictoryRoutes(
  input: FiveYearReviewInput,
): FiveYearVictoryRoute[] {
  const routes: FiveYearVictoryRoute[] = [];
  const releases = input.albumQualities.length;
  const bestQuality = releases > 0 ? Math.max(...input.albumQualities) : 0;
  const averageQuality =
    releases > 0
      ? input.albumQualities.reduce((sum, quality) => sum + quality, 0) / releases
      : 0;

  if (
    releases >= FIVE_YEAR_REVIEW.hitmaker.minReleases &&
    averageQuality >= FIVE_YEAR_REVIEW.hitmaker.minAverageQuality &&
    bestQuality >= FIVE_YEAR_REVIEW.hitmaker.minBestQuality
  ) {
    routes.push("hitmaker");
  }
  if (
    input.public >= FIVE_YEAR_REVIEW.fandom.minPublic &&
    input.fandom >= FIVE_YEAR_REVIEW.fandom.minFandom &&
    input.fandomLoyalty >= FIVE_YEAR_REVIEW.fandom.minLoyalty &&
    input.strategicExpansion.fandom >= FIVE_YEAR_REVIEW.fandom.minExpansionLevel
  ) {
    routes.push("fandom");
  }
  if (
    input.global >= FIVE_YEAR_REVIEW.global.minGlobal &&
    input.industry >= FIVE_YEAR_REVIEW.global.minIndustry &&
    input.strategicExpansion.global >= FIVE_YEAR_REVIEW.global.minExpansionLevel
  ) {
    routes.push("global");
  }
  if (
    input.money >= FIVE_YEAR_REVIEW.business.minMoney &&
    releases >= FIVE_YEAR_REVIEW.business.minReleases
  ) {
    routes.push("business");
  }
  if (
    input.awards >= FIVE_YEAR_REVIEW.awards.minAwards &&
    input.industry >= FIVE_YEAR_REVIEW.awards.minIndustry
  ) {
    routes.push("awards");
  }

  return routes;
}
