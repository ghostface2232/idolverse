import { describe, expect, it } from "vitest";
import {
  COMEBACK_BUDGET_TIERS_BY_ID,
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

type PlayerProfile = "novice" | "intermediate" | "expert";
type StaffingPolicy = "lean" | "specialists";
type LevelFacility = "dormLevel" | "studioLevel" | "equipmentLevel";

interface CampaignSummary {
  profile: PlayerProfile;
  seed: number;
  weeksPlayed: number;
  failedAtWeek: number | null;
  endingMoney: number;
  minimumMoney: number;
  totalIncome: number;
  totalExpenses: number;
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
  facilityLevelTotal: number;
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
const NOVICE_COMEBACK_GAPS = [22, 37, 19, 31, 25] as const;

function sumRecord(values: Record<string, number>): number {
  return Object.values(values).reduce((sum, value) => sum + value, 0);
}

function average(values: readonly number[]): number {
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
  const definitions =
    profile === "expert"
      ? [
          { traits: ["pure", "doglike"] as const, potential: 1.62 },
          { traits: ["energetic", "wholesome"] as const, potential: 1.52 },
          { traits: ["haughty", "catlike"] as const, potential: 1.47 },
          { traits: ["reserved", "mysterious"] as const, potential: 1.38 },
        ]
      : profile === "intermediate"
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
    profile === "expert"
      ? [
          { visual: 31, vocal: 35, dance: 27, charm: 32, stamina: 34, mental: 61 },
          { visual: 27, vocal: 29, dance: 38, charm: 31, stamina: 38, mental: 58 },
          { visual: 38, vocal: 27, dance: 34, charm: 35, stamina: 31, mental: 55 },
          { visual: 35, vocal: 37, dance: 28, charm: 30, stamina: 29, mental: 64 },
        ]
      : profile === "intermediate"
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
        profile === "expert" && index === 0
          ? "producing"
          : profile === "expert" && index === 2
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
          profile === "expert"
            ? 18 + ((index + otherIndex) % 3) * 4
            : profile === "intermediate"
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

function buildWeeklyDecisions(
  snapshot: GameSnapshot,
  profile: PlayerProfile,
  cumulativeWeek: number,
): PlayerDecisions["resolvedDecisions"] {
  return snapshot.game.weeklyDecisions.flatMap((card) => {
    if (card.id === "strategic-expansion" && profile === "novice") return [];
    if (profile === "novice" && card.lane === "opportunity" && cumulativeWeek % 2 !== 0) {
      return [];
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
    const option =
      strategicOption ??
      (profile === "expert"
        ? [...card.options].sort(
            (left, right) =>
              contextualEffectUtility(right.effects, snapshot) -
              contextualEffectUtility(left.effects, snapshot),
          )[0]
        : profile === "intermediate"
          ? [...card.options].sort(
              (left, right) => effectUtility(right.effects) - effectUtility(left.effects),
            )[0]
          : card.options[0]);
    if (!option) return [];
    if (card.id === "strategic-expansion") {
      const reserve = profile === "expert" ? 350_000_000 : 200_000_000;
      if (snapshot.finance.money + (option.effects.money ?? 0) < reserve) return [];
    }
    if (
      profile !== "novice" &&
      card.lane === "opportunity" &&
      contextualEffectUtility(option.effects, snapshot) < 0
    ) {
      return [];
    }
    return [
      {
        cardId: card.id,
        optionId: option.id,
        effects: option.effects,
        targetTraineeIds: selectTargets(option, snapshot.trainee.trainees),
        activityOverride: option.activityOverride,
      },
    ];
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
): PlayerDecisions {
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
    } else if (profile === "novice" && cumulativeWeek % 3 === 0) {
      promotionOrders.push({
        activityId: "varietyShow",
        assignedMemberIds: [snapshot.trainee.trainees[0].id],
      });
    }
  }

  return {
    trainingSchedule:
      profile === "novice"
        ? { intensity: "normal", restDay: false }
        : meanStress >= (profile === "expert" ? 48 : 60)
          ? { intensity: "normal", restDay: true, focus: weakestTeamStat(snapshot.trainee.trainees) }
          : {
              intensity: profile === "expert" ? "hard" : "normal",
              restDay: false,
              focus:
                profile === "expert" || cumulativeWeek % 2 === 0
                  ? weakestTeamStat(snapshot.trainee.trainees)
                  : undefined,
            },
    resolvedDecisions: buildWeeklyDecisions(snapshot, profile, cumulativeWeek),
    promotionOrders,
  };
}

function chooseExpertConcept(snapshot: GameSnapshot): {
  genre: Genre;
  mood: ConceptMood;
  centerTraineeId: string;
} {
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

function chooseNoviceConcept(snapshot: GameSnapshot, comebackIndex: number): {
  genre: Genre;
  mood: ConceptMood;
  centerTraineeId: string;
} {
  const mood = CONCEPT_MOODS[(comebackIndex * 7 + snapshot.game.campaignSeed) % CONCEPT_MOODS.length];
  return {
    genre: GENRES[(comebackIndex * 5 + 2) % GENRES.length],
    mood,
    centerTraineeId:
      snapshot.trainee.trainees[comebackIndex % snapshot.trainee.trainees.length].id,
  };
}

function chooseIntermediateConcept(snapshot: GameSnapshot): {
  genre: Genre;
  mood: ConceptMood;
  centerTraineeId: string;
} {
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

function completeProjectChoices(snapshot: GameSnapshot, profile: PlayerProfile): GameSnapshot {
  const owner = snapshot.game.activeProjects.find(
    (project) =>
      project.status !== "completed" &&
      !project.releasedAlbumId &&
      project.decisionStatuses[TITLE_TRACK_SELECTION_DECISION_ID] === "available",
  );
  if (!owner || !snapshot.album.currentAlbum) return snapshot;

  const candidates = snapshot.album.currentAlbum.titleTrackCandidates;
  const selected =
    profile !== "novice"
      ? [...candidates].sort((left, right) => {
          const strategicBonus = (type: string) =>
            type === "global" && snapshot.fandom.global < 35
              ? 8
              : type === "fandom" && snapshot.fandom.fandom < 45
                ? 6
                : type === "bold" && snapshot.fandom.public < 40
                  ? 4
                  : 0;
          return profile === "expert"
            ? right.quality + strategicBonus(right.type) -
                (left.quality + strategicBonus(left.type))
            : right.quality - left.quality;
        })[0]
      : candidates[0];
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

function startComeback(
  snapshot: GameSnapshot,
  profile: PlayerProfile,
  cumulativeWeek: number,
  comebackIndex: number,
): GameSnapshot {
  const budgetTierId: ComebackBudgetTierId = profile === "novice" ? "lean" : "standard";
  const budget = COMEBACK_BUDGET_TIERS_BY_ID.get(budgetTierId);
  if (!budget) throw new Error(`Missing budget ${budgetTierId}.`);
  const chosen =
    profile === "expert"
      ? chooseExpertConcept(snapshot)
      : profile === "intermediate"
        ? chooseIntermediateConcept(snapshot)
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
  cumulativeWeek: number,
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
  } else if (profile === "novice" && cumulativeWeek === 130 && next.finance.money > 500_000_000) {
    buy("dormLevel");
  }
  return { snapshot: next, spend };
}

function musicShowWinsFromReport(report: WeekReport): number {
  return report.events.filter(
    (event) => event.presentation?.kind === "music-show" && event.presentation.won,
  ).length;
}

function simulateCampaign(
  profile: PlayerProfile,
  seed: number,
  staffingPolicy: StaffingPolicy = "lean",
): CampaignSummary {
  let snapshot = makeCampaign(profile, seed, staffingPolicy);
  let minimumMoney = snapshot.finance.money;
  let totalIncome = 0;
  let totalExpenses = 0;
  let decisionCosts = 0;
  let financingBorrowed = 0;
  let financingRepaid = 0;
  const decisionCostBreakdown: Record<string, number> = {};
  let facilitySpend = 0;
  let injuries = 0;
  let musicShowWins = 0;
  let weeksPlayed = 0;
  let comebackIndex = 0;
  let lastComebackStart = 0;
  let nextNoviceStart = 21;
  const yearly: CampaignSummary["yearly"] = [];

  for (let turn = 0; turn < GAME_BALANCE.weeksPerYear * 5; turn++) {
    if (snapshot.game.campaignFailure) break;
    const cumulativeWeek =
      (snapshot.game.currentYear - 1) * GAME_BALANCE.weeksPerYear +
      snapshot.game.currentWeek;

    snapshot = completeProjectChoices(snapshot, profile);
    const facility = applyFacilityPolicy(snapshot, profile, cumulativeWeek);
    snapshot = facility.snapshot;
    facilitySpend += facility.spend;

    const comebackAvailable = canStartComebackProject(
      snapshot.game.currentPhase,
      snapshot.game.activeProjects,
      snapshot.album.currentAlbum,
    );
    const cadenceReady =
      profile === "expert"
        ? lastComebackStart === 0 || cumulativeWeek - lastComebackStart >= 16
        : profile === "intermediate"
          ? lastComebackStart === 0 || cumulativeWeek - lastComebackStart >= 21
          : cumulativeWeek >= nextNoviceStart;
    const budgetTierId: ComebackBudgetTierId = profile === "novice" ? "lean" : "standard";
    const budget = COMEBACK_BUDGET_TIERS_BY_ID.get(budgetTierId)!;
    const reserve =
      profile === "expert" ? 260_000_000 : profile === "intermediate" ? 160_000_000 : 80_000_000;
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
      if (profile === "novice") {
        nextNoviceStart =
          cumulativeWeek +
          NOVICE_COMEBACK_GAPS[comebackIndex % NOVICE_COMEBACK_GAPS.length];
      }
      comebackIndex++;
    }

    const playerDecisions = buildPlayerDecisions(snapshot, profile, cumulativeWeek);
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
    decisionCosts += result.weekReport.finance.expenses.decisionCosts ?? 0;
    financingBorrowed += result.weekReport.finance.income.emergencyFinancing ?? 0;
    financingRepaid += result.weekReport.finance.expenses.financingRepayment ?? 0;
    injuries += result.weekReport.injuries.length;
    musicShowWins += musicShowWinsFromReport(result.weekReport);
    snapshot = result.newState;
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
    endingMoney: snapshot.finance.money,
    minimumMoney,
    totalIncome,
    totalExpenses,
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
    facilityLevelTotal:
      upgrades.dormLevel + upgrades.studioLevel + upgrades.equipmentLevel,
    yearly,
  };
}

function median(summaries: readonly CampaignSummary[], key: keyof CampaignSummary): number {
  const values = summaries
    .map((summary) => summary[key])
    .filter((value): value is number => typeof value === "number")
    .sort((left, right) => left - right);
  const middle = Math.floor(values.length / 2);
  return values.length % 2 === 0
    ? (values[middle - 1] + values[middle]) / 2
    : values[middle];
}

function compactReport(summaries: readonly CampaignSummary[]) {
  const keys: Array<keyof CampaignSummary> = [
    "weeksPlayed",
    "endingMoney",
    "minimumMoney",
    "totalIncome",
    "totalExpenses",
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
    "facilityLevelTotal",
  ];
  return Object.fromEntries(keys.map((key) => [key, median(summaries, key)]));
}

describe("초보와 숙련 플레이어의 5년 폐루프 밸런스", () => {
  it("동일한 시드와 정책은 같은 260주 결과를 만든다", () => {
    expect(simulateCampaign("expert", 101)).toEqual(
      simulateCampaign("expert", 101),
    );
  });

  it("여러 세계 시드에서 숙련 전략이 성장·품질·차트·생존 우위를 만든다", () => {
    const seeds = [11, 29, 47, 83, 101, 137, 173, 211];
    const novice = seeds.map((seed) => simulateCampaign("novice", seed));
    const intermediate = seeds.map((seed) => simulateCampaign("intermediate", seed));
    const expert = seeds.map((seed) => simulateCampaign("expert", seed));

    if (process.env.BALANCE_REPORT === "1") {
      console.log(
        JSON.stringify(
          {
            noviceMedian: compactReport(novice),
            intermediateMedian: compactReport(intermediate),
            expertMedian: compactReport(expert),
            noviceRuns: novice.map((run) => ({
              seed: run.seed,
              weeksPlayed: run.weeksPlayed,
              endingMoney: run.endingMoney,
              releases: run.releases,
              fandom: run.fandom,
              averageAlbumQuality: run.averageAlbumQuality,
              averageChartRank: run.averageChartRank,
              awards: run.awards,
              decisionCostBreakdown: run.decisionCostBreakdown,
            })),
            expertRuns: expert.map((run) => ({
              seed: run.seed,
              weeksPlayed: run.weeksPlayed,
              endingMoney: run.endingMoney,
              releases: run.releases,
              fandom: run.fandom,
              averageAlbumQuality: run.averageAlbumQuality,
              averageChartRank: run.averageChartRank,
              awards: run.awards,
              remainingMembers: run.remainingMembers,
              facilityLevelTotal: run.facilityLevelTotal,
            })),
            intermediateRuns: intermediate.map((run) => ({
              seed: run.seed,
              weeksPlayed: run.weeksPlayed,
              endingMoney: run.endingMoney,
              releases: run.releases,
              fandom: run.fandom,
              averageAlbumQuality: run.averageAlbumQuality,
              averageChartRank: run.averageChartRank,
              awards: run.awards,
              decisionCostBreakdown: run.decisionCostBreakdown,
            })),
          },
          null,
          2,
        ),
      );
    }

    expect(median(expert, "averageMemberStats")).toBeGreaterThan(
      median(novice, "averageMemberStats"),
    );
    expect(median(expert, "averageAlbumQuality")).toBeGreaterThan(
      median(novice, "averageAlbumQuality"),
    );
    expect(median(expert, "averageChartRank")).toBeLessThan(
      median(novice, "averageChartRank"),
    );
    // 5년 평가는 기록 체크포인트다. 파산은 여전히 종료 조건이지만 성과
    // 경로 미달만으로 260주에 캠페인이 끝나서는 안 된다.
    expect(novice.every((run) => run.failedAtWeek !== 260)).toBe(true);
    expect(
      intermediate.filter((run) => run.failedAtWeek === null).length,
    ).toBeGreaterThanOrEqual(Math.ceil(seeds.length * 0.75));
    expect(expert.every((run) => run.failedAtWeek === null)).toBe(true);
    expect(median(intermediate, "averageMemberStats")).toBeGreaterThan(
      median(novice, "averageMemberStats"),
    );
    expect(median(intermediate, "averageMemberStats")).toBeLessThan(
      median(expert, "averageMemberStats"),
    );
    expect(median(intermediate, "averageAlbumQuality")).toBeGreaterThan(
      median(novice, "averageAlbumQuality"),
    );
    expect(median(intermediate, "averageAlbumQuality")).toBeLessThan(
      median(expert, "averageAlbumQuality"),
    );
    // 높은 품질이 경제 외 결과에서도 눈에 띄는 보상으로 남아야 한다.
    expect(
      median(intermediate, "averageChartRank") -
        median(expert, "averageChartRank"),
    ).toBeGreaterThan(10);
    expect(median(expert, "topTenAlbums")).toBeGreaterThanOrEqual(
      median(intermediate, "topTenAlbums") + 5,
    );
    expect(median(expert, "musicShowWins")).toBeGreaterThanOrEqual(
      median(intermediate, "musicShowWins") + 10,
    );
    expect(median(expert, "awards")).toBeGreaterThanOrEqual(
      median(intermediate, "awards") + 6,
    );
    expect(median(expert, "fandom")).toBeGreaterThanOrEqual(
      median(intermediate, "fandom") + 8,
    );
    expect(median(expert, "global")).toBeGreaterThanOrEqual(
      median(intermediate, "global") + 6,
    );
    expect(median(intermediate, "averageChemistry")).toBeGreaterThan(
      median(novice, "averageChemistry") + 5,
    );
    expect(median(expert, "averageChemistry")).toBeGreaterThan(
      median(intermediate, "averageChemistry") + 5,
    );

    // 2026-07-17 기준 중앙값(초보 57.5, 중급 50, 숙련 46)의 1/4 이하여야 한다.
    expect(median(novice, "injuries")).toBeLessThanOrEqual(57.5 / 4);
    expect(median(intermediate, "injuries")).toBeLessThanOrEqual(50 / 4);
    expect(median(expert, "injuries")).toBeLessThanOrEqual(46 / 4);

    // 첫 연말 전에 파산하면 데뷔·첫 컴백·시상식의 최소 루프조차 관찰할 수 없다.
    expect(Math.min(...novice.map((run) => run.weeksPlayed))).toBeGreaterThanOrEqual(52);
    expect(Math.min(...expert.map((run) => run.weeksPlayed))).toBeGreaterThanOrEqual(52);
  }, 20_000);

  it("전문 인력 채용 정책의 품질 이득과 고정비 부담도 같은 루프로 측정한다", () => {
    const lean = simulateCampaign("expert", 101, "lean");
    const specialists = simulateCampaign("expert", 101, "specialists");

    if (process.env.BALANCE_REPORT === "1") {
      console.log(
        JSON.stringify({ specialistStaffComparison: { lean, specialists } }, null, 2),
      );
    }

    expect(specialists.bestAlbumQuality).toBeGreaterThanOrEqual(
      lean.bestAlbumQuality,
    );
    expect(specialists.averageAlbumQuality).toBeGreaterThan(
      lean.averageAlbumQuality,
    );
    expect(specialists.totalExpenses).toBeGreaterThan(lean.totalExpenses);
    expect(specialists.minimumMoney).toBeLessThan(lean.minimumMoney);
    expect(specialists.endingMoney).toBeLessThan(lean.endingMoney);
    expect(specialists.failedAtWeek).toBeNull();
    expect(lean.failedAtWeek).toBeNull();
  });
});
