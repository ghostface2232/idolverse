import { MARKET_HEADLINES } from "@/data/marketHeadlines";
import { createSeededRandom } from "@/lib/seededRandom";
import type { SeasonKey } from "@/types/game";

export function pickMarketHeadline(week: number, season: SeasonKey) {
  const options = MARKET_HEADLINES[season];
  const random = createSeededRandom(week * 211 + season.charCodeAt(0));
  const index = Math.floor(random() * options.length);

  return options[index];
}

