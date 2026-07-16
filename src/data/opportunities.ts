import type {
  GamePhase,
  WeeklyDecisionOption,
} from "@/types/game";

export type OpportunityDefinitionId =
  | "variety-offer"
  | "advertising-offer"
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
  options: readonly WeeklyDecisionOption[];
}

/**
 * 수락 선택지만 데이터로 둔다. 거절은 옵션이 아니라 "미선택 후 주간 종료"이며
 * 아무 효과도 적용하지 않는다. 모든 수락안은 즉시 보상과 이번 주 기회비용을 함께 쓴다.
 */
export const OPPORTUNITY_DEFINITIONS: readonly OpportunityDefinition[] = [
  {
    id: "variety-offer",
    category: "예능 섭외",
    title: "신인 관찰 예능의 러브콜",
    summary: "제작진이 팀의 낯선 매력을 짧은 코너에서 시험해 보고 싶어 한다.",
    triggerDescription: "방송 제작진의 이번 주 한정 출연 제안",
    phases: ["training", "debut", "growth"],
    options: [
      {
        id: "accept-live-recording",
        label: "바로 녹화에 들어간다",
        description: "준비보다 현장감을 살려 대중에게 얼굴을 알린다.",
        tradeoff: "대중 인지도 +5 · 이번 주 팀 훈련 스킵 · 스트레스 +7",
        effects: { public: 5, stress: 7, condition: -4 },
        activityOverride: "entertainment",
      },
      {
        id: "send-variety-line",
        label: "예능 담당만 보낸다",
        description: "노출은 줄이고 일부 멤버만 촬영에 투입한다.",
        tradeoff: "대중 인지도 +3 · 이번 주 개인 일정 전환 · 팀 케미 기회 포기",
        effects: { public: 3, stress: 3, chemistry: -2 },
        activityOverride: "individual",
      },
    ],
  },
  {
    id: "advertising-offer",
    category: "광고 제안",
    title: "급상승 브랜드의 단기 캠페인",
    summary: "화제성이 높은 브랜드가 빠른 계약과 이번 주 촬영을 조건으로 제안했다.",
    triggerDescription: "브랜드 캠페인 슬롯이 이번 주에만 유효",
    phases: ["debut", "growth", "peak"],
    options: [
      {
        id: "sign-campaign",
        label: "팀 광고를 수락한다",
        description: "전원을 캠페인 얼굴로 내세워 현금과 인지도를 확보한다.",
        tradeoff: "자금 +3,000만 · 대중 인지도 +3 · 이번 주 팀 훈련 스킵",
        effects: { money: 30_000_000, public: 3, stress: 6, fandomDisappointment: 3 },
        activityOverride: "entertainment",
      },
      {
        id: "limit-campaign",
        label: "소수 멤버 계약으로 줄인다",
        description: "수익을 낮추는 대신 팀 전체 일정의 충격을 줄인다.",
        tradeoff: "자금 +1,500만 · 이번 주 개인 일정 전환 · 인기 격차 위험",
        effects: { money: 15_000_000, public: 2, satisfaction: -2 },
        activityOverride: "individual",
      },
    ],
  },
  {
    id: "collaboration-offer",
    category: "콜라보",
    title: "해외 아티스트의 깜짝 협업",
    summary: "짧은 준비 기간을 감수하면 새로운 시장에 팀 이름을 각인할 수 있다.",
    triggerDescription: "해외 파트너의 일정 공백과 맞은 일회성 제안",
    phases: ["growth", "peak"],
    options: [
      {
        id: "join-collaboration",
        label: "협업 무대에 합류한다",
        description: "완성도보다 확장성을 택해 공동 무대를 준비한다.",
        tradeoff: "해외 팬덤 +6 · 업계 평판 +3 · 제작비 1,000만 · 이번 주 훈련 스킵",
        effects: { global: 6, industry: 3, money: -10_000_000, stress: 5 },
        activityOverride: "entertainment",
      },
      {
        id: "send-unit",
        label: "유닛만 참여시킨다",
        description: "팀 일정은 지키면서 협업의 발판만 확보한다.",
        tradeoff: "해외 팬덤 +3 · 업계 평판 +2 · 이번 주 개인 일정 전환",
        effects: { global: 3, industry: 2, satisfaction: -1 },
        activityOverride: "individual",
      },
    ],
  },
  {
    id: "viral-cover",
    category: "바이럴",
    title: "커버 영상이 알고리즘을 탔다",
    summary: "연습실 클립의 반응이 커지고 있다. 관심이 식기 전에 후속 영상을 낼 수 있다.",
    triggerDescription: "커버 영상의 비정상적인 조회 상승 감지",
    phases: ["training", "debut", "growth"],
    options: [
      {
        id: "publish-follow-up",
        label: "48시간 안에 후속편 공개",
        description: "완성도보다 속도를 택해 알고리즘의 흐름을 이어 간다.",
        tradeoff: "대중 인지도 +5 · 해외 팬덤 +3 · 이번 주 팀 훈련 스킵",
        effects: { public: 5, global: 3, stress: 5, condition: -3 },
        activityOverride: "entertainment",
      },
      {
        id: "polish-cover",
        label: "멤버 유닛으로 다듬는다",
        description: "확산 속도는 포기하고 팀 색이 보이는 버전으로 만든다.",
        tradeoff: "대중 인지도 +2 · 코어 팬덤 +2 · 이번 주 개인 일정 전환",
        effects: { public: 2, fandom: 2, stress: 2 },
        activityOverride: "individual",
      },
    ],
  },
  {
    id: "rival-comeback-overlap",
    category: "라이벌 대응",
    title: "{{rival}} 컴백과 일정이 겹쳤다",
    summary: "같은 주의 관심을 두고 경쟁하게 됐다. 맞붙거나, 숨거나, 다른 문법을 택할 수 있다.",
    triggerDescription: "{{rival}}의 컴백 발표 감지",
    phases: ["debut", "growth", "peak"],
    requiresRivalComeback: true,
    options: [
      {
        id: "face-head-on",
        label: "정면 승부한다",
        description: "비교 화제성을 노리고 같은 타이밍에 공격적으로 노출한다.",
        tradeoff: "대중 인지도 +6 · 코어 팬덤 +3 · 이번 주 훈련 스킵 · 스트레스 +8",
        effects: { public: 6, fandom: 3, stress: 8, condition: -5 },
        activityOverride: "entertainment",
      },
      {
        id: "delay-schedule",
        label: "핵심 일정을 한 박자 늦춘다",
        description: "당장의 관심을 양보하고 멤버 컨디션과 완성도를 지킨다.",
        tradeoff: "컨디션 +6 · 만족도 +2 · 대중 인지도 -2 · 이번 주 회복 전환",
        effects: { condition: 6, satisfaction: 2, public: -2 },
        activityOverride: "rest",
      },
      {
        id: "differentiate-concept",
        label: "차별화 콘텐츠를 긴급 제작한다",
        description: "상대가 강한 문법을 피하고 별도의 팬 접점을 만든다.",
        tradeoff: "해외 팬덤 +3 · 업계 평판 +2 · 제작비 800만 · 이번 주 개인 일정 전환",
        effects: { global: 3, industry: 2, money: -8_000_000, stress: 3 },
        activityOverride: "individual",
      },
    ],
  },
] as const;
