import { TREND_FORECAST } from "@/data/balance";
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
  year: number,
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
    // 연도를 포함해야 2년차 이후 같은 주차의 뉴스와 id가 충돌하지 않는다.
    id: `news-y${year}-w${week}-${i}`,
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

const SEASON_ORDER: Season[] = ["spring", "summer", "fall", "winter"];
const SEASON_LAST_WEEK: Record<Season, number> = {
  spring: 13,
  summer: 26,
  fall: 39,
  winter: 52,
};

export interface TrendForecast {
  season: Season;
  /** 예보 적용까지 남은 주. */
  weeksUntil: number;
  hotMood: ConceptMood;
  hotGenre: Genre;
}

/**
 * 다음 시즌 트렌드 예보. 실제 트렌드는 시즌 경계 주(SEASON_LAST_WEEK)의
 * 주간 시드로 확정되므로(weekProcessor 13.5단계의 seed+100), 같은 시드를
 * 미리 굴려 "진짜" 다음 트렌드를 계산한 뒤 적중률만큼 노이즈를 섞는다 —
 * 예보를 읽고 컨셉을 베팅하되, 예보가 빗나갈 수도 있는 구조.
 */
export function forecastNextSeasonTrend(input: {
  currentYear: number;
  currentWeek: number;
  currentSeason: Season;
  campaignSeed: number;
}): TrendForecast {
  const { currentYear, currentWeek, currentSeason, campaignSeed } = input;
  const boundaryWeek = SEASON_LAST_WEEK[currentSeason];
  const nextSeason =
    SEASON_ORDER[(SEASON_ORDER.indexOf(currentSeason) + 1) % SEASON_ORDER.length];
  // weekProcessor의 주간 시드 공식과 동일해야 한다. 경계 주를 처리할 때
  // snapshot은 아직 현재 연도를 들고 있다(겨울→봄 포함).
  const boundarySeed =
    boundaryWeek * 997 + currentYear * 31 + campaignSeed + 100;
  const actual = updateSeasonTrend(nextSeason, boundarySeed);

  // 예보 노이즈는 시즌당 한 번만 굴린다(주가 흘러도 예보가 흔들리지 않게).
  const noise = createSeededRandom(campaignSeed * 7 + currentYear * 53 + boundaryWeek);
  let hotMood = actual.hotMood;
  let hotGenre = actual.hotGenre;
  if (noise() >= TREND_FORECAST.accuracy) {
    const fits = SEASON_MOOD_FIT[nextSeason];
    const alternates = (Object.keys(fits) as ConceptMood[])
      .filter((mood) => mood !== actual.hotMood)
      .sort((a, b) => fits[b] - fits[a]);
    hotMood = alternates[Math.floor(noise() * 3)] ?? actual.hotMood;
  }
  if (noise() >= TREND_FORECAST.accuracy) {
    hotGenre = DEFAULT_MARKET_TRENDS[nextSeason].hotGenre;
    if (hotGenre === actual.hotGenre) {
      hotGenre = DEFAULT_MARKET_TRENDS[currentSeason].hotGenre;
    }
  }

  return {
    season: nextSeason,
    weeksUntil: Math.max(0, boundaryWeek - currentWeek + 1),
    hotMood,
    hotGenre,
  };
}

export function getSeasonConceptBonus(
  season: Season,
  mood: ConceptMood,
): number {
  return SEASON_MOOD_FIT[season][mood];
}
