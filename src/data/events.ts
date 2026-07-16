import type { RandomEventTemplate } from "@/types/game";

/** 프로젝트가 결정론적으로 스폰하는 사건. 확률 풀과 분리해 RNG 순서를 보존한다. */
export const DEBUT_PROJECT_EVENT_POOL: RandomEventTemplate[] = [
  {
    id: "debut-personal-strength",
    type: "positive",
    title: "연습실에 남은 한 사람",
    description: "늦은 밤까지 남은 멤버가 약했던 파트를 자기 방식으로 풀어내며 숨은 강점을 증명했다.",
    probability: 0,
    conditions: { phase: "training" },
    effects: { mental: 3, satisfaction: 3 },
  },
  {
    id: "debut-position-evaluation",
    type: "neutral",
    title: "첫 포지션 평가전",
    description: "가배정했던 역할의 실제 적합도가 공개됐다. 이번 프로젝트에서 단 한 번 포지션을 다시 조정할 수 있다.",
    probability: 0,
    conditions: { phase: "training" },
    effects: {},
  },
  {
    id: "debut-song-candidates",
    type: "positive",
    title: "데뷔곡 후보 도착",
    description: "프로듀서가 서로 다른 승부수를 가진 데뷔곡 후보를 테이블 위에 올렸다.",
    probability: 0,
    conditions: { phase: "training" },
    effects: { albumSong: 3 },
  },
  {
    id: "debut-concept-test",
    type: "neutral",
    title: "비공개 콘셉트 테스트",
    description: "두 가지 스타일의 테스트 촬영에서 멤버 핏과 현장 반응이 엇갈렸다.",
    probability: 0,
    conditions: { phase: "training" },
    effects: { albumVisual: 4, industry: 1 },
  },
  {
    id: "debut-unit-chemistry",
    type: "positive",
    title: "유닛 연습의 발견",
    description: "예상 밖의 멤버 조합이 서로의 빈틈을 채우며 무대의 중심 장면을 만들었다.",
    probability: 0,
    conditions: { phase: "training" },
    effects: { chemistry: 5 },
  },
  {
    id: "debut-rival-arrival",
    type: "neutral",
    title: "같은 계절의 라이벌",
    description: "비슷한 데뷔 시기를 노리는 경쟁 팀의 첫 티저가 공개됐다. 시장의 시선이 둘로 갈리기 시작한다.",
    probability: 0,
    conditions: { phase: "training" },
    effects: { industry: 1 },
  },
  {
    id: "debut-title-decision",
    type: "positive",
    title: "타이틀곡 확정",
    description: "수차례의 월말 평가 끝에 팀의 첫인상을 책임질 타이틀곡이 결정됐다.",
    probability: 0,
    conditions: { phase: "training" },
    effects: { albumSong: 5, satisfaction: 2 },
  },
  {
    id: "debut-public-evaluation",
    type: "neutral",
    title: "첫 공개 평가",
    description: "소수의 업계 관계자와 팬 패널 앞에서 처음으로 완곡 무대를 공개했다.",
    probability: 0,
    conditions: { phase: "training" },
    effects: { industry: 3, public: 2 },
  },
  {
    id: "debut-showcase-rehearsal",
    type: "neutral",
    title: "쇼케이스 최종 리허설",
    description: "조명과 카메라가 켜진 무대에서 데뷔 자격을 증명할 마지막 점검이 시작됐다.",
    probability: 0,
    conditions: { phase: "training" },
    effects: { albumChoreography: 4 },
  },
  {
    id: "debut-promotion-launch",
    type: "positive",
    title: "데뷔 티저 공개",
    description: "팀의 이름과 첫 콘셉트가 세상에 공개되며 카운트다운이 시작됐다.",
    probability: 0,
    conditions: { phase: "training" },
    effects: { public: 3, albumMarketing: 5 },
  },
];

export const PROJECT_EVENT_TEMPLATES_BY_ID = new Map(
  DEBUT_PROJECT_EVENT_POOL.map((template) => [template.id, template]),
);

export const RANDOM_EVENT_POOL: RandomEventTemplate[] = [
  {
    id: "viral-performance-cut",
    type: "positive",
    title: "바이럴 직캠 폭발",
    description: "한 멤버의 무대 직캠이 급속도로 퍼지며 팀 전체 인지도가 오른다.",
    probability: 0.08,
    conditions: {
      minWeek: 4,
      minFame: 15,
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
    probability: 0.04,
    conditions: {
      minIndustry: 25,
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
    probability: 0.06,
    conditions: {
      minFandom: 20,
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
    probability: 0.05,
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
    probability: 0.03,
    conditions: {
      minPublic: 25,
      minFandom: 20,
    },
    effects: {
      fandom: 7,
      fandomLoyalty: 4,
      public: 3,
    },
  },
  {
    id: "fan-challenge-viral",
    type: "positive",
    title: "팬 챌린지 바이럴",
    description: "팬이 만든 틱톡 챌린지가 폭발적으로 확산되며 곡이 재조명된다.",
    probability: 0.05,
    conditions: {
      minFandom: 25,
      minWeek: 6,
    },
    effects: {
      public: 10,
      global: 8,
      fandom: 3,
    },
  },
  {
    id: "brand-ad-offer",
    type: "positive",
    title: "브랜드 광고 제안",
    description: "유명 브랜드에서 그룹 광고 모델을 제안해 왔다.",
    probability: 0.04,
    conditions: {
      minPublic: 30,
      phase: ["debut", "growth", "peak"],
    },
    effects: {
      industry: 3,
    },
    choices: [
      {
        label: "계약한다",
        description: "안정적인 수입과 브랜드 이미지를 확보한다.",
        tradeoff: "광고 스케줄로 팀 훈련 시간이 줄어든다.",
        effects: { money: 80000000, public: 5, industry: 4, condition: -3 },
      },
      {
        label: "거절한다",
        description: "음악 활동에 집중한다.",
        tradeoff: "수입 기회를 놓치지만 팀 컨디션을 지킨다.",
        effects: { satisfaction: 3, fandomLoyalty: 2 },
      },
    ],
  },
  {
    id: "chart-surprise",
    type: "positive",
    title: "음원 차트 서프라이즈",
    description: "예상 밖의 유입으로 음원 순위가 급등한다.",
    probability: 0.03,
    conditions: {
      minWeek: 8,
      phase: ["debut", "growth", "peak"],
    },
    effects: {
      public: 8,
      fandom: 5,
      global: 4,
      industry: 3,
    },
  },
  {
    id: "injury-scare",
    type: "negative",
    title: "훈련 중 부상",
    description: "과훈련 여파로 핵심 멤버가 다쳐 예정된 일정 일부를 조정해야 한다.",
    probability: 0.05,
    conditions: {
      minStress: 55,
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
    probability: 0.04,
    conditions: {
      minPublic: 18,
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
    probability: 0.03,
    conditions: {
      minPublic: 25,
      requiresVacation: true,
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
    probability: 0.04,
    conditions: {
      phase: ["debut", "growth", "peak"],
    },
    effects: {
      industry: -2,
      albumMarketing: -4,
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
    probability: 0.04,
    conditions: {
      lowChemistryPair: true,
      maxSatisfaction: 45,
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
    probability: 0.03,
    conditions: {
      minFame: 30,
      requiresSecurity: false,
    },
    effects: {
      stress: 12,
      satisfaction: -10,
      public: -2,
    },
  },
  {
    id: "sns-controversy",
    type: "negative",
    title: "SNS 과거 발언 발굴",
    description: "멤버의 과거 SNS 게시물이 발굴되어 논란이 일어난다.",
    probability: 0.03,
    conditions: {
      minPublic: 20,
      phase: ["debut", "growth", "peak"],
    },
    effects: {
      public: -5,
      fandomDisappointment: 8,
      industry: -4,
    },
    choices: [
      {
        label: "즉시 사과문 발표",
        description: "빠르게 인정하고 반성의 뜻을 전한다.",
        tradeoff: "사태가 빨리 진정되지만 이미지에 흠집이 남는다.",
        effects: { money: -10000000, fandomDisappointment: -3, industry: 1 },
      },
      {
        label: "맥락 해명",
        description: "당시 상황과 맥락을 설명하는 입장문을 낸다.",
        tradeoff: "해명이 먹히면 피해가 줄지만 실패하면 더 커진다.",
        effects: { money: -15000000, public: -2, fandomDisappointment: -1 },
      },
      {
        label: "무대응",
        description: "관심이 옮겨가길 기다린다.",
        tradeoff: "비용은 없지만 여론이 장기간 불안정해진다.",
        effects: { fandomDisappointment: 12, public: -8, industry: -2 },
      },
    ],
  },
  {
    id: "health-issue",
    type: "negative",
    title: "멤버 건강 이슈",
    description: "과로 누적으로 한 멤버가 건강 문제를 호소한다.",
    probability: 0.04,
    conditions: {
      minStress: 50,
      phase: ["debut", "growth", "peak"],
    },
    effects: {
      condition: -20,
      stress: 5,
      satisfaction: -6,
    },
    choices: [
      {
        label: "즉시 휴식 부여",
        description: "해당 멤버를 당분간 일정에서 제외한다.",
        tradeoff: "컨디션은 회복되지만 팀 활동에 공백이 생긴다.",
        effects: { condition: 15, satisfaction: 8, public: -3 },
      },
      {
        label: "일정 축소 후 유지",
        description: "부담을 줄이되 완전히 빠지지는 않게 한다.",
        tradeoff: "공백은 최소화하지만 악화 위험이 남아 있다.",
        effects: { condition: 5, satisfaction: 2, stress: 3 },
      },
    ],
  },
  {
    id: "fandom-split",
    type: "negative",
    title: "팬덤 내부 분열",
    description: "개인팬과 그룹팬 사이 갈등이 커뮤니티에서 가시화된다.",
    probability: 0.03,
    conditions: {
      minFandom: 35,
      phase: ["growth", "peak"],
    },
    effects: {
      fandomLoyalty: -6,
      fandomDisappointment: 8,
      public: -2,
    },
  },
  {
    id: "tv-audition-offer",
    type: "neutral",
    title: "TV 오디션 출연 기회",
    description: "한 멤버가 화제성 높은 오디션 프로그램 특별 코너 제안을 받는다.",
    probability: 0.06,
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
    probability: 0.05,
    conditions: {
      minGlobal: 18,
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
  {
    id: "reality-show-offer",
    type: "neutral",
    title: "리얼리티 프로그램 제안",
    description: "OTT 플랫폼에서 그룹 밀착 리얼리티 촬영을 제안한다.",
    probability: 0.04,
    conditions: {
      minFandom: 20,
      phase: ["debut", "growth", "peak"],
    },
    effects: {
      public: 2,
    },
    choices: [
      {
        label: "수락한다",
        description: "콘텐츠를 통해 팬덤과 대중성을 동시에 노린다.",
        tradeoff: "촬영 일정이 훈련과 겹치고 사생활 노출 부담이 있다.",
        effects: { fandom: 6, public: 5, global: 3, condition: -4, stress: 5 },
      },
      {
        label: "거절한다",
        description: "음악 활동에 집중한다.",
        tradeoff: "노출 기회는 사라지지만 팀 리듬을 유지한다.",
        effects: { satisfaction: 3, chemistry: 2 },
      },
    ],
  },
  {
    id: "ost-offer",
    type: "neutral",
    title: "인기 드라마 OST 참여 기회",
    description: "화제의 드라마 제작팀에서 메인 보컬에게 OST 참여를 제안한다.",
    probability: 0.04,
    conditions: {
      phase: ["debut", "growth", "peak"],
    },
    effects: {
      public: 2,
    },
    choices: [
      {
        label: "참여한다",
        description: "드라마 흥행 시 음원 차트 진입과 대중 인지도 상승을 노린다.",
        tradeoff: "해당 멤버의 팀 활동 시간이 줄어든다.",
        effects: { public: 7, industry: 4, money: 20000000, chemistry: -2 },
      },
      {
        label: "거절한다",
        description: "팀 활동에 집중한다.",
        tradeoff: "개인 인지도 상승 기회를 놓친다.",
        effects: { chemistry: 2, satisfaction: 1 },
      },
    ],
  },
];
