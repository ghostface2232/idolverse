import { useStore } from "zustand";
import { createStore } from "zustand/vanilla";
import type { StaffStore, StaffStoreState } from "@/types/game";

const initialStaffState: StaffStoreState = {
  staff: [
    {
      id: "staff-1",
      name: "J. Park",
      role: "manager",
      ability: 74,
      salary: 6200000,
      specialty: "Schedule efficiency",
    },
    {
      id: "staff-2",
      name: "Yerin",
      role: "producer",
      ability: 79,
      salary: 7800000,
      specialty: "Hook writing",
    },
    {
      id: "staff-3",
      name: "Theo",
      role: "marketer",
      ability: 68,
      salary: 5400000,
      specialty: "Short-form campaigns",
    },
  ],
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
