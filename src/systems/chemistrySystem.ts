import {
  CHEMISTRY_CONFLICT_THRESHOLD,
  CHEMISTRY_DYNAMICS,
  CHEMISTRY_JOINT_TRAINING_GAIN,
  CHEMISTRY_PAIR_SYNERGY,
  TEAM_CHEMISTRY_PERFORMANCE_WEIGHT,
} from "@/data/balance";
import { createSeededRandom } from "@/lib/seededRandom";
import type { Trainee, TraineeActivity } from "@/types/game";

const PERSONALITY_TRAITS = new Set([
  "pure",
  "bubbly",
  "haughty",
  "energetic",
  "reserved",
]);

function hasPair(
  pairs: readonly (readonly string[])[],
  left: string | null | undefined,
  right: string | null | undefined,
): boolean {
  if (!left || !right) return false;
  return pairs.some(
    (pair) =>
      (pair[0] === left && pair[1] === right) ||
      (pair[0] === right && pair[1] === left),
  );
}

function getPersonality(trainee: Trainee): string | undefined {
  return trainee.traits.find((trait) => PERSONALITY_TRAITS.has(trait));
}

function getAppearance(trainee: Trainee): string | undefined {
  return trainee.traits.find((trait) => !PERSONALITY_TRAITS.has(trait));
}

/** 팬이 알아보기 쉬운 또래, 성향, 인상 대비, 포지션 보완 조합을 수치화한다. */
export function calculatePairChemistryAffinity(a: Trainee, b: Trainee): number {
  let affinity = 0;
  const ageDifference = Math.abs(a.age - b.age);
  if (ageDifference === 0) affinity += CHEMISTRY_PAIR_SYNERGY.sameAge;
  else if (ageDifference <= 2) affinity += CHEMISTRY_PAIR_SYNERGY.nearAge;

  const personalityA = getPersonality(a);
  const personalityB = getPersonality(b);
  if (personalityA && personalityA === personalityB) {
    affinity += CHEMISTRY_PAIR_SYNERGY.samePersonality;
  } else if (
    hasPair(
      CHEMISTRY_PAIR_SYNERGY.complementaryPersonalityPairs,
      personalityA,
      personalityB,
    )
  ) {
    affinity += CHEMISTRY_PAIR_SYNERGY.complementaryPersonality;
  }

  const appearanceA = getAppearance(a);
  const appearanceB = getAppearance(b);
  if (hasPair([["doglike", "catlike"]], appearanceA, appearanceB)) {
    affinity += CHEMISTRY_PAIR_SYNERGY.dogCatVisual;
  } else if (appearanceA && appearanceA === appearanceB) {
    affinity += CHEMISTRY_PAIR_SYNERGY.sameAppearance;
  }

  if (
    hasPair(
      CHEMISTRY_PAIR_SYNERGY.complementaryPositionPairs,
      a.position,
      b.position,
    ) ||
    hasPair(
      CHEMISTRY_PAIR_SYNERGY.complementaryPositionPairs,
      a.subPosition,
      b.position,
    ) ||
    hasPair(
      CHEMISTRY_PAIR_SYNERGY.complementaryPositionPairs,
      a.position,
      b.subPosition,
    )
  ) {
    affinity += CHEMISTRY_PAIR_SYNERGY.complementaryPosition;
  }

  return affinity;
}

export function initializeRosterChemistry(
  trainees: readonly Trainee[],
): Trainee[] {
  return trainees.map((trainee) => ({
    ...trainee,
    chemistry: Object.fromEntries(
      trainees
        .filter((candidate) => candidate.id !== trainee.id)
        .map((candidate) => [
          candidate.id,
          calculatePairChemistryAffinity(trainee, candidate),
        ]),
    ),
  }));
}

export interface ChemistryUpdate {
  traineeId: string;
  chemistry: Record<string, number>;
}

export interface ChemistryResult {
  updates: ChemistryUpdate[];
  conflicts: { a: string; b: string; resolved: boolean }[];
  teamChemistry: number;
}

function clampChemistry(value: number): number {
  return Math.max(-100, Math.min(100, value));
}

function diminishingGain(baseGain: number, currentValue: number): number {
  return baseGain * Math.max(0.15, (100 - currentValue) / 100);
}

function pairKey(leftId: string, rightId: string): string {
  return [leftId, rightId].sort().join(":");
}

function getActivityGroup(activity: TraineeActivity): "training" | "away" | "inactive" {
  if (activity === "training") return "training";
  if (activity === "entertainment" || activity === "individual") return "away";
  return "inactive";
}

export function updateChemistry(
  trainees: readonly Trainee[],
  performedStage: boolean,
  weekSeed: number,
): ChemistryResult {
  const chemMap = new Map<string, Record<string, number>>();
  for (const t of trainees) {
    chemMap.set(t.id, { ...t.chemistry });
  }

  const conflicts: ChemistryResult["conflicts"] = [];
  const sharedActivityPairs = new Set<string>();

  const trainingGroup = trainees.filter(
    (t) => getActivityGroup(t.currentActivity) === "training" && t.injuryWeeks === 0,
  );

  for (let i = 0; i < trainingGroup.length; i++) {
    for (let j = i + 1; j < trainingGroup.length; j++) {
      const a = trainingGroup[i];
      const b = trainingGroup[j];
      const chemA = chemMap.get(a.id)!;
      const chemB = chemMap.get(b.id)!;
      const currentVal = chemA[b.id] ?? 0;

      if (currentVal < CHEMISTRY_CONFLICT_THRESHOLD) {
        const seed = weekSeed * 100 + i * 13 + j * 7;
        const random = createSeededRandom(seed);
        if (random() < 0.3) {
          chemA[b.id] = clampChemistry(currentVal + 10);
          chemB[a.id] = clampChemistry((chemB[a.id] ?? 0) + 10);
          conflicts.push({ a: a.id, b: b.id, resolved: true });
        } else {
          chemA[b.id] = clampChemistry(currentVal - 3);
          chemB[a.id] = clampChemistry((chemB[a.id] ?? 0) - 3);
          conflicts.push({ a: a.id, b: b.id, resolved: false });
        }
      } else {
        const pairAffinity = calculatePairChemistryAffinity(a, b);
        const routineCeiling =
          CHEMISTRY_DYNAMICS.baseRoutineTrainingCeiling + pairAffinity;
        const pairStress = (a.stress + b.stress) / 2;
        const stressFriction = Math.min(
          CHEMISTRY_DYNAMICS.maxWeeklyStressFriction,
          Math.max(
            0,
            (pairStress - CHEMISTRY_DYNAMICS.frictionStressThreshold) / 20,
          ),
        );
        const updateRoutineChemistry = (value: number) =>
          value >= routineCeiling
            ? value - CHEMISTRY_DYNAMICS.aboveCeilingWeeklyDecay - stressFriction
            : value +
              CHEMISTRY_JOINT_TRAINING_GAIN *
                Math.max(
                  0.15,
                  (routineCeiling - value) / Math.max(routineCeiling, 1),
                ) -
              stressFriction;
        chemA[b.id] = clampChemistry(updateRoutineChemistry(currentVal));
        chemB[a.id] = clampChemistry(
          updateRoutineChemistry(chemB[a.id] ?? 0),
        );
        sharedActivityPairs.add(pairKey(a.id, b.id));
      }
    }
  }

  if (performedStage) {
    const activeMembers = trainees.filter(
      (t) => t.injuryWeeks === 0 && t.currentActivity !== "rest" && t.currentActivity !== "vacation",
    );
    for (let i = 0; i < activeMembers.length; i++) {
      for (let j = i + 1; j < activeMembers.length; j++) {
        const a = activeMembers[i];
        const b = activeMembers[j];
        const chemA = chemMap.get(a.id)!;
        const chemB = chemMap.get(b.id)!;
        const stageGain =
          CHEMISTRY_DYNAMICS.sharedStageGain *
          (1 + calculatePairChemistryAffinity(a, b) / 50);
        chemA[b.id] = clampChemistry(
          (chemA[b.id] ?? 0) +
            diminishingGain(stageGain, chemA[b.id] ?? 0),
        );
        chemB[a.id] = clampChemistry(
          (chemB[a.id] ?? 0) +
            diminishingGain(stageGain, chemB[a.id] ?? 0),
        );
        sharedActivityPairs.add(pairKey(a.id, b.id));
      }
    }
  }

  for (let left = 0; left < trainees.length; left++) {
    for (let right = left + 1; right < trainees.length; right++) {
      const a = trainees[left];
      const b = trainees[right];
      if (sharedActivityPairs.has(pairKey(a.id, b.id))) continue;
      const chemA = chemMap.get(a.id)!;
      const chemB = chemMap.get(b.id)!;
      const affinityRetention = Math.max(
        0.5,
        1 - calculatePairChemistryAffinity(a, b) / 50,
      );
      const decay = CHEMISTRY_DYNAMICS.separateActivityDecay * affinityRetention;
      if ((chemA[b.id] ?? 0) > 0) {
        chemA[b.id] = Math.max(
          0,
          (chemA[b.id] ?? 0) - decay,
        );
      }
      if ((chemB[a.id] ?? 0) > 0) {
        chemB[a.id] = Math.max(
          0,
          (chemB[a.id] ?? 0) - decay,
        );
      }
    }
  }

  const updates: ChemistryUpdate[] = [];
  for (const t of trainees) {
    updates.push({ traineeId: t.id, chemistry: chemMap.get(t.id)! });
  }

  const teamChemistry = calculateTeamChemistry(trainees, chemMap);

  return { updates, conflicts, teamChemistry };
}

function calculateTeamChemistry(
  trainees: readonly Trainee[],
  chemMap: Map<string, Record<string, number>>,
): number {
  if (trainees.length < 2) return 0;

  let sum = 0;
  let pairCount = 0;

  for (let i = 0; i < trainees.length; i++) {
    for (let j = i + 1; j < trainees.length; j++) {
      const a = trainees[i];
      const b = trainees[j];
      const chem = chemMap.get(a.id)?.[b.id] ?? 0;
      sum += chem;
      pairCount++;
    }
  }

  return pairCount > 0 ? sum / pairCount : 0;
}

export function getTeamChemistryModifier(teamChemistry: number): number {
  return 1.0 + (teamChemistry / 100) * TEAM_CHEMISTRY_PERFORMANCE_WEIGHT;
}
