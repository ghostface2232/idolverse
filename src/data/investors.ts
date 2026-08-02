import type {
  InvestorCompany,
  InvestorCondition,
  InvestorType,
} from "@/types/game";

export const INVESTOR_TREND_FIT_SCORING = {
  baseline: 50,
  hotMatchBonus: 25,
  coldMatchPenalty: 25,
  min: 0,
  max: 100,
} as const;

export const INVESTOR_COMPANIES: InvestorCompany[] = [
  {
    id: "nextbeat",
    name: "넥스트비트랩스",
    type: "it",
    description:
      "숏폼 플랫폼과 자체 음원 스트리밍을 운영하는 디지털 중심 기업",
    fundAmount: 1200000000,
    conditions: [
      // 지표 산식(weekProcessor.buildInvestorMetrics): snsFollowers =
      // global×1000 + public×500, spotifyStreams = global×10000.
      // global/public은 0~100 스케일이라 팔로워 10만은 이론상 최대치,
      // 스트리밍 100만은 수학적으로 도달 불가였다(확정 페널티 이벤트).
      // 40000은 "global 30 + public 20" 수준 — 1년차 해외 축을 실제로
      // 키운 팀이 닿는 값이고, 120000은 global 12로 2년차 초까지
      // 스트리밍 순환을 만든 팀이 닿는 값이다.
      {
        id: "nextbeat-followers",
        metric: "snsFollowers",
        target: 40000,
        deadlineWeeks: 52,
        description: "1년 안에 주요 SNS 합산 팔로워 4만 달성",
        penalty: "디지털 마케팅 지원이 중단되고 다음 라운드 검토가 보류됩니다.",
      },
      {
        id: "nextbeat-streams",
        metric: "spotifyStreams",
        target: 120000,
        deadlineWeeks: 78,
        description: "1년 반 안에 스포티파이 누적 스트리밍 12만 회 달성",
        penalty: "자체 플레이리스트 편성이 끊기고 성과 추적 보고가 강화됩니다.",
      },
    ],
    penaltyEffects: [
      {
        type: "marketingCut",
        severity: "high",
        description: "디지털 마케팅 제작비 및 광고 슬롯 지원 중단",
      },
      {
        type: "followUpRefusal",
        severity: "medium",
        description: "후속 투자 라운드 심사 보류",
      },
      {
        type: "cashRecall",
        severity: "medium",
        description: "성과 미달 명목으로 일부 운용 자금 회수",
      },
    ],
    bonusEffects: [
      {
        type: "platformBoost",
        description: "자체 플랫폼 메인 배너 및 추천 알고리즘 우선 노출",
      },
      {
        type: "contentSubsidy",
        description: "숏폼·비하인드 디지털 콘텐츠 제작비 전액 보조",
      },
    ],
    personality: "차갑고 숫자 중심적이지만, 목표를 달성하면 확실히 밀어줍니다.",
  },
  {
    id: "crownmusic-ent",
    name: "크라운뮤직 엔터테인먼트",
    type: "entertainment",
    description:
      "방송 네트워크와 선배 아티스트 IP를 보유한 대형 엔터테인먼트 그룹. 우리와 같은 시장에서 뛰는 그룹도 여럿 데리고 있는 회사입니다.",
    fundAmount: 900000000,
    conditions: [
      // 1위 후보권(차트 25위 이내) 진입이 2년차 컴백부터 현실적 목표이므로
      // 1위 요구도 2년(104주) 창을 준다. 신인상 자격 창(2년차 말까지,
      // AWARD_ELIGIBILITY_THRESHOLDS.rookie.maxYear)과 같은 시계다.
      {
        id: "crownmusic-win",
        metric: "musicShowWin",
        target: "1위 1회",
        deadlineWeeks: 104,
        description: "2년 안에 음악방송 1위 1회 달성",
        penalty: "방송 편성 우대가 약화되고 컬래버 라인이 닫힙니다.",
      },
      {
        id: "crownmusic-award",
        metric: "awardLevel",
        target: "신인상 이상",
        deadlineWeeks: 104,
        description: "2년차 연말까지 시상식 신인상 이상 수상",
        penalty: "연말 특별 무대와 외부 네트워크 협의 우선순위가 내려갑니다.",
      },
    ],
    penaltyEffects: [
      {
        type: "broadcastDisadvantage",
        severity: "high",
        description: "방송 편성 및 특별무대 섭외 우선순위 하락",
      },
      {
        type: "collaborationBlock",
        severity: "medium",
        description: "선배 아티스트 및 사내 프로듀서 컬래버 차단",
      },
    ],
    bonusEffects: [
      {
        type: "broadcastPriority",
        description: "음악방송, 예능, 연말무대 편성 우대",
      },
      {
        type: "collaborationOpportunity",
        description: "소속 아티스트와 합동 콘서트 및 컬래버 무대 기회 제공",
      },
    ],
    personality: "관계와 전통을 중시하며, 무대 성과를 숫자보다 높게 평가합니다.",
  },
  {
    id: "summit-capital",
    name: "서밋 캐피탈",
    type: "vc",
    description:
      "회수 기간과 수익 구조를 집요하게 추적하는 공격적 성장형 펀드",
    fundAmount: 1500000000,
    conditions: [
      // 데뷔 전(표준 일정 20주)에는 수입이 구조적으로 0이라 36주 시점의
      // 분기 흑자는 사실상 불가였다. 78주면 데뷔 후 두 번째 활동 사이클의
      // 정산까지 본 뒤의 평가가 된다. payback도 5년 누적 흑자 규모에 맞춰
      // 5억으로 낮추고 3년(156주) 창을 준다.
      {
        id: "summit-quarterly",
        metric: "quarterlyRevenue",
        target: 0,
        deadlineWeeks: 78,
        description: "1년 반 안에 최근 분기 영업 현금흐름 흑자 달성",
        penalty: "경영 간섭이 시작되고 활동 우선순위가 왜곡됩니다.",
      },
      {
        id: "summit-payback",
        metric: "payback",
        target: 500000000,
        deadlineWeeks: 156,
        description: "3년 안에 누적 순수익 5억 달성",
        penalty: "지분 압박과 투자 회수 통보가 시작됩니다.",
      },
    ],
    penaltyEffects: [
      {
        type: "managementInterference",
        severity: "critical",
        description: "수익성 위주 활동 강제 및 비핵심 스케줄 개입",
      },
      {
        type: "equityPressure",
        severity: "high",
        description: "지분 재협상 압박으로 장기 운영 유연성 하락",
      },
      {
        type: "cashRecall",
        severity: "critical",
        description: "최악의 경우 투자 회수 통보로 심각한 유동성 위기 발생",
      },
    ],
    bonusEffects: [
      {
        type: "extraFundingRound",
        description: "성과 달성 시 추가 투자 라운드 개설",
      },
    ],
    personality: "기회가 보이면 크게 베팅하지만, 감정보다 회수 속도를 우선합니다.",
  },
  {
    id: "lumiere-beauty",
    name: "루미에르 뷰티",
    type: "cosmetic",
    description:
      "비주얼 브랜딩과 광고 전환율에 민감한 글로벌 뷰티 기업",
    fundAmount: 700000000,
    conditions: [
      // 신인은 스탯 18~32에서 시작하고 포커스 성장이 연 +20~25 수준이라
      // (TRAINING_BASE_GROWTH 주석) 1년 안에 비주얼 평균 70은 불가였다.
      // 50은 비주얼에 훈련을 실제로 배분한 팀이 1년 반에 닿는 값이다.
      {
        id: "lumiere-visual",
        metric: "visualAverage",
        target: 50,
        deadlineWeeks: 78,
        description: "1년 반 안에 멤버 비주얼 평균 50 달성",
        penalty: "브랜드 이미지 불일치로 협찬과 제작 지원이 축소됩니다.",
      },
      {
        id: "lumiere-model",
        metric: "adContract",
        target: "자사 모델 계약 1건",
        deadlineWeeks: 52,
        description: "1년 안에 자사 광고 모델 계약 체결",
        penalty: "광고가 파기되고 위약금이 발생합니다.",
      },
    ],
    penaltyEffects: [
      {
        type: "contractPenalty",
        severity: "high",
        description: "광고 파기 및 위약금 부담",
      },
      {
        type: "reputationDrop",
        severity: "medium",
        description: "업계에 이미지 관리 실패 인식 확산",
      },
    ],
    bonusEffects: [
      {
        type: "beautyCollab",
        description: "뷰티 콘텐츠와 메이크업 브랜드 컬래버 지원",
      },
      {
        type: "globalBeautySupport",
        description: "해외 뷰티 유통망과 연동한 글로벌 인지도 강화",
      },
    ],
    personality: "결과보다 이미지 완성도를 집요하게 보며, 브랜드 핏에 매우 민감합니다.",
  },
  {
    id: "maison-group",
    name: "메종 그룹",
    type: "fashion",
    description:
      "트렌드 적합도와 스타일 파급력을 중시하는 프리미엄 패션 하우스",
    fundAmount: 500000000,
    conditions: [
      // trendFit은 최신 발매작의 트렌드 적중(기본 50, 적중 +25)으로만
      // 오르므로 발매작이 없으면 0이다. 39주는 데뷔작 한 장으로 승부해야
      // 하는 창이라 사실상 운이었다. 78주면 발매작이 2장 이상 쌓여
      // "트렌드를 읽고 기획한다"는 선택이 성립한다. styleScore는
      // visualAverage와 같은 산식(멤버 비주얼 평균)이므로 신인 성장
      // 곡선에 맞춰 50으로 낮춘다.
      {
        id: "maison-trend",
        metric: "trendFit",
        target: 75,
        deadlineWeeks: 78,
        description: "1년 반 안에 패션 트렌드 적합도 75 달성",
        penalty: "메인 스타일리스트 지원과 쇼 초청 기회가 축소됩니다.",
      },
      {
        id: "maison-style",
        metric: "styleScore",
        target: 50,
        deadlineWeeks: 78,
        description: "1년 반 안에 비주얼과 스타일 점수 평균 50 달성",
        penalty: "프리미엄 스타일링 라인과 촬영 컬래버가 끊깁니다.",
      },
    ],
    penaltyEffects: [
      {
        type: "styleSupportCut",
        severity: "medium",
        description: "프리미엄 스타일리스트 및 협찬 지원 중단",
      },
      {
        type: "reputationDrop",
        severity: "medium",
        description: "패션 업계 내 화제성 및 초청 우선순위 하락",
      },
    ],
    bonusEffects: [
      {
        type: "fashionWeekInvite",
        description: "해외 패션위크 참석 이벤트와 글로벌 미디어 노출 지원",
      },
      {
        type: "stylistSupport",
        description: "시즌 전담 스타일리스트 및 화보 컨셉 패키지 제공",
      },
    ],
    personality: "수치보다 분위기와 화제성을 읽지만, 시즌 감각이 떨어지면 냉정하게 손을 뗍니다.",
  },
];

export const INVESTOR_COMPANIES_BY_TYPE: Record<InvestorType, InvestorCompany[]> = {
  it: INVESTOR_COMPANIES.filter((company) => company.type === "it"),
  entertainment: INVESTOR_COMPANIES.filter(
    (company) => company.type === "entertainment",
  ),
  vc: INVESTOR_COMPANIES.filter((company) => company.type === "vc"),
  cosmetic: INVESTOR_COMPANIES.filter((company) => company.type === "cosmetic"),
  fashion: INVESTOR_COMPANIES.filter((company) => company.type === "fashion"),
};

export const DEFAULT_INVESTOR_BY_TYPE: Record<InvestorType, InvestorCompany> = {
  it: INVESTOR_COMPANIES_BY_TYPE.it[0],
  entertainment: INVESTOR_COMPANIES_BY_TYPE.entertainment[0],
  vc: INVESTOR_COMPANIES_BY_TYPE.vc[0],
  cosmetic: INVESTOR_COMPANIES_BY_TYPE.cosmetic[0],
  fashion: INVESTOR_COMPANIES_BY_TYPE.fashion[0],
};

export const INVESTOR_PROFILES: Record<
  InvestorType,
  { label: string; focus: string; description: string }
> = {
  it: {
    label: DEFAULT_INVESTOR_BY_TYPE.it.name,
    focus: "스트리밍, SNS 반응, 플랫폼 성장",
    description: DEFAULT_INVESTOR_BY_TYPE.it.description,
  },
  entertainment: {
    label: DEFAULT_INVESTOR_BY_TYPE.entertainment.name,
    focus: "음악방송, 시상식, 무대 신뢰도",
    description: DEFAULT_INVESTOR_BY_TYPE.entertainment.description,
  },
  vc: {
    label: DEFAULT_INVESTOR_BY_TYPE.vc.name,
    focus: "분기 수익, 투자 회수, 성장률",
    description: DEFAULT_INVESTOR_BY_TYPE.vc.description,
  },
  cosmetic: {
    label: DEFAULT_INVESTOR_BY_TYPE.cosmetic.name,
    focus: "비주얼 점수, 광고 전환, 브랜드 핏",
    description: DEFAULT_INVESTOR_BY_TYPE.cosmetic.description,
  },
  fashion: {
    label: DEFAULT_INVESTOR_BY_TYPE.fashion.name,
    focus: "트렌드 적합도, 스타일 임팩트, 패션 화제성",
    description: DEFAULT_INVESTOR_BY_TYPE.fashion.description,
  },
};

export const INVESTOR_CONDITIONS: Record<InvestorType, InvestorCondition[]> = {
  it: DEFAULT_INVESTOR_BY_TYPE.it.conditions,
  entertainment: DEFAULT_INVESTOR_BY_TYPE.entertainment.conditions,
  vc: DEFAULT_INVESTOR_BY_TYPE.vc.conditions,
  cosmetic: DEFAULT_INVESTOR_BY_TYPE.cosmetic.conditions,
  fashion: DEFAULT_INVESTOR_BY_TYPE.fashion.conditions,
};
