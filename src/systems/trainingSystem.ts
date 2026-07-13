import {
  DORM_CONDITION_MULT,
  GAME_BALANCE,
  INJURY_PROBABILITY_BASE,
  INJURY_STAMINA_FACTOR,
  INJURY_STRESS_FACTOR,
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

function rollInjury(
  trainee: Trainee,
  seed: number,
): boolean {
  const prob = Math.max(
    0,
    INJURY_PROBABILITY_BASE +
      (100 - trainee.stats.stamina) * INJURY_STAMINA_FACTOR +
      trainee.stress * INJURY_STRESS_FACTOR,
  );
  const random = createSeededRandom(seed);
  return random() < prob;
}

export interface FacilityLevels {
  dormLevel: 1 | 2 | 3 | 4;
  studioLevel: 1 | 2 | 3 | 4;
}

export function processTrainingWeek(
  trainees: readonly Trainee[],
  schedule: TrainingSchedule,
  manager: Staff | null,
  albumConcept: ConceptMood | null,
  weekSeed: number,
  facilityLevels: FacilityLevels,
): TrainingResult {
  const managerEff = getManagerEfficiency(manager);
  const managerAbility = manager?.ability ?? 25;
  const dormConditionMult = DORM_CONDITION_MULT[facilityLevels.dormLevel];
  const studioTrainingMult = STUDIO_TRAINING_MULT[facilityLevels.studioLevel];
  const injuries: TrainingResult["injuries"] = [];

  const updated = trainees.map((trainee, idx) => {
    let t = { ...trainee, stats: { ...trainee.stats } };

    if (t.injuryWeeks > 0) {
      t.injuryWeeks = t.injuryWeeks - 1;
      t.stress = clamp01(t.stress + STRESS_DECREASE_RATE.rest * 0.3);
      return t;
    }

    if (
      t.currentActivity === "entertainment" ||
      t.currentActivity === "individual"
    ) {
      t.stress = clamp01(t.stress + 2);
      return t;
    }

    if (
      t.currentActivity === "rest" ||
      t.currentActivity === "vacation"
    ) {
      const rate =
        t.currentActivity === "vacation"
          ? STRESS_DECREASE_RATE.vacation
          : STRESS_DECREASE_RATE.rest;
      t.stress = clamp01(t.stress + rate);
      t.condition = clamp01(t.condition + 10 * dormConditionMult);
      return t;
    }

    const intensityMult = TRAINING_INTENSITY_MULTIPLIER[schedule.intensity];
    const staminaMult = t.stats.stamina / 50;
    // potential is already a growth multiplier on the 0.8–1.7 scale (see recruitSystem/potentialToStars).
    const potentialMult = t.potential;
    const allocation = computeManagerFocusAllocation(
      t,
      managerAbility,
      schedule.focus,
    );

    for (const stat of TRAINABLE_STATS) {
      const conceptBonus = computeConceptBonus(t, albumConcept, stat);
      const growth =
        TRAINING_BASE_GROWTH *
        intensityMult *
        (managerEff / 1.0) *
        staminaMult *
        potentialMult *
        conceptBonus *
        allocation[stat] *
        studioTrainingMult;
      t.stats[stat] = clampStat(t.stats[stat] + growth);
    }

    let stressIncrease = STRESS_INCREASE_RATE[schedule.intensity];
    if (schedule.restDay) {
      stressIncrease = Math.max(0, stressIncrease + STRESS_DECREASE_RATE.rest * 0.4);
    }
    const mentalResist = t.stats.mental / 200;
    stressIncrease *= 1 - mentalResist;
    t.stress = clamp01(t.stress + stressIncrease);
    t.condition = clamp01(t.condition - stressIncrease * 0.3);

    const injurySeed = weekSeed * 1000 + idx * 7 + 31;
    if (rollInjury(t, injurySeed)) {
      const random = createSeededRandom(injurySeed + 99);
      t.injuryWeeks = 1 + Math.floor(random() * 3);
      t.condition = clamp01(t.condition - 15);
      injuries.push({ traineeId: t.id, traineeName: t.name });
    }

    return t;
  });

  return { trainees: updated, injuries };
}
