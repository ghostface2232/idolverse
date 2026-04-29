import type { Nationality, Position, StaffRole, TraineeStatKey } from "@/types/game";

export type FoundingStep = "staff" | "facility" | "audition" | "position";

export const STAFF_ROLE_ORDER = [
  "manager",
  "producer",
  "designer",
  "marketer",
] as const satisfies readonly StaffRole[];

export interface FacilityTier {
  level: 1 | 2 | 3 | 4;
  name: string;
  monthlyCost: number;
  effect: string;
}

export interface LivingExpenseTier {
  level: 1 | 2 | 3 | 4;
  name: string;
  perPersonCost: number;
  effect: string;
}

export const FOUNDING_FACILITY_TIERS = {
  dormitory: [
    { level: 1, name: "원룸", monthlyCost: 1_500_000, effect: "컨디션 회복 기본, 만족도 -1/주" },
    { level: 2, name: "투룸", monthlyCost: 3_000_000, effect: "컨디션 회복 +20%" },
    { level: 3, name: "아파트", monthlyCost: 5_000_000, effect: "컨디션 회복 +40%, 만족도 +1/주" },
    { level: 4, name: "고급", monthlyCost: 8_000_000, effect: "컨디션 회복 +60%, 만족도 +2/주" },
  ] satisfies FacilityTier[],
  studio: [
    { level: 1, name: "소형", monthlyCost: 1_000_000, effect: "트레이닝 효율 기본" },
    { level: 2, name: "중형", monthlyCost: 2_500_000, effect: "트레이닝 효율 +15%" },
    { level: 3, name: "대형", monthlyCost: 4_000_000, effect: "트레이닝 효율 +30%" },
    { level: 4, name: "프리미엄", monthlyCost: 6_000_000, effect: "트레이닝 효율 +50%" },
  ] satisfies FacilityTier[],
  equipment: [
    { level: 1, name: "기본", monthlyCost: 500_000, effect: "앨범 품질 -20%" },
    { level: 2, name: "중급", monthlyCost: 1_200_000, effect: "앨범 품질 기본" },
    { level: 3, name: "고급", monthlyCost: 2_000_000, effect: "앨범 품질 +20%" },
    { level: 4, name: "최상", monthlyCost: 3_500_000, effect: "앨범 품질 +30%" },
  ] satisfies FacilityTier[],
  livingExpense: [
    { level: 1, name: "최소", perPersonCost: 500_000, effect: "만족도 -1/주" },
    { level: 2, name: "기본", perPersonCost: 1_000_000, effect: "만족도 유지" },
    { level: 3, name: "넉넉", perPersonCost: 1_500_000, effect: "만족도 +1/주" },
    { level: 4, name: "풍족", perPersonCost: 2_000_000, effect: "만족도 +2/주" },
  ] satisfies LivingExpenseTier[],
} as const;

export const FOUNDING_ONETIME_UPGRADES = {
  healthcare: { cost: 30_000_000, name: "헬스케어 시스템", description: "부상 회복 2배, 예방 확률 -30%" },
  security: { cost: 20_000_000, name: "보안팀", description: "스캔들/사생팬 이벤트 확률 -50%" },
} as const;

export const FOUNDING_RECRUITMENT_COSTS = {
  openAudition: 10_000_000,
  scout: 30_000_000,
  staffRefresh: 5_000_000,
} as const;

export const POSITION_FITNESS_WEIGHTS: Record<Position, Partial<Record<TraineeStatKey, number>>> = {
  leader: { mental: 0.4, charm: 0.3, diligence: 0.3 },
  mainVocal: { vocal: 0.7, stamina: 0.15, mental: 0.15 },
  mainDancer: { dance: 0.7, stamina: 0.2, visual: 0.1 },
  center: { visual: 0.4, charm: 0.3, dance: 0.15, vocal: 0.15 },
  visual: { visual: 0.6, charm: 0.3, stamina: 0.1 },
  variety: { charm: 0.5, mental: 0.3, vocal: 0.1, visual: 0.1 },
  producing: { diligence: 0.4, vocal: 0.3, mental: 0.3 },
};

export const POSITION_LABELS: Record<Position, string> = {
  leader: "리더",
  mainVocal: "메인보컬",
  mainDancer: "메인댄서",
  center: "센터",
  visual: "비주얼",
  variety: "예능",
  producing: "프로듀싱",
};

export const REQUIRED_POSITIONS: Position[] = ["leader", "mainVocal", "mainDancer", "center"];

export const STAFF_ROLE_LABELS: Record<StaffRole, string> = {
  manager: "매니저",
  producer: "프로듀서",
  designer: "디자이너",
  marketer: "마케터",
};

export const NATIONALITY_FLAGS: Record<Nationality, string> = {
  korean: "KR",
  japanese: "JP",
  chinese: "CN",
  thai: "TH",
  american: "US",
  other: "GL",
};

export const STAFF_MISSING_WARNINGS: Record<StaffRole, string> = {
  manager: "매니저 없이는 스케줄 관리가 불가능합니다.",
  producer: "프로듀서 없이 앨범 제작이 어렵습니다.",
  designer: "디자이너 없이 비주얼 품질이 낮아집니다.",
  marketer: "마케터 없이 홍보 효과가 크게 떨어집니다.",
};

export function calculatePositionFitness(
  stats: Record<TraineeStatKey, number>,
  position: Position,
): number {
  const weights = POSITION_FITNESS_WEIGHTS[position];
  let fitness = 0;
  for (const [stat, weight] of Object.entries(weights)) {
    fitness += (stats[stat as TraineeStatKey] ?? 0) * (weight ?? 0);
  }
  return Math.round(fitness);
}

export function potentialToStars(potential: number): number {
  if (potential >= 1.5) return 5;
  if (potential >= 1.3) return 4;
  if (potential >= 1.1) return 3;
  if (potential >= 0.9) return 2;
  return 1;
}
