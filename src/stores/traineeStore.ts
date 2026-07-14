import { useStore } from "zustand";
import { createStore } from "zustand/vanilla";
import type {
  ConceptMood,
  Trainee,
  TraineeStore,
  TraineeStoreState,
} from "@/types/game";

export const initialTraineeState: TraineeStoreState = {
  trainees: [],
};

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(value, max));
}

export const traineeVanillaStore = createStore<TraineeStore>()((set) => ({
  ...initialTraineeState,
  addTrainee: (trainee) =>
    set((state) => ({
      // 같은 id가 이미 있으면 교체한다 — 창단 플로우에서 "이전" 후 재진행해도 멤버가 복제되지 않는다.
      trainees: state.trainees.some((existing) => existing.id === trainee.id)
        ? state.trainees.map((existing) =>
            existing.id === trainee.id ? trainee : existing,
          )
        : [...state.trainees, trainee],
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
