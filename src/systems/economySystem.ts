import type {
  AwardRecord,
  EffectMap,
  FinanceStoreState,
  InvestorCompany,
  InvestorCondition,
} from "@/types/game";
import { INVESTOR_INTERVENTION } from "@/data/balance";

// 스트리밍은 활동기의 일상 수입 축이다. 30000/15000이던 시절에는 주간
// 상한이 ~450만원으로 고정비·컴백 예산 대비 너무 작아, 콘서트 없이는
// 모든 런이 5년 내 우하향했다(2026-07 시뮬레이션: 무난한 런이 매년
// 1~2억씩 순감). 2.5배 상향으로 "팬덤을 키우면 매주 버는 돈이 는다"가
// 체감되게 한다 — 숙련 런 기준 주 1,000만원대, 연 5~6억 수준이다.
const STREAMING_FANDOM_RATE = 75000;
const STREAMING_GLOBAL_RATE = 40000;
const CHART_RANK_BONUS_THRESHOLD = 100;
// 차트 상위권의 스트리밍 프리미엄. 1위면 주 +300만원 — 순위 경쟁의
// 보상이 명성만이 아니라 현금으로도 돌아온다.
const CHART_RANK_BONUS_PER_RANK = 30000;
// 앨범 수익 = 초동 판매량 × 장당 마진(감쇠 주간에 걸쳐 분할). 판매량이
// 품질×팬덤의 함수이므로 컴백 예산·스태프 투자가 실제로 회수되는 경로다 —
// 팬덤 정률(×5만)이던 시절에는 사이클당 ~5M뿐이라 모든 예산 티어가
// 구조적 적자였다(R6 프로브). 마진 800은 컴백 예산(3천만~1.2억)을 초동
// 5만 장 이하로는 회수하지 못하는 수준이라 1200으로 올린다 — 표준 예산
// 컴백이 초동 5만 장이면 발매 5주 동안 6천만원을 돌려받는 계산이다.
const ALBUM_UNIT_MARGIN = 1200;
const ALBUM_DECAY_WEEKS = 4;
/** 감쇠 가중치(1, 0.8, 0.6, 0.4, 0.2)의 합 — 총수익을 초동×마진으로 정규화한다. */
const ALBUM_DECAY_WEIGHT_SUM = 3;

export interface RevenueContext {
  fandom: number;
  global: number;
  chartRank: number | null;
  weeksAfterAlbumRelease: number | null;
  /** 최신 발매 앨범의 초동 판매량. 발매 이력이 없으면 0. */
  albumFirstWeekSales: number;
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
  firstWeekSales: number,
  weeksAfterRelease: number | null,
): number {
  if (weeksAfterRelease === null || weeksAfterRelease > ALBUM_DECAY_WEEKS) {
    return 0;
  }

  const decayFactor = 1 - weeksAfterRelease / (ALBUM_DECAY_WEEKS + 1);
  return Math.round(
    (firstWeekSales * ALBUM_UNIT_MARGIN * decayFactor) /
      ALBUM_DECAY_WEIGHT_SUM,
  );
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

  const album = calculateAlbumRevenue(
    ctx.albumFirstWeekSales,
    ctx.weeksAfterAlbumRelease,
  );
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
  awardHistory: readonly AwardRecord[];
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
  /** 마감(deadlineWeeks) 도래 여부. 마감 전 미달은 실패가 아니라 진행 중이다. */
  deadlinePassed: boolean;
  description: string;
  penalty?: string;
}

export function checkInvestorConditions(
  investor: InvestorCompany,
  metrics: InvestorMetrics,
  cumulativeWeek: number,
): InvestorCheckResult[] {
  const results: InvestorCheckResult[] = [];

  for (const condition of investor.conditions) {
    // 마감 전에도 매주 평가해 조기 달성을 기록할 수 있게 한다. 미달의
    // 페널티 절차는 호출부가 deadlinePassed일 때만 연다.
    // deadlineWeeks는 게임 시작 기준 누적 주차다. 연도가 바뀌며 currentWeek가
    // 1로 랩되어도 마감이 다시 미래가 되지 않도록 누적 주차로 비교한다.
    const deadlinePassed = cumulativeWeek >= condition.deadlineWeeks;
    const met = evaluateCondition(condition, metrics);
    results.push({
      conditionId: condition.id,
      met,
      deadlinePassed,
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
      // 마감(deadlineWeeks) 안에 딴 상만 인정한다. 마감 이후의 수상이
      // 이미 실패한 마일스톤을 소급 충족시키면 안 된다.
      return metrics.awardHistory.some(
        (record) =>
          record.week <= condition.deadlineWeeks &&
          meetsAwardLevel(record.category, condition.target as string),
      );
    case "quarterlyRevenue":
      return metrics.quarterlyRevenue > 0;
    case "payback":
      return metrics.cumulativeRevenue >= (condition.target as number);
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
    .replace("신인상 이상", "rookie")
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
        effects.money = -Math.round(
          investor.fundAmount * INVESTOR_INTERVENTION.penalty.cashRecallShare,
        );
        break;
      case "broadcastDisadvantage":
        effects.public = -4;
        effects.industry = -3;
        break;
      case "collaborationBlock":
        effects.industry = -5;
        break;
      case "managementInterference":
        effects.satisfaction =
          INVESTOR_INTERVENTION.penalty.managementSatisfaction;
        effects.stress = INVESTOR_INTERVENTION.penalty.managementStress;
        break;
      case "equityPressure":
        effects.money = -Math.round(
          investor.fundAmount * INVESTOR_INTERVENTION.penalty.equityPressureShare,
        );
        effects.satisfaction = -3;
        break;
      case "contractPenalty":
        effects.money = -Math.round(
          investor.fundAmount * INVESTOR_INTERVENTION.penalty.contractPenaltyShare,
        );
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
