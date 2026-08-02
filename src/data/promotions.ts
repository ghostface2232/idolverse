import type { PromotionActivity } from "@/types/game";

// cost·income 단위: 만 원 — promotionSystem의 COST_UNIT(10000)을 곱해 원화로 환산한다.

export const PROMOTION_ACTIVITIES: PromotionActivity[] = [
  {
    id: "musicShow",
    name: "음악방송 출연",
    cost: 0, // 음악방송은 직접 비용보다 준비 리소스 소모가 더 큰 활동이다.
    duration: 1, // 주 단위 루프에서 1주 슬롯으로 보는 편이 관리하기 쉽다.
    successFactors: ["vocal", "dance", "visual"],
    effects: {
      public: 3,
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
      public: 5,
      fandom: -1,
    },
    requirements: {
      phase: "debut+",
    },
    sideEffect: "해당 멤버는 이번 주 그룹 훈련에 제대로 참여하지 못합니다. 대중 노출은 커지지만 코어 팬 일부는 예능 소모를 반기지 않습니다.",
  },
  {
    id: "youtubeContent",
    name: "자체 콘텐츠 촬영",
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
    income: 800, // 광고 수익 몫. 제작비를 살짝 웃도는 소액이라 콘텐츠 남발의 이유는 못 된다.
  },
  {
    id: "fanSign",
    name: "팬사인회",
    cost: 1000, // 오프라인 운영비가 들어가므로 무상 활동보다 약간 비싸게 둔다.
    duration: 1, // 짧은 단기 팬 관리 루프에 적합하다.
    effects: {
      fandom: 4,
      fandomLoyalty: 3,
    },
    requirements: {
      phase: "debut+",
      minFandom: 15, // 팬풀 없는 상태에서 팬사인회는 의미가 약하다.
    },
    // 응모권이 붙은 음반 판매 몫. 콘서트 해금(growth) 전 유일한 유료
    // 회수 수단이라 소폭 흑자를 보장하되, 남발은 상업 활동 연속
    // 판정(EXCESSIVE_COMMERCIAL_STREAK_WEEKS)이 막는다.
    income: 1600,
  },
  {
    id: "liveBroadcast",
    name: "팬 커뮤니티 라이브",
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
    // 활동기 긴급 개입 1: 음악방송 1위 대결의 팬투표 축을 이번 주에 밀어
    // 올린다(weekProcessor가 fanRally 주문을 감지해 투표 보너스를 싣는다).
    // 차트 리빌을 본 뒤 "이번 주 승부수"로 당기는 레버다.
    id: "fanRally",
    name: "팬덤 총공 지휘",
    cost: 800,
    duration: 1,
    successFactors: ["teamwork"],
    effects: {
      fandomLoyalty: 3,
      stress: 2,
    },
    requirements: {
      phase: "debut+",
      minFandom: 15,
    },
    sideEffect: "이번 주 음악방송 팬투표 화력이 크게 오릅니다",
  },
  {
    // 활동기 긴급 개입 2: 이번 주 차트 자연 하락을 완만하게 만든다
    // (weekProcessor가 streamingPush 주문을 감지해 감쇠를 줄인다).
    id: "streamingPush",
    name: "스트리밍 스퍼트",
    cost: 1500,
    duration: 1,
    effects: {
      public: 2,
    },
    requirements: {
      phase: "debut+",
      minPublic: 15,
    },
    sideEffect: "이번 주 차트 하락세가 눈에 띄게 완만해집니다",
  },
  {
    id: "fanCafeEvent",
    name: "멤버십 이벤트",
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
    name: "라이브홀 팬콘",
    cost: 15000, // 소극장은 첫 유료 라이브 단계로 부담을 제한한다.
    duration: 2, // 준비와 후속 회복까지 고려하면 2주가 적절하다.
    effects: {
      fandom: 6,
      fandomLoyalty: 6,
      public: 2,
      condition: -4, // 공연은 전원의 체력을 쓴다. 무비용 반복을 막는 실질 대가.
    },
    requirements: {
      phase: "growth+",
      minFandom: 35, // 최소한의 티켓 수요가 필요하다.
    },
    income: 20000, // 작은 흑자 단계. 확정 대박이 아니라 팬덤 관리와 겸하는 수익원이다.
    sideEffect: "이틀의 공연 준비로 전원 컨디션이 조금 떨어집니다.",
  },
  {
    id: "midConcert",
    name: "아레나 콘서트",
    cost: 45000, // 중극장은 운영이 본격적으로 무거워져야 한다.
    duration: 2, // 여전히 짧은 투어 단위로 처리할 수 있게 한다.
    effects: {
      fandom: 9,
      fandomLoyalty: 8,
      public: 4,
      industry: 2,
      condition: -6, // 규모가 커질수록 소모도 커진다. 연속 공연 루프의 제동 장치.
    },
    requirements: {
      phase: "growth+",
      minFandom: 50, // 중극장은 명확한 코어 팬덤을 요구한다.
    },
    income: 58000, // 자금 회수 체감은 남기되, 다른 활동을 밀어내는 확정 정답은 아니게 한다.
    sideEffect: "2주 공연 일정의 소모로 전원 컨디션이 떨어집니다.",
  },
  {
    id: "largeConcert",
    name: "고척돔 콘서트",
    cost: 120000, // 대극장은 큰 자금 묶임을 통해 리스크를 체감시킨다.
    duration: 3, // 준비 기간이 길어져 다른 활동을 희생하게 만든다.
    effects: {
      fandom: 18,
      fandomLoyalty: 10,
      public: 6,
      industry: 5,
      condition: -8, // 3주 준비 공연의 피로. 다음 활동 계획에 회복 주가 필요해진다.
    },
    requirements: {
      phase: "peak",
      minFandom: 70, // 대극장은 상위권 팬덤 규모를 전제로 한다.
      minIndustry: 50, // 운영 역량에 대한 업계 신뢰도도 요구한다.
    },
    income: 152000, // 성공 시 큰 현금 흐름. 다만 컨디션 대가와 3주 구속을 상쇄할 만큼만.
    sideEffect: "3주를 통째로 쓰는 대형 공연이라 준비 여파로 전원 컨디션이 크게 떨어집니다.",
  },
  {
    id: "domeConcert",
    name: "스타디움 콘서트",
    cost: 300000, // 돔은 명백한 엔드게임급 베팅이어야 한다.
    duration: 4, // 긴 준비 기간이 다른 의사결정을 압박하게 한다.
    effects: {
      fandom: 28,
      fandomLoyalty: 14,
      public: 10,
      industry: 8,
      global: 6,
      condition: -10, // 엔드게임 공연의 대가. 전원이 지친 채로 다음 사이클을 맞는다.
    },
    requirements: {
      phase: "peak",
      minFandom: 85, // 돔은 최상위 팬덤 체급일 때만 도전 가능해야 한다.
      minIndustry: 65, // 신뢰도 없는 돔 공연은 설득력이 떨어진다.
    },
    income: 400000, // 대형 보상은 유지하되 순이익 10억 단위의 유일 지배 전략은 되지 않게 한다.
    sideEffect: "4주를 통째로 쓰는 최대 규모 베팅입니다. 끝나면 전원이 지친 채로 다음 사이클을 맞습니다.",
  },
];
