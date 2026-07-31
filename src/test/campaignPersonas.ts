import {
  COMEBACK_BUDGET_TIERS_BY_ID,
  COMEBACK_REQUIREMENTS,
  FACILITY_TIER_UNLOCKS,
  GAME_BALANCE,
  STAFF_HIRING,
  type ComebackBudgetTierId,
} from "@/data/balance";
import { CONCEPT_MOODS, SEASON_MOOD_FIT } from "@/data/concepts";
import { DEBUT_PROJECT, TITLE_TRACK_SELECTION_DECISION_ID } from "@/data/debutProject";
import { INVESTOR_COMPANIES } from "@/data/investors";
import { deriveConceptAffinity, traitComboBonus } from "@/data/memberTraits";
import { initialAlbumState } from "@/stores/albumStore";
import { initialCompetitorState } from "@/stores/competitorStore";
import { calculateWeeklyFixedTotal, UPGRADE_COSTS } from "@/stores/financeStore";
import { initialFandomState } from "@/stores/fandomStore";
import { calculateFandomExpectation } from "@/systems/albumSystem";
import {
  canStartComebackProject,
  createComebackPlan,
} from "@/systems/comebackSystem";
import { createProjectInstance } from "@/systems/projectSystem";
import {
  processWeek,
  type GameSnapshot,
  type PlayerDecisions,
  type WeekReport,
} from "@/systems/weekProcessor";
import { makeGameSnapshot, makeTrainee } from "@/test/gameStateFixture";
import type {
  ConceptMood,
  EffectMap,
  Genre,
  Staff,
  Trainee,
  TraineeStatKey,
  WeeklyDecision,
} from "@/types/game";

/**
 * 5년 폐루프 시뮬레이션의 플레이어 페르소나.
 *
 * - novice: 위기마다 가장 유화적인(돈과 휴식으로 달래는) 선택을 하고,
 *   장기 전략 없이 느슨한 주기로 컴백하는 첫 플레이.
 * - intermediate: 카드에 표시된 효과의 합산 가치로 선택하는 계산형 플레이.
 * - expert: 유동성·시즌·시장·팬덤 기대까지 반영해 선택하는 계획형 플레이.
 * - abusive: 멤버를 소모품으로 다루는 최악의 운영. 손실 시스템(이탈
 *   카운트다운과 그 대가)이 실제로 발동하는지 검증하는 프로브 전용이며,
 *   novice와 같은 로스터로 시작해 결과 격차가 순수하게 '대우'에 귀속된다.
 */
export type PlayerProfile = "novice" | "intermediate" | "expert" | "abusive";
export type StaffingPolicy = "lean" | "specialists";
type LevelFacility = "dormLevel" | "studioLevel" | "equipmentLevel";

export interface CampaignSummary {
  profile: PlayerProfile;
  seed: number;
  weeksPlayed: number;
  failedAtWeek: number | null;
  startingMoney: number;
  endingMoney: number;
  minimumMoney: number;
  totalIncome: number;
  totalExpenses: number;
  commercialContractIncome: number;
  commercialFatigueExposure: number;
  maxCommercialScheduleSlots: number;
  decisionCosts: number;
  financingBorrowed: number;
  financingRepaid: number;
  decisionCostBreakdown: Record<string, number>;
  facilitySpend: number;
  releases: number;
  averageAlbumQuality: number;
  bestAlbumQuality: number;
  averageChartRank: number;
  chartNumberOnes: number;
  topTenAlbums: number;
  musicShowWins: number;
  awards: number;
  rookieAwards: number;
  bonsangAwards: number;
  daesangAwards: number;
  public: number;
  fandom: number;
  global: number;
  industry: number;
  loyalty: number;
  disappointment: number;
  averageMemberStats: number;
  averageChemistry: number;
  averageStress: number;
  averageSatisfaction: number;
  injuries: number;
  remainingMembers: number;
  memberDepartures: number;
  firstDepartureWeek: number | null;
  facilityLevelTotal: number;
  incomeBreakdown: Record<string, number>;
  expenseBreakdown: Record<string, number>;
  yearly: Array<{
    year: number;
    money: number;
    fandom: number;
    public: number;
    averageStats: number;
    releases: number;
  }>;
}

const GENRES: Genre[] = [
  "dancePop",
  "rnb",
  "hiphop",
  "edm",
  "rock",
  "ballad",
  "cityPop",
  "trot",
];
const TRAINABLE_STATS: TraineeStatKey[] = [
  "visual",
  "vocal",
  "dance",
  "charm",
  "stamina",
];

/**
 * 시상식 역산용 상수. 시상은 매년 50주차(weeksPerYear - 2)에 열리고, 후보
 * 집계는 "그 해 1주차~시상 주 사이의 발매작"만 본다. 컴백 시작부터 발매까지
 * 12주(COMEBACK_REQUIREMENTS.releaseWeek)가 걸리므로:
 * - 발매가 50~52주차에 떨어지면 그 앨범은 어느 해 시상에도 집계되지 않는다
 *   (시상 주 이후 발매는 올해 제외, 연초 기준 미달로 내년에도 제외).
 * - 발매가 42~49주차에 떨어지면 품질이 집계되고 활동기 화력(public)이
 *   심사 시점과 겹친다 — 컴백을 앞당길 가치가 있는 구간.
 */
const AWARDS_WEEK_OF_YEAR = GAME_BALANCE.weeksPerYear - 2;
const RELEASE_LEAD_WEEKS = COMEBACK_REQUIREMENTS.releaseWeek;

/** 지금 컴백을 시작하면 발매가 떨어질 연중 주차(1~52). */
function projectedReleaseWeekOfYear(weekOfYear: number): number {
  return ((weekOfYear + RELEASE_LEAD_WEEKS - 1) % GAME_BALANCE.weeksPerYear) + 1;
}

export function sumRecord(values: Record<string, number>): number {
  return Object.values(values).reduce((sum, value) => sum + value, 0);
}

export function average(values: readonly number[]): number {
  return values.length === 0
    ? 0
    : values.reduce((sum, value) => sum + value, 0) / values.length;
}

function averageMemberStats(trainees: readonly Trainee[]): number {
  return average(
    trainees.map((trainee) =>
      average(TRAINABLE_STATS.map((stat) => trainee.stats[stat])),
    ),
  );
}

function averageChemistry(trainees: readonly Trainee[]): number {
  const pairs: number[] = [];
  for (let left = 0; left < trainees.length; left++) {
    for (let right = left + 1; right < trainees.length; right++) {
      pairs.push(trainees[left].chemistry[trainees[right].id] ?? 0);
    }
  }
  return average(pairs);
}

function makeStaff(
  id: string,
  role: Staff["role"],
  ability: number,
): Staff {
  const annualSalary = STAFF_HIRING.salaryBase + ability * STAFF_HIRING.salaryPerAbility;
  return {
    id,
    name: `${role}-${ability}`,
    role,
    ability,
    // recruitSystem stores the displayed/fixed-cost salary as a monthly amount.
    salary: Math.floor(annualSalary / 12 / 100_000) * 100_000,
    potentialCap: ability + 12,
  };
}

function makeRoster(profile: PlayerProfile): Trainee[] {
  // abusive는 novice와 같은 뽑기로 시작한다 — 두 페르소나의 결과 격차는
  // 로스터가 아니라 '대우'의 차이로만 설명돼야 한다.
  const rosterProfile = profile === "abusive" ? "novice" : profile;
  const definitions =
    rosterProfile === "expert"
      ? [
          { traits: ["pure", "doglike"] as const, potential: 1.62 },
          { traits: ["energetic", "wholesome"] as const, potential: 1.52 },
          { traits: ["haughty", "catlike"] as const, potential: 1.47 },
          { traits: ["reserved", "mysterious"] as const, potential: 1.38 },
        ]
      : rosterProfile === "intermediate"
        ? [
            { traits: ["pure", "doglike"] as const, potential: 1.22 },
            { traits: ["energetic", "tall"] as const, potential: 1.28 },
            { traits: ["haughty", "catlike"] as const, potential: 1.16 },
            { traits: ["reserved", "wholesome"] as const, potential: 1.2 },
          ]
        : [
          { traits: ["pure", "catlike"] as const, potential: 0.88 },
          { traits: ["bubbly", "tall"] as const, potential: 1.02 },
          { traits: ["reserved", "wholesome"] as const, potential: 0.94 },
          { traits: ["energetic", "mysterious"] as const, potential: 1.08 },
        ];
  const positions: Trainee["position"][] = [
    "leader",
    "mainVocal",
    "mainDancer",
    "center",
  ];
  const baseStats =
    rosterProfile === "expert"
      ? [
          { visual: 31, vocal: 35, dance: 27, charm: 32, stamina: 34, mental: 61 },
          { visual: 27, vocal: 29, dance: 38, charm: 31, stamina: 38, mental: 58 },
          { visual: 38, vocal: 27, dance: 34, charm: 35, stamina: 31, mental: 55 },
          { visual: 35, vocal: 37, dance: 28, charm: 30, stamina: 29, mental: 64 },
        ]
      : rosterProfile === "intermediate"
        ? [
            { visual: 32, vocal: 34, dance: 28, charm: 31, stamina: 33, mental: 60 },
            { visual: 29, vocal: 31, dance: 36, charm: 31, stamina: 35, mental: 58 },
            { visual: 36, vocal: 28, dance: 33, charm: 34, stamina: 31, mental: 57 },
            { visual: 34, vocal: 35, dance: 29, charm: 31, stamina: 31, mental: 61 },
          ]
        : [
          { visual: 32, vocal: 31, dance: 27, charm: 30, stamina: 30, mental: 58 },
          { visual: 28, vocal: 33, dance: 34, charm: 27, stamina: 32, mental: 56 },
          { visual: 35, vocal: 27, dance: 31, charm: 32, stamina: 29, mental: 60 },
          { visual: 30, vocal: 29, dance: 33, charm: 35, stamina: 31, mental: 54 },
        ];

  const trainees = definitions.map((definition, index) =>
    makeTrainee(`member-${index + 1}`, {
      name: `${profile}-${index + 1}`,
      stats: baseStats[index],
      position: positions[index],
      subPosition:
        rosterProfile === "expert" && index === 0
          ? "producing"
          : rosterProfile === "expert" && index === 2
            ? "visual"
            : null,
      traits: [...definition.traits],
      conceptAffinity: deriveConceptAffinity(definition.traits),
      potential: definition.potential,
      stress: 8,
      condition: 85,
      satisfaction: 72,
      contract: { tier: 1, nextRenegotiationWeek: 78 + index * 4 },
    }),
  );

  return trainees.map((trainee, index) => ({
    ...trainee,
    chemistry: Object.fromEntries(
      trainees
        .filter((candidate) => candidate.id !== trainee.id)
        .map((candidate, otherIndex) => [
          candidate.id,
          rosterProfile === "expert"
            ? 18 + ((index + otherIndex) % 3) * 4
            : rosterProfile === "intermediate"
              ? -4 + ((index + otherIndex) % 4) * 6
              : -38 + ((index + otherIndex) % 4) * 9,
        ]),
    ),
  }));
}

function makeCampaign(
  profile: PlayerProfile,
  campaignSeed: number,
  staffingPolicy: StaffingPolicy,
): GameSnapshot {
  const investor = INVESTOR_COMPANIES.find(
    (candidate) => candidate.type === "entertainment",
  );
  if (!investor) throw new Error("Missing entertainment investor fixture.");

  const snapshot = makeGameSnapshot({ week: 1, investorType: "entertainment" });
  const staff =
    staffingPolicy === "specialists"
      ? [makeStaff("manager", "manager", 56), makeStaff("producer", "producer", 54)]
      : [makeStaff("manager", "manager", 36)];
  const fixedCosts = {
    dormitory: 1_000_000,
    studio: 1_500_000,
    staffSalary: staff.reduce((sum, member) => sum + member.salary, 0),
    livingExpense: 2_500_000,
    equipment: 300_000,
    healthcare: 0,
    security: 0,
  };

  snapshot.game = {
    ...snapshot.game,
    campaignSeed,
    currentPhase: "training",
    investorConditions: investor.conditions,
    activeProjects: [
      {
        ...createProjectInstance(DEBUT_PROJECT, 1),
        scheduleTierId: "standard",
      },
    ],
  };
  snapshot.trainee = { trainees: makeRoster(profile) };
  snapshot.staff = { staff };
  snapshot.album = structuredClone(initialAlbumState);
  snapshot.fandom = structuredClone(initialFandomState);
  snapshot.competitor = structuredClone(initialCompetitorState);
  snapshot.finance = {
    money:
      investor.fundAmount -
      (profile === "expert" ? 180_000_000 : profile === "intermediate" ? 110_000_000 : 50_000_000),
    fixedCosts,
    upgrades: {
      dormLevel: 1,
      studioLevel: 1,
      equipmentLevel: 1,
      livingExpenseLevel: 1,
      hasHealthcare: false,
      hasSecurity: false,
    },
    weeklyFixedTotal: calculateWeeklyFixedTotal(fixedCosts),
    incomeHistory: [],
    expenseHistory: [],
  };
  return snapshot;
}

function effectUtility(effects: EffectMap): number {
  const weights: Partial<Record<keyof EffectMap, number>> = {
    money: 1 / 10_000_000,
    public: 1.8,
    fandom: 2.2,
    fandomLoyalty: 1.2,
    fandomDisappointment: -1.6,
    global: 1.5,
    industry: 1.4,
    satisfaction: 1.2,
    stress: -1.1,
    condition: 0.7,
    injuryWeeks: -5,
    albumSong: 0.25,
    albumVisual: 0.2,
    albumChoreography: 0.2,
    albumMarketing: 0.2,
    investorPressure: -2,
  };
  return Object.entries(effects).reduce(
    (score, [key, value]) =>
      score + value * (weights[key as keyof EffectMap] ?? 0),
    0,
  );
}

function contextualEffectUtility(
  effects: EffectMap,
  snapshot: GameSnapshot,
): number {
  const cashEffect = effects.money ?? 0;
  const reserve = Math.max(120_000_000, snapshot.finance.weeklyFixedTotal * 12);
  const cashAfterChoice = snapshot.finance.money + cashEffect;
  const liquidityPenalty =
    cashEffect < 0 && cashAfterChoice < reserve
      ? ((reserve - cashAfterChoice) / 10_000_000) * 3
      : 0;
  return effectUtility(effects) - liquidityPenalty;
}

function selectTargets(
  option: WeeklyDecision["options"][number],
  trainees: readonly Trainee[],
): string[] | undefined {
  if (option.targetTraineeIds) return [...option.targetTraineeIds];
  if (!option.targetSelection) return undefined;
  const sorted = [...trainees].sort((left, right) => {
    if (option.activityOverride === "entertainment") {
      return right.stats.charm - left.stats.charm;
    }
    if (option.activityOverride === "individual") {
      return right.potential - left.potential;
    }
    return left.condition - right.condition;
  });
  return sorted.slice(0, option.targetSelection.min).map((trainee) => trainee.id);
}

/**
 * 초보 페르소나의 카드 읽기: 처음 보는 플레이어는 카드에 표시된 즉각적이고
 * 구체적인 효과(돈, 인지도, 팬덤, 만족도, 컨디션, 부상)만 보고 고른다.
 * 스트레스 누적, 투자사 압박, 업계 평판 같은 간접적·장기적 비용은 아직 그
 * 의미를 몰라 계산에 넣지 못한다 — 해당 키의 가중치가 0인 이유다. 반면 팬
 * 실망은 위기 카드가 문구로 직접 설명해 주는 지표라 초보도 읽는다(다만
 * 숙련보다 가볍게 느낀다). 현금은 수입 구조를 모르는 초보일수록 잔액이
 * 줄어드는 것 자체를 무서워하므로 오히려 민감도가 높다 — 이 민감도가
 * 없으면 초보가 매주 팬 행사에 2,500만원을 태우고 2억짜리 확장을 사다
 * 2년 안에 파산한다(2026-07 프로브). 이 모델은 옵션 정렬 순서와 무관해서
 * 카드 데이터 리팩토링에도 안정적이다.
 */
const NOVICE_VISIBLE_WEIGHTS: Partial<Record<keyof EffectMap, number>> = {
  money: 1 / 4_000_000,
  public: 2.5,
  fandom: 2.5,
  fandomLoyalty: 0.5,
  fandomDisappointment: -1.0,
  satisfaction: 1.2,
  condition: 0.8,
  chemistry: 1.0,
  injuryWeeks: -5,
  albumSong: 0.2,
  albumVisual: 0.2,
  albumChoreography: 0.2,
  albumMarketing: 0.2,
};

function noviceVisibleUtility(effects: EffectMap): number {
  return Object.entries(effects).reduce(
    (score, [key, value]) =>
      score + value * (NOVICE_VISIBLE_WEIGHTS[key as keyof EffectMap] ?? 0),
    0,
  );
}

/**
 * 혹사 페르소나의 위기 대응: 모든 위기에서 멤버에게 가장 가혹한(비용을
 * 아끼고 일정을 강행하는) 선택지를 고른다. 손실 경로 검증 전용.
 */
const ABUSIVE_CRISIS_PREFERENCE: Record<string, string> = {
  recontract: "freeze",
  injury: "partial-activity",
  conflict: "ignore",
  "emergency-investor": "comply",
  "financial-crisis": "austerity",
  "financing-repayment": "defer",
  "fandom-crisis": "wait",
  morale: "pressure",
  overwork: "push-through",
  "strategic-expansion": "strategic-defer",
};

function cardRoot(cardId: string): string {
  return cardId.split(":")[0];
}

function pickPreferredOption(
  card: WeeklyDecision,
  preference: Record<string, string>,
  profile: PlayerProfile,
): WeeklyDecision["options"][number] {
  const root = cardRoot(card.id);
  const wanted = preference[root];
  if (!wanted) {
    throw new Error(
      `${profile} 페르소나에 "${root}" 카드 선호가 정의되지 않았습니다. ` +
        "새 결정 카드를 추가했다면 campaignPersonas의 선호 테이블에 각 페르소나의 대응을 명시하세요.",
    );
  }
  const option = card.options.find((candidate) => candidate.id === wanted);
  if (!option) {
    throw new Error(
      `"${card.id}" 카드에 "${wanted}" 옵션이 없습니다. ` +
        "옵션 id가 바뀌었다면 campaignPersonas의 선호 테이블을 함께 갱신하세요.",
    );
  }
  return option;
}

function buildWeeklyDecisions(
  snapshot: GameSnapshot,
  profile: PlayerProfile,
  contractFirst = false,
): PlayerDecisions["resolvedDecisions"] {
  const toResolved = (
    card: WeeklyDecision,
    option: WeeklyDecision["options"][number],
  ): PlayerDecisions["resolvedDecisions"] => [
    {
      cardId: card.id,
      optionId: option.id,
      effects: option.effects,
      targetTraineeIds: selectTargets(option, snapshot.trainee.trainees),
      activityOverride: option.activityOverride,
    },
  ];

  return snapshot.game.weeklyDecisions.flatMap((card) => {
    if (profile === "abusive") {
      // 혹사 운영은 기회(광고·행사)에는 관심이 없다 — 손실 경로만 프로브한다.
      if (card.lane === "opportunity") return [];
      return toResolved(
        card,
        pickPreferredOption(card, ABUSIVE_CRISIS_PREFERENCE, profile),
      );
    }
    if (profile === "novice") {
      // 모든 카드를 "보이는 좋은 숫자가 가장 큰" 옵션으로 고른다. 위기
      // 카드는 반드시 하나를 고르고(가장 덜 나빠 보이는 것), 기회 카드는
      // 이득이 보일 때만 수락한다 — 격주 수락 같은 인공 규칙은 없다.
      const option = [...card.options].sort(
        (left, right) =>
          noviceVisibleUtility(right.effects) - noviceVisibleUtility(left.effects),
      )[0];
      if (!option) return [];
      if (card.lane === "opportunity" && noviceVisibleUtility(option.effects) <= 0) {
        return [];
      }
      return toResolved(card, option);
    }

    const strategicPreference =
      card.id === "strategic-expansion"
        ? profile === "intermediate"
          ? ["strategic-production", "strategic-fandom", "strategic-global"]
          : ["strategic-global", "strategic-fandom", "strategic-production"]
        : [];
    const strategicOption = strategicPreference
      .map((id) => card.options.find((candidate) => candidate.id === id))
      .find((candidate) => candidate !== undefined);
    const contractOption = contractFirst && card.lane === "opportunity"
      ? card.options.find((candidate) => candidate.contractOffer)
      : undefined;
    const option =
      contractOption ?? strategicOption ??
      (profile === "expert"
        ? [...card.options].sort(
            (left, right) =>
              contextualEffectUtility(right.effects, snapshot) -
              contextualEffectUtility(left.effects, snapshot),
          )[0]
        : [...card.options].sort(
            (left, right) => effectUtility(right.effects) - effectUtility(left.effects),
          )[0]);
    if (!option) return [];
    if (card.id === "strategic-expansion") {
      const reserve = profile === "expert" ? 350_000_000 : 200_000_000;
      if (snapshot.finance.money + (option.effects.money ?? 0) < reserve) return [];
    }
    if (
      !contractOption &&
      card.lane === "opportunity" &&
      contextualEffectUtility(option.effects, snapshot) < 0
    ) {
      return [];
    }
    return toResolved(card, option);
  });
}

function weakestTeamStat(trainees: readonly Trainee[]): TraineeStatKey {
  return [...TRAINABLE_STATS].sort(
    (left, right) =>
      average(trainees.map((trainee) => trainee.stats[left])) -
      average(trainees.map((trainee) => trainee.stats[right])),
  )[0];
}

function buildPlayerDecisions(
  snapshot: GameSnapshot,
  profile: PlayerProfile,
  cumulativeWeek: number,
  contractFirst = false,
): PlayerDecisions {
  if (profile === "abusive") {
    // 휴식 없는 극한 훈련을 5년 내내 유지한다. 과로 불만(-3×성격 배율)이
    // 매주 쌓이는 것이 이 페르소나의 핵심 압력이다.
    return {
      trainingSchedule: { intensity: "extreme", restDay: false },
      resolvedDecisions: buildWeeklyDecisions(snapshot, profile),
      promotionOrders: [],
    };
  }

  if (profile === "novice") {
    // 초보는 대시보드 수치가 아니라 "게임이 카드로 소리쳐야" 반응한다.
    // 부상·과로·사기 카드가 뜬 주에만 휴식일을 넣고, 그 외에는 아무
    // 조정 없이 기본 일정을 반복한다.
    const healthAlarm = snapshot.game.weeklyDecisions.some((card) => {
      const root = card.id.split(":")[0];
      return root === "injury" || root === "overwork" || root === "morale";
    });
    const inActivityPeriod = snapshot.game.activeProjects.some(
      (project) =>
        project.kind === "comeback" &&
        project.status !== "completed" &&
        project.currentStageId === "activity",
    );
    return {
      trainingSchedule: { intensity: "normal", restDay: healthAlarm },
      resolvedDecisions: buildWeeklyDecisions(snapshot, profile),
      promotionOrders:
        inActivityPeriod && cumulativeWeek % 3 === 0
          ? [
              {
                activityId: "varietyShow",
                assignedMemberIds: [snapshot.trainee.trainees[0].id],
              },
            ]
          : [],
    };
  }

  const meanStress = average(snapshot.trainee.trainees.map((trainee) => trainee.stress));
  const inActivityPeriod = snapshot.game.activeProjects.some(
    (project) =>
      project.kind === "comeback" &&
      project.status !== "completed" &&
      project.currentStageId === "activity",
  );
  const promotionOrders: PlayerDecisions["promotionOrders"] = [];

  if (inActivityPeriod) {
    if (profile === "expert") {
      const activityId =
        snapshot.game.currentPhase !== "debut" && snapshot.fandom.fandom >= 35
          ? "smallConcert"
          : snapshot.fandom.fandom >= 15 && snapshot.fandom.fandomLoyalty < 75
            ? "fanSign"
            : snapshot.fandom.public < 55
              ? "varietyShow"
              : "youtubeContent";
      promotionOrders.push({
        activityId,
        assignedMemberIds: [
          [...snapshot.trainee.trainees].sort(
            (left, right) => right.stats.charm - left.stats.charm,
          )[0].id,
        ],
      });
    } else if (profile === "intermediate" && cumulativeWeek % 2 === 0) {
      promotionOrders.push({
        activityId:
          snapshot.fandom.fandom < 45
            ? "fanSign"
            : "smallConcert",
      });
    }
  }

  return {
    trainingSchedule:
      meanStress >= (profile === "expert" ? 48 : 60)
        ? { intensity: "normal", restDay: true, focus: weakestTeamStat(snapshot.trainee.trainees) }
        : {
            intensity: profile === "expert" ? "hard" : "normal",
            restDay: false,
            focus:
              profile === "expert" || cumulativeWeek % 2 === 0
                ? weakestTeamStat(snapshot.trainee.trainees)
                : undefined,
          },
    resolvedDecisions: buildWeeklyDecisions(snapshot, profile, contractFirst),
    promotionOrders,
  };
}

interface ConceptChoice {
  genre: Genre;
  mood: ConceptMood;
  centerTraineeId: string;
}

function chooseExpertConcept(snapshot: GameSnapshot): ConceptChoice {
  const mood = [...CONCEPT_MOODS].sort((left, right) => {
    const score = (candidate: ConceptMood) => {
      const teamAffinity = average(
        snapshot.trainee.trainees.map(
          (trainee) => trainee.conceptAffinity[candidate] ?? 50,
        ),
      );
      const bestCenter = Math.max(
        ...snapshot.trainee.trainees.map(
          (trainee) =>
            (trainee.conceptAffinity[candidate] ?? 50) +
            traitComboBonus(trainee.traits ?? [], candidate),
        ),
      );
      const expectation = calculateFandomExpectation(
        snapshot.album.conceptHistory,
        candidate,
      );
      return (
        teamAffinity * 0.55 +
        bestCenter * 0.25 +
        SEASON_MOOD_FIT[snapshot.game.currentSeason][candidate] * 1.5 +
        (snapshot.calendar.marketTrend.hotMood === candidate ? 12 : 0) +
        (snapshot.calendar.marketTrend.coldMood === candidate ? -12 : 0) +
        expectation.fitScore * 0.4
      );
    };
    return score(right) - score(left);
  })[0];
  const center = [...snapshot.trainee.trainees].sort(
    (left, right) =>
      (right.conceptAffinity[mood] ?? 50) +
      traitComboBonus(right.traits ?? [], mood) -
      ((left.conceptAffinity[mood] ?? 50) + traitComboBonus(left.traits ?? [], mood)),
  )[0];
  const hotGenre = snapshot.calendar.marketTrend.hotGenre as Genre;
  return {
    genre: GENRES.includes(hotGenre) ? hotGenre : "dancePop",
    mood,
    centerTraineeId: center.id,
  };
}

function chooseNoviceConcept(snapshot: GameSnapshot, comebackIndex: number): ConceptChoice {
  const mood = CONCEPT_MOODS[(comebackIndex * 7 + snapshot.game.campaignSeed) % CONCEPT_MOODS.length];
  return {
    genre: GENRES[(comebackIndex * 5 + 2) % GENRES.length],
    mood,
    centerTraineeId:
      snapshot.trainee.trainees[comebackIndex % snapshot.trainee.trainees.length].id,
  };
}

function chooseIntermediateConcept(snapshot: GameSnapshot): ConceptChoice {
  const mood = [...CONCEPT_MOODS].sort(
    (left, right) =>
      average(
        snapshot.trainee.trainees.map((trainee) => trainee.conceptAffinity[right] ?? 50),
      ) -
      average(
        snapshot.trainee.trainees.map((trainee) => trainee.conceptAffinity[left] ?? 50),
      ),
  )[0];
  const center = [...snapshot.trainee.trainees].sort(
    (left, right) =>
      (right.conceptAffinity[mood] ?? 50) - (left.conceptAffinity[mood] ?? 50),
  )[0];
  const hotGenre = snapshot.calendar.marketTrend.hotGenre as Genre;
  return {
    genre: GENRES.includes(hotGenre) ? hotGenre : "dancePop",
    mood,
    centerTraineeId: center.id,
  };
}

function chooseAbusiveConcept(snapshot: GameSnapshot): ConceptChoice {
  // 팀 평균 친화가 가장 낮은 무드를 일부러 반복한다 — 부적합 컨셉 불만이
  // 활동기 내내 발동하도록 만드는 손실 경로 프로브.
  const mood = [...CONCEPT_MOODS].sort(
    (left, right) =>
      average(
        snapshot.trainee.trainees.map((trainee) => trainee.conceptAffinity[left] ?? 50),
      ) -
      average(
        snapshot.trainee.trainees.map((trainee) => trainee.conceptAffinity[right] ?? 50),
      ),
  )[0];
  const center = [...snapshot.trainee.trainees].sort(
    (left, right) =>
      (left.conceptAffinity[mood] ?? 50) - (right.conceptAffinity[mood] ?? 50),
  )[0];
  return { genre: "dancePop", mood, centerTraineeId: center.id };
}

function completeProjectChoices(snapshot: GameSnapshot, profile: PlayerProfile): GameSnapshot {
  const owner = snapshot.game.activeProjects.find(
    (project) =>
      project.status !== "completed" &&
      !project.releasedAlbumId &&
      project.decisionStatuses[TITLE_TRACK_SELECTION_DECISION_ID] === "available",
  );
  if (!owner || !snapshot.album.currentAlbum) return snapshot;

  const candidates = snapshot.album.currentAlbum.titleTrackCandidates;
  // 초보도 화면에 보이는 품질 숫자는 읽는다 — 가장 높은 숫자를 고른다.
  // 트랙 타입(팬덤 확장·해외 공략)의 전략적 의미까지 읽는 건 숙련의 몫이고,
  // 혹사는 아무거나(첫 후보) 던진다.
  const selected =
    profile === "abusive"
      ? candidates[0]
      : [...candidates].sort((left, right) => {
          const strategicBonus = (type: string) =>
            profile !== "expert"
              ? 0
              : type === "global" && snapshot.fandom.global < 35
                ? 8
                : type === "fandom" && snapshot.fandom.fandom < 45
                  ? 6
                  : type === "bold" && snapshot.fandom.public < 40
                    ? 4
                    : 0;
          return (
            right.quality + strategicBonus(right.type) -
            (left.quality + strategicBonus(left.type))
          );
        })[0];
  if (!selected) return snapshot;

  return {
    ...snapshot,
    game: {
      ...snapshot.game,
      activeProjects: snapshot.game.activeProjects.map((project) =>
        project.id === owner.id
          ? {
              ...project,
              decisionStatuses: {
                ...project.decisionStatuses,
                [TITLE_TRACK_SELECTION_DECISION_ID]: "completed",
                ...(profile === "expert" &&
                project.decisionStatuses.positionReview === "available"
                  ? { positionReview: "completed" as const }
                  : {}),
              },
            }
          : project,
      ),
    },
    album: {
      ...snapshot.album,
      currentAlbum: { ...snapshot.album.currentAlbum, titleTrack: { ...selected } },
    },
  };
}

function comebackBudgetTier(profile: PlayerProfile): ComebackBudgetTierId {
  return profile === "novice" || profile === "abusive" ? "lean" : "standard";
}

function startComeback(
  snapshot: GameSnapshot,
  profile: PlayerProfile,
  cumulativeWeek: number,
  comebackIndex: number,
): GameSnapshot {
  const budgetTierId = comebackBudgetTier(profile);
  const budget = COMEBACK_BUDGET_TIERS_BY_ID.get(budgetTierId);
  if (!budget) throw new Error(`Missing budget ${budgetTierId}.`);
  const chosen =
    profile === "expert"
      ? chooseExpertConcept(snapshot)
      : profile === "intermediate"
        ? chooseIntermediateConcept(snapshot)
        : profile === "abusive"
          ? chooseAbusiveConcept(snapshot)
          : chooseNoviceConcept(snapshot, comebackIndex);
  const plan = createComebackPlan({
    concept: { genre: chosen.genre, mood: chosen.mood },
    budgetTierId,
    centerTraineeId: chosen.centerTraineeId,
    startedAtWeek: cumulativeWeek,
    season: snapshot.game.currentSeason,
    trainees: snapshot.trainee.trainees,
    conceptHistory: snapshot.album.conceptHistory,
  });
  return {
    ...snapshot,
    game: {
      ...snapshot.game,
      activeProjects: [...snapshot.game.activeProjects, plan.project],
    },
    album: { ...snapshot.album, currentAlbum: plan.album },
    finance: { ...snapshot.finance, money: snapshot.finance.money - budget.cost },
  };
}

function facilityUnlocked(snapshot: GameSnapshot, nextLevel: number): boolean {
  if (nextLevel < 3) return true;
  const unlock = FACILITY_TIER_UNLOCKS[nextLevel as 3 | 4];
  return snapshot.game.milestonesAchieved.some(
    (milestone) => milestone.id === unlock.milestoneId,
  );
}

function upgradeFacility(
  snapshot: GameSnapshot,
  target: LevelFacility,
): { snapshot: GameSnapshot; cost: number } {
  const currentLevel = snapshot.finance.upgrades[target];
  if (currentLevel >= 4 || !facilityUnlocked(snapshot, currentLevel + 1)) {
    return { snapshot, cost: 0 };
  }
  const cost = UPGRADE_COSTS[target][currentLevel];
  if (snapshot.finance.money < cost) return { snapshot, cost: 0 };
  const fixedCosts = { ...snapshot.finance.fixedCosts };
  if (target === "dormLevel") fixedCosts.dormitory += 900_000;
  if (target === "studioLevel") fixedCosts.studio += 1_200_000;
  if (target === "equipmentLevel") fixedCosts.equipment += 700_000;
  return {
    snapshot: {
      ...snapshot,
      finance: {
        ...snapshot.finance,
        money: snapshot.finance.money - cost,
        fixedCosts,
        weeklyFixedTotal: calculateWeeklyFixedTotal(fixedCosts),
        upgrades: {
          ...snapshot.finance.upgrades,
          [target]: (currentLevel + 1) as 2 | 3 | 4,
        },
      },
    },
    cost,
  };
}

function applyFacilityPolicy(
  snapshot: GameSnapshot,
  profile: PlayerProfile,
): { snapshot: GameSnapshot; spend: number } {
  let next = snapshot;
  let spend = 0;
  const buy = (target: LevelFacility) => {
    const result = upgradeFacility(next, target);
    next = result.snapshot;
    spend += result.cost;
  };

  if (profile === "expert") {
    if (next.album.releasedAlbums.length >= 1 && next.finance.money > 450_000_000) {
      if (next.finance.upgrades.equipmentLevel < 3) buy("equipmentLevel");
      if (next.finance.upgrades.studioLevel < 3) buy("studioLevel");
    }
    if (
      next.game.currentPhase !== "debut" &&
      next.finance.money > 700_000_000 &&
      next.finance.upgrades.dormLevel < 3
    ) {
      buy("dormLevel");
    }
  } else if (
    profile === "intermediate" &&
    next.album.releasedAlbums.length >= 2 &&
    next.finance.money > 550_000_000 &&
    next.finance.upgrades.equipmentLevel < 2
  ) {
    buy("equipmentLevel");
  } else if (
    profile === "novice" &&
    next.finance.money > 500_000_000 &&
    next.finance.upgrades.dormLevel < 2
  ) {
    // 초보는 잔액이 크게 쌓인 게 눈에 보이면 숙소부터 한 번 올려 준다.
    buy("dormLevel");
  }
  // abusive는 멤버 처우에 아무것도 투자하지 않는다.
  return { snapshot: next, spend };
}

function musicShowWinsFromReport(report: WeekReport): number {
  return report.events.filter(
    (event) => event.presentation?.kind === "music-show" && event.presentation.won,
  ).length;
}

export interface CampaignOptions {
  /**
   * 숙련 페르소나의 시상식 역산 스케줄링. 끄면 순수 16주 간격으로만
   * 컴백한다 — "달력을 읽는 계획이 실제로 상을 더 가져오는가"를 검증하는
   * 대조군 전용이며, 기본 숙련 플레이는 항상 켜져 있다.
   */
  awardPlanning?: boolean;
}

export function simulateCampaign(
  profile: PlayerProfile,
  seed: number,
  staffingPolicy: StaffingPolicy = "lean",
  contractFirst = false,
  options: CampaignOptions = {},
): CampaignSummary {
  const awardPlanning = options.awardPlanning ?? true;
  let snapshot = makeCampaign(profile, seed, staffingPolicy);
  const startingMoney = snapshot.finance.money;
  let minimumMoney = snapshot.finance.money;
  let totalIncome = 0;
  let totalExpenses = 0;
  let commercialContractIncome = 0;
  let commercialFatigueExposure = 0;
  let maxCommercialScheduleSlots = 0;
  let decisionCosts = 0;
  let financingBorrowed = 0;
  let financingRepaid = 0;
  const decisionCostBreakdown: Record<string, number> = {};
  const incomeBreakdown: Record<string, number> = {};
  const expenseBreakdown: Record<string, number> = {};
  let facilitySpend = 0;
  let injuries = 0;
  let musicShowWins = 0;
  let weeksPlayed = 0;
  let comebackIndex = 0;
  let lastComebackStart = 0;
  let memberDepartures = 0;
  let firstDepartureWeek: number | null = null;
  const yearly: CampaignSummary["yearly"] = [];

  for (let turn = 0; turn < GAME_BALANCE.weeksPerYear * 5; turn++) {
    if (snapshot.game.campaignFailure) break;
    const cumulativeWeek =
      (snapshot.game.currentYear - 1) * GAME_BALANCE.weeksPerYear +
      snapshot.game.currentWeek;

    snapshot = completeProjectChoices(snapshot, profile);
    const facility = applyFacilityPolicy(snapshot, profile);
    snapshot = facility.snapshot;
    facilitySpend += facility.spend;

    const comebackAvailable = canStartComebackProject(
      snapshot.game.currentPhase,
      snapshot.game.activeProjects,
      snapshot.album.currentAlbum,
    );
    const gap = cumulativeWeek - lastComebackStart;
    const releaseWeekOfYear = projectedReleaseWeekOfYear(snapshot.game.currentWeek);
    const cadenceReady =
      profile === "expert"
        ? awardPlanning
          ? // 시상식 역산: 발매가 어느 해 심사에도 집계되지 않는 사각지대
            // (시상 주 이후, 50~52주차)로 떨어질 타이밍이면 몇 주 미루고
            // 연초 발매로 넘긴다. 심사 직전(42~49주차)으로 주기를 당기는
            // 압축 스프린트는 프로브 결과 오히려 해로웠다 — 사이클 압축이
            // 팬 실망·충성도를 갉아 투표 지표(MAMA 30%)를 깎기 때문.
            // 현 시상 체계는 연중 차트 성적을 안 보므로(50주차 public
            // 스냅샷 + 그 해 최고 품질) 달력의 이득은 낭비 회피까지다.
            releaseWeekOfYear < AWARDS_WEEK_OF_YEAR &&
            (lastComebackStart === 0 || gap >= 16)
          : lastComebackStart === 0 || gap >= 16
        : profile === "intermediate"
          ? lastComebackStart === 0 || gap >= 21
          : // 초보는 "돈이 모이면 바로 쓴다" — 예약금 계산 없이 컴백 버튼이
            // 열리고 예산이 맞으면 즉시 시작한다. 혹사도 같은 즉시 강행이지만
            // 동기가 다르다(멤버 소모 전제의 무휴식 회전).
            true;
    const budget = COMEBACK_BUDGET_TIERS_BY_ID.get(comebackBudgetTier(profile))!;
    const reserve =
      profile === "expert"
        ? 260_000_000
        : profile === "intermediate"
          ? 160_000_000
          : profile === "novice"
            ? 20_000_000
            : 80_000_000;
    if (
      comebackAvailable &&
      cadenceReady &&
      snapshot.finance.money >= budget.cost + reserve
    ) {
      snapshot = startComeback(
        snapshot,
        profile,
        cumulativeWeek,
        comebackIndex,
      );
      lastComebackStart = cumulativeWeek;
      comebackIndex++;
    }

    const playerDecisions = buildPlayerDecisions(
      snapshot,
      profile,
      cumulativeWeek,
      contractFirst,
    );
    for (const decision of playerDecisions.resolvedDecisions) {
      const cost = Math.max(0, -(decision.effects.money ?? 0));
      if (cost === 0) continue;
      const key = decision.cardId.startsWith("recontract:")
        ? "recontract"
        : decision.cardId.startsWith("opportunity:")
          ? "opportunity"
          : decision.cardId;
      decisionCostBreakdown[key] = (decisionCostBreakdown[key] ?? 0) + cost;
    }
    const result = processWeek(snapshot, playerDecisions);
    totalIncome += sumRecord(result.weekReport.finance.income);
    totalExpenses += sumRecord(result.weekReport.finance.expenses);
    for (const [key, value] of Object.entries(result.weekReport.finance.income)) {
      incomeBreakdown[key] = (incomeBreakdown[key] ?? 0) + value;
    }
    for (const [key, value] of Object.entries(result.weekReport.finance.expenses)) {
      expenseBreakdown[key] = (expenseBreakdown[key] ?? 0) + value;
    }
    commercialContractIncome +=
      result.weekReport.finance.income.commercialContracts ?? 0;
    commercialFatigueExposure += snapshot.game.activeCommercialContracts.reduce(
      (sum, contract) =>
        sum +
        contract.weeklyStress *
          (contract.targetTraineeIds.length || snapshot.trainee.trainees.length),
      0,
    );
    decisionCosts += result.weekReport.finance.expenses.decisionCosts ?? 0;
    financingBorrowed += result.weekReport.finance.income.emergencyFinancing ?? 0;
    financingRepaid += result.weekReport.finance.expenses.financingRepayment ?? 0;
    injuries += result.weekReport.injuries.length;
    musicShowWins += musicShowWinsFromReport(result.weekReport);
    const departuresThisWeek = result.weekReport.events.filter((event) =>
      event.id.startsWith("member-leave:"),
    ).length;
    if (departuresThisWeek > 0) {
      memberDepartures += departuresThisWeek;
      firstDepartureWeek ??= cumulativeWeek;
    }
    snapshot = result.newState;
    maxCommercialScheduleSlots = Math.max(
      maxCommercialScheduleSlots,
      snapshot.game.activeCommercialContracts.reduce(
        (sum, contract) => sum + contract.scheduleSlots,
        0,
      ),
    );
    weeksPlayed++;
    minimumMoney = Math.min(minimumMoney, snapshot.finance.money);

    if (weeksPlayed % GAME_BALANCE.weeksPerYear === 0) {
      yearly.push({
        year: weeksPlayed / GAME_BALANCE.weeksPerYear,
        money: snapshot.finance.money,
        fandom: snapshot.fandom.fandom,
        public: snapshot.fandom.public,
        averageStats: averageMemberStats(snapshot.trainee.trainees),
        releases: snapshot.album.releasedAlbums.length,
      });
    }
  }

  const albums = snapshot.album.releasedAlbums;
  const qualities = albums.map((album) => album.quality);
  const chartRanks = albums
    .map((album) => album.performance?.chartPeak ?? 0)
    .filter((rank) => rank > 0);
  const upgrades = snapshot.finance.upgrades;

  return {
    profile,
    seed,
    weeksPlayed,
    failedAtWeek: snapshot.game.campaignFailure
      ? (snapshot.game.campaignFailure.year - 1) * GAME_BALANCE.weeksPerYear +
        snapshot.game.campaignFailure.week
      : null,
    startingMoney,
    endingMoney: snapshot.finance.money,
    minimumMoney,
    totalIncome,
    totalExpenses,
    commercialContractIncome,
    commercialFatigueExposure,
    maxCommercialScheduleSlots,
    decisionCosts,
    financingBorrowed,
    financingRepaid,
    decisionCostBreakdown,
    facilitySpend,
    releases: albums.length,
    averageAlbumQuality: average(qualities),
    bestAlbumQuality: qualities.length > 0 ? Math.max(...qualities) : 0,
    averageChartRank: average(chartRanks),
    chartNumberOnes: chartRanks.filter((rank) => rank === 1).length,
    topTenAlbums: chartRanks.filter((rank) => rank <= 10).length,
    musicShowWins,
    awards: snapshot.game.awardHistory.length,
    rookieAwards: snapshot.game.awardHistory.filter((award) => award.category === "rookie").length,
    bonsangAwards: snapshot.game.awardHistory.filter((award) => award.category === "bonsang").length,
    daesangAwards: snapshot.game.awardHistory.filter((award) => award.category === "daesang").length,
    public: snapshot.fandom.public,
    fandom: snapshot.fandom.fandom,
    global: snapshot.fandom.global,
    industry: snapshot.fandom.industry,
    loyalty: snapshot.fandom.fandomLoyalty,
    disappointment: snapshot.fandom.fandomDisappointment,
    averageMemberStats: averageMemberStats(snapshot.trainee.trainees),
    averageChemistry: averageChemistry(snapshot.trainee.trainees),
    averageStress: average(snapshot.trainee.trainees.map((trainee) => trainee.stress)),
    averageSatisfaction: average(
      snapshot.trainee.trainees.map((trainee) => trainee.satisfaction),
    ),
    injuries,
    remainingMembers: snapshot.trainee.trainees.length,
    memberDepartures,
    firstDepartureWeek,
    incomeBreakdown,
    expenseBreakdown,
    facilityLevelTotal:
      upgrades.dormLevel + upgrades.studioLevel + upgrades.equipmentLevel,
    yearly,
  };
}

export function median(
  summaries: readonly CampaignSummary[],
  key: keyof CampaignSummary,
): number {
  const values = summaries
    .map((summary) => summary[key])
    .filter((value): value is number => typeof value === "number")
    .sort((left, right) => left - right);
  const middle = Math.floor(values.length / 2);
  return values.length % 2 === 0
    ? (values[middle - 1] + values[middle]) / 2
    : values[middle];
}

export function compactReport(summaries: readonly CampaignSummary[]) {
  const keys: Array<keyof CampaignSummary> = [
    "weeksPlayed",
    "endingMoney",
    "minimumMoney",
    "totalIncome",
    "totalExpenses",
    "commercialContractIncome",
    "commercialFatigueExposure",
    "maxCommercialScheduleSlots",
    "decisionCosts",
    "financingBorrowed",
    "financingRepaid",
    "facilitySpend",
    "releases",
    "averageAlbumQuality",
    "bestAlbumQuality",
    "averageChartRank",
    "chartNumberOnes",
    "topTenAlbums",
    "musicShowWins",
    "awards",
    "rookieAwards",
    "bonsangAwards",
    "daesangAwards",
    "public",
    "fandom",
    "global",
    "industry",
    "loyalty",
    "disappointment",
    "averageMemberStats",
    "averageChemistry",
    "averageStress",
    "averageSatisfaction",
    "injuries",
    "remainingMembers",
    "memberDepartures",
    "facilityLevelTotal",
  ];
  return Object.fromEntries(keys.map((key) => [key, median(summaries, key)]));
}
