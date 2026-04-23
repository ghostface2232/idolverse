import {
  CHEMISTRY_CONFLICT_THRESHOLD,
  SATISFACTION_CONCEPT_MISMATCH_PENALTY,
  SATISFACTION_LEAVE_THRESHOLD,
  SATISFACTION_OVERWORK_PENALTY,
  SATISFACTION_WARNING_THRESHOLD,
} from "@/data/balance";
import type {
  ConceptMood,
  GamePhase,
  Position,
  Trainee,
  TrainingIntensity,
} from "@/types/game";

export interface WeekContext {
  currentPhase: GamePhase;
  albumConcept: ConceptMood | null;
  trainingIntensity: TrainingIntensity;
  facilityLevel: number;
  weeksSinceDebut: number;
  debutWeek: number | null;
  currentWeek: number;
  recentAward: boolean;
  musicShowWin: boolean;
  goodFanReaction: boolean;
}

export interface SatisfactionDelta {
  traineeId: string;
  traineeName: string;
  before: number;
  after: number;
  reasons: string[];
}

export interface LeaveRiskResult {
  traineeId: string;
  traineeName: string;
  level: "warning" | "leaving";
  satisfaction: number;
}

export interface SatisfactionResult {
  deltas: SatisfactionDelta[];
  leaveRisks: LeaveRiskResult[];
}

const CONCEPT_AFFINITY_HIGH = 65;
const CONCEPT_AFFINITY_LOW = 35;
const FACILITY_GOOD_THRESHOLD = 3;
const DEBUT_DELAY_THRESHOLD_WEEKS = 20;
const REST_ACTIVITIES = new Set(["rest", "vacation"]);

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function hasConflictingPeer(
  trainee: Trainee,
  trainees: readonly Trainee[],
): boolean {
  for (const other of trainees) {
    if (other.id === trainee.id) continue;
    const chem = trainee.chemistry[other.id] ?? 0;
    if (chem < CHEMISTRY_CONFLICT_THRESHOLD) return true;
  }
  return false;
}

function isPositionMismatch(trainee: Trainee): boolean {
  if (!trainee.position) return false;
  const positionStatMap: Record<Position, keyof Trainee["stats"]> = {
    leader: "mental",
    mainVocal: "vocal",
    mainDancer: "dance",
    center: "visual",
    visual: "visual",
    variety: "charm",
    producing: "vocal",
  };
  const primaryStat = positionStatMap[trainee.position];
  return trainee.stats[primaryStat] < 40;
}

function computeDelta(
  trainee: Trainee,
  ctx: WeekContext,
  trainees: readonly Trainee[],
): { delta: number; reasons: string[] } {
  let delta = 0;
  const reasons: string[] = [];

  if (ctx.albumConcept) {
    const affinity = trainee.conceptAffinity[ctx.albumConcept] ?? 50;
    if (affinity < CONCEPT_AFFINITY_LOW) {
      delta += SATISFACTION_CONCEPT_MISMATCH_PENALTY;
      reasons.push("부적합 콘셉트");
    } else if (affinity >= CONCEPT_AFFINITY_HIGH) {
      delta += 2;
      reasons.push("적합 콘셉트");
    }
  }

  if (ctx.trainingIntensity === "extreme") {
    delta += SATISFACTION_OVERWORK_PENALTY;
    reasons.push("과도한 스케줄");
  } else if (ctx.trainingIntensity === "hard" && trainee.stress > 70) {
    delta += SATISFACTION_OVERWORK_PENALTY;
    reasons.push("높은 스트레스 속 강훈련");
  }

  if (ctx.facilityLevel < 2) {
    delta -= 2;
    reasons.push("열악한 시설");
  } else if (ctx.facilityLevel >= FACILITY_GOOD_THRESHOLD) {
    delta += 1;
    reasons.push("좋은 시설");
  }

  if (hasConflictingPeer(trainee, trainees)) {
    delta -= 2;
    reasons.push("갈등 중인 동료");
  }

  if (
    ctx.debutWeek === null &&
    ctx.currentPhase === "training" &&
    ctx.currentWeek > DEBUT_DELAY_THRESHOLD_WEEKS
  ) {
    delta -= 3;
    reasons.push("데뷔 지연");
  }

  if (isPositionMismatch(trainee)) {
    delta -= 2;
    reasons.push("부적합 포지션");
  }

  if (REST_ACTIVITIES.has(trainee.currentActivity ?? "")) {
    delta += 5;
    reasons.push("적절한 휴식");
  }

  if (ctx.recentAward) {
    delta += 10;
    reasons.push("시상식 수상");
  }

  if (ctx.musicShowWin) {
    delta += 8;
    reasons.push("음악방송 1위");
  }

  if (ctx.goodFanReaction) {
    delta += 3;
    reasons.push("팬 반응 좋음");
  }

  return { delta, reasons };
}

export function updateSatisfaction(
  trainees: readonly Trainee[],
  ctx: WeekContext,
): SatisfactionResult {
  const deltas: SatisfactionDelta[] = [];
  const leaveRisks: LeaveRiskResult[] = [];

  for (const trainee of trainees) {
    const { delta, reasons } = computeDelta(trainee, ctx, trainees);
    const before = trainee.satisfaction;
    const after = clamp(before + delta, 0, 100);

    deltas.push({
      traineeId: trainee.id,
      traineeName: trainee.name,
      before,
      after,
      reasons,
    });

    if (after <= SATISFACTION_LEAVE_THRESHOLD) {
      leaveRisks.push({
        traineeId: trainee.id,
        traineeName: trainee.name,
        level: "leaving",
        satisfaction: after,
      });
    } else if (after <= SATISFACTION_WARNING_THRESHOLD) {
      leaveRisks.push({
        traineeId: trainee.id,
        traineeName: trainee.name,
        level: "warning",
        satisfaction: after,
      });
    }
  }

  return { deltas, leaveRisks };
}

export interface MemberLeaveImpact {
  fandomLossPercent: number;
  industryPenalty: number;
}

export function calculateMemberLeaveImpact(
  isDebuted: boolean,
): MemberLeaveImpact {
  if (!isDebuted) {
    return { fandomLossPercent: 5, industryPenalty: 2 };
  }
  return { fandomLossPercent: 20, industryPenalty: 10 };
}
