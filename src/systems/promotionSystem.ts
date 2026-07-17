import { FANDOM_DISAPPOINTMENT_COMMERCIAL } from "@/data/balance";
import { PROMOTION_ACTIVITIES } from "@/data/promotions";
import { createSeededRandom } from "@/lib/seededRandom";
import type {
  EffectKey,
  EffectMap,
  GamePhase,
  PromotionActivity,
  PromotionActivityId,
  PromotionRequirementPhase,
  Staff,
  Trainee,
  TraineeStatKey,
} from "@/types/game";

const PHASE_ORDER: GamePhase[] = [
  "prologue", "founding", "training", "debut", "growth", "peak",
];

const COST_UNIT = 10000;

export interface PromotionOrder {
  activityId: PromotionActivityId;
  assignedMemberIds?: string[];
}

export interface PromotionContext {
  phase: GamePhase;
  public: number;
  fandom: number;
  industry: number;
}

export interface PromotionResult {
  activityId: PromotionActivityId;
  activityName: string;
  success: boolean;
  successRate: number;
  effects: EffectMap;
  income: number;
  cost: number;
  memberActivityChanges: { traineeId: string; activity: "entertainment" }[];
  warnings: string[];
}

function getActivity(id: PromotionActivityId): PromotionActivity | undefined {
  return PROMOTION_ACTIVITIES.find((a) => a.id === id);
}

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

function meetsPhaseRequirement(
  current: GamePhase,
  required: PromotionRequirementPhase,
): boolean {
  const hasPlus = required.endsWith("+");
  const baseName = required.replace("+", "") as GamePhase;
  const currentIdx = PHASE_ORDER.indexOf(current);
  const requiredIdx = PHASE_ORDER.indexOf(baseName);
  return hasPlus ? currentIdx >= requiredIdx : current === baseName;
}

function checkRequirements(
  activity: PromotionActivity,
  ctx: PromotionContext,
): boolean {
  const req = activity.requirements;
  if (req.phase && !meetsPhaseRequirement(ctx.phase, req.phase)) return false;
  if (req.minPublic !== undefined && ctx.public < req.minPublic) return false;
  if (req.minFandom !== undefined && ctx.fandom < req.minFandom) return false;
  if (req.minIndustry !== undefined && ctx.industry < req.minIndustry) return false;
  return true;
}

/**
 * 활동기 UI가 노출할 실행 가능 프로모션. 요건(phase·팬덤·업계)은 이정표
 * 해금 체인과 같은 상수를 참조하므로 "이정표 달성 → 여기 나타남"이 성립한다.
 * musicShow는 활동기 음악방송 대결이 자동으로 다루므로 제외한다.
 */
export function listAvailablePromotions(
  ctx: PromotionContext,
): PromotionActivity[] {
  return PROMOTION_ACTIVITIES.filter(
    (activity) => activity.id !== "musicShow" && checkRequirements(activity, ctx),
  );
}

function averageStat(
  trainees: readonly Trainee[],
  stat: TraineeStatKey | "teamwork" | "visualStyle",
): number {
  if (trainees.length === 0) return 50;

  if (stat === "teamwork") {
    let total = 0;
    let count = 0;
    for (const t of trainees) {
      for (const v of Object.values(t.chemistry)) {
        total += v;
        count++;
      }
    }
    return count > 0 ? 50 + (total / count) * 0.5 : 50;
  }

  if (stat === "visualStyle") {
    return trainees.reduce((s, t) => s + t.stats.visual, 0) / trainees.length;
  }

  return trainees.reduce((s, t) => s + t.stats[stat], 0) / trainees.length;
}

export function executePromotion(
  order: PromotionOrder,
  trainees: readonly Trainee[],
  staff: readonly Staff[],
  ctx: PromotionContext,
  seed: number,
): PromotionResult | null {
  const activity = getActivity(order.activityId);
  if (!activity) return null;

  if (!checkRequirements(activity, ctx)) {
    return {
      activityId: order.activityId,
      activityName: activity.name,
      success: false,
      successRate: 0,
      effects: {},
      income: 0,
      cost: 0,
      memberActivityChanges: [],
      warnings: [`${activity.name}: 요구 조건 미충족`],
    };
  }

  const random = createSeededRandom(seed);

  const relevantMembers = order.assignedMemberIds
    ? trainees.filter((t) => order.assignedMemberIds!.includes(t.id))
    : trainees;

  const factors = activity.successFactors ?? [];
  let successRate = 1.0;
  if (factors.length > 0) {
    const avgAbility =
      factors.reduce((s, f) => s + averageStat(relevantMembers, f), 0) /
      factors.length;
    successRate = (avgAbility / 50) * (0.7 + random() * 0.6);
  }

  const marketer = staff.find((s) => s.role === "marketer");
  if (marketer) {
    successRate += marketer.ability * 0.003;
  }

  successRate = clamp(successRate, 0.1, 2.0);
  const success = successRate >= 0.8;

  const effectMult = success ? Math.min(successRate, 1.5) : successRate * 0.4;
  const scaledEffects: EffectMap = {};
  for (const [key, value] of Object.entries(activity.effects) as [
    EffectKey,
    number,
  ][]) {
    scaledEffects[key] = Math.round(value * effectMult);
  }

  const costWon = activity.cost * COST_UNIT;
  const incomeWon =
    success && activity.income
      ? Math.round(activity.income * COST_UNIT * Math.min(effectMult, 1.3))
      : 0;

  const memberChanges: { traineeId: string; activity: "entertainment" }[] = [];
  if (
    (activity.id === "varietyShow" || activity.id === "youtubeContent") &&
    order.assignedMemberIds
  ) {
    for (const memberId of order.assignedMemberIds) {
      memberChanges.push({ traineeId: memberId, activity: "entertainment" });
    }
  }

  const warnings: string[] = [];
  if (!success) {
    warnings.push(
      `${activity.name} 성과 미달 (성공률 ${Math.round(successRate * 100)}%)`,
    );
  }

  return {
    activityId: order.activityId,
    activityName: activity.name,
    success,
    successRate,
    effects: scaledEffects,
    income: incomeWon,
    cost: costWon,
    memberActivityChanges: memberChanges,
    warnings,
  };
}

const COMMERCIAL_ACTIVITY_IDS: Set<PromotionActivityId> = new Set([
  "fanSign",
  "youtubeContent",
  "liveBroadcast",
]);

export function checkExcessiveCommercial(
  recentWeeksHadCommercial: number,
  currentOrders: readonly PromotionOrder[],
): number {
  const hasCommercialThisWeek = currentOrders.some((o) =>
    COMMERCIAL_ACTIVITY_IDS.has(o.activityId),
  );
  const total = recentWeeksHadCommercial + (hasCommercialThisWeek ? 1 : 0);
  return total >= 3 ? FANDOM_DISAPPOINTMENT_COMMERCIAL : 0;
}
