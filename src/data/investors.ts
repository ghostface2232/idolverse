import type {
  InvestorCompany,
  InvestorCondition,
  InvestorType,
} from "@/types/game";

export const INVESTOR_COMPANIES: InvestorCompany[] = [
  {
    id: "nexgen-tech",
    name: "NexGen Tech",
    type: "it",
    description:
      "Short-form analytics와 자체 플랫폼을 무기로 삼는 디지털 중심 투자사",
    fundAmount: 1800000000, // IT 자본은 초반 성장 가속을 체감시킬 만큼 크게 잡는다.
    conditions: [
      {
        id: "nexgen-followers",
        metric: "snsFollowers",
        target: 100000, // 10만 팔로워는 데뷔 후 6개월 KPI로 도전적이지만 불가능하진 않다.
        deadlineWeeks: 26, // 반년은 디지털 성장 압박을 체감하기 좋은 기준이다.
        description: "6개월 안에 주요 SNS 합산 팔로워 10만 달성",
        penalty: "디지털 마케팅 지원이 중단되고 다음 라운드 검토가 보류된다.",
      },
      {
        id: "nexgen-streams",
        metric: "spotifyStreams",
        target: 1000000, // 100만 스트리밍은 글로벌 지향 전략의 첫 관문 역할을 한다.
        deadlineWeeks: 26, // 동일 기간에 두 KPI를 묶어 플레이스타일을 선명하게 만든다.
        description: "6개월 안에 스포티파이 누적 100만 스트리밍 달성",
        penalty: "자체 플레이리스트 편성이 끊기고 성과 추적 보고가 강화된다.",
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
        description: "자체 플랫폼과 메인 배너에서 우선 노출 지원",
      },
      {
        type: "contentSubsidy",
        description: "숏폼 및 비하인드 디지털 콘텐츠 제작비 보조",
      },
    ],
    personality: "차갑고 숫자 중심적이지만, 목표를 달성하면 확실히 밀어준다.",
  },
  {
    id: "starwave-ent",
    name: "StarWave Ent.",
    type: "entertainment",
    description:
      "방송 네트워크와 선배 아티스트 자산을 활용하는 전통 엔터 계열 투자사",
    fundAmount: 1200000000, // 엔터 자본은 안정적이지만 IT/VC보다 보수적이어야 한다.
    conditions: [
      {
        id: "starwave-win",
        metric: "musicShowWin",
        target: "1위 1회", // 방송 성과 압박을 명확하게 보여주는 직관적인 목표다.
        deadlineWeeks: 52, // 1년 내 목표는 데뷔~성장 페이즈를 모두 포괄한다.
        description: "1년 안에 음악방송 1위 1회 달성",
        penalty: "방송 편성 우대가 약화되고 협업 라인이 닫힌다.",
      },
      {
        id: "starwave-award",
        metric: "awardLevel",
        target: "본상 이상", // 본상은 중견 엔터 투자사가 요구할 만한 최소 prestige 목표다.
        deadlineWeeks: 52, // 연말 시상식 사이클과 맞물리게 설정한다.
        description: "1년 안에 연말 시상식 본상 이상 수상",
        penalty: "연말 특별 무대와 외부 네트워크 협의 우선순위가 내려간다.",
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
        description: "선배 아티스트 및 사내 프로듀서 협업 차단",
      },
    ],
    bonusEffects: [
      {
        type: "broadcastPriority",
        description: "음악방송, 예능, 연말무대 편성 우대",
      },
      {
        type: "collaborationOpportunity",
        description: "기존 아티스트와 합동 콘서트 혹은 컬래버 무대 기회 제공",
      },
    ],
    personality: "관계와 전통을 중시하며, 무대 성과를 숫자보다 높게 평가한다.",
  },
  {
    id: "blue-ocean-capital",
    name: "Blue Ocean Capital",
    type: "vc",
    description:
      "회수 기간과 수익 구조를 집요하게 추적하는 공격적 성장형 펀드",
    fundAmount: 2400000000, // VC는 최고 투자금으로 강한 유혹을 줘야 한다.
    conditions: [
      {
        id: "blueocean-quarterly",
        metric: "quarterlyRevenue",
        target: "분기 보고 흑자 전환 추세", // 정밀 계산보다 플레이 감각에 맞춘 운영 목표다.
        deadlineWeeks: 13, // 분기 단위 압박이 VC 스타일의 핵심이다.
        description: "분기마다 수익 보고서 제출 및 흑자 전환 경향 증명",
        penalty: "경영 간섭이 시작되고 활동 우선순위가 왜곡된다.",
      },
      {
        id: "blueocean-payback",
        metric: "payback",
        target: "2년 내 투자금 회수", // 큰 자금에는 명확한 회수 압박이 따라와야 한다.
        deadlineWeeks: 104, // 두 해는 장기 KPI로 충분히 긴 편이지만 여전히 압박적이다.
        description: "2년 안에 초기 투자금 회수 수준의 누적 성과 달성",
        penalty: "지분 압박과 투자 회수 통보가 시작된다.",
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
    personality: "기회가 보이면 크게 베팅하지만, 감정보다 회수 속도를 우선한다.",
  },
  {
    id: "bloom-beauty",
    name: "Bloom Beauty",
    type: "cosmetic",
    description:
      "비주얼 브랜딩과 광고 전환률에 민감한 뷰티 산업 투자사",
    fundAmount: 1100000000, // 코스메틱 자금은 의미 있지만 엔터 본업보다 약간 낮게 둔다.
    conditions: [
      {
        id: "bloom-visual",
        metric: "visualAverage",
        target: 70, // 평균 70은 꾸준한 관리가 필요하지만 과도하지 않은 기준이다.
        deadlineWeeks: 52, // 1년 동안 이미지 메이킹의 장기 성과를 보게 만든다.
        description: "1년 동안 멤버 비주얼 평균 70 이상 유지",
        penalty: "브랜드 이미지 불일치로 협찬과 제작 지원이 축소된다.",
      },
      {
        id: "bloom-model",
        metric: "adContract",
        target: "자사 모델 계약 1건", // 명확한 광고 연결 목표가 뷰티 투자사의 성격을 드러낸다.
        deadlineWeeks: 52, // 데뷔 후 1년 안에 첫 광고 계약을 유도한다.
        description: "1년 안에 자사 광고 모델 계약 체결",
        penalty: "광고가 파기되고 위약금이 발생한다.",
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
        description: "뷰티 콘텐츠와 메이크업 브랜드 협업 지원",
      },
      {
        type: "globalBeautySupport",
        description: "해외 뷰티 유통망과 연동한 글로벌 인지도 강화",
      },
    ],
    personality: "결과보다 이미지 완성도를 집요하게 보며, 브랜드 핏에 매우 민감하다.",
  },
  {
    id: "mode-group",
    name: "MODE Group",
    type: "fashion",
    description:
      "트렌드 적합도와 스타일 파급력을 중시하는 패션 하우스 계열 파트너",
    fundAmount: 1000000000, // 패션 자본은 현금보다는 네트워크 가치가 더 중요해야 한다.
    conditions: [
      {
        id: "mode-trend",
        metric: "trendFit",
        target: 75, // 높은 트렌드 적합도는 시즌 읽기와 콘셉트 운영을 강제한다.
        deadlineWeeks: 39, // 패션 시즌 흐름을 반영해 3개 분기 안에 성과를 보게 만든다.
        description: "패션 트렌드 적합도 75 이상 유지",
        penalty: "메인 스타일리스트 지원과 쇼 초청 기회가 축소된다.",
      },
      {
        id: "mode-style",
        metric: "styleScore",
        target: 72, // 비주얼/스타일 평균 72는 코스메틱보다 약간 높은 패션 기준이다.
        deadlineWeeks: 39, // 패션 쪽은 빠른 시즌 대응이 중요하므로 1년보다 짧게 둔다.
        description: "비주얼 및 스타일 점수 평균 72 이상 유지",
        penalty: "프리미엄 스타일링 라인과 촬영 협업이 끊긴다.",
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
        description: "시즌 전담 스타일리스트 및 화보 콘셉트 패키지 제공",
      },
    ],
    personality: "수치보다 분위기와 화제성을 읽지만, 시즌 감각이 떨어지면 냉정하게 손을 뗀다.",
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
    focus: "디지털 KPI, 바이럴 지표, 플랫폼 성장",
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
