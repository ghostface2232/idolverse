import type { StaffRole, StaffTrainingId } from "@/types/game";

export interface StaffTrainingDefinition {
  id: StaffTrainingId;
  name: string;
  description: string;
  cost: number;
  baseGain: number;
  roleMultipliers: Record<StaffRole, number>;
}

export const STAFF_TRAINING_BALANCE = {
  /** 같은 훈련의 효과는 매회 이 비율만큼 남는다. 5회부터는 거의 미미하다. */
  repeatDecay: 0.45,
  /** 이만큼 성장 여지가 남아 있을 때 잠재력 감쇠 없이 훈련 효과를 받는다. */
  fullEffectHeadroom: 30,
  negligibleGain: 0.05,
  visibleTrainingCountPerRole: 4,
} as const;

export const STAFF_TRAININGS: readonly StaffTrainingDefinition[] = [
  {
    id: "film-study",
    name: "영화 관람",
    description: "장면의 흐름과 감정 전달 방식을 함께 분석합니다.",
    cost: 4_000_000,
    baseGain: 4.6,
    roleMultipliers: { manager: 0.8, producer: 1.05, designer: 1.15, marketer: 0.85 },
  },
  {
    id: "exhibition-visit",
    name: "전시 관람",
    description: "색감과 공간 연출에서 다음 작업의 감각을 찾습니다.",
    cost: 5_000_000,
    baseGain: 4.8,
    roleMultipliers: { manager: 0.7, producer: 0.85, designer: 1.3, marketer: 1.0 },
  },
  {
    id: "directing-workshop",
    name: "디렉팅 훈련",
    description: "현장에서 사람과 결과물을 이끄는 법을 익힙니다.",
    cost: 7_000_000,
    baseGain: 5.5,
    roleMultipliers: { manager: 1.2, producer: 1.3, designer: 0.85, marketer: 0.7 },
  },
  {
    id: "beatmaking-lab",
    name: "비트메이킹 훈련",
    description: "리듬과 편곡을 직접 다루며 제작 감각을 넓힙니다.",
    cost: 8_000_000,
    baseGain: 6,
    roleMultipliers: { manager: 0.55, producer: 1.4, designer: 0.8, marketer: 0.6 },
  },
  {
    id: "leadership-workshop",
    name: "리더십 워크숍",
    description: "갈등을 조율하고 팀의 판단을 모으는 연습을 합니다.",
    cost: 6_000_000,
    baseGain: 5.1,
    roleMultipliers: { manager: 1.4, producer: 0.9, designer: 0.75, marketer: 1.0 },
  },
  {
    id: "trend-fieldwork",
    name: "트렌드 현장 조사",
    description: "공연과 매장을 돌며 팬들의 반응 변화를 살핍니다.",
    cost: 5_000_000,
    baseGain: 4.9,
    roleMultipliers: { manager: 0.85, producer: 0.75, designer: 1.0, marketer: 1.4 },
  },
] as const;

export function getStaffTraining(trainingId: StaffTrainingId) {
  return STAFF_TRAININGS.find((training) => training.id === trainingId);
}

export function getStaffTrainingsForRole(role: StaffRole) {
  return [...STAFF_TRAININGS]
    .sort((left, right) => right.roleMultipliers[role] - left.roleMultipliers[role])
    .slice(0, STAFF_TRAINING_BALANCE.visibleTrainingCountPerRole);
}
