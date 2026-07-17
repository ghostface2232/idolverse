import { DEFAULT_MARKET_TRENDS, SEASONAL_NEWS_POOL } from "@/data/kpopCalendar";
import { SEASON_MOOD_FIT } from "@/data/concepts";
import { createSeededRandom, pickUniqueItems } from "@/lib/seededRandom";
import { withJosa } from "@/utils/josa";
import type {
  CompetitorGroup,
  ConceptMood,
  Genre,
  KPopNews,
  Season,
} from "@/types/game";

export interface MarketTrend {
  hotGenre: Genre;
  coldGenre: Genre;
  hotMood: ConceptMood;
  coldMood: ConceptMood;
}

export function generateWeeklyNews(
  week: number,
  season: Season,
  competitors: readonly CompetitorGroup[],
  seed: number,
): KPopNews[] {
  const random = createSeededRandom(seed);
  const count = random() < 0.3 ? 2 : 1;

  const seasonPool = SEASONAL_NEWS_POOL[season] ?? [];

  const activeCompetitors = competitors.filter((c) => c.currentAlbum);
  const competitorNews: Omit<KPopNews, "id" | "week">[] = activeCompetitors
    .slice(0, 2)
    .map((c) => ({
      headline: `${c.name}, '${c.currentAlbum!.title}' 활동 중`,
      detail: `${c.agency} 소속 ${withJosa(c.name, "이/가")} 차트에서 선전하고 있습니다.`,
      type: "competitor" as const,
    }));

  const fullPool = [...seasonPool, ...competitorNews];
  const picked = pickUniqueItems(fullPool, count, seed + 17);

  return picked.map((n, i) => ({
    ...n,
    id: `news-w${week}-${i}`,
    week,
  }));
}

export function updateSeasonTrend(
  season: Season,
  seed: number,
): MarketTrend {
  const base = DEFAULT_MARKET_TRENDS[season];
  const random = createSeededRandom(seed);

  if (random() < 0.8) {
    return { ...base };
  }

  const allMoods: ConceptMood[] = [
    "refreshing", "dark", "retro", "girlCrush", "cute",
    "sophisticated", "powerful", "dreamy", "y2k", "sexy",
  ];
  const seasonFits = SEASON_MOOD_FIT[season];
  const sorted = [...allMoods].sort((a, b) => seasonFits[b] - seasonFits[a]);
  const hotMood = sorted[Math.floor(random() * 3)];
  const coldMood = sorted[sorted.length - 1 - Math.floor(random() * 2)];

  return { ...base, hotMood, coldMood };
}

export function getSeasonConceptBonus(
  season: Season,
  mood: ConceptMood,
): number {
  return SEASON_MOOD_FIT[season][mood];
}
