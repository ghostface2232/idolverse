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
  illustrationImagePath?: string;
  illustrationSpriteIndex?: number;
}

export interface LivingExpenseTier {
  level: 1 | 2 | 3 | 4;
  name: string;
  perPersonCost: number;
  effect: string;
  illustrationImagePath?: string;
  illustrationSpriteIndex?: number;
}

export const FOUNDING_FACILITY_TIERS = {
  dormitory: [
    {
      level: 1,
      name: "원룸",
      monthlyCost: 1_500_000,
      effect: "다 같이 부대끼는 좁은 방 — 지내다 보면 불만이 쌓인다",
      illustrationImagePath: "/facilities/dormitory-spritesheet.png",
      illustrationSpriteIndex: 0,
    },
    {
      level: 2,
      name: "투룸",
      monthlyCost: 3_000_000,
      effect: "지낼 만한 공간 — 쉬면 몸이 회복된다",
      illustrationImagePath: "/facilities/dormitory-spritesheet.png",
      illustrationSpriteIndex: 1,
    },
    {
      level: 3,
      name: "아파트",
      monthlyCost: 5_000_000,
      effect: "쾌적한 집 — 회복이 빠르고 생활에 여유가 생긴다",
      illustrationImagePath: "/facilities/dormitory-spritesheet.png",
      illustrationSpriteIndex: 2,
    },
    {
      level: 4,
      name: "고급",
      monthlyCost: 8_000_000,
      effect: "최고급 주거 — 몸도 마음도 확실히 편안해진다",
      illustrationImagePath: "/facilities/dormitory-spritesheet.png",
      illustrationSpriteIndex: 3,
    },
  ] satisfies FacilityTier[],
  studio: [
    {
      level: 1,
      name: "소형",
      monthlyCost: 1_000_000,
      effect: "연습할 수 있는 최소한의 공간",
      illustrationImagePath: "/facilities/studio-spritesheet.png",
      illustrationSpriteIndex: 0,
    },
    {
      level: 2,
      name: "중형",
      monthlyCost: 2_500_000,
      effect: "연습에 탄력이 붙는 환경",
      illustrationImagePath: "/facilities/studio-spritesheet.png",
      illustrationSpriteIndex: 1,
    },
    {
      level: 3,
      name: "대형",
      monthlyCost: 4_000_000,
      effect: "수준 높은 훈련이 가능한 환경",
      illustrationImagePath: "/facilities/studio-spritesheet.png",
      illustrationSpriteIndex: 2,
    },
    {
      level: 4,
      name: "프리미엄",
      monthlyCost: 6_000_000,
      effect: "대형 기획사 부럽지 않은 훈련 환경",
      illustrationImagePath: "/facilities/studio-spritesheet.png",
      illustrationSpriteIndex: 3,
    },
  ] satisfies FacilityTier[],
  equipment: [
    { level: 1, name: "기본", monthlyCost: 500_000, effect: "낡은 장비 — 작업물 완성도가 아쉽다" },
    { level: 2, name: "중급", monthlyCost: 1_200_000, effect: "업계 표준 수준의 장비" },
    { level: 3, name: "고급", monthlyCost: 2_000_000, effect: "고급 장비 — 작업물의 때깔이 달라진다" },
    { level: 4, name: "최상", monthlyCost: 3_500_000, effect: "최상급 장비 — 완성도가 확연히 다르다" },
  ] satisfies FacilityTier[],
  livingExpense: [
    {
      level: 1,
      name: "최소",
      perPersonCost: 500_000,
      effect: "빠듯한 생활 — 불만이 쌓이기 쉽다",
      illustrationImagePath: "/facilities/money-spritesheet.png",
      illustrationSpriteIndex: 0,
    },
    {
      level: 2,
      name: "기본",
      perPersonCost: 1_000_000,
      effect: "부족하지 않은 평범한 생활",
      illustrationImagePath: "/facilities/money-spritesheet.png",
      illustrationSpriteIndex: 1,
    },
    {
      level: 3,
      name: "넉넉",
      perPersonCost: 1_500_000,
      effect: "여유 있는 생활 — 표정이 밝아진다",
      illustrationImagePath: "/facilities/money-spritesheet.png",
      illustrationSpriteIndex: 2,
    },
    {
      level: 4,
      name: "풍족",
      perPersonCost: 2_000_000,
      effect: "아쉬울 것 없는 생활 — 사기가 크게 오른다",
      illustrationImagePath: "/facilities/money-spritesheet.png",
      illustrationSpriteIndex: 3,
    },
  ] satisfies LivingExpenseTier[],
} as const;

export const FOUNDING_ONETIME_UPGRADES = {
  healthcare: { cost: 30_000_000, name: "헬스케어 시스템", description: "전담 의료진이 상주해 부상을 미리 잡아내고, 다쳐도 훨씬 빨리 회복합니다" },
  security: { cost: 20_000_000, name: "보안팀", description: "경호팀이 멤버들의 사생활을 지켜 구설수와 사생팬 위협을 크게 줄입니다" },
} as const;

export const FOUNDING_RECRUITMENT_COSTS = {
  openAudition: 10_000_000,
  scout: 30_000_000,
  staffRefresh: 5_000_000,
} as const;

export const RECRUITMENT_HEADCOUNT_MULTIPLIER: Record<5 | 7 | 9 | 12, number> = {
  5: 1.0,
  7: 1.4,
  9: 1.8,
  12: 2.4,
};

export const RECRUITMENT_MAX_EXTRA_BUDGET = 100_000_000;

export function getRecruitmentStatRange(extraBudget: number): {
  min: number;
  max: number;
} {
  const ratio = Math.max(
    0,
    Math.min(1, extraBudget / RECRUITMENT_MAX_EXTRA_BUDGET),
  );
  return {
    min: Math.round(30 + ratio * 20),
    max: Math.round(65 + ratio * 30),
  };
}

interface RecruitmentBudgetMilestone {
  threshold: number;
  label: string;
}

const RECRUITMENT_BUDGET_MILESTONES: RecruitmentBudgetMilestone[] = [
  { threshold: 0, label: "기본" },
  { threshold: 50_000_000, label: "심화" },
  { threshold: 75_000_000, label: "프리미엄" },
];

export function getRecruitmentBudgetLabel(extraBudget: number): string {
  let active = RECRUITMENT_BUDGET_MILESTONES[0];
  for (const m of RECRUITMENT_BUDGET_MILESTONES) {
    if (extraBudget >= m.threshold) active = m;
  }
  return active.label;
}

export function getStatBandLabel(min: number, max: number): string {
  const band = (v: number) => {
    if (v < 40) return "낮음";
    if (v < 70) return "중간";
    return "높음";
  };
  const lo = band(min);
  const hi = band(max);
  return lo === hi ? lo : `${lo}-${hi}`;
}

export const POSITION_FITNESS_WEIGHTS: Record<Position, Partial<Record<TraineeStatKey, number>>> = {
  leader: { mental: 0.4, charm: 0.3, stamina: 0.3 },
  mainVocal: { vocal: 0.7, stamina: 0.15, mental: 0.15 },
  mainDancer: { dance: 0.7, stamina: 0.2, visual: 0.1 },
  center: { visual: 0.4, charm: 0.3, dance: 0.15, vocal: 0.15 },
  visual: { visual: 0.6, charm: 0.3, stamina: 0.1 },
  variety: { charm: 0.5, mental: 0.3, vocal: 0.1, visual: 0.1 },
  producing: { stamina: 0.4, vocal: 0.3, mental: 0.3 },
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
export const OPTIONAL_POSITIONS: Position[] = ["visual", "variety", "producing"];

export function isRequiredPosition(position: Position): boolean {
  return REQUIRED_POSITIONS.includes(position);
}

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
