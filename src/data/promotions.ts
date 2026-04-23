import type { PromotionActivity } from "@/types/game";

export const PROMOTION_ACTIVITIES: PromotionActivity[] = [
  {
    id: "musicShow",
    name: "음악방송 출연",
    cost: 0, // 음악방송은 직접 비용보다 준비 리소스 소모가 더 큰 활동이다.
    duration: 1, // 주 단위 루프에서 1주 슬롯으로 보는 편이 관리하기 쉽다.
    successFactors: ["vocal", "dance", "visual"],
    effects: {
      public: 5,
      fandom: 2,
      industry: 1,
    },
    requirements: {
      phase: "debut+",
    },
  },
  {
    id: "varietyShow",
    name: "예능 출연",
    cost: 0, // 예능은 현금 비용보다 기회비용이 핵심이다.
    duration: 1, // 한 주간의 집중 스케줄로 처리하는 것이 의사결정에 명확하다.
    successFactors: ["charm"],
    effects: {
      public: 8,
      fandom: -1,
    },
    requirements: {
      phase: "debut+",
    },
    sideEffect: "해당 멤버는 이번 주 그룹 훈련에 제대로 참여하지 못한다.",
  },
  {
    id: "youtubeContent",
    name: "유튜브 콘텐츠",
    cost: 500, // 저비용 반복 루프로 팬덤 관리를 가능하게 한다.
    duration: 1, // 짧게 반복 가능한 활동으로 둬야 활용도가 높다.
    successFactors: ["charm", "visualStyle"],
    effects: {
      fandom: 3,
      global: 2,
    },
    requirements: {
      phase: "training+",
    },
  },
  {
    id: "fanSign",
    name: "팬사인회",
    cost: 1000, // 오프라인 운영비가 들어가므로 무상 활동보다 약간 비싸게 둔다.
    duration: 1, // 짧은 단기 팬 관리 루프에 적합하다.
    effects: {
      fandom: 5,
      fandomLoyalty: 3,
    },
    requirements: {
      phase: "debut+",
      minFandom: 15, // 팬풀 없는 상태에서 팬사인회는 의미가 약하다.
    },
  },
  {
    id: "liveBroadcast",
    name: "라이브 방송",
    cost: 0, // 라이브는 가장 접근성 높은 팬 소통 수단으로 둔다.
    duration: 1, // 한 주에 한 번 넣기 쉬운 단기 액션이다.
    successFactors: ["charm"],
    effects: {
      fandom: 2,
      global: 1,
    },
    requirements: {
      phase: "training+",
    },
  },
  {
    id: "fanCafeEvent",
    name: "팬카페 이벤트",
    cost: 300, // 작은 운영비는 들지만 반복 가능한 충성도 유지 수단이어야 한다.
    duration: 1, // 짧게 소화 가능한 활동으로 남긴다.
    effects: {
      fandomLoyalty: 5,
    },
    requirements: {
      phase: "training+",
      minFandom: 10, // 팬 커뮤니티가 아주 작은 상태에서는 효율이 떨어진다.
    },
  },
  {
    id: "smallConcert",
    name: "콘서트 - 소극장",
    cost: 15000, // 소극장은 첫 유료 라이브 단계로 부담을 제한한다.
    duration: 2, // 준비와 후속 회복까지 고려하면 2주가 적절하다.
    effects: {
      fandom: 8,
      fandomLoyalty: 6,
      public: 2,
    },
    requirements: {
      phase: "growth+",
      minFandom: 35, // 최소한의 티켓 수요가 필요하다.
    },
    income: 26000, // 작지만 확실한 흑자를 보여주는 단계다.
  },
  {
    id: "midConcert",
    name: "콘서트 - 중극장",
    cost: 45000, // 중극장은 운영이 본격적으로 무거워져야 한다.
    duration: 2, // 여전히 짧은 투어 단위로 처리할 수 있게 한다.
    effects: {
      fandom: 12,
      fandomLoyalty: 8,
      public: 4,
      industry: 2,
    },
    requirements: {
      phase: "growth+",
      minFandom: 50, // 중극장은 명확한 코어 팬덤을 요구한다.
    },
    income: 72000, // 중형 공연은 자금 회수 체감이 있어야 한다.
  },
  {
    id: "largeConcert",
    name: "콘서트 - 대극장",
    cost: 120000, // 대극장은 큰 자금 묶임을 통해 리스크를 체감시킨다.
    duration: 3, // 준비 기간이 길어져 다른 활동을 희생하게 만든다.
    effects: {
      fandom: 18,
      fandomLoyalty: 10,
      public: 6,
      industry: 5,
    },
    requirements: {
      phase: "peak",
      minFandom: 70, // 대극장은 상위권 팬덤 규모를 전제로 한다.
      minIndustry: 50, // 운영 역량에 대한 업계 신뢰도도 요구한다.
    },
    income: 190000, // 성공 시 큰 현금 흐름을 주어 도박할 이유를 만든다.
  },
  {
    id: "domeConcert",
    name: "콘서트 - 돔",
    cost: 300000, // 돔은 명백한 엔드게임급 베팅이어야 한다.
    duration: 4, // 긴 준비 기간이 다른 의사결정을 압박하게 한다.
    effects: {
      fandom: 28,
      fandomLoyalty: 14,
      public: 10,
      industry: 8,
      global: 6,
    },
    requirements: {
      phase: "peak",
      minFandom: 85, // 돔은 최상위 팬덤 체급일 때만 도전 가능해야 한다.
      minIndustry: 65, // 신뢰도 없는 돔 공연은 설득력이 떨어진다.
    },
    income: 520000, // 리스크에 상응하는 대형 보상을 제공한다.
  },
];
