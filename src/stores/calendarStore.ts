import { useStore } from "zustand";
import { createStore } from "zustand/vanilla";
import { SEASON_MOOD_FIT } from "@/data/concepts";
import { DEFAULT_MARKET_TRENDS, SEASONAL_NEWS_POOL } from "@/data/kpopCalendar";
import type { CalendarStore, CalendarStoreState, Season } from "@/types/game";

function createInitialNews(season: Season) {
  return SEASONAL_NEWS_POOL[season].slice(0, 2).map((news, index) => ({
    ...news,
    id: `news-${season}-${index + 1}`,
    week: 1,
  }));
}

export const initialCalendarState: CalendarStoreState = {
  currentSeason: "spring",
  seasonConceptBonus: SEASON_MOOD_FIT.spring,
  kpopNews: createInitialNews("spring"),
  // 컴백 일정은 주간 시뮬레이션이 실제 라이벌 기준으로 채운다 — 가짜 초기값을 두지 않는다.
  upcomingCompetitorComebacks: [],
  marketTrend: DEFAULT_MARKET_TRENDS.spring,
};

export const calendarVanillaStore = createStore<CalendarStore>()((set) => ({
  ...initialCalendarState,
  updateSeason: (season) =>
    set(() => ({
      currentSeason: season,
      seasonConceptBonus: SEASON_MOOD_FIT[season],
      marketTrend: DEFAULT_MARKET_TRENDS[season],
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
