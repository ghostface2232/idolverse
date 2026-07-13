import { WEEKLY_DECISION_POOL } from "@/data/decisionCards";
import { GAME_BALANCE } from "@/data/balance";
import { pickUniqueItems } from "@/lib/seededRandom";
import type {
  GamePhase,
  Season,
  WeeklyDecision,
  WeeklyDecisionOption,
} from "@/types/game";

export interface DecisionCardContext {
  phase: GamePhase;
  hasPendingScandal: boolean;
  hasInjuredMember: boolean;
  investorPressure: boolean;
  hasCurrentAlbum: boolean;
  weeksSinceLastAlbum: number | null;
  lowSatisfactionMember: boolean;
}

const PHASE_CATEGORY_PRIORITY: Record<GamePhase, string[]> = {
  prologue: [],
  founding: [],
  training: ["훈련", "재정", "스케줄"],
  debut: ["스케줄", "훈련", "재정", "콘셉트"],
  growth: ["콘셉트", "스케줄", "재정", "훈련"],
  peak: ["콘셉트", "재정", "스케줄"],
};

const EMERGENCY_CARDS: WeeklyDecision[] = [
  {
    id: "emergency-scandal",
    category: "위기",
    title: "스캔들 긴급 대응",
    summary: "터진 스캔들에 대한 즉각적인 대응이 필요하다.",
    options: [
      {
        id: "fast-response",
        label: "즉시 해명 자료 배포",
        description: "법무·홍보팀을 총동원하여 빠르게 진화한다.",
        tradeoff: "비용이 크지만 피해를 최소화한다.",
        effects: { money: -30000000, fandomDisappointment: -5, public: 1 },
      },
      {
        id: "wait-observe",
        label: "상황 관망",
        description: "여론 추이를 보며 대응 타이밍을 잡는다.",
        tradeoff: "비용은 없지만 팬 불안이 길어질 수 있다.",
        effects: { fandomDisappointment: 5, public: -3 },
      },
    ],
  },
  {
    id: "emergency-injury",
    category: "위기",
    title: "멤버 부상 대처",
    summary: "부상 멤버의 일정을 어떻게 조정할지 결정해야 한다.",
    options: [
      {
        id: "full-rest",
        label: "완전 휴식",
        description: "해당 멤버를 모든 일정에서 제외한다.",
        tradeoff: "회복은 빠르지만 팀 활동에 공백이 생긴다.",
        effects: { condition: 15, satisfaction: 5, public: -2 },
      },
      {
        id: "partial-activity",
        label: "경량 참여",
        description: "부담을 줄이되 최소한의 활동은 유지한다.",
        tradeoff: "공백은 줄지만 악화 위험이 남아 있다.",
        effects: { condition: 5, stress: 3, public: -1 },
      },
    ],
  },
  {
    id: "emergency-investor",
    category: "위기",
    title: "투자사 조건 압박",
    summary: "투자사가 실적 미달을 이유로 개입하려 한다.",
    options: [
      {
        id: "comply",
        label: "요구 수용",
        description: "투자사 요구에 따라 상업 활동을 늘린다.",
        tradeoff: "투자사 관계는 회복되지만 팬 실망과 피로가 누적된다.",
        effects: { money: 20000000, fandomDisappointment: 5, stress: 5, satisfaction: -4 },
      },
      {
        id: "negotiate",
        label: "협상 시도",
        description: "기한 연장이나 조건 완화를 설득한다.",
        tradeoff: "성공 시 여유가 생기지만 실패 시 관계가 악화된다.",
        effects: { industry: -2, satisfaction: 2 },
      },
      {
        id: "defy",
        label: "자체 방침 고수",
        description: "음악적 방향성을 우선하고 투자사와 마찰을 감수한다.",
        tradeoff: "팀 만족도는 오르지만 투자 지원이 줄어들 수 있다.",
        effects: { satisfaction: 5, fandomLoyalty: 3, money: -15000000, industry: -3 },
      },
    ],
  },
  {
    id: "emergency-morale",
    category: "위기",
    title: "멤버 사기 저하",
    summary: "한 멤버의 만족도가 위험 수준으로 떨어져 관리가 시급하다.",
    options: [
      {
        id: "private-meeting",
        label: "개별 면담",
        description: "시간을 들여 불만을 듣고 해결책을 모색한다.",
        tradeoff: "만족도가 회복되지만 팀 훈련 시간이 줄어든다.",
        effects: { satisfaction: 8, chemistry: 2, vocal: -1, dance: -1 },
      },
      {
        id: "reward",
        label: "특별 보상 지급",
        description: "보너스와 휴식을 제공한다.",
        tradeoff: "즉각 효과가 있지만 비용이 든다.",
        effects: { satisfaction: 6, money: -10000000, condition: 5 },
      },
    ],
  },
];

const INTERLUDE_CARDS: WeeklyDecision[] = [
  {
    id: "interlude-activity",
    category: "인터루드",
    title: "앨범 사이 활동 선택",
    summary: "다음 컴백까지 팀의 에너지를 어디에 쓸지 결정한다.",
    options: [
      {
        id: "content-production",
        label: "자체 콘텐츠 제작",
        description: "유튜브·비하인드 콘텐츠로 팬덤을 유지한다.",
        tradeoff: "해외 팬덤과 충성도는 오르지만 대중 인지도는 정체된다.",
        effects: { global: 3, fandomLoyalty: 2, public: -1 },
      },
      {
        id: "individual-schedules",
        label: "개인 스케줄 배분",
        description: "멤버별 연기·모델·예능 활동을 추진한다.",
        tradeoff: "개별 인지도와 수입은 오르지만 팀 결속이 느슨해진다.",
        effects: { public: 3, money: 15000000, chemistry: -3 },
      },
      {
        id: "team-vacation",
        label: "단체 휴가",
        description: "전원 휴식으로 컨디션을 끌어올린다.",
        tradeoff: "컨디션은 크게 회복되지만 팬 노출이 줄어든다.",
        effects: { condition: 20, stress: -15, satisfaction: 8, public: -3 },
      },
    ],
  },
  {
    id: "interlude-next-album",
    category: "인터루드",
    title: "다음 앨범 준비 시기",
    summary: "다음 컴백 준비를 언제 시작할지 결정한다.",
    options: [
      {
        id: "start-now",
        label: "즉시 시작",
        description: "컴백 공백을 최소화하고 빠르게 돌아간다.",
        tradeoff: "시장 존재감은 유지하지만 팀 피로가 누적된다.",
        effects: { public: 2, stress: 5, albumSong: 3 },
      },
      {
        id: "wait-recover",
        label: "2-3주 후 착수",
        description: "충분히 쉬고 나서 다음 앨범에 집중한다.",
        tradeoff: "컨디션은 좋지만 시장에서 잊힐 수 있다.",
        effects: { condition: 10, stress: -8, public: -2 },
      },
    ],
  },
];

export function generateWeeklyDecisionCards(
  week: number,
  season: Season,
  ctx?: DecisionCardContext,
): WeeklyDecision[] {
  if (!ctx) {
    const seasonalPool = WEEKLY_DECISION_POOL.filter(
      (card) => !card.seasons || card.seasons.includes(season),
    );
    return pickUniqueItems(
      seasonalPool,
      GAME_BALANCE.weeklyDecisionCount,
      week * 101 + season.length,
    );
  }

  const cards: WeeklyDecision[] = [];

  if (ctx.hasPendingScandal) {
    cards.push(EMERGENCY_CARDS[0]);
  }
  if (ctx.hasInjuredMember) {
    cards.push(EMERGENCY_CARDS[1]);
  }
  if (ctx.investorPressure) {
    cards.push(EMERGENCY_CARDS[2]);
  }
  if (ctx.lowSatisfactionMember) {
    cards.push(EMERGENCY_CARDS[3]);
  }

  const isInterlude =
    !ctx.hasCurrentAlbum &&
    ctx.weeksSinceLastAlbum !== null &&
    ctx.weeksSinceLastAlbum > 0 &&
    ctx.phase !== "training";

  if (isInterlude) {
    const interludeCards = pickUniqueItems(
      INTERLUDE_CARDS,
      Math.min(INTERLUDE_CARDS.length, 2),
      week * 71,
    );
    cards.push(...interludeCards);
  }

  const remaining = (isInterlude ? 4 : GAME_BALANCE.weeklyDecisionCount) - cards.length;

  if (remaining > 0) {
    const priorities = PHASE_CATEGORY_PRIORITY[ctx.phase] ?? [];

    const seasonalPool = WEEKLY_DECISION_POOL.filter(
      (card) => !card.seasons || card.seasons.includes(season),
    );

    const usedIds = new Set(cards.map((c) => c.id));
    const available = seasonalPool.filter((c) => !usedIds.has(c.id));

    const sorted = [...available].sort((a, b) => {
      const aPriority = priorities.indexOf(a.category);
      const bPriority = priorities.indexOf(b.category);
      const aScore = aPriority === -1 ? priorities.length : aPriority;
      const bScore = bPriority === -1 ? priorities.length : bPriority;
      return aScore - bScore;
    });

    const picked = pickUniqueItems(
      sorted.slice(0, Math.max(remaining * 2, sorted.length)),
      remaining,
      week * 101 + season.length + ctx.phase.length,
    );

    cards.push(...picked);
  }

  return cards.slice(0, isInterlude ? 4 : GAME_BALANCE.weeklyDecisionCount + cards.filter((c) => c.category === "위기").length);
}
