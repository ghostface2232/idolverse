import type { RandomEventTemplate } from "@/types/game";

export const RANDOM_EVENT_POOL: RandomEventTemplate[] = [
  {
    id: "viral-performance-cut",
    type: "positive",
    title: "바이럴 직캠 폭발",
    description: "한 멤버의 무대 직캠이 급속도로 퍼지며 팀 전체 인지도가 오른다.",
    probability: 0.08, // 긍정 이벤트는 가끔 터져야 기대감이 생기지만 남발되면 안 된다.
    conditions: {
      minWeek: 4, // 데뷔 직후 약간의 누적 무대가 쌓여야 설득력이 생긴다.
      minFame: 15, // 완전 무명 상태에서는 바이럴도 확산력이 부족하다.
    },
    effects: {
      public: 12,
      fandom: 4,
      global: 6,
    },
  },
  {
    id: "famous-composer-offer",
    type: "positive",
    title: "유명 작곡가 협업 제의",
    description: "업계 히트메이커가 다음 타이틀 후보를 제안해 왔다.",
    probability: 0.04, // 강한 보상 이벤트는 희소해야 선택의 무게가 생긴다.
    conditions: {
      minIndustry: 25, // 업계 평판이 어느 정도 쌓여야 톱라인 제안이 들어온다.
      phase: ["training", "debut", "growth"],
    },
    effects: {
      albumSong: 12,
      industry: 5,
    },
    choices: [
      {
        label: "거액을 주고 계약한다",
        description: "예산을 더 써서 곡 우선권을 확보한다.",
        tradeoff: "자금은 크게 줄지만 앨범 퀄리티 기대치가 오른다.",
        effects: { money: -90000000, albumSong: 18, industry: 6 },
      },
      {
        label: "표준 조건으로 진행한다",
        description: "무난한 수준의 계약으로 협업을 성사시킨다.",
        tradeoff: "효과는 좋지만 절대적인 최고 효율은 아니다.",
        effects: { money: -45000000, albumSong: 12, industry: 4 },
      },
      {
        label: "자체 제작을 고수한다",
        description: "브랜드 일관성을 이유로 제안을 거절한다.",
        tradeoff: "예산은 지키지만 업계 화제성 기회를 놓친다.",
        effects: { money: 0, industry: -2, fandomLoyalty: 2 },
      },
    ],
  },
  {
    id: "fan-touching-story",
    type: "positive",
    title: "팬 감동 에피소드 확산",
    description: "멤버의 진심 어린 대응이 커뮤니티에서 화제가 되며 팬덤 충성도가 오른다.",
    probability: 0.06, // 중간급 긍정 이벤트는 정서적 보상으로 자주 보이는 편이 좋다.
    conditions: {
      minFandom: 20, // 팬 커뮤니티 규모가 어느 정도 있어야 이야기가 퍼진다.
    },
    effects: {
      fandom: 3,
      fandomLoyalty: 8,
      industry: 2,
    },
  },
  {
    id: "hidden-talent-found",
    type: "positive",
    title: "숨겨진 재능 발견",
    description: "주목받지 못했던 멤버의 특별한 재능이 드러나 팀의 활용 폭이 넓어진다.",
    probability: 0.05, // 성장형 이벤트는 희귀하지만 캠페인마다 몇 번은 보여야 한다.
    conditions: {
      phase: ["training", "debut", "growth"],
    },
    effects: {
      charm: 4,
      satisfaction: 6,
      fandom: 2,
    },
  },
  {
    id: "rival-fan-migration",
    type: "positive",
    title: "경쟁 그룹 팬 유입",
    description: "경쟁 그룹의 공백기와 실수로 일부 팬이 우리 쪽으로 넘어온다.",
    probability: 0.03, // 순수한 팬 유입은 강한 눈덩이 효과를 내므로 낮게 둔다.
    conditions: {
      minPublic: 25, // 어느 정도 비교 대상이 될 수준은 되어야 한다.
      minFandom: 20,
    },
    effects: {
      fandom: 7,
      fandomLoyalty: 4,
      public: 3,
    },
  },
  {
    id: "injury-scare",
    type: "negative",
    title: "훈련 중 부상",
    description: "과훈련 여파로 핵심 멤버가 다쳐 예정된 일정 일부를 조정해야 한다.",
    probability: 0.05, // 부상은 충분히 체감되되 지나치게 자주 터지면 운영이 경직된다.
    conditions: {
      minStress: 55, // 스트레스 관리 실패가 부상의 핵심 원인으로 읽혀야 한다.
    },
    effects: {
      condition: -18,
      stress: 8,
      public: -2,
    },
  },
  {
    id: "malicious-rumor",
    type: "negative",
    title: "악성 루머 확산",
    description: "근거 없는 루머가 커뮤니티와 숏폼 플랫폼을 통해 번진다.",
    probability: 0.04, // 루머는 낮지 않은 빈도로 등장해야 위기 대응이 의미를 가진다.
    conditions: {
      minPublic: 18, // 아무도 모르면 루머도 크게 번지지 않는다.
    },
    effects: {
      public: -6,
      fandomDisappointment: 10,
      industry: -3,
    },
    choices: [
      {
        label: "즉시 대응 자료 배포",
        description: "법무/홍보 비용을 써서 빠르게 정리한다.",
        tradeoff: "돈은 들지만 피해를 최소화한다.",
        effects: { money: -25000000, public: 1, fandomDisappointment: -5 },
      },
      {
        label: "며칠 지켜본다",
        description: "노이즈가 자연 소멸되길 기대한다.",
        tradeoff: "비용은 없지만 팬 불안이 길어진다.",
        effects: { money: 0, public: -4, fandomDisappointment: 6 },
      },
    ],
  },
  {
    id: "dating-scandal",
    type: "negative",
    title: "연애 스캔들 포착",
    description: "휴식 중 사적인 장면이 포착되어 팬덤이 흔들린다.",
    probability: 0.03, // 연애 스캔들은 강도가 높은 만큼 기본 확률은 낮게 유지한다.
    conditions: {
      minPublic: 25, // 인지도가 있어야 스캔들이 시장 이슈가 된다.
      requiresVacation: true, // 휴가나 개인 일정이 많을수록 체감상 더 설득력 있다.
    },
    effects: {
      fandomDisappointment: 12,
      public: 4,
    },
    choices: [
      {
        label: "자금 투입하여 수습",
        description: "법무, 기사 관리, 현장 대응 인력을 총동원한다.",
        tradeoff: "돈은 크게 빠지지만 팬 충격을 가장 줄인다.",
        effects: { money: -50000000, fandomDisappointment: 5, public: 1 },
      },
      {
        label: "침묵한다",
        description: "공식 입장 없이 시간을 끌며 관심이 옮겨가길 기다린다.",
        tradeoff: "돈은 안 들지만 팬 실망이 커지고 관심은 더 모인다.",
        effects: { money: 0, fandomDisappointment: 15, public: 10 },
      },
      {
        label: "공식 인정",
        description: "관계를 인정하고 사생활 존중을 호소한다.",
        tradeoff: "팬층은 크게 흔들리지만 일부 대중 호감은 얻는다.",
        effects: { fandomDisappointment: 25, industry: -5, public: 5 },
      },
    ],
  },
  {
    id: "staff-poaching",
    type: "negative",
    title: "핵심 스태프 이직 위기",
    description: "외부에서 더 좋은 조건을 제시하며 스태프를 빼가려 한다.",
    probability: 0.04, // 스태프 리스크는 장기 운영 압박을 만드는 보조 위협이다.
    conditions: {
      phase: ["debut", "growth", "peak"],
    },
    effects: {
      industry: -2,
      marketing: -4,
    },
    choices: [
      {
        label: "연봉 인상으로 붙잡는다",
        description: "즉시 보상안을 제시해 잔류시킨다.",
        tradeoff: "현금흐름이 나빠지지만 운영 안정성을 지킨다.",
        effects: { money: -30000000, industry: 1 },
      },
      {
        label: "보내고 구조를 재편한다",
        description: "손실을 감수하고 체제를 슬림하게 만든다.",
        tradeoff: "단기 효율이 떨어지지만 비용 부담은 없다.",
        effects: { money: 0, industry: -3, public: -1 },
      },
    ],
  },
  {
    id: "member-conflict",
    type: "negative",
    title: "멤버 갈등 폭발",
    description: "케미가 나쁜 멤버 쌍의 갈등이 공개적으로 드러날 조짐을 보인다.",
    probability: 0.04, // 케미 시스템이 체감되려면 갈등 이벤트가 종종 보여야 한다.
    conditions: {
      lowChemistryPair: true, // 낮은 케미를 방치했을 때만 발생하도록 연결한다.
      maxSatisfaction: 45, // 팀 전체 분위기가 나쁠수록 터지기 쉬워야 한다.
    },
    effects: {
      chemistry: -15,
      satisfaction: -8,
      public: -3,
    },
  },
  {
    id: "sasaeng-issue",
    type: "negative",
    title: "사생팬 문제",
    description: "숙소와 동선을 집요하게 추적하는 사생 문제가 발생한다.",
    probability: 0.03, // 강한 페널티성 이벤트이므로 출현 빈도는 낮게 둔다.
    conditions: {
      minFame: 30, // 어느 정도 유명해져야 사생 문제가 현실화된다.
      requiresSecurity: false, // 보안팀 미도입 상태를 데이터 해석에 사용하기 좋다.
    },
    effects: {
      stress: 12,
      satisfaction: -10,
      public: -2,
    },
  },
  {
    id: "tv-audition-offer",
    type: "neutral",
    title: "TV 오디션 출연 기회",
    description: "한 멤버가 화제성 높은 오디션 프로그램 특별 코너 제안을 받는다.",
    probability: 0.06, // 중립 기회 이벤트는 플레이 리듬을 바꾸는 장치로 자주 보이면 좋다.
    conditions: {
      phase: ["training", "debut", "growth"],
    },
    effects: {
      public: 3,
    },
    choices: [
      {
        label: "출연시킨다",
        description: "단기 화제성을 노리고 팀 훈련 공백을 감수한다.",
        tradeoff: "대중성은 오르지만 해당 멤버 훈련과 팀 케미가 손해를 본다.",
        effects: { public: 8, chemistry: -3, condition: -2 },
      },
      {
        label: "거절한다",
        description: "팀 일정과 장기 성장에 집중한다.",
        tradeoff: "노출 기회는 사라지지만 내부 안정은 지킨다.",
        effects: { chemistry: 2, satisfaction: 2 },
      },
    ],
  },
  {
    id: "overseas-invite",
    type: "neutral",
    title: "해외 초청 행사",
    description: "작은 규모의 해외 행사에서 공연 초청이 들어온다.",
    probability: 0.05, // 해외 기회는 가끔 등장해야 글로벌 축이 살아난다.
    conditions: {
      minGlobal: 18, // 글로벌 씨앗이 생긴 뒤에만 자연스럽다.
    },
    effects: {
      global: 5,
      public: -1,
    },
    choices: [
      {
        label: "참석한다",
        description: "해외 노출을 확보한다.",
        tradeoff: "국내 일정 일부가 밀리고 컨디션이 소모된다.",
        effects: { global: 8, money: -15000000, condition: -3 },
      },
      {
        label: "국내 활동 유지",
        description: "이번 주는 국내 지표를 지킨다.",
        tradeoff: "해외 성장 속도는 느려진다.",
        effects: { public: 2, global: -1 },
      },
    ],
  },
];
