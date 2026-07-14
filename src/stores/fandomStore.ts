import { useStore } from "zustand";
import { createStore } from "zustand/vanilla";
import type { FandomStore, FandomStoreState } from "@/types/game";

export const initialFandomState: FandomStoreState = {
  public: 5,
  fandom: 0,
  fandomLoyalty: 50,
  fandomDisappointment: 0,
  global: 0,
  industry: 8,
  chartPositions: {
    melon: 0,
    spotify: 0,
    youtube: 0,
    albumSales: 0,
  },
  weeklyRevenue: {
    streaming: 0,
    album: 0,
    concert: 0,
    ads: 0,
    goods: 0,
    other: 0,
  },
};

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(value, max));
}

export const fandomVanillaStore = createStore<FandomStore>()((set) => ({
  ...initialFandomState,
  updatePublic: (value) =>
    set(() => ({
      public: clamp(value, 0, 100),
    })),
  updateFandom: (value, loyalty) =>
    set((state) => ({
      fandom: Math.max(0, value),
      fandomLoyalty:
        loyalty === undefined ? state.fandomLoyalty : clamp(loyalty, 0, 100),
    })),
  updateGlobal: (value) =>
    set(() => ({
      global: Math.max(0, value),
    })),
  updateIndustry: (value) =>
    set(() => ({
      industry: clamp(value, 0, 100),
    })),
  updateCharts: (charts) =>
    set((state) => ({
      chartPositions: {
        ...state.chartPositions,
        ...charts,
      },
    })),
  addDisappointment: (amount) =>
    set((state) => ({
      fandomDisappointment: clamp(state.fandomDisappointment + amount, 0, 100),
      fandomLoyalty: clamp(state.fandomLoyalty - Math.max(0, amount / 2), 0, 100),
    })),
  resetRevenue: () =>
    set((state) => ({
      weeklyRevenue: Object.fromEntries(
        Object.keys(state.weeklyRevenue).map((key) => [key, 0]),
      ) as FandomStoreState["weeklyRevenue"],
    })),
}));

export const useFandomStore = <T>(selector: (state: FandomStore) => T) =>
  useStore(fandomVanillaStore, selector);
