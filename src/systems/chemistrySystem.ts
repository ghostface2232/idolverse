import {
  CHEMISTRY_CONFLICT_THRESHOLD,
  CHEMISTRY_JOINT_TRAINING_GAIN,
  TEAM_CHEMISTRY_PERFORMANCE_WEIGHT,
} from "@/data/balance";
import { createSeededRandom } from "@/lib/seededRandom";
import type { Trainee, TraineeActivity } from "@/types/game";

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
        chemA[b.id] = clampChemistry(currentVal + CHEMISTRY_JOINT_TRAINING_GAIN);
        chemB[a.id] = clampChemistry(
          (chemB[a.id] ?? 0) + CHEMISTRY_JOINT_TRAINING_GAIN,
        );
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
        chemA[b.id] = clampChemistry((chemA[b.id] ?? 0) + 5);
        chemB[a.id] = clampChemistry((chemB[a.id] ?? 0) + 5);
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
