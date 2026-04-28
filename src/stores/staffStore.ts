import { useStore } from "zustand";
import { createStore } from "zustand/vanilla";
import type { StaffStore, StaffStoreState } from "@/types/game";

const initialStaffState: StaffStoreState = {
  staff: [],
};

export const staffVanillaStore = createStore<StaffStore>()((set) => ({
  ...initialStaffState,
  hireStaff: (member) =>
    set((state) => ({
      staff: [...state.staff, member],
    })),
  fireStaff: (staffId) =>
    set((state) => ({
      staff: state.staff.filter((member) => member.id !== staffId),
    })),
}));

export const useStaffStore = <T>(selector: (state: StaffStore) => T) =>
  useStore(staffVanillaStore, selector);
