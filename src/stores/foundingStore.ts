import { useStore } from "zustand";
import { createStore } from "zustand/vanilla";
import type { Staff, StaffRole, Trainee, Position } from "@/types/game";
import { isRequiredPosition, type FoundingStep } from "@/data/founding";

interface FacilitySelections {
  dormLevel: 1 | 2 | 3 | 4;
  studioLevel: 1 | 2 | 3 | 4;
  equipmentLevel: 1 | 2 | 3 | 4;
  livingExpenseLevel: 1 | 2 | 3 | 4;
  hasHealthcare: boolean;
  hasSecurity: boolean;
}

interface FoundingStoreState {
  foundingStep: FoundingStep;
  staffCandidates: Record<StaffRole, Staff[]>;
  staffCandidateSeed: number;
  facilitySelections: FacilitySelections;
  auditionMethod: "open" | "scout";
  auditionExtraBudget: number;
  auditionHeadcount: 5 | 7 | 9 | 12;
  auditionCandidates: Trainee[];
  auditionExecuted: boolean;
  selectedTraineeIds: string[];
  positionAssignments: Partial<Record<Position, string | null>>;
}

interface FoundingStoreActions {
  setFoundingStep: (step: FoundingStep) => void;
  setStaffCandidates: (role: StaffRole, candidates: Staff[]) => void;
  setStaffCandidateSeed: (seed: number) => void;
  updateFacilitySelection: (updates: Partial<FacilitySelections>) => void;
  setAuditionMethod: (method: "open" | "scout") => void;
  setAuditionExtraBudget: (budget: number) => void;
  setAuditionHeadcount: (count: 5 | 7 | 9 | 12) => void;
  setAuditionCandidates: (candidates: Trainee[]) => void;
  setAuditionExecuted: (executed: boolean) => void;
  toggleTraineeSelection: (traineeId: string) => void;
  assignPosition: (position: Position, traineeId: string | null) => void;
  resetFoundingStore: () => void;
}

type FoundingStore = FoundingStoreState & FoundingStoreActions;

const initialFoundingState: FoundingStoreState = {
  foundingStep: "staff",
  staffCandidates: { manager: [], producer: [], designer: [], marketer: [] },
  staffCandidateSeed: Date.now(),
  facilitySelections: {
    dormLevel: 1,
    studioLevel: 1,
    equipmentLevel: 1,
    livingExpenseLevel: 1,
    hasHealthcare: false,
    hasSecurity: false,
  },
  auditionMethod: "open",
  auditionExtraBudget: 0,
  auditionHeadcount: 5,
  auditionCandidates: [],
  auditionExecuted: false,
  selectedTraineeIds: [],
  positionAssignments: {},
};

export const foundingVanillaStore = createStore<FoundingStore>()((set) => ({
  ...initialFoundingState,
  setFoundingStep: (step) => set({ foundingStep: step }),
  setStaffCandidates: (role, candidates) =>
    set((state) => ({
      staffCandidates: { ...state.staffCandidates, [role]: candidates },
    })),
  setStaffCandidateSeed: (seed) => set({ staffCandidateSeed: seed }),
  updateFacilitySelection: (updates) =>
    set((state) => ({
      facilitySelections: { ...state.facilitySelections, ...updates },
    })),
  setAuditionMethod: (method) => set({ auditionMethod: method }),
  setAuditionExtraBudget: (budget) => set({ auditionExtraBudget: budget }),
  setAuditionHeadcount: (count) => set({ auditionHeadcount: count }),
  setAuditionCandidates: (candidates) => set({ auditionCandidates: candidates }),
  setAuditionExecuted: (executed) => set({ auditionExecuted: executed }),
  toggleTraineeSelection: (traineeId) =>
    set((state) => {
      const ids = state.selectedTraineeIds;
      return {
        selectedTraineeIds: ids.includes(traineeId)
          ? ids.filter((id) => id !== traineeId)
          : [...ids, traineeId],
      };
    }),
  assignPosition: (position, traineeId) =>
    set((state) => {
      const assignments: Partial<Record<Position, string | null>> = {
        ...state.positionAssignments,
      };

      if (traineeId === null) {
        assignments[position] = null;
        return { positionAssignments: assignments };
      }

      if (isRequiredPosition(position)) {
        for (const slot of Object.keys(assignments) as Position[]) {
          if (
            slot !== position &&
            isRequiredPosition(slot) &&
            assignments[slot] === traineeId
          ) {
            assignments[slot] = null;
          }
        }
      } else {
        for (const slot of Object.keys(assignments) as Position[]) {
          if (
            slot !== position &&
            !isRequiredPosition(slot) &&
            assignments[slot] === traineeId
          ) {
            assignments[slot] = null;
          }
        }
      }

      assignments[position] = traineeId;
      return { positionAssignments: assignments };
    }),
  resetFoundingStore: () => set({ ...initialFoundingState, staffCandidateSeed: Date.now() }),
}));

export const useFoundingStore = <T>(selector: (state: FoundingStore) => T) =>
  useStore(foundingVanillaStore, selector);
