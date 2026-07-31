import type { RandomEventTemplate } from "@/types/game";

/** 프로젝트가 결정론적으로 스폰하는 사건. 확률 풀과 분리해 RNG 순서를 보존한다. */
export const DEBUT_PROJECT_EVENT_POOL: RandomEventTemplate[] = [
  {
    id: "debut-personal-strength",
    type: "positive",
    title: "연습실에 남은 한 사람",
    description: "늦은 밤까지 남은 멤버가 약했던 파트를 자기 방식으로 풀어내며 숨은 강점을 증명했습니다.",
    probability: 0,
    conditions: { phase: "training" },
    effects: { mental: 3, satisfaction: 3 },
  },
  {
    id: "debut-position-evaluation",
    type: "neutral",
    title: "첫 포지션 선발전 예고",
    description: "6주차에 포지션 선발전을 엽니다. 가배정 역할에 맞춰 훈련하며 컨디션과 팀워크를 준비해야 합니다.",
    probability: 0,
    conditions: { phase: "training" },
    effects: {},
  },
  {
    id: "debut-song-candidates",
    type: "positive",
    title: "데뷔곡 후보 도착",
    description: "프로듀서가 서로 다른 승부수를 가진 데뷔곡 후보를 테이블 위에 올렸습니다.",
    probability: 0,
    conditions: { phase: "training" },
    effects: { albumSong: 3 },
  },
  {
    id: "debut-concept-test",
    type: "neutral",
    title: "비공개 컨셉 테스트",
    description: "두 가지 스타일의 테스트 촬영에서 멤버 핏과 현장 반응이 엇갈렸습니다.",
    probability: 0,
    conditions: { phase: "training" },
    effects: { albumVisual: 4, industry: 1 },
  },
  {
    id: "debut-unit-chemistry",
    type: "positive",
    title: "유닛 연습의 발견",
    description: "예상 밖의 멤버 조합이 서로의 빈틈을 채우며 무대의 중심 장면을 만들었습니다.",
    probability: 0,
    conditions: { phase: "training" },
    effects: { chemistry: 5 },
  },
  {
    id: "debut-rival-arrival",
    type: "neutral",
    title: "같은 계절의 라이벌",
    description: "비슷한 데뷔 시기를 노리는 경쟁 팀의 첫 티저가 공개됐습니다. 시장의 시선이 둘로 갈리기 시작했습니다.",
    probability: 0,
    conditions: { phase: "training" },
    effects: { industry: 1 },
  },
  {
    id: "debut-title-decision",
    type: "positive",
    title: "타이틀곡 확정",
    description: "수차례의 월말 평가 끝에 팀의 첫인상을 책임질 타이틀곡이 결정됐습니다.",
    probability: 0,
    conditions: { phase: "training" },
    effects: { albumSong: 5, satisfaction: 2 },
  },
  {
    id: "debut-public-evaluation",
    type: "neutral",
    title: "첫 공개 평가",
    description: "소수의 업계 관계자와 팬 패널 앞에서 처음으로 완곡 무대를 공개했습니다.",
    probability: 0,
    conditions: { phase: "training" },
    effects: { industry: 3, public: 2 },
  },
  {
    id: "debut-showcase-rehearsal",
    type: "neutral",
    title: "쇼케이스 최종 리허설",
    description: "조명과 카메라가 켜진 무대에서 데뷔 자격을 증명할 마지막 점검이 시작됐습니다.",
    probability: 0,
    conditions: { phase: "training" },
    effects: { albumChoreography: 4 },
  },
  {
    id: "debut-promotion-launch",
    type: "positive",
    title: "데뷔 티저 공개",
    description: "팀의 이름과 첫 컨셉이 세상에 공개되며 카운트다운이 시작됐습니다.",
    probability: 0,
    conditions: { phase: "training" },
    effects: { public: 3, albumMarketing: 5 },
  },
  {
    id: "debut-observation-character",
    type: "positive",
    title: "관찰기의 뜻밖의 캐릭터",
    description: "쉬는 시간마다 팀을 웃게 만드는 멤버의 예능 감각이 눈에 들어왔습니다. 데뷔 후 큰 무기가 될 수 있습니다.",
    probability: 0,
    conditions: { phase: "training" },
    effects: { charm: 3, chemistry: 2 },
  },
  {
    id: "debut-dorm-rules",
    type: "neutral",
    title: "숙소 규칙 회의",
    description: "청소 당번과 취침 시간을 놓고 멤버들이 처음으로 긴 회의를 했습니다. 서로의 생활 방식을 알아가는 중입니다.",
    probability: 0,
    conditions: { phase: "training" },
    effects: { chemistry: 3, satisfaction: 2 },
  },
  {
    id: "debut-evaluation-upset",
    type: "neutral",
    title: "평가전의 이변",
    description: "기대치가 낮았던 멤버가 선발전에서 최고 점수를 받았습니다. 연습실 공기가 달라졌습니다.",
    probability: 0,
    conditions: { phase: "training" },
    effects: { mental: 3, satisfaction: 2 },
  },
  {
    id: "debut-rehearsal-blackout",
    type: "neutral",
    title: "리허설 돌발 정전",
    description: "쇼케이스 리허설 중 전원이 나갔지만 멤버들이 무반주로 무대를 이어갔습니다. 지켜보던 스태프들이 박수를 보냈습니다.",
    probability: 0,
    conditions: { phase: "training" },
    effects: { mental: 3, industry: 1 },
  },
];

/** 컴백 프로젝트 스테이지가 결정론적으로 스폰하는 사건. */
export const COMEBACK_PROJECT_EVENT_POOL: RandomEventTemplate[] = [
  {
    id: "comeback-concept-research",
    type: "neutral",
    title: "컴백 컨셉 조사 착수",
    description: "다음 활동의 색을 정하기 위해 트렌드 리포트와 팬 커뮤니티 반응을 훑기 시작했습니다.",
    probability: 0,
    conditions: {},
    effects: { albumMarketing: 3 },
  },
  {
    id: "comeback-song-candidates",
    type: "positive",
    title: "타이틀 후보 도착",
    description: "프로듀서 팀이 이번 컴백의 방향을 가를 타이틀 후보들을 올렸습니다. 결정은 대표님 몫입니다.",
    probability: 0,
    conditions: {},
    effects: { albumSong: 3 },
  },
  {
    id: "comeback-part-assignment",
    type: "neutral",
    title: "파트 분배 회의",
    description: "확정된 타이틀의 킬링파트를 누구에게 맡길지 회의가 길어지고 있습니다.",
    probability: 0,
    conditions: {},
    effects: {},
    choices: [
      {
        label: "에이스에게 집중",
        description: "가장 완성도 높은 멤버에게 핵심 파트를 몰아줍니다.",
        tradeoff: "무대 완성도는 오르지만 파트가 적은 멤버들의 만족도가 떨어집니다.",
        effects: { albumSong: 5, albumChoreography: 3, satisfaction: -4 },
      },
      {
        label: "고르게 분배",
        description: "전원의 분량을 균형 있게 맞춥니다.",
        tradeoff: "팀 분위기는 좋아지지만 임팩트 있는 순간이 줄어듭니다.",
        effects: { satisfaction: 4, chemistry: 3, albumSong: 1 },
      },
    ],
  },
  {
    id: "comeback-recording-accident",
    type: "negative",
    title: "녹음 사고",
    description: "메인 트랙 녹음본 일부가 손상된 채 발견됐습니다. 발매까지 남은 시간이 많지 않습니다.",
    probability: 0,
    conditions: {},
    effects: { stress: 4 },
    choices: [
      {
        label: "밤샘 재녹음",
        description: "이번 주 안에 손상 구간을 다시 녹음합니다.",
        tradeoff: "퀄리티는 지키지만 멤버들의 피로가 쌓입니다.",
        effects: { albumSong: 6, stress: 6, condition: -4 },
      },
      {
        label: "백업 테이크 사용",
        description: "보관 중이던 예비 테이크로 대체합니다.",
        tradeoff: "일정은 지키지만 곡 완성도가 조금 떨어집니다.",
        effects: { albumSong: -3, satisfaction: 2 },
      },
    ],
  },
  {
    id: "comeback-choreo-draft",
    type: "neutral",
    title: "안무 시안 선택",
    description: "안무팀이 상반된 두 가지 시안을 가져왔습니다. 무대의 인상이 여기서 갈립니다.",
    probability: 0,
    conditions: {},
    effects: {},
    choices: [
      {
        label: "고난도 시안",
        description: "화제성을 노리고 어려운 동선을 채택합니다.",
        tradeoff: "무대 임팩트가 크지만 연습 부담과 부상 위험이 있습니다.",
        effects: { albumChoreography: 7, stress: 5, condition: -3 },
      },
      {
        label: "안정형 시안",
        description: "전원이 소화 가능한 완성형 동선을 택합니다.",
        tradeoff: "안정적인 라이브가 가능하지만 화제성은 낮습니다.",
        effects: { albumChoreography: 4, satisfaction: 2 },
      },
    ],
  },
  {
    id: "comeback-teaser-reaction",
    type: "positive",
    title: "티저 반응 도착",
    description: "첫 티저가 공개되자 커뮤니티와 숏폼에 반응이 모이기 시작했습니다.",
    probability: 0,
    conditions: {},
    effects: { public: 3, albumMarketing: 5 },
  },
  {
    id: "comeback-expectation-briefing",
    type: "neutral",
    title: "사전 반응 브리핑",
    description: "마케팅팀이 팬덤 기대치 조사를 정리해 보고했습니다.",
    probability: 0,
    conditions: {},
    effects: { albumMarketing: 3 },
  },
  {
    id: "comeback-part-dispute",
    type: "negative",
    title: "파트 불만 면담 요청",
    description: "파트가 줄어든 멤버가 따로 면담을 요청했습니다. 납득할 수 있는 답이 필요합니다.",
    probability: 0,
    conditions: {},
    effects: {},
    choices: [
      {
        label: "파트를 재조정한다",
        description: "녹음 일부를 다시 배분해 불만을 풀어줍니다.",
        tradeoff: "멤버 마음은 풀리지만 곡 완성 일정이 흔들립니다.",
        effects: { satisfaction: 4, albumSong: -2, stress: 2 },
      },
      {
        label: "설득하고 유지한다",
        description: "이번 곡의 색에 맞는 배분이라는 점을 설명합니다.",
        tradeoff: "완성도는 지키지만 서운함이 남습니다.",
        effects: { albumSong: 2, satisfaction: -3, chemistry: -2 },
      },
    ],
  },
  {
    id: "comeback-mv-set-accident",
    type: "negative",
    title: "뮤직비디오 세트 사고",
    description: "촬영 중 메인 세트 일부가 무너졌습니다. 다친 사람은 없지만 핵심 장면이 날아갔습니다.",
    probability: 0,
    conditions: {},
    effects: { stress: 4 },
    choices: [
      {
        label: "세트를 복구해 재촬영",
        description: "일정을 늘려서라도 기획한 장면을 살립니다.",
        tradeoff: "영상 완성도는 지키지만 멤버들 피로가 쌓입니다.",
        effects: { albumVisual: 6, stress: 5, condition: -3 },
      },
      {
        label: "앵글을 바꿔 편집으로 살린다",
        description: "남은 소스와 대체 장면으로 마무리합니다.",
        tradeoff: "일정은 지키지만 영상 임팩트가 조금 줄어듭니다.",
        effects: { albumVisual: -2, satisfaction: 2 },
      },
    ],
  },
  {
    id: "comeback-mv-scene-steal",
    type: "positive",
    title: "원테이크 명장면 탄생",
    description: "감독이 마지막 테이크를 보고 촬영장을 멈췄습니다. 이번 뮤직비디오의 얼굴이 될 장면이 나왔습니다.",
    probability: 0,
    conditions: {},
    // 스테이지 이벤트는 사이클마다 반복 발동하므로 랜덤 풀보다 효과를 작게 잡는다.
    effects: { albumVisual: 3, albumMarketing: 1 },
  },
  {
    id: "comeback-teaser-debate",
    type: "neutral",
    title: "티저 반응 엇갈림",
    description: "첫 티저를 두고 반응이 갈립니다. 새롭다는 평과 낯설다는 평이 반반입니다.",
    probability: 0,
    conditions: {},
    effects: {},
    choices: [
      {
        label: "컨셉을 밀고 간다",
        description: "기획 의도를 믿고 예정대로 갑니다.",
        tradeoff: "팀의 색은 선명해지지만 낯설다는 반응은 남습니다.",
        effects: { albumMarketing: 4, fandomLoyalty: 2 },
      },
      {
        label: "2차 티저에서 톤을 조정한다",
        description: "반응을 반영해 다음 티저의 방향을 다듬습니다.",
        tradeoff: "진입 장벽은 낮아지지만 편집팀 일정이 빠듯해집니다.",
        effects: { albumVisual: 3, albumMarketing: 2, stress: 3 },
      },
    ],
  },
  {
    id: "comeback-stage-mishap",
    type: "neutral",
    title: "생방송 무대 사고",
    description: "생방송 중 인이어가 꺼졌지만 멤버들이 침착하게 무대를 끝냈습니다. 방송 후 대응이 남았습니다.",
    probability: 0,
    conditions: {},
    effects: { stress: 3 },
    choices: [
      {
        label: "다음 무대로 증명한다",
        description: "따로 언급하지 않고 더 좋은 무대를 준비합니다.",
        tradeoff: "프로다운 인상을 남기지만 멤버들 부담이 커집니다.",
        effects: { public: 3, industry: 2, stress: 3 },
      },
      {
        label: "팬들에게 비하인드를 전한다",
        description: "당시 상황과 멤버들의 대처를 솔직하게 공유합니다.",
        tradeoff: "팬덤 결속은 깊어지지만 사고 자체는 더 오래 회자됩니다.",
        effects: { fandomLoyalty: 4, public: 1 },
      },
    ],
  },
  {
    id: "comeback-fancam-resurge",
    type: "positive",
    title: "활동기 직캠 역주행",
    description: "지난주 무대 직캠이 뒤늦게 퍼지며 조회수가 치솟고 있습니다. 해외 계정들도 퍼 나르기 시작했습니다.",
    probability: 0,
    conditions: {},
    // 스테이지 이벤트는 사이클마다 반복 발동하므로 랜덤 풀보다 효과를 작게 잡는다.
    effects: { public: 3, fandom: 1, global: 1 },
  },
  {
    id: "comeback-settlement-notes",
    type: "neutral",
    title: "활동을 닫는 밤",
    description: "마지막 무대를 마친 멤버들이 대기실에 모여 이번 활동의 소회를 나눴습니다. 서로에게 고맙다는 말이 오갔습니다.",
    probability: 0,
    conditions: {},
    effects: { satisfaction: 2, chemistry: 1 },
  },
];

export const PROJECT_EVENT_TEMPLATES_BY_ID = new Map(
  [...DEBUT_PROJECT_EVENT_POOL, ...COMEBACK_PROJECT_EVENT_POOL].map(
    (template) => [template.id, template],
  ),
);

export const RANDOM_EVENT_POOL: RandomEventTemplate[] = [
  {
    id: "viral-performance-cut",
    type: "positive",
    title: "바이럴 직캠 폭발",
    description: "한 멤버의 무대 직캠이 급속도로 퍼지며 팀 전체 인지도가 오르고 있습니다.",
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
    description: "업계 히트메이커가 다음 타이틀 후보를 제안해 왔습니다.",
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
        description: "예산을 더 써서 곡 우선권을 확보합니다.",
        tradeoff: "자금은 크게 줄지만 앨범 퀄리티 기대치가 오릅니다.",
        effects: { money: -90000000, albumSong: 18, industry: 6 },
      },
      {
        label: "표준 조건으로 진행한다",
        description: "무난한 수준의 계약으로 협업을 성사시킵니다.",
        tradeoff: "비용과 기대 성과가 가장 균형 잡힌 선택입니다.",
        effects: { money: -45000000, albumSong: 12, industry: 4 },
      },
      {
        label: "자체 제작을 고수한다",
        description: "브랜드 일관성을 이유로 제안을 거절합니다.",
        tradeoff: "예산은 지키지만 업계 화제성 기회를 놓칩니다.",
        effects: { money: 0, industry: -2, fandomLoyalty: 2 },
      },
    ],
  },
  {
    id: "fan-touching-story",
    type: "positive",
    title: "팬 감동 에피소드 확산",
    description: "멤버의 진심 어린 대응이 커뮤니티에서 화제가 되며 팬덤 충성도가 오르고 있습니다.",
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
    description: "주목받지 못했던 멤버의 특별한 재능이 드러나 팀의 활용 폭이 넓어졌습니다.",
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
    description: "경쟁 그룹의 공백기와 실수로 일부 팬이 우리 쪽으로 넘어오고 있습니다.",
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
    description: "팬이 만든 틱톡 챌린지가 폭발적으로 확산되며 곡이 재조명되고 있습니다.",
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
    description: "유명 브랜드에서 그룹 광고 모델을 제안해 왔습니다.",
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
        description: "안정적인 수입과 브랜드 이미지를 확보합니다.",
        tradeoff: "광고 스케줄로 팀 훈련 시간이 줄어듭니다.",
        effects: { money: 80000000, public: 5, industry: 4, condition: -3 },
      },
      {
        label: "거절한다",
        description: "음악 활동에 집중합니다.",
        tradeoff: "수입 기회를 놓치지만 팀 컨디션을 지킵니다.",
        effects: { satisfaction: 3, fandomLoyalty: 2 },
      },
    ],
  },
  {
    id: "chart-surprise",
    type: "positive",
    title: "음원 차트 서프라이즈",
    description: "예상 밖의 유입으로 음원 순위가 급등하고 있습니다.",
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
    description: "과훈련 여파로 핵심 멤버가 다쳐 예정된 일정 일부를 조정해야 합니다.",
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
    isScandal: true,
    title: "악성 루머 확산",
    description: "근거 없는 루머가 커뮤니티와 숏폼 플랫폼을 통해 번지고 있습니다.",
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
        description: "법무/홍보 비용을 써서 빠르게 정리합니다.",
        tradeoff: "돈은 들지만 피해를 최소화합니다.",
        effects: { money: -25000000, public: 1, fandomDisappointment: -5 },
      },
      {
        label: "며칠 지켜본다",
        description: "노이즈가 자연 소멸되길 기대합니다.",
        tradeoff: "비용은 없지만 팬 불안이 길어집니다.",
        effects: { money: 0, public: -4, fandomDisappointment: 6 },
      },
    ],
  },
  {
    id: "dating-scandal",
    type: "negative",
    isScandal: true,
    title: "연애 스캔들 포착",
    description: "휴식 중 사적인 장면이 포착되어 팬덤이 흔들리고 있습니다.",
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
        description: "법무, 기사 관리, 현장 대응 인력을 총동원합니다.",
        tradeoff: "돈은 크게 빠지지만 팬 충격을 가장 줄입니다.",
        // 수습 대응은 실망을 낮춰야 한다(+5는 설명과 정반대였다).
        effects: { money: -50000000, fandomDisappointment: -5, public: 1 },
      },
      {
        label: "침묵한다",
        description: "공식 입장 없이 시간을 끌며 관심이 옮겨가길 기다립니다.",
        tradeoff: "돈은 안 들지만 팬 실망이 커지고 관심은 더 모입니다.",
        effects: { money: 0, fandomDisappointment: 15, public: 10 },
      },
      {
        label: "공식 인정",
        description: "관계를 인정하고 사생활 존중을 호소합니다.",
        tradeoff: "팬층은 크게 흔들리지만 일부 대중 호감은 얻습니다.",
        effects: { fandomDisappointment: 25, industry: -5, public: 5 },
      },
    ],
  },
  {
    // 멤버 혹사가 회사 밖으로 새어 나가는 순간 — 팬과 업계가 회사를
    // 겨냥한다. minStress는 팀 최고 스트레스 기준이라, 한 명이라도
    // 만성 소진 상태로 방치하면 논란의 재료가 된다.
    id: "overwork-controversy",
    type: "negative",
    isScandal: true,
    title: "멤버 혹사 논란",
    description:
      "지친 멤버들의 모습이 팬 커뮤니티에서 화제가 되며 회사의 일정 운영을 향한 비판이 커지고 있습니다.",
    probability: 0.06,
    conditions: {
      phase: ["debut", "growth", "peak"],
      minStress: 92,
      minPublic: 30,
    },
    effects: {
      public: -3,
    },
    choices: [
      {
        label: "전면 휴식을 선언한다",
        description: "예정된 일정을 정리하고 멤버들의 회복을 최우선에 둡니다.",
        tradeoff: "활동 공백이 생기지만 멤버와 팬의 신뢰를 지킵니다.",
        effects: {
          stress: -12,
          condition: 8,
          satisfaction: 6,
          public: -3,
          fandomDisappointment: -8,
        },
      },
      {
        label: "일정을 줄이고 인력을 보강한다",
        description: "무리한 구간을 조정하고 현장 지원을 늘립니다.",
        tradeoff: "비용이 들지만 활동을 이어가며 논란을 진정시킵니다.",
        effects: { money: -40000000, stress: -6, fandomDisappointment: -5 },
      },
      {
        label: "문제없다고 반박한다",
        description: "멤버들의 컨디션은 관리되고 있다고 해명합니다.",
        tradeoff: "일정은 지키지만 논란이 이어지고 멤버들의 마음이 상합니다.",
        effects: { fandomDisappointment: 6, industry: -3, satisfaction: -4 },
      },
    ],
  },
  {
    // 혹사는 멤버만 갈아 넣는 게 아니다 — 격무의 현장을 버티던 스태프가
    // 먼저 떠나려 한다. 내부 악재라 스캔들 판정은 아니지만 제작이 흔들린다.
    id: "staff-burnout-exodus",
    type: "negative",
    title: "격무에 지친 스태프 이탈 조짐",
    description:
      "쉼 없는 일정을 감당해 온 핵심 스태프가 번아웃을 호소하며 퇴사를 고민하고 있습니다.",
    probability: 0.05,
    conditions: {
      phase: ["debut", "growth", "peak"],
      minStress: 92,
    },
    effects: {
      industry: -2,
      albumSong: -3,
      albumMarketing: -3,
    },
    choices: [
      {
        label: "위로금과 충원을 약속한다",
        description: "즉시 보상하고 현장 인력을 보강합니다.",
        tradeoff: "비용이 들지만 팀의 기반을 지킵니다.",
        effects: { money: -35000000, industry: 1 },
      },
      {
        label: "지금 인원으로 감내한다",
        description: "빈자리를 남은 인력이 메웁니다.",
        tradeoff: "비용은 없지만 제작이 흔들리고 피로가 더 쌓입니다.",
        effects: { albumSong: -4, industry: -2, stress: 3 },
      },
    ],
  },
  {
    id: "staff-poaching",
    type: "negative",
    title: "핵심 스태프 이직 위기",
    description: "외부에서 더 좋은 조건을 제시하며 스태프를 빼가려 합니다.",
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
        description: "즉시 보상안을 제시해 잔류시킵니다.",
        tradeoff: "현금흐름이 나빠지지만 운영 안정성을 지킵니다.",
        effects: { money: -30000000, industry: 1 },
      },
      {
        label: "보내고 구조를 재편한다",
        description: "손실을 감수하고 체제를 슬림하게 만듭니다.",
        tradeoff: "단기 효율이 떨어지지만 비용 부담은 없습니다.",
        effects: { money: 0, industry: -3, public: -1 },
      },
    ],
  },
  {
    id: "member-conflict",
    type: "negative",
    title: "멤버 갈등 폭발",
    description: "케미가 나쁜 멤버 쌍의 갈등이 공개적으로 드러날 조짐을 보이고 있습니다.",
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
    description: "숙소와 동선을 집요하게 추적하는 사생 문제가 발생했습니다.",
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
    isScandal: true,
    title: "SNS 과거 발언 발굴",
    description: "멤버의 과거 SNS 게시물이 발굴되어 논란이 일고 있습니다.",
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
        description: "빠르게 인정하고 반성의 뜻을 전합니다.",
        tradeoff: "사태가 빨리 진정되지만 이미지에 흠집이 남습니다.",
        effects: { money: -10000000, fandomDisappointment: -3, industry: 1 },
      },
      {
        label: "맥락 해명",
        description: "당시 상황과 맥락을 설명하는 입장문을 냅니다.",
        tradeoff: "해명이 먹히면 피해가 줄지만 실패하면 더 커집니다.",
        effects: { money: -15000000, public: -2, fandomDisappointment: -1 },
      },
      {
        label: "무대응",
        description: "관심이 옮겨가길 기다립니다.",
        tradeoff: "비용은 없지만 여론이 장기간 불안정해집니다.",
        effects: { fandomDisappointment: 12, public: -8, industry: -2 },
      },
    ],
  },
  {
    id: "health-issue",
    type: "negative",
    title: "멤버 건강 이슈",
    description: "과로 누적으로 한 멤버가 건강 문제를 호소하고 있습니다.",
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
        description: "해당 멤버를 당분간 일정에서 제외합니다.",
        tradeoff: "컨디션은 회복되지만 팀 활동에 공백이 생깁니다.",
        effects: { condition: 15, satisfaction: 8, public: -3 },
      },
      {
        label: "일정 축소 후 유지",
        description: "부담을 줄이되 완전히 빠지지는 않게 합니다.",
        tradeoff: "공백은 최소화하지만 악화 위험이 남아 있습니다.",
        effects: { condition: 5, satisfaction: 2, stress: 3 },
      },
    ],
  },
  {
    id: "fandom-split",
    type: "negative",
    title: "팬덤 내부 분열",
    description: "개인팬과 그룹팬 사이 갈등이 커뮤니티에서 가시화되고 있습니다.",
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
    description: "한 멤버가 화제성 높은 오디션 프로그램 특별 코너 제안을 받았습니다.",
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
        description: "단기 화제성을 노리고 팀 훈련 공백을 감수합니다.",
        tradeoff: "대중성은 오르지만 해당 멤버 훈련과 팀 케미가 손해를 봅니다.",
        effects: { public: 8, chemistry: -3, condition: -2 },
      },
      {
        label: "거절한다",
        description: "팀 일정과 장기 성장에 집중합니다.",
        tradeoff: "노출 기회는 사라지지만 내부 안정은 지킵니다.",
        effects: { chemistry: 2, satisfaction: 2 },
      },
    ],
  },
  {
    id: "overseas-invite",
    type: "neutral",
    title: "해외 초청 행사",
    description: "작은 규모의 해외 행사에서 공연 초청이 들어왔습니다.",
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
        description: "해외 노출을 확보합니다.",
        tradeoff: "국내 일정 일부가 밀리고 컨디션이 소모됩니다.",
        effects: { global: 8, money: -15000000, condition: -3 },
      },
      {
        label: "국내 활동 유지",
        description: "이번 주는 국내 지표를 지킵니다.",
        tradeoff: "해외 성장 속도는 느려집니다.",
        effects: { public: 2, global: -1 },
      },
    ],
  },
  {
    id: "reality-show-offer",
    type: "neutral",
    title: "리얼리티 프로그램 제안",
    description: "OTT 플랫폼에서 그룹 밀착 리얼리티 촬영을 제안했습니다.",
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
        description: "콘텐츠를 통해 팬덤과 대중성을 동시에 노립니다.",
        tradeoff: "촬영 일정이 훈련과 겹치고 사생활 노출 부담이 있습니다.",
        effects: { fandom: 6, public: 5, global: 3, condition: -4, stress: 5 },
      },
      {
        label: "거절한다",
        description: "음악 활동에 집중합니다.",
        tradeoff: "노출 기회는 사라지지만 팀 리듬을 유지합니다.",
        effects: { satisfaction: 3, chemistry: 2 },
      },
    ],
  },
  {
    id: "ost-offer",
    type: "neutral",
    title: "인기 드라마 OST 참여 기회",
    description: "화제의 드라마 제작팀에서 메인 보컬에게 OST 참여를 제안했습니다.",
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
        description: "드라마 흥행 시 음원 차트 진입과 대중 인지도 상승을 노립니다.",
        tradeoff: "해당 멤버의 팀 활동 시간이 줄어듭니다.",
        effects: { public: 7, industry: 4, money: 20000000, chemistry: -2 },
      },
      {
        label: "거절한다",
        description: "팀 활동에 집중합니다.",
        tradeoff: "개인 인지도 상승 기회를 놓칩니다.",
        effects: { chemistry: 2, satisfaction: 1 },
      },
    ],
  },
  // ── 이하 확장 풀. 기존 이벤트의 시드 소비 순서를 지키기 위해 반드시 뒤에만 추가한다. ──
  {
    id: "regional-festival-invite",
    type: "neutral",
    title: "지역 축제 초청",
    description: "지방 축제 무대에 초청받았습니다. 출연료는 확실하지만 왕복 이동이 만만치 않습니다.",
    probability: 0.04,
    conditions: {
      minPublic: 10,
      phase: ["debut", "growth"],
    },
    effects: {
      public: 1,
    },
    choices: [
      {
        label: "내려가서 무대에 선다",
        description: "출연료 1500만 원을 받고 현장 관객을 만납니다.",
        tradeoff: "수입과 지역 팬을 얻지만 긴 이동으로 컨디션이 소모됩니다.",
        effects: { money: 15000000, public: 4, fandom: 2, condition: -3 },
      },
      {
        label: "정중히 거절한다",
        description: "이번 주는 팀 일정에 집중합니다.",
        tradeoff: "수입 기회는 놓치지만 멤버들 체력을 지킵니다.",
        effects: { satisfaction: 1, condition: 2 },
      },
    ],
  },
  {
    id: "practice-room-livestream",
    type: "positive",
    title: "연습실 깜짝 라이브",
    description: "멤버들이 즉흥으로 켠 연습실 라이브에 접속자가 몰렸습니다. 편한 모습에 반응이 뜨겁습니다.",
    probability: 0.04,
    conditions: {
      minFandom: 10,
    },
    effects: {
      fandom: 3,
      fandomLoyalty: 3,
    },
    choices: [
      {
        label: "정기 콘텐츠로 확대",
        description: "매주 고정 라이브 코너로 만듭니다.",
        tradeoff: "팬덤과의 거리는 좁혀지지만 멤버들 체력 부담이 늘어납니다.",
        effects: { fandom: 5, fandomLoyalty: 4, condition: -3, stress: 3 },
      },
      {
        label: "깜짝 이벤트로 남긴다",
        description: "부담 없이 가끔만 켜기로 합니다.",
        tradeoff: "확산 효과는 작지만 멤버들이 편하게 임할 수 있습니다.",
        effects: { fandomLoyalty: 3, satisfaction: 2 },
      },
    ],
  },
  {
    id: "practice-room-blackout",
    type: "neutral",
    title: "연습실 정전 해프닝",
    description: "정전으로 연습이 멈추자 멤버들이 휴대폰 불빛 아래에서 아카펠라를 이어갔습니다. 그 영상이 잔잔하게 퍼지고 있습니다.",
    probability: 0.03,
    conditions: {
      phase: ["training", "debut", "growth"],
    },
    effects: {
      chemistry: 3,
      fandom: 1,
    },
  },
  {
    id: "teaser-typo-issue",
    type: "negative",
    title: "티저 오타 논란",
    description: "공개된 티저 이미지에서 오타가 발견되어 가볍게 놀림거리가 되고 있습니다. 대응 방식이 여론을 가릅니다.",
    probability: 0.03,
    conditions: {
      phase: ["debut", "growth", "peak"],
      minPublic: 20,
    },
    effects: {
      public: -2,
      stress: 2,
    },
    choices: [
      {
        label: "정정 공지와 사과",
        description: "빠르게 수정본을 올리고 짧게 사과합니다.",
        tradeoff: "제작비가 조금 들지만 깔끔하게 마무리됩니다.",
        effects: { money: -10000000, fandomDisappointment: -2, industry: 1 },
      },
      {
        label: "유머로 받아친다",
        description: "오타를 밈으로 만들어 공식 계정이 먼저 웃습니다.",
        tradeoff: "화제성은 얻지만 가볍다고 느끼는 팬도 생깁니다.",
        effects: { public: 4, fandom: 1, fandomDisappointment: 3 },
      },
    ],
  },
  {
    id: "senior-group-advice",
    type: "positive",
    title: "선배 그룹의 조언",
    description: "음악방송 대기실에서 만난 선배 그룹이 멤버들에게 긴 조언과 함께 식사를 대접했습니다.",
    probability: 0.04,
    conditions: {
      phase: ["training", "debut", "growth"],
    },
    effects: {
      satisfaction: 4,
      mental: 2,
      industry: 2,
    },
  },
  {
    id: "mental-slump-sign",
    type: "negative",
    title: "멤버 슬럼프 신호",
    description: "한 멤버가 최근 무대가 무섭다고 털어놨습니다. 표정이 눈에 띄게 어두워졌습니다.",
    probability: 0.04,
    conditions: {
      minStress: 45,
    },
    effects: {
      stress: 4,
    },
    choices: [
      {
        label: "심리 상담을 지원한다",
        description: "전문 상담을 연결하고 일정 부담을 줄여줍니다.",
        tradeoff: "비용이 들지만 멤버가 다시 무대를 즐길 힘을 얻습니다.",
        effects: { money: -15000000, mental: 3, satisfaction: 4 },
      },
      {
        label: "일정 그대로, 지켜본다",
        description: "스스로 이겨내길 기다립니다.",
        tradeoff: "비용은 없지만 슬럼프가 깊어질 위험이 있습니다.",
        effects: { satisfaction: -4, stress: 4, condition: -3 },
      },
    ],
  },
  {
    id: "dorm-cooking-clip",
    type: "positive",
    title: "숙소 요리 영상 화제",
    description: "막내가 올린 숙소 야식 영상이 귀엽다는 반응과 함께 퍼지고 있습니다. 멤버들의 일상 케미가 재조명됩니다.",
    probability: 0.04,
    conditions: {
      phase: ["training", "debut", "growth"],
    },
    effects: {
      fandom: 3,
      fandomLoyalty: 3,
      chemistry: 2,
    },
  },
  {
    id: "staff-wedding",
    type: "neutral",
    title: "매니저의 결혼식",
    description: "데뷔 전부터 함께한 매니저가 결혼합니다. 주말 일정과 겹쳐 참석 여부를 정해야 합니다.",
    probability: 0.03,
    conditions: {
      minWeek: 8,
    },
    effects: {},
    choices: [
      {
        label: "전원이 축가를 부른다",
        description: "하루 일정을 비우고 다 같이 식장으로 갑니다.",
        tradeoff: "피로는 남지만 팀과 스태프의 신뢰가 깊어집니다.",
        effects: { satisfaction: 4, chemistry: 3, condition: -2 },
      },
      {
        label: "영상 편지만 보낸다",
        description: "일정을 지키고 마음은 영상으로 전합니다.",
        tradeoff: "일정은 지키지만 서운함이 남을 수 있습니다.",
        effects: { industry: 1, satisfaction: -2 },
      },
    ],
  },
  {
    id: "overseas-subtitle-team",
    type: "positive",
    title: "해외 팬 자막팀 결성",
    description: "해외 팬들이 자발적으로 콘텐츠 번역 자막팀을 꾸렸습니다. 언어 장벽이 낮아지며 유입이 늘고 있습니다.",
    probability: 0.04,
    conditions: {
      minGlobal: 12,
    },
    effects: {
      global: 5,
      fandomLoyalty: 3,
    },
  },
  {
    id: "equipment-breakdown",
    type: "negative",
    title: "연습실 장비 고장",
    description: "연습실 음향 장비가 수명을 다했습니다. 소리가 끊겨 합주 연습이 자꾸 멈춥니다.",
    probability: 0.04,
    conditions: {
      phase: ["training", "debut", "growth"],
    },
    effects: {
      stress: 3,
    },
    choices: [
      {
        label: "새 장비를 들인다",
        description: "2000만 원을 들여 음향 장비를 교체합니다.",
        tradeoff: "지출이 생기지만 연습 환경이 눈에 띄게 좋아집니다.",
        effects: { money: -20000000, satisfaction: 3, condition: 2 },
      },
      {
        label: "수리하며 버틴다",
        description: "임시 수리로 당분간 사용을 이어갑니다.",
        tradeoff: "비용은 아끼지만 연습 효율과 멤버들 사기가 떨어집니다.",
        effects: { condition: -3, stress: 3, satisfaction: -2 },
      },
    ],
  },
  {
    id: "cover-song-buzz",
    type: "positive",
    title: "커버 무대 역주행",
    description: "라디오에서 부른 선배 곡 커버가 원곡 가수의 SNS에 언급되며 화제가 됐습니다.",
    probability: 0.04,
    conditions: {
      minWeek: 6,
      phase: ["debut", "growth", "peak"],
    },
    effects: {
      public: 6,
      industry: 2,
      fandom: 2,
    },
  },
  {
    id: "choreo-leak",
    type: "negative",
    title: "신곡 안무 유출",
    description: "비공개 연습 영상 일부가 외부로 유출됐습니다. 공개 전 안무가 이미 돌아다니고 있습니다.",
    probability: 0.03,
    conditions: {
      phase: ["debut", "growth", "peak"],
      minFandom: 15,
    },
    effects: {
      stress: 4,
    },
    choices: [
      {
        label: "정식 선공개로 전환",
        description: "유출본보다 좋은 화질의 연습 영상을 공식 공개합니다.",
        tradeoff: "화제성을 우리 쪽으로 가져오지만 기획했던 공개 순서가 무너집니다.",
        effects: { albumMarketing: 4, public: 3, stress: 2 },
      },
      {
        label: "유포자 법적 대응",
        description: "법무팀을 통해 유출 경로를 추적하고 삭제를 요청합니다.",
        tradeoff: "돈이 들지만 재발을 막고 팬들을 안심시킵니다.",
        effects: { money: -20000000, fandomDisappointment: -2, industry: 1 },
      },
      {
        label: "무대응",
        description: "공개일까지 그대로 둡니다.",
        tradeoff: "비용은 없지만 김이 빠지고 보안에 대한 실망이 남습니다.",
        effects: { albumMarketing: -3, fandomDisappointment: 4, stress: 2 },
      },
    ],
  },
  {
    id: "overseas-radio-play",
    type: "positive",
    title: "해외 라디오 전파",
    description: "해외 유명 라디오 채널이 타이틀곡을 소개했습니다. 현지 반응이 조금씩 쌓이고 있습니다.",
    probability: 0.03,
    conditions: {
      minGlobal: 15,
    },
    effects: {
      global: 6,
      public: 3,
    },
  },
  {
    id: "fan-gift-policy",
    type: "neutral",
    title: "팬 선물 정책 논의",
    description: "고가의 팬 선물이 늘면서 정리된 원칙이 필요해졌습니다. 어떤 결정이든 반응이 갈릴 것입니다.",
    probability: 0.03,
    conditions: {
      minFandom: 25,
    },
    effects: {},
    choices: [
      {
        label: "선물 전면 반려를 발표한다",
        description: "마음만 받겠다는 원칙을 공식화합니다.",
        tradeoff: "건전한 팬 문화라는 평가를 얻지만 서운해하는 팬도 생깁니다.",
        effects: { fandomDisappointment: 4, industry: 2, public: 2 },
      },
      {
        label: "손편지만 받는 절충안",
        description: "물건 대신 편지와 응원만 받기로 합니다.",
        tradeoff: "팬들과의 정서적 연결은 지키지만 현장 관리 부담이 늘어납니다.",
        effects: { fandomLoyalty: 3, stress: 2 },
      },
    ],
  },
  {
    id: "dorm-noise-complaint",
    type: "negative",
    title: "숙소 소음 민원",
    description: "새벽 안무 연습 소리로 이웃 민원이 들어왔습니다. 멤버들이 눈치를 보며 연습 시간을 줄이고 있습니다.",
    probability: 0.03,
    conditions: {
      phase: ["training", "debut", "growth"],
    },
    effects: {
      satisfaction: -3,
      stress: 3,
      public: -1,
    },
  },
  {
    id: "fan-art-exhibition",
    type: "positive",
    title: "팬아트 전시 프로젝트",
    description: "팬들이 자발적으로 모은 팬아트 전시가 열렸습니다. 멤버들이 다녀간 인증샷에 커뮤니티가 들썩입니다.",
    probability: 0.04,
    conditions: {
      minFandom: 15,
    },
    effects: {
      fandomLoyalty: 5,
      fandom: 2,
      public: 2,
    },
  },
  {
    id: "broadcast-slot-cancelled",
    type: "negative",
    title: "방송 편성 취소 통보",
    description: "출연 예정이던 음악 프로그램이 편성 개편으로 취소됐습니다. 준비했던 무대가 갈 곳을 잃었습니다.",
    probability: 0.04,
    conditions: {
      phase: ["debut", "growth", "peak"],
      minPublic: 15,
    },
    effects: {
      public: -3,
      stress: 3,
      satisfaction: -2,
    },
  },
  {
    id: "sns-qna-request",
    type: "neutral",
    title: "팬들의 실시간 Q&A 요청",
    description: "팬 커뮤니티에서 실시간 질문방을 열어 달라는 요청이 쏟아지고 있습니다.",
    probability: 0.04,
    conditions: {
      minFandom: 12,
    },
    effects: {},
    choices: [
      {
        label: "오늘 밤 라이브를 켠다",
        description: "즉흥으로 소통 방송을 엽니다.",
        tradeoff: "팬덤 반응은 뜨겁지만 준비 없는 방송이라 멤버들이 긴장합니다.",
        effects: { fandom: 4, fandomLoyalty: 4, stress: 3 },
      },
      {
        label: "다음 주에 준비해서 연다",
        description: "질문을 미리 받아 정돈된 방송을 준비합니다.",
        tradeoff: "안정적이지만 지금의 열기는 조금 식습니다.",
        effects: { fandomLoyalty: 1, fandomDisappointment: 2, satisfaction: 1 },
      },
    ],
  },
];
