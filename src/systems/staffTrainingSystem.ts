import {
  getStaffTraining,
  STAFF_TRAINING_BALANCE,
} from "@/data/staffTraining";
import { STAFF_GROWTH } from "@/data/balance";
import type { Staff, StaffTrainingId } from "@/types/game";

export interface StaffTrainingResult {
  staff: Staff;
  trainingId: StaffTrainingId;
  abilityGain: number;
  beforeAbility: number;
  afterAbility: number;
  repetition: number;
}

export function getStaffPotentialCap(staff: Staff) {
  return staff.potentialCap ?? Math.min(100, staff.ability + STAFF_GROWTH.legacyCapMargin);
}

export function getStaffPotentialHeadroom(staff: Staff) {
  return Math.max(0, getStaffPotentialCap(staff) - staff.ability);
}

/** 잠재력 별은 현재 능력이 아니라 앞으로 성장할 수 있는 폭을 나타낸다. */
export function staffPotentialToStars(staff: Staff): 1 | 2 | 3 | 4 | 5 {
  const headroom = getStaffPotentialHeadroom(staff);
  if (headroom >= 50) return 5;
  if (headroom >= 30) return 4;
  if (headroom >= 16) return 3;
  if (headroom >= 6) return 2;
  return 1;
}

export function getTrainingFamiliarity(repetitionCount: number) {
  if (repetitionCount === 0) return "처음 시도";
  if (repetitionCount === 1) return "익숙해지는 중";
  if (repetitionCount === 2) return "효과가 줄어드는 중";
  if (repetitionCount < 5) return "새로운 자극이 적음";
  return "거의 익숙해짐";
}

export function applyStaffTraining(
  staff: Staff,
  trainingId: StaffTrainingId,
): StaffTrainingResult {
  const training = getStaffTraining(trainingId);
  if (!training) {
    throw new Error(`Unknown staff training: ${trainingId}`);
  }

  const repetitionCount = staff.trainingCounts?.[trainingId] ?? 0;
  const beforeAbility = staff.ability;
  const headroom = getStaffPotentialHeadroom(staff);
  const repeatMultiplier = STAFF_TRAINING_BALANCE.repeatDecay ** repetitionCount;
  const potentialMultiplier = Math.min(
    1,
    headroom / STAFF_TRAINING_BALANCE.fullEffectHeadroom,
  );
  const rawGain =
    training.baseGain *
    training.roleMultipliers[staff.role] *
    repeatMultiplier *
    potentialMultiplier;
  const abilityGain = Math.round(Math.min(headroom, rawGain) * 1_000) / 1_000;
  const afterAbility = Math.round((beforeAbility + abilityGain) * 1_000) / 1_000;

  return {
    staff: {
      ...staff,
      ability: afterAbility,
      potentialCap: getStaffPotentialCap(staff),
      trainingCounts: {
        ...staff.trainingCounts,
        [trainingId]: repetitionCount + 1,
      },
    },
    trainingId,
    abilityGain,
    beforeAbility,
    afterAbility,
    repetition: repetitionCount + 1,
  };
}
