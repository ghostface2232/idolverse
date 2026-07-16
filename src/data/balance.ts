import type {
  ConceptSynergyGrade,
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

/** 데뷔 프로젝트의 공개 게이트. UI·쇼케이스 판정·테스트가 같은 값을 쓴다. */
export const DEBUT_REQUIREMENTS = {
  readiness: 80,
  averageVocal: 55,
  minimumWeeks: 14,
  projectWeeks: 20,
} as const;

export const TRAINING_BASE_GROWTH = 0.8; // A single week should matter, but not outscale album-level decisions.

// 휴식일은 스트레스 완화 대가로 그 주 성장을 깎는다. 무비용이면 항상 켜는
// 것이 지배 선택이 되므로, "언제 쉬게 할 것인가"가 실제 결정이 되게 한다.
export const REST_DAY_GROWTH_MULT = 0.85;

// 개인 레슨은 한 스탯(포커스, 미지정 시 최고 스탯)에 집중 성장을 준다.
// 대가는 그 주 팀 합동 훈련 제외(케미 성장 기회 상실)와 스트레스다.
export const INDIVIDUAL_LESSON_GROWTH = 2.2;

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

export const INJURY_PROBABILITY_BASE = 0.02; // Even careful teams need a low background risk for tension.
export const INJURY_STAMINA_FACTOR = 0.0003; // Applied to (100 - stamina): stamina 0 adds +3%p weekly risk, stamina 100 adds none.
export const INJURY_STRESS_FACTOR = 0.0008; // Stress is the clearest player-controlled lever: +8%p weekly risk at stress 100.

export const CHEMISTRY_JOINT_TRAINING_GAIN = 2; // Shared practice should improve team feel slowly, not instantly.
export const CHEMISTRY_CONFLICT_THRESHOLD = -50; // Below this, conflict is severe enough to justify explicit events.
export const TEAM_CHEMISTRY_PERFORMANCE_WEIGHT = 0.15; // Team feel matters, but execution should still dominate stage outcomes.

export const SATISFACTION_CONCEPT_MISMATCH_PENALTY = -5; // Repeating the wrong concept must become dangerous within a comeback cycle.
export const SATISFACTION_OVERWORK_PENALTY = -3; // Overwork should chip away steadily rather than trigger instant collapse.
export const SATISFACTION_WARNING_THRESHOLD = 30; // At this point, the player should feel urgent retention pressure.
export const SATISFACTION_LEAVE_THRESHOLD = 10; // This is low enough that ignoring it is a clear strategic failure.
export const SATISFACTION_BASELINE = 50; // Base satisfaction regresses toward this value so past bonuses fade over time.
export const SATISFACTION_REGRESSION_RATE = 1; // Fixed weekly decay above the baseline keeps small bonuses ephemeral and big ones lasting.

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

export const INVESTOR_PENALTY_GRACE_WEEKS = 4; // A failed condition warns first so the player can react before being punished.
export const INVESTOR_COMPLY_SUPPORT_LIMIT = 3; // The investor bails the player out only a few times; unlimited cash would invert the incentive to meet conditions.
export const INVESTOR_NEGOTIATION_EXTENSION_WEEKS = 2; // 재협상은 기존 미달 조건의 페널티 유예를 실제로 두 주 연장한다.

export const COMPETITOR_SCALING_FACTOR = 0.8; // Rivals should trail the player slightly so smart planning can overcome them.
export const EVENT_COMPETITOR_SPAWN_CHANCE = 0.15; // Seasonal event rivals should be memorable spikes, not routine noise.

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

export const STAFF_SALARY_BANDS = [
  {
    minAbility: 1, // Rookie staff populate the bargain pool.
    maxAbility: 39, // This band exists to support desperate early-game hires.
    annualSalary: 28000000, // Cheap enough to onboard without collapsing cashflow.
  },
  {
    minAbility: 40, // Competent staff should define the early-to-midgame baseline.
    maxAbility: 59, // They remain obtainable for stable companies.
    annualSalary: 42000000, // This price forces trade-offs against marketing or demos.
  },
  {
    minAbility: 60, // Strong specialists are where role differentiation starts to matter.
    maxAbility: 79, // This bracket should feel aspirational but realistic.
    annualSalary: 68000000, // A serious salary that pressures weekly fixed costs.
  },
  {
    minAbility: 80, // High-end talent is a strategic luxury.
    maxAbility: 100, // Capped at 100 to align with the global stat scale.
    annualSalary: 98000000, // Expensive enough that only successful teams can sustain them.
  },
] as const;

export const AWARD_ELIGIBILITY_THRESHOLDS = {
  rookie: {
    minYear: 1, // Rookie awards are meant to matter in the first campaign year.
    maxYear: 2, // A short window keeps the race tight and understandable.
  },
  bonsang: {
    minDigitalIndex: 55, // Mid-tier chart traction should be enough to enter the conversation.
    minAlbumSalesIndex: 40, // Sales matter, but not as much as broad relevance.
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
