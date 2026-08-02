import {
  EXCESSIVE_COMMERCIAL_STREAK_WEEKS,
  FANDOM_DISAPPOINTMENT_COMMERCIAL,
} from "@/data/balance";
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
  return listUnmetRequirements(activity, ctx).length === 0;
}

/** 미달 요건을 사람이 읽을 문장으로 돌려준다 — "요구 조건 미충족"만으로는 다음 행동을 못 정한다. */
function listUnmetRequirements(
  activity: PromotionActivity,
  ctx: PromotionContext,
): string[] {
  const req = activity.requirements;
  const unmet: string[] = [];
  if (req.phase && !meetsPhaseRequirement(ctx.phase, req.phase)) {
    unmet.push("아직 열리지 않은 단계입니다");
  }
  if (req.minPublic !== undefined && ctx.public < req.minPublic) {
    unmet.push(`대중 인지도 ${req.minPublic} 필요 (현재 ${Math.floor(ctx.public)})`);
  }
  if (req.minFandom !== undefined && ctx.fandom < req.minFandom) {
    unmet.push(`코어 팬덤 ${req.minFandom} 필요 (현재 ${Math.floor(ctx.fandom)})`);
  }
  if (req.minIndustry !== undefined && ctx.industry < req.minIndustry) {
    unmet.push(`업계 평판 ${req.minIndustry} 필요 (현재 ${Math.floor(ctx.industry)})`);
  }
  return unmet;
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

/**
 * 비활동기(인터루드) 주간에 열리는 운영 활동. 콘서트·팬사인회 같은
 * 활동기 전용 대형 이벤트는 제외하고, 팬덤 유지·인지도 관리형 활동만
 * 큐레이션한다 — "조용한 주"를 능동적 운영 주간으로 바꾸는 목록이다.
 * 과도한 상업 활동 반복은 checkExcessiveCommercial이 그대로 견제한다.
 */
const INTERLUDE_ACTIVITY_IDS: ReadonlySet<PromotionActivityId> = new Set([
  "varietyShow",
  "youtubeContent",
  "liveBroadcast",
  "fanCafeEvent",
]);

export function listInterludePromotions(
  ctx: PromotionContext,
): PromotionActivity[] {
  return PROMOTION_ACTIVITIES.filter(
    (activity) =>
      INTERLUDE_ACTIVITY_IDS.has(activity.id) &&
      checkRequirements(activity, ctx),
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
      warnings: [
        `${activity.name}: ${listUnmetRequirements(activity, ctx).join(" · ") || "요구 조건 미충족"}`,
      ],
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
      `${activity.name} 성과 미달 — 팀 역량이 기준의 ${Math.round(successRate * 100)}%에 그쳤습니다`,
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

// 과도 상업활동 판정 대상. 콘서트는 수익형 "공연"이므로 제외한다 —
// 수입 내역(breakdown.promotions)에는 콘서트 수익이 섞여 들어가므로
// 판정은 수입 키가 아니라 이 활동 유형 기록(commercialWeekStreak)으로 한다.
const COMMERCIAL_ACTIVITY_IDS: Set<PromotionActivityId> = new Set([
  "fanSign",
  "youtubeContent",
  "liveBroadcast",
]);

/** 이번 주 프로모션 주문에 상업형 활동이 포함되어 있는지. 주간 스트릭 갱신용. */
export function hasCommercialPromotion(
  orders: readonly PromotionOrder[],
): boolean {
  return orders.some((order) => COMMERCIAL_ACTIVITY_IDS.has(order.activityId));
}

/**
 * 상업형 활동이 EXCESSIVE_COMMERCIAL_STREAK_WEEKS(3주) 이상 이어지면
 * 팬 실망 페널티를 돌려준다. 이번 주에 상업 활동이 없으면 스트릭이 끊긴
 * 것이므로 페널티도 없다.
 */
export function checkExcessiveCommercial(
  previousCommercialStreakWeeks: number,
  currentOrders: readonly PromotionOrder[],
): number {
  if (!hasCommercialPromotion(currentOrders)) return 0;
  return previousCommercialStreakWeeks + 1 >= EXCESSIVE_COMMERCIAL_STREAK_WEEKS
    ? FANDOM_DISAPPOINTMENT_COMMERCIAL
    : 0;
}
