import {
  POSITION_TRIAL_INJURY_PENALTY_PER_WEEK,
  POSITION_TRIAL_MAX_INJURY_PENALTY,
  POSITION_TRIAL_SCORE_WEIGHTS,
} from "@/data/balance";
import {
  ALL_POSITIONS,
  calculatePositionFitness,
  positionFitnessToRating,
} from "@/data/founding";
import { createSeededRandom } from "@/lib/seededRandom";
import type { Position, Trainee } from "@/types/game";

export interface PositionTrialBreakdown {
  fitness: number;
  condition: number;
  chemistry: number;
  stageForm: number;
  injuryPenalty: number;
}

export interface PositionTrialCandidateResult {
  traineeId: string;
  position: Position;
  rank: number;
  score: number;
  baseFitness: number;
  baseRating: 1 | 2 | 3 | 4 | 5;
  condition: number;
  teamChemistry: number;
  stageForm: number;
  breakdown: PositionTrialBreakdown;
}

export type PositionTrialResults = Record<
  Position,
  PositionTrialCandidateResult[]
>;

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function hashString(value: string): number {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i++) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function getAverageTeamChemistry(
  trainee: Trainee,
  trainees: readonly Trainee[],
): number {
  const teammates = trainees.filter((candidate) => candidate.id !== trainee.id);
  if (teammates.length === 0) return 0;

  const total = teammates.reduce((sum, teammate) => {
    const direct = trainee.chemistry[teammate.id];
    const reverse = teammate.chemistry[trainee.id];
    return sum + (direct ?? reverse ?? 0);
  }, 0);
  return total / teammates.length;
}

function evaluateCandidate(
  trainee: Trainee,
  trainees: readonly Trainee[],
  position: Position,
  seed: number,
): Omit<PositionTrialCandidateResult, "rank"> {
  const baseFitness = calculatePositionFitness(trainee.stats, position);
  const condition = clamp(trainee.condition, 0, 100);
  const teamChemistry = clamp(getAverageTeamChemistry(trainee, trainees), -100, 100);
  const chemistryScore = (teamChemistry + 100) / 2;
  const random = createSeededRandom(
    seed ^ hashString(`${position}:${trainee.id}`),
  );
  const stageForm = Math.round(random() * 100);
  const injuryPenalty = Math.min(
    POSITION_TRIAL_MAX_INJURY_PENALTY,
    Math.max(0, trainee.injuryWeeks) * POSITION_TRIAL_INJURY_PENALTY_PER_WEEK,
  );
  const breakdown: PositionTrialBreakdown = {
    fitness: Math.round(baseFitness * POSITION_TRIAL_SCORE_WEIGHTS.fitness),
    condition: Math.round(condition * POSITION_TRIAL_SCORE_WEIGHTS.condition),
    chemistry: Math.round(chemistryScore * POSITION_TRIAL_SCORE_WEIGHTS.chemistry),
    stageForm: Math.round(stageForm * POSITION_TRIAL_SCORE_WEIGHTS.stageForm),
    injuryPenalty,
  };
  const score = clamp(
    breakdown.fitness +
      breakdown.condition +
      breakdown.chemistry +
      breakdown.stageForm -
      breakdown.injuryPenalty,
    0,
    100,
  );

  return {
    traineeId: trainee.id,
    position,
    score,
    baseFitness,
    baseRating: positionFitnessToRating(baseFitness),
    condition,
    teamChemistry,
    stageForm,
    breakdown,
  };
}

export function evaluatePositionTrials(
  trainees: readonly Trainee[],
  seed: number,
): PositionTrialResults {
  return Object.fromEntries(
    ALL_POSITIONS.map((position) => {
      const ranked = trainees
        .map((trainee) => evaluateCandidate(trainee, trainees, position, seed))
        .sort(
          (a, b) =>
            b.score - a.score ||
            b.baseFitness - a.baseFitness ||
            a.traineeId.localeCompare(b.traineeId),
        )
        .map((result, index) => ({ ...result, rank: index + 1 }));
      return [position, ranked];
    }),
  ) as PositionTrialResults;
}
