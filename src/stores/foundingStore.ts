import { useStore } from "zustand";
import { createStore } from "zustand/vanilla";
import type { Staff, StaffRole, Trainee, Position } from "@/types/game";
import type { FoundingStep } from "@/data/founding";

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
  auditionHeadcount: 3 | 5 | 7 | 9;
  auditionCandidates: Trainee[];
  auditionExecuted: boolean;
  selectedTraineeIds: string[];
  positionAssignments: Record<string, Position | null>;
  subPositionAssignments: Record<string, Position | null>;
}

interface FoundingStoreActions {
  setFoundingStep: (step: FoundingStep) => void;
  setStaffCandidates: (role: StaffRole, candidates: Staff[]) => void;
  setStaffCandidateSeed: (seed: number) => void;
  updateFacilitySelection: (updates: Partial<FacilitySelections>) => void;
  setAuditionMethod: (method: "open" | "scout") => void;
  setAuditionExtraBudget: (budget: number) => void;
  setAuditionHeadcount: (count: 3 | 5 | 7 | 9) => void;
  setAuditionCandidates: (candidates: Trainee[]) => void;
  setAuditionExecuted: (executed: boolean) => void;
  toggleTraineeSelection: (traineeId: string) => void;
  assignPosition: (traineeId: string, position: Position | null) => void;
  assignSubPosition: (traineeId: string, position: Position | null) => void;
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
  subPositionAssignments: {},
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
  assignPosition: (traineeId, position) =>
    set((state) => {
      const assignments = { ...state.positionAssignments };
      for (const [id, pos] of Object.entries(assignments)) {
        if (pos === position && position !== null) {
          assignments[id] = null;
        }
      }
      assignments[traineeId] = position;
      return { positionAssignments: assignments };
    }),
  assignSubPosition: (traineeId, position) =>
    set((state) => ({
      subPositionAssignments: { ...state.subPositionAssignments, [traineeId]: position },
    })),
  resetFoundingStore: () => set({ ...initialFoundingState, staffCandidateSeed: Date.now() }),
}));

export const useFoundingStore = <T>(selector: (state: FoundingStore) => T) =>
  useStore(foundingVanillaStore, selector);
