import {
  DORM_CONDITION_MULT,
  GAME_BALANCE,
  INDIVIDUAL_LESSON_GROWTH,
  INJURY_PROBABILITY_BASE,
  INJURY_STAMINA_FACTOR,
  INJURY_STRESS_FACTOR,
  REST_DAY_GROWTH_MULT,
  STRESS_DECREASE_RATE,
  STRESS_INCREASE_RATE,
  STUDIO_TRAINING_MULT,
  TRAINING_BASE_GROWTH,
  TRAINING_INTENSITY_MULTIPLIER,
} from "@/data/balance";
import { createSeededRandom } from "@/lib/seededRandom";
import type {
  ConceptMood,
  Staff,
  Trainee,
  TraineeStatKey,
  TrainingIntensity,
} from "@/types/game";

export interface TrainingSchedule {
  intensity: TrainingIntensity;
  focus?: TraineeStatKey;
  restDay: boolean;
}

export interface TrainingResult {
  trainees: Trainee[];
  injuries: { traineeId: string; traineeName: string }[];
}

const TRAINABLE_STATS: TraineeStatKey[] = [
  "vocal",
  "dance",
  "visual",
  "charm",
  "stamina",
];

function clampStat(value: number): number {
  return Math.max(0, Math.min(GAME_BALANCE.maxStatValue, value));
}

function clamp01(value: number): number {
  return Math.max(0, Math.min(100, value));
}

function getManagerEfficiency(manager: Staff | null): number {
  if (!manager) return 0.5;
  return 0.5 + (manager.ability / 100) * 1.5;
}

function computeConceptBonus(
  trainee: Trainee,
  albumConcept: ConceptMood | null,
  stat: TraineeStatKey,
): number {
  if (!albumConcept) return 1.0;
  const affinity = trainee.conceptAffinity[albumConcept] ?? 50;
  const conceptStatMap: Partial<Record<ConceptMood, TraineeStatKey[]>> = {
    refreshing: ["vocal", "charm"],
    dark: ["dance", "vocal"],
    retro: ["vocal", "charm"],
    girlCrush: ["dance", "charm"],
    cute: ["charm", "visual"],
    sophisticated: ["vocal", "visual"],
    powerful: ["dance", "stamina"],
    dreamy: ["vocal", "visual"],
    y2k: ["dance", "visual"],
    sexy: ["dance", "charm"],
  };
  const relatedStats = conceptStatMap[albumConcept] ?? [];
  if (!relatedStats.includes(stat)) return 1.0;
  return 1.0 + (affinity - 50) / 200;
}

function findWeakestStat(trainee: Trainee): TraineeStatKey {
  let weakest: TraineeStatKey = "vocal";
  let min = Infinity;
  for (const stat of TRAINABLE_STATS) {
    if (trainee.stats[stat] < min) {
      min = trainee.stats[stat];
      weakest = stat;
    }
  }
  return weakest;
}

function findStrongestStat(trainee: Trainee): TraineeStatKey {
  let strongest: TraineeStatKey = "vocal";
  let max = -Infinity;
  for (const stat of TRAINABLE_STATS) {
    if (trainee.stats[stat] > max) {
      max = trainee.stats[stat];
      strongest = stat;
    }
  }
  return strongest;
}

function computeManagerFocusAllocation(
  trainee: Trainee,
  managerAbility: number,
  globalFocus: TraineeStatKey | undefined,
): Record<TraineeStatKey, number> {
  const weights: Record<string, number> = {};
  const base = 1.0 / TRAINABLE_STATS.length;

  for (const stat of TRAINABLE_STATS) {
    weights[stat] = base;
  }

  if (globalFocus && weights[globalFocus] !== undefined) {
    weights[globalFocus] += 0.3;
  }

  const autoAllocStrength = managerAbility / 100;
  const weakest = findWeakestStat(trainee);
  weights[weakest] += 0.2 * autoAllocStrength;

  const total = Object.values(weights).reduce((s, v) => s + v, 0);
  for (const stat of TRAINABLE_STATS) {
    weights[stat] = (weights[stat] / total) * TRAINABLE_STATS.length;
  }

  return weights as Record<TraineeStatKey, number>;
}

export function computeInjuryProbability(
  stamina: number,
  stress: number,
): number {
  return Math.max(
    0,
    INJURY_PROBABILITY_BASE +
      (100 - stamina) * INJURY_STAMINA_FACTOR +
      stress * INJURY_STRESS_FACTOR,
  );
}

export interface FacilityLevels {
  dormLevel: 1 | 2 | 3 | 4;
  studioLevel: 1 | 2 | 3 | 4;
}

export type TraineeWeekMode =
  | "injured"
  | "entertainment"
  | "individual"
  | "rest"
  | "training";

/**
 * 한 멤버의 이번 주 결정론적 결과. processTrainingWeek가 실제 적용에 쓰고,
 * 훈련 UI가 사전 프리뷰에 그대로 쓴다 — 표시값과 실제 결과가 같은 함수에서
 * 나오므로 어긋날 수 없다. (부상은 확률만 알려주고 롤은 process에서만 한다.)
 */
export interface TraineeWeekPreview {
  mode: TraineeWeekMode;
  statGrowth: Partial<Record<TraineeStatKey, number>>;
  stressDelta: number;
  conditionDelta: number;
  /** 이번 주 부상 확률(0..1). 훈련 활동에만 적용된다. */
  injuryProbability: number;
}

export function previewTraineeWeek(
  trainee: Trainee,
  schedule: TrainingSchedule,
  manager: Staff | null,
  albumConcept: ConceptMood | null,
  facilityLevels: FacilityLevels,
): TraineeWeekPreview {
  const dormConditionMult = DORM_CONDITION_MULT[facilityLevels.dormLevel];
  const studioTrainingMult = STUDIO_TRAINING_MULT[facilityLevels.studioLevel];

  if (trainee.injuryWeeks > 0) {
    return {
      mode: "injured",
      statGrowth: {},
      stressDelta: STRESS_DECREASE_RATE.rest * 0.3,
      conditionDelta: 0,
      injuryProbability: 0,
    };
  }

  if (trainee.currentActivity === "entertainment") {
    return {
      mode: "entertainment",
      statGrowth: {},
      stressDelta: 2,
      conditionDelta: 0,
      injuryProbability: 0,
    };
  }

  if (trainee.currentActivity === "individual") {
    // 개인 레슨: 포커스 스탯(미지정 시 최고 스탯)에 집중 성장.
    // 팀 합동 훈련에서 빠지므로 케미 성장 기회를 잃는 것이 대가다.
    const lessonStat = schedule.focus ?? findStrongestStat(trainee);
    const growth =
      INDIVIDUAL_LESSON_GROWTH * trainee.potential * studioTrainingMult;
    return {
      mode: "individual",
      statGrowth: { [lessonStat]: growth },
      stressDelta: 2,
      conditionDelta: 0,
      injuryProbability: 0,
    };
  }

  if (
    trainee.currentActivity === "rest" ||
    trainee.currentActivity === "vacation"
  ) {
    const rate =
      trainee.currentActivity === "vacation"
        ? STRESS_DECREASE_RATE.vacation
        : STRESS_DECREASE_RATE.rest;
    return {
      mode: "rest",
      statGrowth: {},
      stressDelta: rate,
      conditionDelta: 10 * dormConditionMult,
      injuryProbability: 0,
    };
  }

  const intensityMult = TRAINING_INTENSITY_MULTIPLIER[schedule.intensity];
  const staminaMult = trainee.stats.stamina / 50;
  // potential is already a growth multiplier on the 0.8–1.7 scale (see recruitSystem/potentialToStars).
  const potentialMult = trainee.potential;
  // 휴식일은 스트레스 완화의 대가로 성장을 깎는다. 무비용이면 항상 켜는 것이 지배 선택이 된다.
  const restDayMult = schedule.restDay ? REST_DAY_GROWTH_MULT : 1;
  const managerEff = getManagerEfficiency(manager);
  const managerAbility = manager?.ability ?? 25;
  const allocation = computeManagerFocusAllocation(
    trainee,
    managerAbility,
    schedule.focus,
  );

  const statGrowth: Partial<Record<TraineeStatKey, number>> = {};
  for (const stat of TRAINABLE_STATS) {
    const conceptBonus = computeConceptBonus(trainee, albumConcept, stat);
    statGrowth[stat] =
      TRAINING_BASE_GROWTH *
      intensityMult *
      (managerEff / 1.0) *
      staminaMult *
      potentialMult *
      conceptBonus *
      allocation[stat] *
      studioTrainingMult *
      restDayMult;
  }

  let stressDelta = STRESS_INCREASE_RATE[schedule.intensity];
  if (schedule.restDay) {
    stressDelta = Math.max(0, stressDelta + STRESS_DECREASE_RATE.rest * 0.4);
  }
  const mentalResist = trainee.stats.mental / 200;
  stressDelta *= 1 - mentalResist;

  return {
    mode: "training",
    statGrowth,
    stressDelta,
    conditionDelta: -stressDelta * 0.3,
    injuryProbability: computeInjuryProbability(
      trainee.stats.stamina,
      clamp01(trainee.stress + stressDelta),
    ),
  };
}

export function processTrainingWeek(
  trainees: readonly Trainee[],
  schedule: TrainingSchedule,
  manager: Staff | null,
  albumConcept: ConceptMood | null,
  weekSeed: number,
  facilityLevels: FacilityLevels,
): TrainingResult {
  const injuries: TrainingResult["injuries"] = [];

  const updated = trainees.map((trainee, idx) => {
    const preview = previewTraineeWeek(
      trainee,
      schedule,
      manager,
      albumConcept,
      facilityLevels,
    );
    const t = { ...trainee, stats: { ...trainee.stats } };

    for (const [stat, growth] of Object.entries(preview.statGrowth)) {
      const key = stat as TraineeStatKey;
      t.stats[key] = clampStat(t.stats[key] + growth);
    }
    t.stress = clamp01(t.stress + preview.stressDelta);
    t.condition = clamp01(t.condition + preview.conditionDelta);

    if (preview.mode === "injured") {
      t.injuryWeeks = t.injuryWeeks - 1;
      return t;
    }

    if (preview.mode === "training") {
      const injurySeed = weekSeed * 1000 + idx * 7 + 31;
      const random = createSeededRandom(injurySeed);
      if (random() < preview.injuryProbability) {
        const injuryRandom = createSeededRandom(injurySeed + 99);
        t.injuryWeeks = 1 + Math.floor(injuryRandom() * 3);
        t.condition = clamp01(t.condition - 15);
        injuries.push({ traineeId: t.id, traineeName: t.name });
      }
    }

    return t;
  });

  return { trainees: updated, injuries };
}
