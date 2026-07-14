import type {
  EffectMap,
  FinanceStoreState,
  InvestorCompany,
  InvestorCondition,
} from "@/types/game";

const STREAMING_FANDOM_RATE = 30000;
const STREAMING_GLOBAL_RATE = 15000;
const CHART_RANK_BONUS_THRESHOLD = 100;
const CHART_RANK_BONUS_PER_RANK = 20000;
const ALBUM_FANDOM_RATE = 50000;
const ALBUM_DECAY_WEEKS = 4;

export interface RevenueContext {
  fandom: number;
  global: number;
  chartRank: number | null;
  weeksAfterAlbumRelease: number | null;
  hasReleasedAlbum: boolean;
  promotionIncome: number;
  promotionCost: number;
}

export interface FinanceResult {
  money: number;
  income: Record<string, number>;
  expenses: Record<string, number>;
  warnings: string[];
}

export function calculateStreamingRevenue(
  fandom: number,
  global: number,
  chartRank: number | null,
): number {
  let revenue = Math.round(
    fandom * STREAMING_FANDOM_RATE + global * STREAMING_GLOBAL_RATE,
  );

  if (chartRank !== null && chartRank <= CHART_RANK_BONUS_THRESHOLD) {
    revenue +=
      (CHART_RANK_BONUS_THRESHOLD + 1 - chartRank) * CHART_RANK_BONUS_PER_RANK;
  }

  return revenue;
}

export function calculateAlbumRevenue(
  fandom: number,
  weeksAfterRelease: number | null,
): number {
  if (weeksAfterRelease === null || weeksAfterRelease > ALBUM_DECAY_WEEKS) {
    return 0;
  }

  const decayFactor = 1 - weeksAfterRelease / (ALBUM_DECAY_WEEKS + 1);
  return Math.round(fandom * ALBUM_FANDOM_RATE * decayFactor);
}

export function processWeeklyFinances(
  finance: FinanceStoreState,
  ctx: RevenueContext,
): FinanceResult {
  let money = finance.money;
  const income: Record<string, number> = {};
  const expenses: Record<string, number> = {};
  const warnings: string[] = [];

  expenses.fixedCosts = finance.weeklyFixedTotal;
  money -= finance.weeklyFixedTotal;

  if (ctx.promotionCost > 0) {
    expenses.promotions = ctx.promotionCost;
    money -= ctx.promotionCost;
  }

  const streaming = ctx.hasReleasedAlbum
    ? calculateStreamingRevenue(ctx.fandom, ctx.global, ctx.chartRank)
    : 0;
  if (streaming > 0) {
    income.streaming = streaming;
    money += streaming;
  }

  const album = calculateAlbumRevenue(ctx.fandom, ctx.weeksAfterAlbumRelease);
  if (album > 0) {
    income.album = album;
    money += album;
  }

  if (ctx.promotionIncome > 0) {
    income.promotions = ctx.promotionIncome;
    money += ctx.promotionIncome;
  }

  if (money < 0) {
    warnings.push(`자금 부족: ${money.toLocaleString()}원`);
  }

  return { money, income, expenses, warnings };
}

export interface InvestorMetrics {
  snsFollowers: number;
  spotifyStreams: number;
  musicShowWins: number;
  highestAwardLevel: string | null;
  quarterlyRevenue: number;
  cumulativeRevenue: number;
  visualAverage: number;
  adContracts: number;
  trendFit: number;
  styleScore: number;
}

export interface InvestorCheckResult {
  conditionId: string;
  met: boolean;
  description: string;
  penalty?: string;
}

/**
 * 음악방송 1위와 광고 계약은 실측 시스템이 아직 없어(지표가 항상 0)
 * 평가하면 구조적으로 영구 실패한다. 실측이 연결될 때까지 평가에서 제외한다.
 */
const UNMEASURED_METRICS: ReadonlySet<string> = new Set([
  "musicShowWin",
  "adContract",
]);

export function checkInvestorConditions(
  investor: InvestorCompany,
  metrics: InvestorMetrics,
  cumulativeWeek: number,
): InvestorCheckResult[] {
  const results: InvestorCheckResult[] = [];

  for (const condition of investor.conditions) {
    if (UNMEASURED_METRICS.has(condition.metric)) continue;
    // deadlineWeeks는 게임 시작 기준 누적 주차다. 연도가 바뀌며 currentWeek가
    // 1로 랩되어도 마감이 다시 미래가 되지 않도록 누적 주차로 비교한다.
    if (cumulativeWeek < condition.deadlineWeeks) continue;

    const met = evaluateCondition(condition, metrics);
    results.push({
      conditionId: condition.id,
      met,
      description: condition.description,
      penalty: met ? undefined : condition.penalty,
    });
  }

  return results;
}

function evaluateCondition(
  condition: InvestorCondition,
  metrics: InvestorMetrics,
): boolean {
  switch (condition.metric) {
    case "snsFollowers":
      return metrics.snsFollowers >= (condition.target as number);
    case "spotifyStreams":
      return metrics.spotifyStreams >= (condition.target as number);
    case "musicShowWin":
      return metrics.musicShowWins >= 1;
    case "awardLevel":
      return (
        metrics.highestAwardLevel !== null &&
        meetsAwardLevel(metrics.highestAwardLevel, condition.target as string)
      );
    case "quarterlyRevenue":
      return metrics.quarterlyRevenue > 0;
    case "payback":
      return metrics.cumulativeRevenue >= 0;
    case "visualAverage":
      return metrics.visualAverage >= (condition.target as number);
    case "adContract":
      return metrics.adContracts >= 1;
    case "trendFit":
      return metrics.trendFit >= (condition.target as number);
    case "styleScore":
      return metrics.styleScore >= (condition.target as number);
    default:
      return false;
  }
}

const AWARD_LEVEL_ORDER = ["popularity", "rookie", "bonsang", "daesang"];

function meetsAwardLevel(actual: string, required: string): boolean {
  const normalized = required
    .replace("본상 이상", "bonsang")
    .replace("대상 이상", "daesang")
    .replace("본상", "bonsang")
    .replace("대상", "daesang");
  return (
    AWARD_LEVEL_ORDER.indexOf(actual) >=
    AWARD_LEVEL_ORDER.indexOf(normalized)
  );
}

export interface InvestorPenaltyResult {
  effectType: string;
  effects: EffectMap;
  description: string;
}

export function applyInvestorPenalty(
  investor: InvestorCompany,
): InvestorPenaltyResult[] {
  return investor.penaltyEffects.map((effect) => {
    const effects: EffectMap = {};

    switch (effect.type) {
      case "marketingCut":
        effects.public = -5;
        effects.global = -3;
        break;
      case "followUpRefusal":
        effects.industry = -3;
        break;
      case "cashRecall":
        effects.money = -Math.round(investor.fundAmount * 0.1);
        break;
      case "broadcastDisadvantage":
        effects.public = -4;
        effects.industry = -3;
        break;
      case "collaborationBlock":
        effects.industry = -5;
        break;
      case "managementInterference":
        effects.satisfaction = -5;
        effects.stress = 5;
        break;
      case "equityPressure":
        effects.money = -Math.round(investor.fundAmount * 0.05);
        effects.satisfaction = -3;
        break;
      case "contractPenalty":
        effects.money = -50000000;
        break;
      case "reputationDrop":
        effects.industry = -4;
        effects.public = -2;
        break;
      case "styleSupportCut":
        effects.public = -3;
        break;
    }

    return {
      effectType: effect.type,
      effects,
      description: effect.description,
    };
  });
}
