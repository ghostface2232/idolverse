import {
  CHEMISTRY_CONFLICT_THRESHOLD,
  DORM_SATISFACTION_BONUS,
  LIVING_EXPENSE_SATISFACTION_BONUS,
  SATISFACTION_BASELINE,
  SATISFACTION_CONCEPT_MISMATCH_PENALTY,
  SATISFACTION_LEAVE_THRESHOLD,
  SATISFACTION_OVERWORK_PENALTY,
  SATISFACTION_REGRESSION_RATE,
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
  dormLevel: 1 | 2 | 3 | 4;
  livingExpenseLevel: 1 | 2 | 3 | 4;
  weeksSinceDebut: number;
  debutWeek: number | null;
  currentWeek: number;
  /**
   * 약속된 데뷔 일정(창단 시 선택한 티어)을 넘긴 주 수. 완성형 24주를
   * "선택"한 팀이 20주부터 불만을 갖는 건 서사적으로 틀리므로,
   * 고정 임계 대신 약속 대비 지연으로 판정한다.
   */
  debutDelayWeeks: number;
  recentAward: boolean;
  musicShowWin: boolean;
  goodFanReaction: boolean;
}

export interface SatisfactionDelta {
  traineeId: string;
  traineeName: string;
  before: number;
  after: number;
  effective: number;
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

  if (hasConflictingPeer(trainee, trainees)) {
    delta -= 2;
    reasons.push("갈등 중인 동료");
  }

  if (
    ctx.debutWeek === null &&
    ctx.currentPhase === "training" &&
    ctx.debutDelayWeeks > 0
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

function applyRegression(base: number): { value: number; regressed: boolean } {
  if (base > SATISFACTION_BASELINE) {
    return {
      value: Math.max(SATISFACTION_BASELINE, base - SATISFACTION_REGRESSION_RATE),
      regressed: true,
    };
  }
  return { value: base, regressed: false };
}

export function getFacilitySatisfactionOffset(
  dormLevel: 1 | 2 | 3 | 4,
  livingExpenseLevel: 1 | 2 | 3 | 4,
): number {
  return (
    DORM_SATISFACTION_BONUS[dormLevel] +
    LIVING_EXPENSE_SATISFACTION_BONUS[livingExpenseLevel]
  );
}

export function getEffectiveSatisfaction(
  baseSatisfaction: number,
  dormLevel: 1 | 2 | 3 | 4,
  livingExpenseLevel: 1 | 2 | 3 | 4,
): number {
  return clamp(
    baseSatisfaction + getFacilitySatisfactionOffset(dormLevel, livingExpenseLevel),
    0,
    100,
  );
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
    const { value: regressed, regressed: didRegress } = applyRegression(before);
    if (didRegress) reasons.push("기준점 회귀");
    const after = clamp(regressed + delta, 0, 100);
    const effective = getEffectiveSatisfaction(
      after,
      ctx.dormLevel,
      ctx.livingExpenseLevel,
    );

    deltas.push({
      traineeId: trainee.id,
      traineeName: trainee.name,
      before,
      after,
      effective,
      reasons,
    });

    if (effective <= SATISFACTION_LEAVE_THRESHOLD) {
      leaveRisks.push({
        traineeId: trainee.id,
        traineeName: trainee.name,
        level: "leaving",
        satisfaction: effective,
      });
    } else if (effective <= SATISFACTION_WARNING_THRESHOLD) {
      leaveRisks.push({
        traineeId: trainee.id,
        traineeName: trainee.name,
        level: "warning",
        satisfaction: effective,
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
