export type MarketStandingMetric =
  | "public"
  | "fandom"
  | "global"
  | "industry"
  | "chartPower";

export interface MarketStandingTier {
  min: number;
  label: string;
}

export interface MarketStanding {
  label: string;
  nextLabel: string | null;
  tierIndex: number;
  tierCount: number;
}

/**
 * 시장 수치를 플레이어가 바로 이해할 수 있는 체급으로 번역한다.
 * 팬덤·해외·업계 구간은 공연 및 해외 진출 해금 기준과 같은 문턱을 쓴다.
 */
export const MARKET_STANDING_TIERS = {
  public: [
    { min: 0, label: "인지도 쌓는 중" },
    { min: 10, label: "핫 루키" },
    { min: 25, label: "입소문 상승세" },
    { min: 45, label: "대중픽" },
    { min: 65, label: "전국구 스타" },
    { min: 85, label: "국민 아이돌" },
  ],
  fandom: [
    { min: 0, label: "팬덤 형성 중" },
    { min: 10, label: "팬 커뮤니티 결집" },
    { min: 15, label: "팬사인회 매진권" },
    { min: 35, label: "팬콘 매진권" },
    { min: 50, label: "아레나 투어급" },
    { min: 70, label: "고척돔 입성권" },
    { min: 85, label: "스타디움급 팬덤" },
  ],
  global: [
    { min: 0, label: "국내 중심" },
    { min: 10, label: "해외 반응 탐색" },
    { min: 20, label: "글로벌 입소문" },
    { min: 35, label: "해외 쇼케이스급" },
    { min: 50, label: "현지 러브콜" },
    { min: 75, label: "월드투어급" },
    { min: 90, label: "글로벌 헤드라이너" },
  ],
  industry: [
    { min: 0, label: "업계 인지도 형성" },
    { min: 15, label: "현장 입소문" },
    { min: 30, label: "신뢰 쌓는 중" },
    { min: 45, label: "섭외 러브콜" },
    { min: 65, label: "우선 섭외" },
    { min: 75, label: "시상식 중심축" },
    { min: 90, label: "업계 아이콘" },
  ],
  chartPower: [
    { min: 0, label: "차트 밖 관망" },
    { min: 20, label: "라이징" },
    { min: 40, label: "차트인 경쟁" },
    { min: 55, label: "상위권 강세" },
    { min: 70, label: "톱티어" },
    { min: 85, label: "메가 히트" },
  ],
} as const satisfies Record<MarketStandingMetric, readonly MarketStandingTier[]>;

export function getMarketStanding(
  metric: MarketStandingMetric,
  value: number,
): MarketStanding {
  const tiers = MARKET_STANDING_TIERS[metric];
  const safeValue = Number.isFinite(value) ? value : 0;
  let tierIndex = 0;

  for (let index = 1; index < tiers.length; index += 1) {
    if (safeValue < tiers[index].min) break;
    tierIndex = index;
  }

  return {
    label: tiers[tierIndex].label,
    nextLabel: tiers[tierIndex + 1]?.label ?? null,
    tierIndex,
    tierCount: tiers.length,
  };
}
