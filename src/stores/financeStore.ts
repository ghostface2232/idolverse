import { useStore } from "zustand";
import { createStore } from "zustand/vanilla";
import { WEEKS_PER_MONTH } from "@/data/balance";
import type { FinanceStore, FinanceStoreState } from "@/types/game";

const UPGRADE_COSTS = {
  dormLevel: { 1: 9000000, 2: 14000000, 3: 22000000, 4: 0 },
  studioLevel: { 1: 12000000, 2: 18000000, 3: 26000000, 4: 0 },
  equipmentLevel: { 1: 8000000, 2: 15000000, 3: 23000000, 4: 0 },
  hasHealthcare: 7000000,
  hasSecurity: 6000000,
} as const;

// fixedCosts entries are monthly amounts (facility tiers, staff salaries) — convert before weekly deduction.
export function calculateWeeklyFixedTotal(costs: FinanceStoreState["fixedCosts"]) {
  const monthlyTotal = Object.values(costs).reduce((sum, value) => sum + value, 0);
  return Math.round(monthlyTotal / WEEKS_PER_MONTH);
}

const initialFixedCosts: FinanceStoreState["fixedCosts"] = {
  dormitory: 0,
  studio: 0,
  staffSalary: 0,
  livingExpense: 0,
  equipment: 0,
  healthcare: 0,
  security: 0,
};

export const initialFinanceState: FinanceStoreState = {
  money: 0,
  fixedCosts: initialFixedCosts,
  upgrades: {
    dormLevel: 1,
    studioLevel: 1,
    equipmentLevel: 1,
    livingExpenseLevel: 1,
    hasHealthcare: false,
    hasSecurity: false,
  },
  weeklyFixedTotal: 0,
  incomeHistory: [],
  expenseHistory: [],
};

export const financeVanillaStore = createStore<FinanceStore>()((set) => ({
  ...initialFinanceState,
  addMoney: (amount) =>
    set((state) => ({
      money: state.money + Math.max(0, amount),
    })),
  subtractMoney: (amount) =>
    set((state) => ({
      money: state.money - Math.max(0, amount),
    })),
  updateFixedCosts: (costs) =>
    set((state) => {
      const fixedCosts = {
        ...state.fixedCosts,
        ...costs,
      };

      return {
        fixedCosts,
        weeklyFixedTotal: calculateWeeklyFixedTotal(fixedCosts),
      };
    }),
  upgrade: (target) =>
    set((state) => {
      const upgrades = { ...state.upgrades };
      const fixedCosts = { ...state.fixedCosts };
      let money = state.money;

      if (target === "hasHealthcare" && !upgrades.hasHealthcare) {
        upgrades.hasHealthcare = true;
        fixedCosts.healthcare = UPGRADE_COSTS.hasHealthcare;
        money -= UPGRADE_COSTS.hasHealthcare;
      } else if (target === "hasSecurity" && !upgrades.hasSecurity) {
        upgrades.hasSecurity = true;
        fixedCosts.security = UPGRADE_COSTS.hasSecurity;
        money -= UPGRADE_COSTS.hasSecurity;
      } else if (
        target === "dormLevel" ||
        target === "studioLevel" ||
        target === "equipmentLevel"
      ) {
        const currentLevel = upgrades[target];

        if (currentLevel < 4) {
          const nextLevel = (currentLevel + 1) as 1 | 2 | 3 | 4;
          upgrades[target] = nextLevel;
          money -= UPGRADE_COSTS[target][currentLevel];

          if (target === "dormLevel") {
            fixedCosts.dormitory += 900000;
          }

          if (target === "studioLevel") {
            fixedCosts.studio += 1200000;
          }

          if (target === "equipmentLevel") {
            fixedCosts.equipment += 700000;
          }
        }
      }

      return {
        upgrades,
        fixedCosts,
        money,
        weeklyFixedTotal: calculateWeeklyFixedTotal(fixedCosts),
      };
    }),
  recordIncome: (week, breakdown) =>
    set((state) => ({
      incomeHistory: [...state.incomeHistory, { week, breakdown }],
    })),
  recordExpense: (week, breakdown) =>
    set((state) => ({
      expenseHistory: [...state.expenseHistory, { week, breakdown }],
    })),
}));

export const useFinanceStore = <T>(selector: (state: FinanceStore) => T) =>
  useStore(financeVanillaStore, selector);
