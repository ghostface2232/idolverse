import { useStore } from "zustand";
import { createStore } from "zustand/vanilla";
import type {
  BackgroundGroup,
  CompetitorGroup,
  CompetitorStore,
  CompetitorStoreState,
  EventCompetitor,
} from "@/types/game";

const initialPermanentRivals: CompetitorGroup[] = [
  {
    id: "rival-nova",
    name: "루미나라",
    agency: "크라운뮤직",
    gender: "female",
    type: "traditional",
    stats: { vocal: 74, dance: 77, visual: 83, marketing: 88 },
    fandom: 6400,
    public: 41,
    global: 1900,
    industry: 52,
    activeWeeks: 24,
    debutYear: 1,
    strengths: ["빈틈없는 제작진", "안정적인 방송 편성"],
    weaknesses: ["낮은 개성", "보수적 콘셉트"],
  },
  {
    id: "rival-pulse",
    name: "피킷",
    agency: "버즈팩토리",
    gender: "female",
    type: "viral",
    stats: { vocal: 59, dance: 72, visual: 78, marketing: 93 },
    fandom: 5100,
    public: 49,
    global: 3300,
    industry: 29,
    activeWeeks: 17,
    debutYear: 1,
    strengths: ["숏폼 바이럴", "높은 예능 전환율"],
    weaknesses: ["음악성 평판 약세", "논란 리스크"],
  },
  {
    id: "rival-aegis",
    name: "볼티지",
    agency: "레드아크",
    gender: "female",
    type: "performance",
    stats: { vocal: 68, dance: 91, visual: 69, marketing: 58 },
    fandom: 4700,
    public: 28,
    global: 2600,
    industry: 58,
    activeWeeks: 31,
    debutYear: 1,
    strengths: ["압도적 무대", "높은 업계 신뢰"],
    weaknesses: ["대중 확장 느림", "예능 약세"],
  },
];

const initialBackgroundGroups: BackgroundGroup[] = [
  {
    id: "bg-magnus",
    name: "매그너스",
    agency: "크라운뮤직",
    gender: "male",
    chartScore: 72,
  },
  {
    id: "bg-hardbeat",
    name: "하드비트",
    agency: "레드아크",
    gender: "male",
    chartScore: 65,
  },
  {
    id: "bg-cross",
    name: "크로스",
    agency: "스텔라쉽",
    gender: "male",
    chartScore: 58,
  },
  {
    id: "bg-genesis",
    name: "제네시스",
    agency: "골든리프",
    gender: "male",
    chartScore: 45,
  },
];

export const initialCompetitorState: CompetitorStoreState = {
  permanentRivals: initialPermanentRivals,
  eventRivals: [],
  backgroundGroups: initialBackgroundGroups,
};

export const competitorVanillaStore = createStore<CompetitorStore>()((set) => ({
  ...initialCompetitorState,
  addPermanentRival: (rival) =>
    set((state) => ({
      permanentRivals: [...state.permanentRivals, rival],
    })),
  updateRival: (rivalId, updates, eventRival = false) =>
    set((state) => ({
      permanentRivals: eventRival
        ? state.permanentRivals
        : state.permanentRivals.map((rival) =>
            rival.id === rivalId ? { ...rival, ...updates } : rival,
          ),
      eventRivals: eventRival
        ? state.eventRivals.map((rival) =>
            rival.id === rivalId ? { ...rival, ...updates } as EventCompetitor : rival,
          )
        : state.eventRivals,
    })),
  spawnEventRival: (rival) =>
    set((state) => ({
      eventRivals: [...state.eventRivals, rival],
    })),
  removeEventRival: (rivalId) =>
    set((state) => ({
      eventRivals: state.eventRivals.filter((rival) => rival.id !== rivalId),
    })),
}));

export const useCompetitorStore = <T>(
  selector: (state: CompetitorStore) => T,
) => useStore(competitorVanillaStore, selector);
