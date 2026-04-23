import { useStore } from "zustand";
import { createStore } from "zustand/vanilla";
import { SEASON_CONCEPT_BONUSES } from "@/data/gameBalance";
import { SEASONAL_NEWS_POOL } from "@/data/marketHeadlines";
import type { CalendarStore, CalendarStoreState, Season } from "@/types/game";

function createInitialNews(season: Season) {
  return SEASONAL_NEWS_POOL[season].slice(0, 2).map((news, index) => ({
    ...news,
    id: `news-${season}-${index + 1}`,
    week: 1,
  }));
}

const initialCalendarState: CalendarStoreState = {
  currentSeason: "spring",
  seasonConceptBonus: SEASON_CONCEPT_BONUSES.spring,
  kpopNews: createInitialNews("spring"),
  upcomingCompetitorComebacks: [
    { week: 3, competitorId: "rival-nova", competitorName: "NOVA" },
    { week: 6, competitorId: "rival-aegis", competitorName: "AEGIS" },
  ],
  marketTrend: {
    hotGenre: "dance",
    coldGenre: "ballad",
    hotMood: "fresh",
    coldMood: "dark",
  },
};

export const calendarVanillaStore = createStore<CalendarStore>()((set) => ({
  ...initialCalendarState,
  updateSeason: (season) =>
    set(() => ({
      currentSeason: season,
      seasonConceptBonus: SEASON_CONCEPT_BONUSES[season],
    })),
  addNews: (news) =>
    set((state) => ({
      kpopNews: [news, ...state.kpopNews].slice(0, 8),
    })),
  updateTrend: (trend) =>
    set((state) => ({
      marketTrend: {
        ...state.marketTrend,
        ...trend,
      },
    })),
  updateComebacks: (comebacks) =>
    set(() => ({
      upcomingCompetitorComebacks: comebacks,
    })),
}));

export const useCalendarStore = <T>(selector: (state: CalendarStore) => T) =>
  useStore(calendarVanillaStore, selector);
