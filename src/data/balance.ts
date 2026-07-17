import type {
  ConceptSynergyGrade,
  EffectMap,
  MemberTemperament,
  Position,
  Season,
  TrainingIntensity,
} from "@/types/game";

export const GAME_BALANCE = {
  baseWidth: 360, // Mobile-first baseline keeps the simulation readable on narrow screens.
  baseHeight: 640, // A 9:16-ish portrait frame matches the intended one-hand play pattern.
  weeksPerYear: 52, // One in-game year maps to a familiar K-Pop scheduling cycle.
  weeksPerSeason: 13, // Four equal seasons simplify trend rotation and event pacing.
  weeklyDecisionMaxCount: 4, // 상황이 실제로 발생한 경우에만 최대 네 건까지 플레이어에게 올린다.
  maxStatValue: 100, // All visible character-facing stats stay on the same 0-100 scale.
} as const;

export const WEEKS_PER_MONTH = GAME_BALANCE.weeksPerYear / 12; // Fixed costs are priced monthly but charged weekly at this ratio.

// 전속계약 기간. 실제 K-POP 관습은 7년이지만 게임 페이싱에는 너무 길어
// 3년(156주)을 기본으로 한다. 계약 만료가 캠페인의 시계가 되고,
// 만료 전 재계약 협상이 후반 멤버 운영 컨텐츠의 축이 된다.
export const CONTRACT_TERM_WEEKS = GAME_BALANCE.weeksPerYear * 3;

/**
 * 데뷔의 "완성형" 기준선. 게이트가 아니다 — 발매는 일정대로 이뤄지고
 * (Game Dev Story 원칙: 퀄리티가 낮다고 출시를 막지 않는다), 이 기준 대비
 * 완성도가 쇼케이스 평가와 차트 결과로 나타날 뿐이다.
 */
export const DEBUT_REQUIREMENTS = {
  readiness: 80,
  averageVocal: 55,
  projectWeeks: 24, // 가장 긴 일정 기준의 프로젝트 상한.
} as const;

/**
 * 창단 시 정하는 데뷔 일정. 짧으면 시장의 첫 주목을 받는 대신 완성도가
 * 낮고, 길면 완성도가 오르는 대신 경쟁 신인 데뷔에 가려질 수 있다.
 */
export const DEBUT_SCHEDULE_TIERS = [
  {
    id: "fast",
    label: "속전속결",
    debutWeek: 16,
    attentionMult: 1.2, // 첫 신인 프리미엄 — 발매 주 대중·팬덤 반응 배율.
    rivalDebutChance: 0.15, // 같은 주 경쟁 신인 데뷔로 가려질 확률.
    summary: "시장의 첫 주목을 독차지하지만 완성도와 평가가 낮을 수 있습니다",
  },
  {
    id: "standard",
    label: "정석",
    debutWeek: 20,
    attentionMult: 1.0,
    rivalDebutChance: 0.35,
    summary: "준비와 주목도의 균형을 잡는 표준 일정입니다",
  },
  {
    id: "long",
    label: "완성형",
    debutWeek: 24,
    attentionMult: 0.85,
    rivalDebutChance: 0.6,
    summary: "완성도를 끌어올리지만 그 사이 경쟁 신인들에게 가려질 수 있습니다",
  },
] as const;

export type DebutScheduleTier = (typeof DEBUT_SCHEDULE_TIERS)[number];

export const DEBUT_SCHEDULE_TIERS_BY_ID = new Map(
  DEBUT_SCHEDULE_TIERS.map((tier) => [tier.id, tier]),
);

/** 스케줄 미기록 구버전 세이브가 따르는 기본 일정. */
export const DEFAULT_DEBUT_SCHEDULE_ID = "standard";

/** 데뷔 프로모션(티저~쇼케이스)이 발매보다 앞서 시작되는 주 수. */
export const DEBUT_PROMOTION_LEAD_WEEKS = 2;

/**
 * 쇼케이스는 합격/불합격 게이트가 아니라 평가다. 점수 구간이 데뷔 주의
 * 업계·팬덤 반응을 소폭 가감한다 — 낮은 완성도는 출시를 막는 게 아니라
 * 결과로 말한다.
 */
export const DEBUT_SHOWCASE_GRADES: readonly {
  min: number;
  label: string;
  summary: string;
  effects: EffectMap;
}[] = [
  {
    min: 75,
    label: "완성형 데뷔",
    summary: "무대 완성도가 기준선을 넘어 업계와 팬덤의 신뢰를 얻었다",
    effects: { industry: 3, fandom: 2 },
  },
  {
    min: 55,
    label: "무난한 출발",
    summary: "신인다운 무대. 성장 서사의 출발점으로는 충분하다",
    effects: {},
  },
  {
    min: 0,
    label: "미완의 데뷔",
    summary: "준비가 부족한 무대가 그대로 드러났다",
    effects: { industry: -2, fandomDisappointment: 4 },
  },
];

/**
 * 컴백 프로젝트의 페이싱. readiness는 게이트가 아니라 권장 준비도 —
 * 낮아도 발매되며 progressMult를 통해 품질·차트로 귀결된다.
 */
export const COMEBACK_REQUIREMENTS = {
  readiness: 65, // 권장 준비도. GoalLanes·기획 UI 표기 기준.
  releaseWeek: 12, // 발매 스테이지가 열리는 상대 주차. D-day 카운트의 기준.
  activityWeeks: 3, // 발매 후 활동기 — 음악방송·프로모션이 열리는 컴백의 정점.
  projectWeeks: 16, // 컨셉 조사부터 활동기·정산까지의 표준 사이클 길이.
} as const;

// 음악방송 1위 후보는 아무나 서지 못한다. 후보권 밖의 신인은 조용한 무대
// 리포트만 받고, "첫 후보 진입" 자체가 이정표가 된다 — 지는 대결 연출의
// 반복(1~2년차 승률 0~5%)을 긴장으로 바꾸는 장치다.
export const MUSIC_SHOW_CANDIDACY = {
  maxChartRank: 15, // 이 순위 안(멜론 기준)이어야 1위 후보에 선다.
} as const;

/**
 * 앨범 성적은 실력의 선형 함수가 아니다. 같은 완성도라도 트렌드 적중,
 * 계절 적합(여름 청량·파워풀, 겨울 몽환·세련 등 — SEASON_MOOD_FIT),
 * 발매 주 운에 따라 차트 파워가 ±25%p 이상 흔들린다 — 성장은 기대값을
 * 올릴 뿐 결과를 보장하지 않는다.
 */
export const RELEASE_MARKET_SWING = {
  hotMoodMult: 1.12, // 시장 강세 무드 적중.
  coldMoodMult: 0.88, // 약세 무드 정면 충돌.
  hotGenreMult: 1.08,
  coldGenreMult: 0.92,
  seasonFitScale: 0.01, // SEASON_MOOD_FIT(-5~12)을 파워 배율(±12%)로 환산.
  luckSpread: 0.1, // 발매 주 운: ×0.9~1.1. 모든 발매에 적용된다.
} as const;

/**
 * 컴백 기획의 제작 예산. 착수 비용이 없으면 "정산 즉시 무조건 재컴백"이
 * 지배 선택이 된다. 예산이 사전 제작분(출발 진행도)을 결정해, 절약 기획은
 * 낮은 완성도 리스크를 스스로 감수하는 결정이 된다.
 */
export const COMEBACK_BUDGET_TIERS = [
  {
    id: "lean",
    label: "절약",
    cost: 30_000_000,
    baseProgress: 12,
    summary: "최소 예산. 완성도가 낮은 채로 발매될 위험을 감수합니다",
  },
  {
    id: "standard",
    label: "표준",
    cost: 60_000_000,
    baseProgress: 20,
    summary: "무난한 사전 제작과 안정적인 일정",
  },
  {
    id: "blockbuster",
    label: "대형",
    cost: 120_000_000,
    baseProgress: 30,
    summary: "높은 출발선. 시설·스태프 투자와 자금을 경쟁합니다",
  },
] as const;

export type ComebackBudgetTier = (typeof COMEBACK_BUDGET_TIERS)[number];
export type ComebackBudgetTierId = ComebackBudgetTier["id"];

export const COMEBACK_BUDGET_TIERS_BY_ID = new Map(
  COMEBACK_BUDGET_TIERS.map((tier) => [tier.id, tier]),
);

// 음악방송 1위 대결의 보상. 승리는 활동기의 정점이어야 하고,
// 패배는 다음 주 결정을 바꿀 만큼만 아프고 회복 불가능해서는 안 된다.
export const MUSIC_SHOW_OUTCOME = {
  win: { fandom: 4, public: 5, industry: 3, satisfaction: 6 },
  lose: { fandomLoyalty: 2, stress: 3 },
} as const;

// 음악방송은 음원 파워만의 무대가 아니라 팬덤 화력이 결정력을 갖는 무대다.
// 차트에서 밀려도 팬덤으로 1위를 다투는 순간이 이 가중치에서 나온다.
export const MUSIC_SHOW_SCORE = {
  powerWeight: 0.7,
  fanVoteWeight: 0.3,
  /** 배경 그룹(시장 기준선)의 팬덤 화력. 활동 라이벌은 실제 팬덤을 쓴다. */
  marketBaselineFanVote: 45,
} as const;

// 차트풀에서 배경 그룹(시장 전체)의 존재감. 1.0이면 최상위 배경 그룹이
// 플레이어의 이론상 최대 파워 위에 있어 성장 곡선이 영원히 1위에 닿지 못한다
// (전 구간 음악방송 승률 0% 측정). 기성 그룹 역전은 3~7년차의 목표이므로
// 밴드를 플레이어 후반 곡선이 간신히 관통하는 높이까지만 누른다.
export const BACKGROUND_CHART_POWER_SCALE = 0.8;

// 프로듀서가 없거나 약하면 앨범 제작이 매주 사고 위험에 노출된다.
// 스태프 고용은 속도(진행 계수)만이 아니라 안정성(사고 확률)을 산다.
export const PRODUCTION_RISK = {
  safeAbility: 55, // 이 능력치 이상의 프로듀서면 제작 사고가 나지 않는다.
  noStaffChance: 0.25, // 프로듀서 부재 시 주간 사고 확률.
  lowStaffChance: 0.12, // 능력 미달 프로듀서의 주간 사고 확률.
  songProgressLoss: 6, // 사고 1회당 곡 작업 손실.
} as const;

// FM 유스식 육성: 신인은 낮은 능력치로 시작하고(상한 30~40대),
// 예산은 능력치가 아니라 잠재력을 산다. 완성은 여러 앨범과 활동 이후다.
export const RECRUIT_STAT_BANDS = {
  min: 18, // 추가 예산 0 기준 하한.
  max: 32, // 추가 예산 0 기준 상한.
  budgetSpread: 8, // 최대 예산 시 하한·상한에 더해지는 폭.
  scoutBonus: 4, // 스카우트 방식의 즉시 전력 보정.
  hardCap: 45, // 어떤 조합으로도 넘지 못하는 신인 스탯 상한.
} as const;

export const RECRUIT_POTENTIAL = {
  base: 0.75,
  spread: 0.65, // 기본 롤 폭: 0.75~1.40.
  budgetBonus: 0.25, // 최대 예산이 더하는 잠재력 — 예산은 잠재력을 산다.
  scoutBonus: 0.1,
  max: 1.7,
} as const;

// 잠재력이 성장 상한을 정한다: cap = base + potential × perPotential.
// (0.8→67, 1.2→81, 1.5→92, 1.7→99) 상한 근처에서는 성장이 taper된다.
export const POTENTIAL_STAT_CAP = { base: 38, perPotential: 36 } as const;
export const POTENTIAL_TAPER_WINDOW = 18;

// 창단 시장에는 검증된 인재가 오지 않는다. 상위 풀은 회사가 성장한 뒤
// 재모집(M5)에서 열린다.
export const FOUNDING_STAFF_ABILITY_CAP = 60;

// 신생 기획사의 창단 시장에는 상위 시설이 아예 매물로 나오지 않는다.
// 3~4단계는 이정표 언락 이후에만 보이고, 열려도 큰 맘을 먹어야 하는 가격이다.
export const FOUNDING_FACILITY_MAX_LEVEL = 2;

/** 시설 상위 단계의 언락 이정표. 달성 전에는 업그레이드 목록에서 잠긴다. */
export const FACILITY_TIER_UNLOCKS: Record<
  3 | 4,
  { milestoneId: string; label: string }
> = {
  3: { milestoneId: "first-release", label: "첫 앨범 발매" },
  4: { milestoneId: "mid-concert-open", label: "중극장 공연 규모 달성" },
};

// 상시 스태프 시장(M5): 풀 상한이 업계 신뢰와 함께 열리고, 후보는 매주
// 회전한다. 오래 함께한 스태프의 교체는 팀 만족도로 대가를 치른다.
export const STAFF_MARKET = {
  industryScale: 0.5, // 풀 상한 = 창단 상한(60) + 업계 신뢰 × 이 값.
  candidatesPerRole: 3,
  replaceTeamSatisfactionPenalty: -4,
} as const;

// ── M5 「사람」: 개인 인기도·성격·재계약 ─────────────────────────────

// 개인 인기도는 활동과 노출로 쌓인다. 팀이 쉬면 서서히 식는다 —
// "가장 인기 있는 멤버"가 데이터로 구분되어 재계약 격차 서사의 근거가 된다.
export const MEMBER_POPULARITY = {
  /** 활동기 주간 기본 노출. */
  activityWeekBase: 0.8,
  /** 포지션별 노출 가중 — 활동기에 더해진다. */
  positionExposure: {
    center: 0.6,
    visual: 0.5,
    mainVocal: 0.5,
    mainDancer: 0.4,
    variety: 0.55,
    leader: 0.3,
    producing: 0.25,
  } as Partial<Record<Position, number>>,
  entertainmentGain: 2.5, // 개인 예능/유튜브 스케줄 수행.
  promotionGain: 1.2, // 프로모션 지정 참가 멤버.
  musicShowWinGain: 1.5, // 1위 무대는 전원에게 남는다.
  viralGain: 8, // 직캠 바이럴의 주인공.
  weeklyDecay: 0.4, // 아무 노출이 없는 주의 감쇠.
} as const;

/** 성격이 재계약 요구 시점·조건 격차 반응·스트레스 민감도를 가른다. */
export const TEMPERAMENT_PROFILES: Record<
  MemberTemperament,
  {
    label: string;
    description: string;
    /** 조건 격차 불만 배율. */
    gapSensitivity: number;
    /** 재계약 주기 보정(주). 음수면 더 일찍 협상을 요구한다. */
    renegotiationBiasWeeks: number;
    /** 과로 불만 배율(satisfactionSystem). */
    stressSensitivity: number;
  }
> = {
  ambitious: {
    label: "야심가",
    description: "기회와 조건에 민감하다. 성장이 대우로 돌아오지 않으면 먼저 움직인다",
    gapSensitivity: 2,
    renegotiationBiasWeeks: -26,
    stressSensitivity: 1,
  },
  devoted: {
    label: "헌신형",
    description: "팀의 성취를 자기 일처럼 여긴다. 격차에 관대하지만 무한하지는 않다",
    gapSensitivity: 0.5,
    renegotiationBiasWeeks: 13,
    stressSensitivity: 1,
  },
  steady: {
    label: "안정형",
    description: "감정의 진폭이 작고 예측 가능하다",
    gapSensitivity: 1,
    renegotiationBiasWeeks: 0,
    stressSensitivity: 1,
  },
  sensitive: {
    label: "섬세형",
    description: "무대 표현이 섬세한 만큼 과로와 갈등에 쉽게 지친다",
    gapSensitivity: 1,
    renegotiationBiasWeeks: 0,
    stressSensitivity: 1.6,
  },
};

// 멤버 재계약: 주기 도래 또는 조기 트리거(인기 급상승·과로)로 협상 카드가
// 올라온다. 동결은 공짜가 아니고, 격차는 매주 불만으로 되돌아온다.
export const MEMBER_CONTRACT = {
  initialTier: 1,
  maxTier: 5,
  renegotiationIntervalWeeks: 78, // 기본 1.5년 주기.
  /** 인기 조기 트리거: popularity ≥ tier×15 + 이 값이면 앞당겨 요구한다. */
  earlyTriggerPopularityMargin: 30,
  overworkTriggerStress: 70, // 과로 조기 트리거(인기 40+ 필요).
  overworkTriggerPopularity: 40,
  earlyTriggerLeadWeeks: 26, // 성공 직후에도 협상이 반년보다 자주 반복되지는 않는다.
  signingBase: 10_000_000, // 조건 인상 계약금 = base + 인기×perPopularity.
  signingPerPopularity: 1_500_000,
  /** 성공세가 곧바로 파산세가 되지 않도록 현재 현금의 이 비율까지만 즉시 지급한다. */
  signingLiquidityShare: 0.05,
  signingCashCap: 50_000_000,
  gapTierThreshold: 2, // 팀 내 최고 처우와 이만큼 벌어지면 불만.
  gapPenalty: -2, // 주간 격차 불만(성격 배율 적용 전).
  freezeSatisfactionPenalty: -12,
} as const;

/** 만족도 바닥이 이만큼 연속되면 실제로 떠난다. 최소 인원 밑으로는 남는다. */
export const MEMBER_LEAVE = {
  countdownWeeks: 4,
  minTeamSize: 3,
} as const;

// 스태프도 잠재 상한이 있다. 실무로 조금씩 성장하지만(연 +3 수준) 본인의
// 천장(채용 시 랜덤 결정)을 넘지 못한다 — 회사가 커지면 결국 새 인재
// 채용(M5 재모집)이 필요해지는 구조의 근거다.
export const STAFF_GROWTH = {
  weeklyGrowth: 0.06, // 실무 주간 성장. 연 환산 약 +3.
  capMarginMin: 0, // 잠재 상한 = 채용 시 능력 + [min, max] 랜덤 마진.
  capMarginMax: 75,
  potentialSkew: 1.7, // 큰 성장 폭은 드물지만 낮은 능력의 원석도 충분히 등장한다.
  legacyCapMargin: 10, // 상한 정보가 없는 구버전 세이브 스태프의 기본 헤드룸.
} as const;


// FM 유스식 페이싱: 포커스 스탯 기준 연 +20~25. 완성(캡 도달)은 고잠재
// 멤버 기준 4~5년차다 — 한 시즌 만에 만렙이 되면 재계약·세대교체 컨텐츠가
// 설 자리가 없다. (0.8이었을 때 1년차에 캡 도달을 프로브로 확인)
export const TRAINING_BASE_GROWTH = 0.2;

// 휴식일은 스트레스 완화 대가로 그 주 성장을 깎는다. 무비용이면 항상 켜는
// 것이 지배 선택이 되므로, "언제 쉬게 할 것인가"가 실제 결정이 되게 한다.
export const REST_DAY_GROWTH_MULT = 0.85;

// 개인 레슨은 한 스탯(포커스, 미지정 시 최고 스탯)에 집중 성장을 준다.
// 대가는 그 주 팀 합동 훈련 제외(케미 성장 기회 상실)와 스트레스다.
// 포커스 훈련의 약 3배 — 느린 기본 성장 위에서 유의미한 가속이 된다.
export const INDIVIDUAL_LESSON_GROWTH = 1.4;

// 예능 출연의 대중성 보상은 확정이 아니라 분산이 있어야 반복 최적해가 되지
// 않는다. 바이럴이면 추가 보상, 무반응이면 이번 주 대중성 상승이 사라진다.
export const VARIETY_OUTCOME = {
  viralChance: 0.2,
  dudChance: 0.25,
  viralPublicBonus: 6,
  viralGlobalBonus: 3,
} as const;

export const TRAINING_INTENSITY_MULTIPLIER: Record<TrainingIntensity, number> = {
  normal: 1.0, // Baseline growth keeps weekly planning flexible.
  hard: 1.5, // Hard training should feel clearly stronger without invalidating recovery.
  extreme: 2.0, // Extreme training is powerful enough to tempt the player into risky greed.
};

export const MANAGER_EFFICIENCY_SCALE = {
  min: 0.5, // Weak management should still function instead of hard-bricking progression.
  max: 2.0, // Elite management can double throughput but should not break stat ceilings alone.
};

export const STRESS_INCREASE_RATE: Record<TrainingIntensity, number> = {
  normal: 3, // Normal practice causes manageable fatigue.
  hard: 7, // Hard blocks create noticeable attrition pressure after a few weeks.
  extreme: 15, // Extreme pushes are meant to threaten injuries and satisfaction quickly.
};

export const STRESS_DECREASE_RATE = {
  rest: -10, // A rest week should erase one or two normal practice weeks of fatigue.
  vacation: -25, // Vacation is the hard reset lever for near-burnout situations.
} as const;

export const INJURY_PROBABILITY_BASE = 0.004; // Keep routine weeks quiet enough that an injury remains an exceptional setback.
export const INJURY_STAMINA_FACTOR = 0.00006; // Applied to (100 - stamina): stamina 0 adds +0.6%p weekly risk, stamina 100 adds none.
export const INJURY_STRESS_FACTOR = 0.00016; // Stress remains the clearest player-controlled lever: +1.6%p weekly risk at stress 100.
export const INJURY_RISK_WARNING_THRESHOLD = 0.008;
export const INJURY_RISK_CRITICAL_THRESHOLD = 0.016;

export const CHEMISTRY_JOINT_TRAINING_GAIN = 2; // Shared practice should improve team feel slowly, not instantly.
export const CHEMISTRY_CONFLICT_THRESHOLD = -50; // Below this, conflict is severe enough to justify explicit events.
export const TEAM_CHEMISTRY_PERFORMANCE_WEIGHT = 0.15; // Team feel matters, but execution should still dominate stage outcomes.
export const CHEMISTRY_DYNAMICS = {
  baseRoutineTrainingCeiling: 25,
  aboveCeilingWeeklyDecay: 0.35,
  separateActivityDecay: 1.25,
  sharedStageGain: 10,
  frictionStressThreshold: 55,
  maxWeeklyStressFriction: 0.75,
} as const;

export const CHEMISTRY_PAIR_SYNERGY = {
  sameAge: 6,
  nearAge: 3,
  samePersonality: 8,
  complementaryPersonality: 7,
  dogCatVisual: 10,
  sameAppearance: 4,
  complementaryPosition: 6,
  complementaryPersonalityPairs: [
    ["energetic", "reserved"],
    ["bubbly", "haughty"],
  ],
  complementaryPositionPairs: [
    ["mainVocal", "mainDancer"],
    ["leader", "center"],
    ["visual", "variety"],
    ["producing", "mainVocal"],
    ["producing", "mainDancer"],
  ],
} as const;

export const POSITION_TRIAL_SCORE_WEIGHTS = {
  fitness: 0.65,
  condition: 0.15,
  chemistry: 0.15,
  stageForm: 0.05,
} as const;
export const POSITION_TRIAL_INJURY_PENALTY_PER_WEEK = 12;
export const POSITION_TRIAL_MAX_INJURY_PENALTY = 30;

export const SATISFACTION_CONCEPT_MISMATCH_PENALTY = -5; // Repeating the wrong concept must become dangerous within a comeback cycle.
export const SATISFACTION_OVERWORK_PENALTY = -3; // Overwork should chip away steadily rather than trigger instant collapse.
export const SATISFACTION_WARNING_THRESHOLD = 30; // At this point, the player should feel urgent retention pressure.
export const SATISFACTION_LEAVE_THRESHOLD = 10; // This is low enough that ignoring it is a clear strategic failure.
export const SATISFACTION_BASELINE = 50; // Base satisfaction regresses toward this value so past bonuses fade over time.
export const SATISFACTION_REGRESSION_RATE = 1; // Fixed weekly decay above the baseline keeps small bonuses ephemeral and big ones lasting.
export const CONTRACT_SENTIMENT_SATISFIED_MIN = 65; // 계약 브리핑에서 확실한 만족으로 읽히는 구간. 기준점 근처의 일시적 호감과 구분한다.

export const PUBLIC_DECAY_RATE = -2; // Casual attention should fade every inactive week.
export const FANDOM_DISAPPOINTMENT_SCANDAL = 15; // Scandals need to be one of the fastest ways to damage loyalty.
export const FANDOM_DISAPPOINTMENT_CONCEPT_BREAK = 10; // Hard pivots should hurt if not justified by quality.
export const FANDOM_DISAPPOINTMENT_COMMERCIAL = 5; // Overt monetization should annoy fans, but less than scandals or betrayal.
export const FANDOM_LEAVE_THRESHOLD = 80; // Churn should begin only after multiple ignored warning signs.

export const DECISION_TRIGGER_THRESHOLDS = {
  highStress: 70,
  fandomDisappointment: 50,
  lowFandomLoyalty: 30,
  minFandomForLoyaltyIssue: 10,
  financialRunwayWeeks: 8,
} as const;

/** 기회 카드는 평온한 주에 리듬을 만들되 위기 판단을 가리지 않아야 한다. */
export const OPPORTUNITY_PACING = {
  minGapWeeks: 2,
  maxGapWeeks: 3,
  maxConcurrentCrises: 1,
  deadlineWarningWeeks: 2,
  fatigueWarningStress: 50,
} as const;

/**
 * 실패 정의: FM의 경질에 해당한다. 자금 마이너스가 이어지면 투자사가
 * 회수를 결정하고 캠페인이 끝난다. 위기 카드·런웨이 경고·주차 카운트다운이
 * 먼저 오므로 기습이 아니라 예고된 결말이다.
 */
export const CAMPAIGN_FAILURE = {
  insolvencyLimitWeeks: 8,
} as const;

export const INVESTOR_PENALTY_GRACE_WEEKS = 4; // A failed condition warns first so the player can react before being punished.
export const INVESTOR_COMPLY_SUPPORT_LIMIT = 3; // The investor bails the player out only a few times; unlimited cash would invert the incentive to meet conditions.
export const INVESTOR_NEGOTIATION_EXTENSION_WEEKS = 2; // 재협상은 기존 미달 조건의 페널티 유예를 실제로 두 주 연장한다.

export const COMPETITOR_SCALING_FACTOR = 0.8; // Rivals should trail the player slightly so smart planning can overcome them.
export const EVENT_COMPETITOR_SPAWN_CHANCE = 0.15; // Seasonal event rivals should be memorable spikes, not routine noise.

/**
 * 세계는 늙는다(F6): 매년 신인 그룹이 데뷔해 신인상 코호트가 갱신되고,
 * 존재감을 잃은 오래된 그룹은 해체한다. 2년차부터 적용 —
 * 1년차 코호트는 창단 시 생성되는 상시 라이벌이다.
 */
export const ROOKIE_COHORT = {
  /** 매년 데뷔하는 신인 경쟁 그룹 수. */
  groupsPerYear: 2,
  /** 기성 아키타입 밴드 대비 신인 스탯 스케일. 주간 성장으로 따라잡는다. */
  statScale: 0.75,
  /** 신인의 팬덤·대중 인지·해외 기반은 얕게 시작한다. */
  fandomScale: 0.45,
  /** 업계 신뢰도 낮게 시작한다. */
  industryScale: 0.6,
  /** 상시 라이벌 총원 상한. 넘치면 흐려진 그룹부터 해체한다. */
  maxRoster: 9,
  /** 해체 대상이 되는 최소 활동 연차 — 신인을 바로 정리하지 않는다. */
  disbandMinYears: 5,
} as const;

export const CONCEPT_SYNERGY_BONUS: Record<ConceptSynergyGrade, number> = {
  S: 1.3, // Best-in-class matches deserve a visibly stronger ceiling.
  A: 1.15, // Strong matches should feel rewarding without becoming mandatory.
  B: 1.0, // Neutral combinations define the baseline for balance math.
  C: 0.85, // Weak matches should still be playable when other factors are excellent.
  D: 0.7, // Bad matches must be punishing enough to teach the system.
};

export const SEASON_FIT_BONUS = 0.1; // Seasonal fit should matter, but never overpower the core concept.
export const FANDOM_EXPECTATION_SAFE = 0.05; // Gentle evolution earns a small loyalty cushion.
export const FANDOM_EXPECTATION_RISKY = {
  fandomPenalty: -15, // Fans should react sharply when identity changes too abruptly.
  publicBonusChance: 0.2, // Breakthrough pivots should be rare enough to feel dramatic.
  publicBonusAmount: 20, // When a risky pivot lands, it must create meaningful mainstream upside.
} as const;

export const TITLE_TRACK_TYPE_WEIGHTS = {
  safe: {
    fandom: 1.1, // Safe songs should please the existing base first.
    public: 0.9, // They trade breakout odds for reliability.
  },
  bold: {
    fandom: 0.8, // Bold swings can alienate the core unless execution is excellent.
    public: 1.3, // Public upside is the reason to take the risk.
    variance: 0.4, // A wider outcome band keeps bold choices exciting.
  },
  fandom: {
    fandom: 1.25, // Fan-targeted tracks should be the best loyalty stabilizer.
    public: 0.75, // They are intentionally less casual-listener friendly.
  },
  global: {
    fandom: 0.95, // Existing domestic fans neither love nor hate them by default.
    public: 1.05, // Global-oriented songs can still support domestic awareness modestly.
    global: 1.35, // Their main job is overseas reach.
  },
} as const;

export const DORM_CONDITION_MULT: Record<1 | 2 | 3 | 4, number> = {
  1: 1.0,
  2: 1.2,
  3: 1.4,
  4: 1.6,
};

export const DORM_SATISFACTION_BONUS: Record<1 | 2 | 3 | 4, number> = {
  1: -1,
  2: 0,
  3: 1,
  4: 2,
};

export const STUDIO_TRAINING_MULT: Record<1 | 2 | 3 | 4, number> = {
  1: 1.0,
  2: 1.15,
  3: 1.3,
  4: 1.5,
};

export const EQUIPMENT_ALBUM_MULT: Record<1 | 2 | 3 | 4, number> = {
  1: 0.8,
  2: 1.0,
  3: 1.2,
  4: 1.3,
};

export const LIVING_EXPENSE_SATISFACTION_BONUS: Record<1 | 2 | 3 | 4, number> = {
  1: -1,
  2: 0,
  3: 1,
  4: 2,
};

export const FACILITY_LEVEL_COSTS = {
  dormitory: {
    1: 5000000, // A low-end dorm keeps the early-game burn rate survivable.
    2: 12000000, // Level 2 is the first meaningful comfort upgrade.
    3: 22000000, // Level 3 is expensive enough to delay other investments.
    4: 38000000, // Premium housing should be a late-game luxury decision.
  },
  studio: {
    1: 7000000, // A basic practice room should be affordable from day one.
    2: 16000000, // Level 2 enables serious production without being trivial.
    3: 30000000, // Level 3 competes directly with comeback budgets.
    4: 50000000, // Top-tier facilities should feel like a prestige investment.
  },
  equipment: {
    1: 3000000, // Entry gear is cheap because it supports the first onboarding loop.
    2: 9000000, // Mid-tier gear should be the practical sweet spot.
    3: 18000000, // Advanced gear becomes a targeted optimization choice.
    4: 32000000, // Top-tier gear should only make sense for a scaling roster.
  },
} as const;

/**
 * 채용 풀의 능력 분포와 몸값 곡선. 능력을 저편중(제곱 편향)으로 먼저 굴리고
 * 월급을 능력에서 파생시킨다 — 상위 능력은 드물게 나오고, 몸값은 능력을
 * 따라가되 협상 편차 때문에 완전 비례하지는 않는다.
 */
export const STAFF_HIRING = {
  abilityMin: 10,
  /** 분포 편향 지수. 2면 창단 풀(상한 60)에서 45+가 약 16%로 나온다. */
  abilitySkew: 2,
  /** 연봉 = 기본 + 능력 × 단가. 이후 노이즈 배율이 곱해진다. */
  salaryBase: 18_000_000,
  salaryPerAbility: 800_000,
  salaryNoiseMin: 0.85,
  salaryNoiseSpan: 0.3,
} as const;

/** 실제 TOP 100처럼 저성과 앨범도 시장의 긴 꼬리와 경쟁한다. */
export const SYNTHETIC_CHART_MARKET = {
  entryCount: 90,
  minPower: 10,
  powerRange: 75,
  curve: 1.4,
  noise: 4,
} as const;

/** 긴급 조달은 연간/미상환 한도가 있고, 2년 안에 상환해야 한다. */
export const EMERGENCY_FINANCING = {
  maxOriginationsPerYear: 2,
  maxOutstanding: 2,
  termWeeks: 104,
  repaymentWarningWeeks: 13,
  loan: { principal: 80_000_000, repayment: 100_000_000 },
  investment: { principal: 120_000_000, repayment: 150_000_000 },
} as const;

/** 성장기 이후에는 성공을 유지하기 위한 회사 차원의 장기 투자가 필요하다. */
export const STRATEGIC_EXPANSION = {
  unlockWeek: 105,
  minReleasedAlbums: 5,
  reviewIntervalWeeks: 52,
  maxLevelPerTrack: 3,
  levelCosts: [200_000_000, 350_000_000, 550_000_000],
  tracks: {
    production: {
      weeklyUpkeepPerLevel: 1_200_000,
      weeklyAlbumProgress: { song: 0.2, visual: 0.1, choreography: 0.15 },
    },
    fandom: {
      weeklyUpkeepPerLevel: 1_000_000,
      weeklyRevenuePerPoint: 10_000,
    },
    global: {
      weeklyUpkeepPerLevel: 1_500_000,
      weeklyRevenuePerPoint: 12_000,
    },
  },
} as const;

/** 5년 평가는 서로 다른 운영 철학으로 통과할 수 있도록 복수 경로를 둔다. */
export const FIVE_YEAR_REVIEW = {
  year: 5,
  week: 52,
  hitmaker: { minReleases: 10, minAverageQuality: 47, minBestQuality: 75 },
  fandom: { minPublic: 80, minFandom: 85, minLoyalty: 75, minExpansionLevel: 1 },
  global: { minGlobal: 85, minIndustry: 20, minExpansionLevel: 1 },
  business: { minMoney: 1_000_000_000, minReleases: 8 },
  awards: { minAwards: 15, minIndustry: 20 },
} as const;

/** 선택 시설은 설치비와 월 유지비를 구분한다. 모든 구매 경로가 이 값을 공유한다. */
export const OPTIONAL_FACILITY_COSTS = {
  healthcare: { upfront: 30_000_000, monthly: 700_000 },
  security: { upfront: 20_000_000, monthly: 600_000 },
} as const;

export const AWARD_ELIGIBILITY_THRESHOLDS = {
  rookie: {
    minYear: 1, // Rookie awards are meant to matter in the first campaign year.
    maxYear: 1, // 신인상은 데뷔 연도 한 번만 경쟁한다.
  },
  bonsang: {
    minDigitalIndex: 65,
    minAlbumSalesIndex: 55,
  },
  daesang: {
    minDigitalIndex: 80, // Top awards should require undeniable mainstream impact.
    minAlbumSalesIndex: 70, // Massive sales ensure the ceiling stays aspirational.
    minIndustry: 75, // Prestige awards should also reflect long-term credibility.
  },
} as const;

export const GLOBAL_EXPANSION_REQUIREMENTS = {
  showcaseTour: {
    minGlobal: 35, // Light overseas buzz should unlock small-scale global experiments.
    minBudget: 120000000, // International pushes need a meaningful cash commitment.
  },
  regionalPartnership: {
    minGlobal: 50, // Brand partnerships should require proven traction.
    minIndustry: 45, // Industry reputation protects against cheap overseas overreach.
  },
  worldTour: {
    minGlobal: 75, // A world tour should remain a late-game payoff.
    minFandom: 65, // Core fan density matters as much as passive overseas awareness.
    minBudget: 450000000, // The cost gate prevents reckless leapfrogging.
  },
} as const;

export function getSeasonForWeek(week: number): Season {
  const normalizedWeek =
    ((week - 1) % GAME_BALANCE.weeksPerYear) + 1;

  if (normalizedWeek <= GAME_BALANCE.weeksPerSeason) {
    return "spring";
  }

  if (normalizedWeek <= GAME_BALANCE.weeksPerSeason * 2) {
    return "summer";
  }

  if (normalizedWeek <= GAME_BALANCE.weeksPerSeason * 3) {
    return "fall";
  }

  return "winter";
}
