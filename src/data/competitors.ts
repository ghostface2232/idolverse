import type { CompetitorTemplate, EventCompetitorTemplate } from "@/types/game";

export const COMPETITOR_ARCHETYPES: CompetitorTemplate[] = [
  {
    id: "traditionalMajor",
    name: "대형 기획사 정통파",
    type: "traditional",
    description: "기본기가 탄탄하고 마케팅이 강하지만 성장 속도는 느린 메이저형 팀",
    statRanges: {
      vocal: { min: 60, max: 80 }, // 정통파는 기본 보컬 품질이 높아야 설득력 있다.
      dance: { min: 60, max: 80 }, // 퍼포먼스도 안정적으로 상위권을 유지한다.
      visual: { min: 70, max: 90 }, // 메이저형은 비주얼 평균이 높아야 한다.
      marketing: { min: 80, max: 95 }, // 대형 기획사의 가장 큰 강점은 유통/홍보다.
    },
    fandomRange: { min: 35, max: 60 }, // 초반 팬덤은 안정적으로 깔려 있어야 한다.
    publicRange: { min: 30, max: 55 }, // 대중 인지도도 기본치는 높은 편으로 둔다.
    globalRange: { min: 20, max: 45 }, // 해외는 강점일 수 있지만 핵심 축은 아니다.
    industryRange: { min: 45, max: 70 }, // 업계 평판은 기본적으로 높다.
    comebackIntervalWeeks: { min: 12, max: 16 }, // 자본이 있어도 준비가 철저해 공백기가 길다.
    strengths: ["안정적인 라이브", "강한 방송 편성", "비주얼 평균치"],
    weaknesses: ["느린 성장", "보수적인 콘셉트 전환"],
  },
  {
    id: "viralCharacter",
    name: "바이럴/캐릭터형",
    type: "viral",
    description: "캐릭터와 밈으로 빠르게 치고 오르지만 음악성 논란도 많은 팀",
    statRanges: {
      charm: { min: 80, max: 95 }, // 이 archetype의 핵심은 캐릭터성이다.
      vocal: { min: 40, max: 60 }, // 음악 완성도는 상대적으로 흔들려야 차별화된다.
      dance: { min: 45, max: 70 }, // 퍼포먼스도 준수하지만 압도적이진 않다.
      marketing: { min: 70, max: 90 }, // 바이럴 확산력은 꽤 높은 편이어야 한다.
    },
    fandomRange: { min: 20, max: 45 }, // 충성 팬덤은 중간 수준으로 시작한다.
    publicRange: { min: 35, max: 70 }, // 대중성은 빠르게 치솟을 수 있어야 한다.
    globalRange: { min: 10, max: 35 }, // 글로벌은 보너스 정도로 본다.
    industryRange: { min: 15, max: 40 }, // 업계 평판은 양극화되기 쉽다.
    comebackIntervalWeeks: { min: 10, max: 14 }, // 밈 수명이 짧아 공백을 짧게 잡는다.
    strengths: ["캐릭터성", "밈 확산력", "예능 화제성"],
    weaknesses: ["음악성 논란", "짧은 유행 수명"],
  },
  {
    id: "performanceMonster",
    name: "퍼포먼스 괴물형",
    type: "performance",
    description: "무대 장악력이 압도적이라 퍼포먼스상과 페스티벌 무대에서 강한 팀",
    statRanges: {
      dance: { min: 85, max: 100 }, // 이 archetype은 댄스가 거의 최상위여야 한다.
      vocal: { min: 30, max: 50 }, // 보컬은 약점으로 남겨야 선택의 차이가 난다.
      visual: { min: 55, max: 75 }, // 비주얼은 평균 이상이면 충분하다.
      marketing: { min: 45, max: 70 }, // 화제성은 실력에서 오고 외부 푸시는 제한적이다.
    },
    fandomRange: { min: 25, max: 50 }, // 실력 기반 코어 팬은 빠르게 붙는다.
    publicRange: { min: 20, max: 45 }, // 대중 인지도는 실력 대비 느리게 오른다.
    globalRange: { min: 20, max: 50 }, // 퍼포먼스 영상 덕에 해외 반응은 괜찮은 편이다.
    industryRange: { min: 40, max: 75 }, // 업계 평판은 확실히 높아야 한다.
    comebackIntervalWeeks: { min: 11, max: 15 }, // 고난도 퍼포먼스 준비로 공백이 짧지 않다.
    strengths: ["안무 임팩트", "연말무대 강세", "실력 화제성"],
    weaknesses: ["보컬 취약", "대중 확장 속도 느림"],
  },
  {
    id: "globalSpecialist",
    name: "해외 특화형",
    type: "global",
    description: "유튜브와 스포티파이에서 강세를 보이지만 국내 차트는 약한 팀",
    statRanges: {
      vocal: { min: 45, max: 70 }, // 완성도는 중상급 정도로 둔다.
      dance: { min: 60, max: 85 }, // 영상 기반 해외 반응을 위해 퍼포먼스는 강해야 한다.
      marketing: { min: 60, max: 85 }, // 해외 플랫폼 운영 역량이 중요하다.
      global: { min: 70, max: 90 }, // 글로벌 수치가 이 archetype의 정체성이다.
    },
    fandomRange: { min: 22, max: 48 }, // 팬덤은 해외 분산형으로 중간 정도에 머문다.
    publicRange: { min: 12, max: 30 }, // 국내 대중성은 약점으로 남긴다.
    globalRange: { min: 55, max: 85 }, // 핵심 강점이므로 높게 유지한다.
    industryRange: { min: 30, max: 55 }, // 국내 업계 평판은 제한적이다.
    comebackIntervalWeeks: { min: 9, max: 13 }, // 디지털 중심 운영으로 회전이 빠르다.
    strengths: ["스포티파이", "유튜브", "해외 팬덤 응집"],
    weaknesses: ["국내 차트 약세", "내수 화제성 부족"],
  },
  {
    id: "survivalOrigin",
    name: "서바이벌 출신",
    type: "survival",
    description: "초기 팬덤은 강하지만 내부 갈등과 소진 위험을 안고 있는 팀",
    statRanges: {
      vocal: { min: 55, max: 78 }, // 생존경쟁 출신이라 기본 실력은 높은 편이다.
      dance: { min: 58, max: 82 }, // 퍼포먼스도 평균 이상이어야 한다.
      visual: { min: 58, max: 82 }, // 서바이벌 서사의 상업성을 반영한다.
      marketing: { min: 50, max: 76 }, // 초기 팬덤 자체가 마케팅 효과를 낸다.
    },
    fandomRange: { min: 45, max: 70 }, // 초기 팬덤 우위가 가장 큰 특징이다.
    publicRange: { min: 20, max: 45 }, // 대중성은 팬덤 대비 과하지 않게 둔다.
    globalRange: { min: 18, max: 42 }, // 글로벌도 어느 정도 따라오게 한다.
    industryRange: { min: 28, max: 52 }, // 업계 평판은 실적에 따라 요동친다.
    comebackIntervalWeeks: { min: 10, max: 14 }, // 빠른 회전으로 화제성 소모를 막으려 한다.
    strengths: ["초기 팬덤", "서사 몰입도", "데뷔 화제성"],
    weaknesses: ["내부 갈등", "소진 위험", "해체 가능성"],
  },
];

export const EVENT_COMPETITOR_ARCHETYPES: EventCompetitorTemplate[] = [
  {
    id: "traditionalMajor",
    name: "초대형 신인",
    type: "traditional",
    triggerType: "mega_rookie",
    description: "모든 기본기가 상위권인 초대형 신인 그룹",
    statRanges: {
      vocal: { min: 75, max: 92 }, // 메가 루키는 전반적인 완성도가 매우 높아야 한다.
      dance: { min: 78, max: 95 },
      visual: { min: 82, max: 96 },
      marketing: { min: 88, max: 98 },
    },
    fandomRange: { min: 40, max: 65 }, // 데뷔 직후부터 큰 팬덤을 확보한 상태다.
    publicRange: { min: 45, max: 70 }, // 대중 화제성도 즉시 높아야 위협적이다.
    globalRange: { min: 35, max: 60 }, // 해외 반응도 동시에 따라온다.
    industryRange: { min: 55, max: 80 }, // 업계 기대치가 매우 높다.
    strengths: ["완성형 데뷔", "대형 마케팅", "초기 화제성"],
    weaknesses: ["초기 버블 이후 피로도"],
    durationWeeks: { min: 2, max: 3 }, // 짧은 기간 폭발적으로 차트를 점령해야 한다.
    intensityRange: { min: 80, max: 95 }, // 체감상 매우 강력한 이벤트 경쟁자여야 한다.
  },
  {
    id: "viralCharacter",
    name: "역주행 괴물",
    type: "viral",
    triggerType: "comeback_monster",
    description: "특정 주에 갑자기 차트가 폭발하는 역주행 그룹",
    statRanges: {
      charm: { min: 82, max: 96 }, // 역주행은 캐릭터성과 밈 포인트가 강해야 한다.
      vocal: { min: 48, max: 66 },
      marketing: { min: 75, max: 92 },
    },
    fandomRange: { min: 25, max: 45 }, // 팬덤은 아주 크지 않아도 된다.
    publicRange: { min: 55, max: 88 }, // 역주행은 대중성이 핵심이다.
    globalRange: { min: 18, max: 40 },
    industryRange: { min: 22, max: 48 },
    strengths: ["역주행 모멘텀", "바이럴 재점화"],
    weaknesses: ["지속력 불안"],
    durationWeeks: { min: 4, max: 6 }, // 1개월 이상 압박을 줘야 플레이어가 체감한다.
    intensityRange: { min: 65, max: 85 }, // 메가 루키보다 조금 낮지만 꽤 강해야 한다.
  },
  {
    id: "performanceMonster",
    name: "시즌 강자",
    type: "performance",
    triggerType: "season_king",
    description: "특정 시즌에만 유독 강해 해당 분기 차트를 지배하는 팀",
    statRanges: {
      dance: { min: 82, max: 98 }, // 시즌 강자는 공연과 시즌송 소화력이 뛰어나야 한다.
      vocal: { min: 52, max: 74 },
      marketing: { min: 68, max: 88 },
    },
    fandomRange: { min: 30, max: 55 },
    publicRange: { min: 40, max: 75 },
    globalRange: { min: 20, max: 42 },
    industryRange: { min: 35, max: 60 },
    strengths: ["시즌 특화 콘셉트", "공연 시즌 장악력"],
    weaknesses: ["비시즌 약세"],
    durationWeeks: { min: 6, max: 8 }, // 시즌형은 분기 절반 이상 존재해야 의미가 있다.
    intensityRange: { min: 60, max: 80 },
  },
  {
    id: "globalSpecialist",
    name: "글로벌 역수입",
    type: "global",
    triggerType: "global_reverse",
    description: "해외에서 먼저 터진 뒤 국내로 역수입되는 글로벌 화제 그룹",
    statRanges: {
      dance: { min: 65, max: 86 },
      marketing: { min: 72, max: 90 },
      global: { min: 80, max: 96 }, // 이 이벤트는 글로벌 지표 압박이 명확해야 한다.
    },
    fandomRange: { min: 28, max: 52 },
    publicRange: { min: 30, max: 58 },
    globalRange: { min: 70, max: 95 },
    industryRange: { min: 32, max: 55 },
    strengths: ["글로벌 화제성", "국내 역수입 서사"],
    weaknesses: ["국내 로컬팬 기반 약함"],
    durationWeeks: { min: 4, max: 7 }, // 충분히 길어야 글로벌 압박이 체감된다.
    intensityRange: { min: 62, max: 84 },
  },
];
