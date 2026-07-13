import type { WeeklyDecision } from "@/types/game";

export const WEEKLY_DECISION_POOL: WeeklyDecision[] = [
  {
    id: "training-focus",
    category: "훈련",
    title: "이번 주 훈련 방향",
    summary: "제한된 연습 에너지를 어디에 집중할지 결정한다.",
    options: [
      {
        id: "vocals",
        label: "보컬 집중 훈련",
        description: "보컬 실력과 녹음 안정성을 끌어올린다.",
        tradeoff: "스트레스가 오르고 댄스 성장이 느려진다.",
        effects: { vocal: 5, stress: 4, dance: -2 },
      },
      {
        id: "dance",
        label: "안무 합동 연습",
        description: "무대 포메이션과 팀 호흡을 다진다.",
        tradeoff: "보컬 체력과 회복 시간이 줄어든다.",
        effects: { dance: 5, chemistry: 3, condition: -2 },
      },
      {
        id: "rest",
        label: "컨디션 회복 주간",
        description: "컨디션과 번아웃 관리를 우선한다.",
        tradeoff: "실력 성장과 화제성이 모두 느려진다.",
        effects: { condition: 7, stress: -5, public: -1 },
      },
    ],
  },
  {
    id: "budget-allocation",
    category: "재정",
    title: "예산 배분",
    summary: "자금 여유가 없다. 하나를 밀면 다른 쪽이 비어진다.",
    options: [
      {
        id: "song",
        label: "데모 곡 추가 투자",
        description: "타이틀곡 후보 풀의 경쟁력을 높인다.",
        tradeoff: "자금 여유가 즉시 줄어든다.",
        effects: { albumSong: 8, money: -25000000 },
      },
      {
        id: "marketing",
        label: "SNS 광고 집행",
        description: "컴백 전 대중 인지도를 미리 끌어올린다.",
        tradeoff: "곡 완성도와 예비 자금이 희생된다.",
        effects: { public: 4, money: -18000000, albumSong: -2 },
      },
      {
        id: "reserve",
        label: "예비비 확보",
        description: "운영 안정성과 미래 유연성을 지킨다.",
        tradeoff: "이번 주 성장 모멘텀이 멈춘다.",
        effects: { money: 0, public: -1, albumMarketing: -2 },
      },
    ],
  },
  {
    id: "member-schedule",
    category: "스케줄",
    title: "멤버 개별 스케줄 요청",
    summary: "한 멤버에게 이번 주 높은 노출 기회가 들어왔다.",
    options: [
      {
        id: "variety",
        label: "예능 출연",
        description: "해당 멤버의 캐릭터성으로 화제성을 노린다.",
        tradeoff: "해당 멤버는 팀 연습에 참여하지 못한다.",
        effects: { public: 5, chemistry: -2, condition: -1 },
      },
      {
        id: "keep-team",
        label: "팀 연습 유지",
        description: "그룹 중심으로 팀 리듬을 지킨다.",
        tradeoff: "단기 노출 기회를 놓친다.",
        effects: { chemistry: 4, public: -2 },
      },
      {
        id: "solo-lesson",
        label: "개인 레슨",
        description: "전문 포지션 역량을 집중 강화한다.",
        tradeoff: "나머지 멤버들의 지원이 줄어든다.",
        // 멤버 개별 타게팅 미구현 — 전문 역량 강화를 보컬/댄스 분할로 근사
        effects: { vocal: 2, dance: 2, chemistry: -1, money: -6000000 },
      },
    ],
  },
  {
    id: "seasonal-concept",
    category: "콘셉트",
    title: "시즌 콘셉트 방향",
    summary: "시장이 움직이고 있다. 팬이 다음에 느낄 것을 고른다.",
    seasons: ["spring", "summer", "fall", "winter"],
    options: [
      {
        id: "safe",
        label: "기존 노선 유지",
        description: "코어 팬덤에게 안정감을 준다.",
        tradeoff: "대중의 신선함은 제한된다.",
        effects: { fandomLoyalty: 4, public: -1 },
      },
      {
        id: "bridge",
        label: "점진적 전환",
        description: "새로운 정체성으로 자연스럽게 넘어간다.",
        tradeoff: "즉각적인 지표 급등은 없다.",
        effects: { fandomLoyalty: 2, industry: 1, public: 1 },
      },
      {
        id: "shock",
        label: "파격 변신",
        description: "급진적인 전환으로 화제성을 노린다.",
        tradeoff: "콘셉트가 안 먹히면 팬 실망이 커진다.",
        effects: { public: 5, fandomDisappointment: 4, industry: -1 },
      },
    ],
  },
];
