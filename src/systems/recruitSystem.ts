import {
  GAME_BALANCE,
  MEMBER_CONTRACT,
  RECRUIT_POTENTIAL,
  RECRUIT_STAT_BANDS,
  STAFF_GROWTH,
  STAFF_HIRING,
  TEMPERAMENT_PROFILES,
} from "@/data/balance";
import { pickStaffProfiles, STAFF_PROFILES } from "@/data/staffProfiles";
import {
  CHINESE_NAMES_BY_GENDER,
  ENGLISH_NAMES_BY_GENDER,
  JAPANESE_NAMES_BY_GENDER,
  KOREAN_GIVEN_NAMES_BY_GENDER,
  KOREAN_SURNAMES,
  THAI_NAMES_BY_GENDER,
} from "@/data/names";
import {
  deriveConceptAffinity,
  pickMemberTraits,
} from "@/data/memberTraits";
import { createSeededRandom } from "@/lib/seededRandom";
import type {
  ConceptMood,
  GroupGender,
  MemberTemperament,
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

const NATIONALITY_NAME_POOLS: Record<Nationality, Record<GroupGender, readonly string[]>> = {
  korean: KOREAN_GIVEN_NAMES_BY_GENDER,
  japanese: JAPANESE_NAMES_BY_GENDER,
  chinese: CHINESE_NAMES_BY_GENDER,
  thai: THAI_NAMES_BY_GENDER,
  american: ENGLISH_NAMES_BY_GENDER,
  other: ENGLISH_NAMES_BY_GENDER,
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
  groupGender: GroupGender,
  random: () => number,
): string {
  const pool = NATIONALITY_NAME_POOLS[nationality][groupGender];

  if (nationality === "korean") {
    const surname = KOREAN_SURNAMES[Math.floor(random() * KOREAN_SURNAMES.length)];
    const given = pool[Math.floor(random() * pool.length)];
    return `${surname}${given}`;
  }

  return pool[Math.floor(random() * pool.length)];
}

function generateAge(random: () => number): number {
  return 15 + Math.floor(random() * 8);
}


export interface RecruitmentMethod {
  type: "open" | "scout" | "trainee_transfer";
}

export function generateTraineeCandidates(
  budget: number,
  method: RecruitmentMethod,
  groupGender: GroupGender,
  seed: number,
  requestedCount?: number,
): Trainee[] {
  const random = createSeededRandom(seed);
  const count = requestedCount ?? 3 + Math.floor(random() * 3);

  // FM 유스식: 신인은 낮은 능력치로 시작하고(상한 30~40대),
  // 추가 예산과 스카우트는 능력치가 아니라 잠재력을 산다.
  const budgetRatio = clamp(budget / 100_000_000, 0, 1);
  const baseMin = RECRUIT_STAT_BANDS.min + budgetRatio * RECRUIT_STAT_BANDS.budgetSpread;
  const baseMax = RECRUIT_STAT_BANDS.max + budgetRatio * RECRUIT_STAT_BANDS.budgetSpread;

  const methodBonus =
    method.type === "scout"
      ? RECRUIT_STAT_BANDS.scoutBonus
      : method.type === "trainee_transfer"
        ? Math.round(RECRUIT_STAT_BANDS.scoutBonus / 2)
        : 0;

  const candidates: Trainee[] = [];

  for (let i = 0; i < count; i++) {
    const nationality = pickWeighted(NATIONALITY_WEIGHTS, random());
    const name = generateName(nationality, groupGender, random);
    const isForeign = nationality !== "korean";

    const genStat = () =>
      clamp(
        baseMin + Math.floor(random() * (baseMax - baseMin)) + methodBonus,
        1,
        RECRUIT_STAT_BANDS.hardCap,
      );

    const charmPenalty = isForeign ? Math.floor(random() * 10) : 0;

    const stats = {
      visual: genStat(),
      vocal: genStat(),
      dance: genStat(),
      charm: clamp(genStat() - charmPenalty, 1, RECRUIT_STAT_BANDS.hardCap),
      stamina: genStat(),
      mental: genStat(),
    };

    const potential = Math.min(
      RECRUIT_POTENTIAL.max,
      RECRUIT_POTENTIAL.base +
        random() * RECRUIT_POTENTIAL.spread +
        budgetRatio * RECRUIT_POTENTIAL.budgetBonus +
        (method.type === "scout" ? RECRUIT_POTENTIAL.scoutBonus : 0),
    );

    const temperamentRoll = random();
    const temperament: MemberTemperament =
      temperamentRoll < 0.25
        ? "ambitious"
        : temperamentRoll < 0.5
          ? "devoted"
          : temperamentRoll < 0.85
            ? "steady"
            : "sensitive";

    // 인간적 특성(성격+인상)이 먼저고, 컨셉 친화는 거기서 파생된다.
    const traits = pickMemberTraits(random);

    candidates.push({
      id: `recruit-${seed}-${i}`,
      name,
      age: generateAge(random),
      nationality,
      stats,
      position: null,
      subPosition: null,
      traits,
      conceptAffinity: deriveConceptAffinity(traits, random),
      mood: 60 + Math.floor(random() * 20),
      stress: 5 + Math.floor(random() * 15),
      condition: 70 + Math.floor(random() * 20),
      satisfaction: 65 + Math.floor(random() * 20),
      potential,
      chemistry: {},
      currentActivity: null,
      injuryWeeks: 0,
      popularity: 0,
      temperament,
      contract: {
        tier: MEMBER_CONTRACT.initialTier,
        nextRenegotiationWeek:
          MEMBER_CONTRACT.renegotiationIntervalWeeks +
          TEMPERAMENT_PROFILES[temperament].renegotiationBiasWeeks,
      },
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

const STAFF_MONTHLY_SALARY_UNIT = 100_000;
const STAFF_ABILITY_MAX = 95;

export function generateStaffCandidates(
  role: StaffRole,
  seed: number,
  requestedCount?: number,
  // 창단 시장에는 검증된 인재가 오지 않는다 — 상위 풀은 회사 성장 후
  // 재모집(M5)에서 열린다. 기본값은 상한 없음.
  maxAbility: number = STAFF_ABILITY_MAX,
): Staff[] {
  const random = createSeededRandom(seed);
  const count = requestedCount ?? 3 + Math.floor(random() * 2);

  const candidates: Staff[] = [];
  const roleProfiles = pickStaffProfiles(role, count, random);

  for (let i = 0; i < count; i++) {
    // 능력을 먼저 굴린다 — 저편중 분포라 풀 전 구간이 나오되 상위 능력은
    // 드물다. 월급은 능력에서 파생되므로 "싼데 유능"은 협상 편차만큼만 존재한다.
    const ceiling = Math.min(maxAbility, STAFF_ABILITY_MAX);
    const ability = clamp(
      Math.round(
        STAFF_HIRING.abilityMin +
          (ceiling - STAFF_HIRING.abilityMin) *
            random() ** STAFF_HIRING.abilitySkew,
      ),
      STAFF_HIRING.abilityMin,
      ceiling,
    );
    const salary = Math.round(
      (STAFF_HIRING.salaryBase + ability * STAFF_HIRING.salaryPerAbility) *
        (STAFF_HIRING.salaryNoiseMin + random() * STAFF_HIRING.salaryNoiseSpan),
    );
    // 실무 성장의 천장. 창단 풀 상한(60)과 무관하게 상한이 높은 원석이
    // 섞여 있어 저능력 채용에도 장기 성장의 도박이 성립한다.
    const potentialCap = clamp(
      ability +
        STAFF_GROWTH.capMarginMin +
        Math.round(
          random() * (STAFF_GROWTH.capMarginMax - STAFF_GROWTH.capMarginMin),
        ),
      ability,
      100,
    );

    const specialties = STAFF_SPECIALTY_POOL[role];
    const specialty = specialties[Math.floor(random() * specialties.length)];
    const roleProfile = roleProfiles[i] ?? null;
    const name =
      roleProfile?.name ?? STAFF_NAME_POOL[Math.floor(random() * STAFF_NAME_POOL.length)];
    const profile =
      STAFF_PROFILES[role] !== undefined && roleProfile !== null
        ? {
            profileImagePath: roleProfile.profileImagePath,
            profileSpriteIndex: roleProfile.profileSpriteIndex,
          }
        : {};

    const monthlySalary =
      Math.floor(salary / 12 / STAFF_MONTHLY_SALARY_UNIT) * STAFF_MONTHLY_SALARY_UNIT;

    candidates.push({
      id: `staff-recruit-${seed}-${i}`,
      name,
      role,
      ability,
      potentialCap,
      salary: monthlySalary,
      specialty,
      ...profile,
    });
  }

  return candidates;
}
