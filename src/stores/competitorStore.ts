import { useStore } from "zustand";
import { createStore } from "zustand/vanilla";
import type {
  CompetitorGroup,
  CompetitorStore,
  CompetitorStoreState,
  EventCompetitor,
} from "@/types/game";

const initialPermanentRivals: CompetitorGroup[] = [
  {
    id: "rival-nova",
    name: "NOVA",
    agency: "MajorOne",
    type: "traditional",
    stats: { vocal: 74, dance: 77, visual: 83, marketing: 88 },
    fandom: 6400,
    public: 41,
    global: 1900,
    industry: 52,
    activeWeeks: 24,
    debutYear: 1,
    strengths: ["Polished debut system", "Reliable broadcast support"],
    weaknesses: ["Low individuality", "Safe concept bias"],
  },
  {
    id: "rival-pulse",
    name: "PULSE",
    agency: "ClipLab",
    type: "viral",
    stats: { vocal: 59, dance: 72, visual: 78, marketing: 93 },
    fandom: 5100,
    public: 49,
    global: 3300,
    industry: 29,
    activeWeeks: 17,
    debutYear: 1,
    strengths: ["Short-form virality", "High variety conversion"],
    weaknesses: ["Weak musical reputation", "Controversy prone"],
  },
  {
    id: "rival-aegis",
    name: "AEGIS",
    agency: "StageCraft",
    type: "performance",
    stats: { vocal: 68, dance: 91, visual: 69, marketing: 58 },
    fandom: 4700,
    public: 28,
    global: 2600,
    industry: 58,
    activeWeeks: 31,
    debutYear: 1,
    strengths: ["Elite stages", "Strong industry respect"],
    weaknesses: ["Weak casual reach", "Limited humor appeal"],
  },
];

const initialCompetitorState: CompetitorStoreState = {
  permanentRivals: initialPermanentRivals,
  eventRivals: [],
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
