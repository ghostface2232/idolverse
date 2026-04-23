import type { InterludeTemplate } from "@/types/game";

export const INTERLUDE_ACTIVITIES: InterludeTemplate[] = [
  {
    id: "selfContent",
    name: "자체 콘텐츠",
    cost: 500, // 자체 콘텐츠는 저비용이지만 지속 투자 가치가 있어야 한다.
    duration: 1, // 빠른 반복형 활동으로 주간 루프에 잘 맞는다.
    effects: {
      global: 3,
      fandom: 1,
      fandomLoyalty: 2,
    },
    risks: [],
  },
  {
    id: "fanManagement",
    name: "팬 관리",
    cost: 300, // 작은 운영비만 들도록 해서 자주 선택 가능하게 한다.
    duration: 1, // 충성도 유지용 짧은 루프다.
    effects: {
      fandomLoyalty: 5,
      fandomDisappointment: -3,
    },
    risks: [],
  },
  {
    id: "individualSchedule",
    name: "개인 스케줄",
    cost: 0, // 외부 섭외이므로 직접 비용보다 기회비용이 핵심이다.
    duration: { min: 1, max: 4 }, // 짧은 게스트부터 장기 촬영까지 폭이 있어야 한다.
    effects: {
      money: 2000,
    },
    targetMemberStatBonus: {
      charm: 3, // 개인 노출은 해당 멤버의 스타성을 키우는 방향이 자연스럽다.
    },
    risks: ["팀 합동 시간 감소"],
  },
  {
    id: "liveBroadcast",
    name: "라이브 방송",
    cost: 0, // 라이브는 접근성이 높은 팬 서비스 축이어야 한다.
    duration: 1,
    effects: {
      fandom: 2,
      global: 1,
    },
    successFactors: ["charm"],
  },
  {
    id: "controversyIgnore",
    name: "논란 수습 - 무시",
    duration: 1, // 대응 선택지는 모두 즉시성 있는 1주 액션으로 본다.
    effects: {
      fandomDisappointment: 15,
      public: -5,
    },
  },
  {
    id: "controversyClarify",
    name: "논란 수습 - 해명",
    cost: 2000, // 해명은 PR 비용이 들지만 이미지 회복 가능성이 있다.
    duration: 1,
    effects: {
      fandomDisappointment: 5,
      public: 3,
      industry: -2,
    },
  },
  {
    id: "controversyApologize",
    name: "논란 수습 - 사과",
    cost: 1000, // 사과는 해명보다 싸지만 일부 손실을 감수하는 선택지다.
    duration: 1,
    effects: {
      fandomDisappointment: 8,
      public: -3,
      industry: 2,
    },
  },
  {
    id: "vacation",
    name: "휴가",
    cost: 0, // 휴가는 현금보다 활동 기회 손실이 더 큰 선택이다.
    duration: { min: 1, max: 2 }, // 너무 길면 리듬이 끊기므로 짧게 제한한다.
    effects: {
      condition: 30,
      satisfaction: 20,
      stress: -25,
      public: -3,
    },
    risks: ["연애 스캔들 확률 +10%", "대중 인지도 주당 -3"],
  },
];
