import { GAME_BALANCE, STAFF_SALARY_BANDS } from "@/data/balance";
import {
  CHINESE_NAMES,
  ENGLISH_NAMES,
  JAPANESE_NAMES,
  KOREAN_GIVEN_NAMES,
  KOREAN_SURNAMES,
  STAGE_NAME_POOL,
  THAI_NAMES,
} from "@/data/names";
import { CONCEPT_MOODS } from "@/data/concepts";
import { createSeededRandom } from "@/lib/seededRandom";
import type {
  ConceptMood,
  GroupGender,
  Nationality,
  Staff,
  StaffRole,
  Trainee,
} from "@/types/game";

const NATIONALITY_WEIGHTS: { nationality: Nationality; weight: number }[] = [
  { nationality: "korean", weight: 0.80 },
  { nationality: "japanese", weight: 0.10 },
  { nationality: "chinese", weight: 0.05 },
  { nationality: "thai", weight: 0.03 },
  { nationality: "american", weight: 0.02 },
];

const NATIONALITY_NAME_POOLS: Record<string, readonly string[]> = {
  korean: KOREAN_GIVEN_NAMES,
  japanese: JAPANESE_NAMES,
  chinese: CHINESE_NAMES,
  thai: THAI_NAMES,
  american: ENGLISH_NAMES,
};

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

function pickWeighted(
  weights: { nationality: Nationality; weight: number }[],
  roll: number,
): Nationality {
  let cumulative = 0;
  for (const entry of weights) {
    cumulative += entry.weight;
    if (roll < cumulative) return entry.nationality;
  }
  return "korean";
}

function generateName(
  nationality: Nationality,
  random: () => number,
): string {
  if (nationality === "korean") {
    const surname = KOREAN_SURNAMES[Math.floor(random() * KOREAN_SURNAMES.length)];
    const given = KOREAN_GIVEN_NAMES[Math.floor(random() * KOREAN_GIVEN_NAMES.length)];
    return `${surname}${given}`;
  }
  const pool = NATIONALITY_NAME_POOLS[nationality] ?? ENGLISH_NAMES;
  return pool[Math.floor(random() * pool.length)];
}

function generateAge(random: () => number): number {
  return 15 + Math.floor(random() * 8);
}

function generateConceptAffinity(
  random: () => number,
): Record<ConceptMood, number> {
  const affinity: Partial<Record<ConceptMood, number>> = {};

  const strongCount = 2 + Math.floor(random() * 2);
  const shuffled = [...CONCEPT_MOODS].sort(() => random() - 0.5);
  const strongMoods = shuffled.slice(0, strongCount);
  const weakMoods = shuffled.slice(strongCount, strongCount + 2);

  for (const mood of CONCEPT_MOODS) {
    if (strongMoods.includes(mood)) {
      affinity[mood] = 65 + Math.floor(random() * 30);
    } else if (weakMoods.includes(mood)) {
      affinity[mood] = 10 + Math.floor(random() * 30);
    } else {
      affinity[mood] = 35 + Math.floor(random() * 30);
    }
  }

  return affinity as Record<ConceptMood, number>;
}

export interface RecruitmentMethod {
  type: "open" | "scout" | "trainee_transfer";
}

export function generateTraineeCandidates(
  budget: number,
  method: RecruitmentMethod,
  groupGender: GroupGender,
  seed: number,
): Trainee[] {
  const random = createSeededRandom(seed);
  const count = 3 + Math.floor(random() * 3);

  const budgetTier = budget >= 100000000 ? 2 : budget >= 50000000 ? 1 : 0;
  const baseMin = 30 + budgetTier * 10;
  const baseMax = 65 + budgetTier * 15;

  const methodBonus = method.type === "scout" ? 8 : method.type === "trainee_transfer" ? 5 : 0;

  const candidates: Trainee[] = [];

  for (let i = 0; i < count; i++) {
    const nationality = pickWeighted(NATIONALITY_WEIGHTS, random());
    const name = generateName(nationality, random);
    const isForeign = nationality !== "korean";

    const genStat = () =>
      clamp(
        baseMin + Math.floor(random() * (baseMax - baseMin)) + methodBonus,
        1,
        GAME_BALANCE.maxStatValue,
      );

    const charmPenalty = isForeign ? Math.floor(random() * 15) : 0;

    const stats = {
      visual: genStat(),
      vocal: genStat(),
      dance: genStat(),
      charm: clamp(genStat() - charmPenalty, 1, GAME_BALANCE.maxStatValue),
      stamina: genStat(),
      diligence: genStat(),
      mental: genStat(),
    };

    const potential = 0.8 + random() * 0.9;

    candidates.push({
      id: `recruit-${seed}-${i}`,
      name,
      age: generateAge(random),
      nationality,
      stats,
      position: null,
      subPosition: null,
      conceptAffinity: generateConceptAffinity(random),
      mood: 60 + Math.floor(random() * 20),
      stress: 5 + Math.floor(random() * 15),
      condition: 70 + Math.floor(random() * 20),
      satisfaction: 65 + Math.floor(random() * 20),
      potential,
      chemistry: {},
      currentActivity: null,
      injuryWeeks: 0,
    });
  }

  return candidates;
}

const STAFF_SPECIALTY_POOL: Record<StaffRole, string[]> = {
  manager: ["스케줄 최적화", "컨디션 관리", "위기 대응", "방송 섭외", "멘탈 케어"],
  producer: ["훅 라이팅", "트랙 편곡", "보컬 디렉팅", "비트메이킹", "사운드 디자인"],
  designer: ["안무 제작", "뮤직비디오 연출", "비주얼 콘셉트", "무대 연출", "스타일링"],
  marketer: ["숏폼 캠페인", "팬덤 마케팅", "해외 프로모션", "브랜드 콜라보", "바이럴 전략"],
};

const STAFF_NAME_POOL = [
  "김태현", "이서연", "박준혁", "정유나", "최민수",
  "강하은", "조성민", "윤다영", "장현우", "임소정",
  "한지호", "오서준", "서예린", "신민재", "권도윤",
  "황채원", "안지우", "송예성", "전하린", "홍수빈",
];

export function generateStaffCandidates(
  role: StaffRole,
  salaryRange: { min: number; max: number },
  seed: number,
): Staff[] {
  const random = createSeededRandom(seed);
  const count = 2 + Math.floor(random() * 2);

  const candidates: Staff[] = [];

  for (let i = 0; i < count; i++) {
    const salary = salaryRange.min + Math.floor(random() * (salaryRange.max - salaryRange.min));

    let ability = 20;
    for (const band of STAFF_SALARY_BANDS) {
      if (salary >= band.annualSalary * 0.8) {
        ability = band.minAbility + Math.floor(random() * (band.maxAbility - band.minAbility));
      }
    }
    ability = clamp(ability + Math.floor((random() - 0.5) * 10), 1, 100);

    const specialties = STAFF_SPECIALTY_POOL[role];
    const specialty = specialties[Math.floor(random() * specialties.length)];
    const name = STAFF_NAME_POOL[Math.floor(random() * STAFF_NAME_POOL.length)];

    candidates.push({
      id: `staff-recruit-${seed}-${i}`,
      name,
      role,
      ability,
      salary: Math.round(salary / 12),
      specialty,
    });
  }

  return candidates;
}
