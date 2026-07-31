import type {
  GamePhase,
  WeeklyDecisionOption,
} from "@/types/game";

export type OpportunityDefinitionId =
  | "variety-offer"
  | "advertising-offer"
  | "self-content-sponsor"
  | "fan-sign-tour"
  | "ost-offer"
  | "drama-casting"
  | "annual-ambassador"
  | "brand-exclusive-model"
  | "collaboration-offer"
  | "viral-cover"
  | "rival-comeback-overlap";

export interface OpportunityDefinition {
  id: OpportunityDefinitionId;
  category: string;
  title: string;
  summary: string;
  triggerDescription: string;
  phases: readonly GamePhase[];
  requiresRivalComeback?: boolean;
  minPublic?: number;
  minFandom?: number;
  minGlobal?: number;
  minIndustry?: number;
  minBestChartRank?: number;
  requiresReleasedAlbum?: boolean;
  /** 해당 정의로 체결한 계약이 진행 중이면 같은 제안을 다시 내지 않는다. */
  uniqueWhileActive?: boolean;
  options: readonly WeeklyDecisionOption[];
}

/**
 * 수락 선택지만 데이터로 둔다. 거절은 옵션이 아니라 "미선택 후 주간 종료"이며
 * 아무 효과도 적용하지 않는다. 모든 수락안은 즉시 보상과 이번 주 기회비용을 함께 쓴다.
 * tradeoff에는 내부 효과 수치를 그대로 적지 않는다 — 계약금·제작비 같은
 * 실제 금액만 밝히고, 나머지는 어느 쪽에 좋고 나쁜지만 전한다.
 */
export const OPPORTUNITY_DEFINITIONS: readonly OpportunityDefinition[] = [
  {
    id: "variety-offer",
    category: "예능 섭외",
    title: "신인 관찰 예능의 러브콜",
    summary: "제작진이 팀의 낯선 매력을 짧은 코너에서 시험해 보고 싶어 합니다.",
    triggerDescription: "방송 제작진의 이번 주 한정 출연 제안",
    phases: ["training", "debut", "growth"],
    options: [
      {
        id: "accept-live-recording",
        label: "바로 녹화에 들어간다",
        description: "준비보다 현장감을 살려 대중에게 얼굴을 알립니다.",
        tradeoff:
          "대중에게 얼굴을 알릴 기회지만, 이번 주 팀 훈련을 걸러야 하고 멤버들 피로가 눈에 띄게 쌓입니다.",
        effects: { public: 5, stress: 7, condition: -4 },
        activityOverride: "entertainment",
      },
      {
        id: "send-variety-line",
        label: "예능 담당만 보낸다",
        description: "노출은 줄이고 일부 멤버만 촬영에 투입합니다.",
        tradeoff:
          "노출 효과는 줄어드는 대신 부담이 적습니다. 다녀오는 멤버는 이번 주 팀 합동 연습에서 빠집니다.",
        effects: { public: 3, stress: 3, chemistry: -2 },
        targetSelection: {
          label: "출연할 예능 담당",
          min: 1,
          max: 1,
        },
        activityOverride: "individual",
      },
    ],
  },
  {
    id: "advertising-offer",
    category: "광고 제안",
    title: "급상승 브랜드의 단기 캠페인",
    summary: "화제성이 높은 브랜드가 빠른 계약과 이번 주 촬영을 조건으로 제안해 왔습니다.",
    triggerDescription: "브랜드 캠페인 슬롯이 이번 주에만 유효",
    phases: ["debut", "growth", "peak"],
    options: [
      {
        id: "sign-campaign",
        label: "팀 광고를 수락한다",
        description: "전원을 캠페인 얼굴로 내세워 현금과 인지도를 확보합니다.",
        tradeoff:
          "계약금 3000만 원이 바로 들어오지만, 이번 주 팀 훈련을 접어야 하고 잦은 상업 행보에 팬덤 일부가 실망할 수 있습니다.",
        effects: { money: 30_000_000, public: 3, stress: 6, fandomDisappointment: 3 },
        activityOverride: "entertainment",
      },
      {
        id: "limit-campaign",
        label: "소수 멤버 계약으로 줄인다",
        description: "수익을 낮추는 대신 팀 전체 일정의 충격을 줄입니다.",
        tradeoff:
          "계약금은 1500만 원으로 줄지만 팀 일정은 지킵니다. 참여하지 못한 멤버들 사이에 서운함이 남을 수 있습니다.",
        effects: { money: 15_000_000, public: 2, satisfaction: -2 },
        targetSelection: {
          label: "광고에 참여할 멤버",
          min: 1,
          max: 2,
        },
        activityOverride: "individual",
      },
    ],
  },
  {
    id: "self-content-sponsor",
    category: "자체 콘텐츠",
    title: "웹예능 제작 지원 제안",
    summary: "콘텐츠 플랫폼이 팀의 일상을 담는 자체 예능에 제작비와 협찬을 제안했습니다.",
    triggerDescription: "온라인 반응과 팬 체류 시간이 자체 콘텐츠 기준을 넘김",
    phases: ["debut", "growth", "peak"],
    minFandom: 12,
    uniqueWhileActive: true,
    options: [
      {
        id: "produce-season",
        label: "8부작 시즌을 제작한다",
        description: "매주 공개할 자체 예능으로 팬과 꾸준히 만납니다.",
        tradeoff:
          "8주 동안 매주 협찬 수입 250만 원을 받습니다. 촬영이 이어져 멤버들의 피로도 함께 쌓입니다.",
        effects: { fandom: 3, stress: 4 },
        contractOffer: {
          kind: "content",
          title: "자체 웹예능 시즌 협찬",
          durationWeeks: 8,
          weeklyIncome: 2_500_000,
        },
        activityOverride: "entertainment",
      },
      {
        id: "produce-pilot",
        label: "파일럿만 먼저 공개한다",
        description: "한 편으로 반응을 확인하고 팬 접점을 넓힙니다.",
        tradeoff: "제작 지원금 800만 원을 받고 이번 주 촬영에 집중합니다.",
        effects: { money: 8_000_000, fandom: 2, stress: 2 },
        activityOverride: "entertainment",
      },
    ],
  },
  {
    id: "fan-sign-tour",
    category: "팬 이벤트",
    title: "유통사의 팬사인회 투어 제안",
    summary: "앨범 유통사가 활동 종료 뒤에도 주요 도시에서 팬들과 만나는 자리를 제안했습니다.",
    triggerDescription: "코어 팬덤과 최근 앨범 구매력이 팬 이벤트 기준을 넘김",
    phases: ["debut", "growth", "peak"],
    minFandom: 20,
    requiresReleasedAlbum: true,
    options: [
      {
        id: "accept-fan-sign-tour",
        label: "주말 팬사인회를 연다",
        description: "팬들과 직접 만나 결속과 판매 뒷심을 높입니다.",
        tradeoff:
          "행사 수입 1200만 원을 얻고 코어 팬덤이 단단해집니다. 이번 주 휴식 시간은 줄어듭니다.",
        effects: { money: 12_000_000, fandom: 3, stress: 3, condition: -2 },
        activityOverride: "entertainment",
      },
    ],
  },
  {
    id: "ost-offer",
    category: "OST",
    title: "화제 드라마의 OST 가창 제안",
    summary: "음악감독이 팀의 음색과 드라마의 주요 장면이 잘 맞는다고 판단했습니다.",
    triggerDescription: "음원 성적과 업계 평판이 OST 제작진의 섭외 기준을 통과",
    phases: ["debut", "growth", "peak"],
    minIndustry: 24,
    minBestChartRank: 60,
    requiresReleasedAlbum: true,
    uniqueWhileActive: true,
    options: [
      {
        id: "record-ost",
        label: "OST를 녹음한다",
        description: "드라마 방영 동안 음원 수입과 새로운 대중 접점을 만듭니다.",
        tradeoff:
          "계약금 1500만 원과 12주간 매주 음원 수입 180만 원을 받습니다. 녹음 준비로 이번 주 팀 훈련을 거릅니다.",
        effects: { money: 15_000_000, public: 3, industry: 2, stress: 4 },
        contractOffer: {
          kind: "ost",
          title: "드라마 OST 음원 계약",
          durationWeeks: 12,
          weeklyIncome: 1_800_000,
        },
        activityOverride: "individual",
      },
    ],
  },
  {
    id: "drama-casting",
    category: "드라마",
    title: "주말 드라마 조연 오디션 제안",
    summary: "캐스팅팀이 대중에게 얼굴을 알린 멤버 한 명을 조연 후보로 보고 있습니다.",
    triggerDescription: "대중 인지도와 업계 신뢰가 드라마 캐스팅 기준을 통과",
    phases: ["growth", "peak"],
    minPublic: 42,
    minIndustry: 30,
    uniqueWhileActive: true,
    options: [
      {
        id: "accept-drama-role",
        label: "멤버 한 명을 출연시킨다",
        description: "개인 활동으로 팀의 대중 접점을 넓힙니다.",
        tradeoff:
          "출연료 2000만 원과 10주간 매주 300만 원을 받습니다. 출연 멤버는 이번 주 팀 연습에서 빠집니다.",
        effects: { money: 20_000_000, public: 4, industry: 2, stress: 5 },
        contractOffer: {
          kind: "acting",
          title: "주말 드라마 조연 출연",
          durationWeeks: 10,
          weeklyIncome: 3_000_000,
        },
        targetSelection: { label: "출연할 멤버", min: 1, max: 1 },
        activityOverride: "individual",
      },
    ],
  },
  {
    id: "annual-ambassador",
    category: "앰배서더",
    title: "라이프스타일 브랜드 연간 앰배서더",
    summary: "브랜드가 팀의 넓어진 인지도와 팬 반응을 보고 1년 파트너십을 제안했습니다.",
    triggerDescription: "대중 인지도와 코어 팬덤이 연간 앰배서더 기준을 통과",
    phases: ["growth", "peak"],
    minPublic: 55,
    minFandom: 35,
    minIndustry: 30,
    uniqueWhileActive: true,
    options: [
      {
        id: "sign-ambassador",
        label: "연간 앰배서더가 된다",
        description: "브랜드 행사와 캠페인에 꾸준히 참여합니다.",
        tradeoff:
          "계약금 5000만 원과 52주간 매주 250만 원을 받습니다. 상업 일정이 늘어 팬들의 시선을 살펴야 합니다.",
        effects: { money: 50_000_000, public: 3, industry: 3, stress: 4, fandomDisappointment: 2 },
        contractOffer: {
          kind: "ambassador",
          title: "라이프스타일 브랜드 연간 앰배서더",
          durationWeeks: 52,
          weeklyIncome: 2_500_000,
        },
        activityOverride: "entertainment",
      },
    ],
  },
  {
    id: "brand-exclusive-model",
    category: "전속 모델",
    title: "대형 브랜드 전속 모델 계약",
    summary: "검증된 화제성과 구매력을 바탕으로 단독 광고 모델 제안이 들어왔습니다.",
    triggerDescription: "최상위 인지도·팬덤·업계 평판이 전속 모델 심사를 통과",
    phases: ["peak"],
    minPublic: 72,
    minFandom: 50,
    minIndustry: 55,
    minBestChartRank: 20,
    uniqueWhileActive: true,
    options: [
      {
        id: "sign-exclusive-model",
        label: "브랜드의 얼굴이 된다",
        description: "대규모 캠페인과 연간 모델 활동을 맡습니다.",
        tradeoff:
          "계약금 1억 5000만 원과 52주간 매주 500만 원을 받습니다. 경쟁 브랜드 제안은 계약 기간 동안 받을 수 없습니다.",
        effects: { money: 150_000_000, public: 4, industry: 5, stress: 6 },
        contractOffer: {
          kind: "brand-exclusive",
          title: "대형 브랜드 전속 모델",
          durationWeeks: 52,
          weeklyIncome: 5_000_000,
        },
        activityOverride: "entertainment",
      },
    ],
  },
  {
    id: "collaboration-offer",
    category: "콜라보",
    title: "해외 아티스트의 깜짝 협업",
    summary: "짧은 준비 기간을 감수하면 새로운 시장에 팀 이름을 각인할 수 있습니다.",
    triggerDescription: "해외 파트너의 일정 공백과 맞은 일회성 제안",
    phases: ["growth", "peak"],
    options: [
      {
        id: "join-collaboration",
        label: "협업 무대에 합류한다",
        description: "완성도보다 확장성을 택해 공동 무대를 준비합니다.",
        tradeoff:
          "해외 반응과 업계 평판에 보탬이 되지만, 제작비 1000만 원이 들고 이번 주 훈련을 걸러야 합니다.",
        effects: { global: 6, industry: 3, money: -10_000_000, stress: 5 },
        activityOverride: "entertainment",
      },
      {
        id: "send-unit",
        label: "유닛만 참여시킨다",
        description: "팀 일정은 지키면서 협업의 발판만 확보합니다.",
        tradeoff:
          "부담을 줄이는 대신 효과도 제한적입니다. 참여 멤버는 이번 주 개인 일정으로 움직입니다.",
        effects: { global: 3, industry: 2, satisfaction: -1 },
        targetSelection: {
          label: "협업 유닛 멤버",
          min: 2,
          max: 3,
        },
        activityOverride: "individual",
      },
    ],
  },
  {
    id: "viral-cover",
    category: "바이럴",
    title: "커버 영상이 알고리즘을 탔다",
    summary: "연습실 클립의 반응이 커지고 있습니다. 관심이 식기 전에 후속 영상을 낼 수 있습니다.",
    triggerDescription: "커버 영상의 비정상적인 조회 상승 감지",
    phases: ["training", "debut", "growth"],
    options: [
      {
        id: "publish-follow-up",
        label: "48시간 안에 후속편 공개",
        description: "완성도보다 속도를 택해 알고리즘의 흐름을 이어 갑니다.",
        tradeoff:
          "흐름을 타면 국내외에 얼굴을 알릴 수 있지만, 이번 주 팀 훈련을 걸러야 하는 강행군입니다.",
        effects: { public: 5, global: 3, stress: 5, condition: -3 },
        activityOverride: "entertainment",
      },
      {
        id: "polish-cover",
        label: "멤버 유닛으로 다듬는다",
        description: "확산 속도는 포기하고 팀 색이 보이는 버전으로 만듭니다.",
        tradeoff:
          "확산력은 덜해도 팀의 색을 기억하는 팬이 남습니다. 참여 멤버는 이번 주 개인 일정으로 움직입니다.",
        effects: { public: 2, fandom: 2, stress: 2 },
        targetSelection: {
          label: "커버 유닛 멤버",
          min: 2,
          max: 3,
        },
        activityOverride: "individual",
      },
    ],
  },
  {
    id: "rival-comeback-overlap",
    category: "라이벌 대응",
    title: "{{rival}} 컴백과 일정이 겹쳤다",
    summary: "같은 주의 관심을 두고 경쟁하게 됐습니다. 맞붙거나, 피하거나, 다른 문법을 택할 수 있습니다.",
    triggerDescription: "{{rival}}의 컴백 발표 감지",
    phases: ["debut", "growth", "peak"],
    requiresRivalComeback: true,
    options: [
      {
        id: "face-head-on",
        label: "정면 승부한다",
        description: "비교 화제성을 노리고 같은 타이밍에 공격적으로 노출합니다.",
        tradeoff:
          "화제성을 크게 노릴 수 있지만 멤버들에게는 상당한 강행군입니다. 이번 주 훈련은 접어야 합니다.",
        effects: { public: 6, fandom: 3, stress: 8, condition: -5 },
        activityOverride: "entertainment",
      },
      {
        id: "delay-schedule",
        label: "핵심 일정을 한 박자 늦춘다",
        description: "당장의 관심을 양보하고 멤버 컨디션과 완성도를 지킵니다.",
        tradeoff:
          "멤버들이 숨을 돌리고 완성도를 지키는 대신, 이번 주의 관심은 상대에게 내줍니다.",
        effects: { condition: 6, satisfaction: 2, public: -2 },
        activityOverride: "rest",
      },
      {
        id: "differentiate-concept",
        label: "차별화 콘텐츠를 긴급 제작한다",
        description: "상대가 강한 문법을 피하고 별도의 팬 접점을 만듭니다.",
        tradeoff:
          "제작비 800만 원을 들여 해외와 업계 쪽 접점을 넓힙니다. 참여 멤버는 이번 주 개인 일정으로 전환됩니다.",
        effects: { global: 3, industry: 2, money: -8_000_000, stress: 3 },
        activityOverride: "individual",
      },
    ],
  },
] as const;
