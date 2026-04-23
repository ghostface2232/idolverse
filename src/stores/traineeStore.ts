import { useStore } from "zustand";
import { createStore } from "zustand/vanilla";
import type {
  ConceptMood,
  Trainee,
  TraineeStore,
  TraineeStoreState,
} from "@/types/game";

function createAffinity(values: Partial<Record<ConceptMood, number>>) {
  return {
    refreshing: 50,
    cute: 50,
    dark: 50,
    retro: 50,
    girlCrush: 50,
    sophisticated: 50,
    powerful: 50,
    dreamy: 50,
    y2k: 50,
    sexy: 50,
    ...values,
  };
}

const initialTrainees: Trainee[] = [
  {
    id: "trainee-1",
    name: "Minseo",
    age: 19,
    nationality: "korean",
    stats: {
      visual: 86,
      vocal: 78,
      dance: 71,
      charm: 63,
      stamina: 69,
      diligence: 82,
      mental: 68,
    },
    position: "leader",
    subPosition: "mainVocal",
    conceptAffinity: createAffinity({ refreshing: 88, dreamy: 78, dark: 35 }),
    mood: 74,
    stress: 31,
    condition: 79,
    satisfaction: 77,
    potential: 1.32,
    chemistry: {
      "trainee-2": 21,
      "trainee-3": 14,
      "trainee-4": -4,
      "trainee-5": 28,
    },
    currentActivity: "training",
    injuryWeeks: 0,
  },
  {
    id: "trainee-2",
    name: "Yui",
    age: 18,
    nationality: "japanese",
    stats: {
      visual: 74,
      vocal: 66,
      dance: 89,
      charm: 71,
      stamina: 77,
      diligence: 73,
      mental: 62,
    },
    position: "mainDancer",
    subPosition: "center",
    conceptAffinity: createAffinity({ y2k: 84, refreshing: 82, retro: 68 }),
    mood: 69,
    stress: 36,
    condition: 76,
    satisfaction: 74,
    potential: 1.41,
    chemistry: {
      "trainee-1": 21,
      "trainee-3": 18,
      "trainee-4": 11,
      "trainee-5": 9,
    },
    currentActivity: "training",
    injuryWeeks: 0,
  },
  {
    id: "trainee-3",
    name: "Lina",
    age: 20,
    nationality: "thai",
    stats: {
      visual: 91,
      vocal: 58,
      dance: 73,
      charm: 82,
      stamina: 65,
      diligence: 61,
      mental: 66,
    },
    position: "visual",
    subPosition: "variety",
    conceptAffinity: createAffinity({ girlCrush: 80, dark: 76, sexy: 52, cute: 28 }),
    mood: 72,
    stress: 28,
    condition: 80,
    satisfaction: 71,
    potential: 1.18,
    chemistry: {
      "trainee-1": 14,
      "trainee-2": 18,
      "trainee-4": 26,
      "trainee-5": -7,
    },
    currentActivity: "entertainment",
    injuryWeeks: 0,
  },
  {
    id: "trainee-4",
    name: "Hana",
    age: 17,
    nationality: "korean",
    stats: {
      visual: 68,
      vocal: 83,
      dance: 59,
      charm: 57,
      stamina: 72,
      diligence: 88,
      mental: 75,
    },
    position: "mainVocal",
    subPosition: null,
    conceptAffinity: createAffinity({ dreamy: 86, sophisticated: 72, girlCrush: 24 }),
    mood: 77,
    stress: 24,
    condition: 82,
    satisfaction: 79,
    potential: 1.56,
    chemistry: {
      "trainee-1": -4,
      "trainee-2": 11,
      "trainee-3": 26,
      "trainee-5": 17,
    },
    currentActivity: "training",
    injuryWeeks: 0,
  },
  {
    id: "trainee-5",
    name: "Ari",
    age: 18,
    nationality: "american",
    stats: {
      visual: 79,
      vocal: 62,
      dance: 69,
      charm: 87,
      stamina: 74,
      diligence: 64,
      mental: 59,
    },
    position: "variety",
    subPosition: "center",
    conceptAffinity: createAffinity({ refreshing: 76, cute: 71, y2k: 79 }),
    mood: 68,
    stress: 38,
    condition: 73,
    satisfaction: 70,
    potential: 1.27,
    chemistry: {
      "trainee-1": 28,
      "trainee-2": 9,
      "trainee-3": -7,
      "trainee-4": 17,
    },
    currentActivity: "individual",
    injuryWeeks: 0,
  },
];

const initialTraineeState: TraineeStoreState = {
  trainees: initialTrainees,
};

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(value, max));
}

export const traineeVanillaStore = createStore<TraineeStore>()((set) => ({
  ...initialTraineeState,
  addTrainee: (trainee) =>
    set((state) => ({
      trainees: [...state.trainees, trainee],
    })),
  removeTrainee: (traineeId) =>
    set((state) => ({
      trainees: state.trainees.filter((trainee) => trainee.id !== traineeId),
    })),
  updateStats: (traineeId, stats) =>
    set((state) => ({
      trainees: state.trainees.map((trainee) =>
        trainee.id === traineeId
          ? {
              ...trainee,
              stats: {
                ...trainee.stats,
                ...Object.fromEntries(
                  Object.entries(stats).map(([key, value]) => [
                    key,
                    clamp(value ?? trainee.stats[key as keyof Trainee["stats"]], 1, 100),
                  ]),
                ),
              },
            }
          : trainee,
      ),
    })),
  updateCondition: (traineeId, updates) =>
    set((state) => ({
      trainees: state.trainees.map((trainee) =>
        trainee.id === traineeId
          ? {
              ...trainee,
              ...("condition" in updates && updates.condition !== undefined
                ? { condition: clamp(updates.condition, 0, 100) }
                : {}),
              ...("stress" in updates && updates.stress !== undefined
                ? { stress: clamp(updates.stress, 0, 100) }
                : {}),
              ...("mood" in updates && updates.mood !== undefined
                ? { mood: clamp(updates.mood, 0, 100) }
                : {}),
              ...(updates.injuryWeeks !== undefined
                ? { injuryWeeks: Math.max(0, updates.injuryWeeks) }
                : {}),
              ...(updates.currentActivity !== undefined
                ? { currentActivity: updates.currentActivity }
                : {}),
            }
          : trainee,
      ),
    })),
  assignPosition: (traineeId, position, subPosition = null) =>
    set((state) => ({
      trainees: state.trainees.map((trainee) =>
        trainee.id === traineeId
          ? {
              ...trainee,
              position,
              subPosition,
            }
          : trainee,
      ),
    })),
  updateChemistry: (traineeId, targetId, value) =>
    set((state) => ({
      trainees: state.trainees.map((trainee) => {
        if (trainee.id !== traineeId && trainee.id !== targetId) {
          return trainee;
        }

        const counterpartId = trainee.id === traineeId ? targetId : traineeId;

        return {
          ...trainee,
          chemistry: {
            ...trainee.chemistry,
            [counterpartId]: clamp(value, -100, 100),
          },
        };
      }),
    })),
  updateSatisfaction: (traineeId, satisfaction) =>
    set((state) => ({
      trainees: state.trainees.map((trainee) =>
        trainee.id === traineeId
          ? {
              ...trainee,
              satisfaction: clamp(satisfaction, 0, 100),
            }
          : trainee,
      ),
    })),
}));

export const useTraineeStore = <T>(selector: (state: TraineeStore) => T) =>
  useStore(traineeVanillaStore, selector);
