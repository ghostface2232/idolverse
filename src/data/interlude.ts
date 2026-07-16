import type { InterludeTemplate } from "@/types/game";

export const INTERLUDE_ACTIVITIES: InterludeTemplate[] = [
  {
    id: "selfContent",
    name: "자체 콘텐츠 제작",
    cost: 500,
    duration: 1,
    effects: {
      global: 3,
      fandom: 1,
      fandomLoyalty: 2,
    },
    risks: [],
  },
  {
    id: "fanManagement",
    name: "팬 커뮤니티 관리",
    cost: 300,
    duration: 1,
    effects: {
      fandomLoyalty: 5,
      fandomDisappointment: -3,
    },
    risks: [],
  },
  {
    id: "individualSchedule",
    name: "개인 스케줄",
    cost: 0,
    duration: { min: 1, max: 4 },
    effects: {
      money: 2000,
    },
    targetMemberStatBonus: {
      charm: 3,
    },
    risks: ["팀 합동 시간 감소"],
  },
  {
    id: "liveBroadcast",
    name: "라이브 방송",
    cost: 0,
    duration: 1,
    effects: {
      fandom: 2,
      global: 1,
    },
    successFactors: ["charm"],
  },
  {
    id: "pictorial",
    name: "화보 촬영",
    cost: 1500,
    duration: 1,
    effects: {
      public: 3,
      industry: 2,
    },
    targetMemberStatBonus: {
      visual: 2,
    },
    risks: [],
  },
  {
    id: "fanMeeting",
    name: "팬미팅",
    cost: 2500,
    duration: 2,
    effects: {
      fandom: 6,
      fandomLoyalty: 8,
      fandomDisappointment: -5,
    },
    risks: [],
  },
  {
    id: "controversyIgnore",
    name: "논란 수습 — 무시",
    duration: 1,
    effects: {
      fandomDisappointment: 15,
      public: -5,
    },
  },
  {
    id: "controversyClarify",
    name: "논란 수습 — 해명",
    cost: 2000,
    duration: 1,
    effects: {
      fandomDisappointment: 5,
      public: 3,
      industry: -2,
    },
  },
  {
    id: "controversyApologize",
    name: "논란 수습 — 사과",
    cost: 1000,
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
    cost: 0,
    duration: { min: 1, max: 2 },
    effects: {
      condition: 30,
      satisfaction: 20,
      stress: -25,
      public: -3,
    },
    risks: [
      "휴가 중에는 사생활이 카메라에 잡힐 수 있다",
      "쉬는 동안 대중의 관심은 조금씩 식는다",
    ],
  },
];
