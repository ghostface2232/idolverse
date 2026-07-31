import type {
  ConceptMood,
  Genre,
  KPopNews,
  KPopNewsType,
  Season,
} from "@/types/game";

export const NEWS_TYPE_LABELS: Record<KPopNewsType, string> = {
  competitor: "경쟁 그룹",
  trend: "트렌드",
  event: "업계 일정",
  industry: "업계",
};

export const SEASONAL_NEWS_TEMPLATES: Record<Season, string[]> = {
  spring: [
    "[대형 기획사]의 신인 [그룹명], 다음 달 데뷔 예정",
    "신인 시즌 개막, 이번 분기 데뷔 팀 [N]팀 예상",
    "봄 시즌 청량 콘셉트 컴백 러시, 차트 경쟁 치열",
    "올해 상반기 주목할 루키 그룹 TOP 5 공개",
  ],
  summer: [
    "여름 시즌 컴백 경쟁 치열, 이번 주만 [N]팀 동시 컴백",
    "음악 페스티벌 라인업 공개",
    "여름 시즌송 대전, 올해는 누가 '여름 여왕' 차지할까",
    "워터밤·뮤직페스티벌 출연진 확정, 티켓 전쟁 예고",
  ],
  fall: [
    "연말 시상식 앞두고 주요 가수 컴백 러시",
    "올해의 앨범 후보 초집계",
    "3분기 음반 판매량 역대 최고 기록, 팬덤 파워 입증",
    "가을 감성 컴백 대전, 발라드·레트로 트랙 강세",
  ],
  winter: [
    "MMA/MAMA/골든디스크 시상식 일정 확정",
    "연말 결산: 올해 K-POP 키워드는?",
    "연말 무대 출연 라인업 공개, 콜라보 무대 기대",
    "올해 음반 총판매량 전년 대비 [N]% 증가",
  ],
};

export const GENERIC_NEWS_TEMPLATES = [
  "[경쟁그룹명] 컴백 D-[N]",
  "[장르] 트렌드 [상승/하락]세",
  "아이돌 서바이벌 프로그램 화제",
  "음원 차트 개편 논의, 스트리밍 반영 비율 변경 가능성",
  "해외 팬 투표 플랫폼 영향력 확대 논란",
  "아이돌 건강 관리 이슈로 업계 스케줄 관행 재점검",
];

export const SEASONAL_NEWS_POOL: Record<
  Season,
  Omit<KPopNews, "id" | "week">[]
> = {
  spring: [
    {
      headline: "신인 시즌 개막, 이번 분기 데뷔 팀 7팀 예상",
      detail: "봄 시장은 청량·큐트 계열 루키에게 특히 우호적이다.",
      type: "industry",
    },
    {
      headline: "대형 기획사 루키 그룹, 다음 달 데뷔 예고",
      detail: "방송과 숏폼 노출 경쟁이 예상보다 빨라질 것으로 보인다.",
      type: "competitor",
    },
    {
      headline: "봄 시즌 청량 콘셉트 수요 급증",
      detail: "청량·Y2K 계열이 초봄 차트에서 강한 흐름을 보이고 있다.",
      type: "trend",
    },
    {
      headline: "올해 상반기 주목할 루키 그룹 TOP 5 공개",
      detail: "미디어 관심이 집중되며 신인상 경쟁 구도가 빠르게 형성 중이다.",
      type: "industry",
    },
    {
      headline: "대학 축제 시즌 개막, 인기 그룹 섭외 경쟁 치열",
      detail: "라이브 실력이 검증된 그룹에게 유리한 시즌이 시작된다.",
      type: "event",
    },
    {
      headline: "음악방송 신인 무대 편성 확대",
      detail: "지상파와 케이블 모두 루키 특집 코너를 늘리며 기회의 문이 넓어졌다.",
      type: "industry",
    },
    {
      headline: "숏폼 챌린지 발 신곡 역주행 사례 등장",
      detail: "안무 포인트가 명확한 곡일수록 챌린지 확산 속도가 빠르다.",
      type: "trend",
    },
    {
      headline: "벚꽃 시즌 음원 정산 시작, 스테디셀러 강세",
      detail: "시즌송의 벽을 넘으려면 확실한 화제성이 필요하다는 분석이다.",
      type: "trend",
    },
    {
      headline: "중소 기획사 신인들의 약진, 업계 지형 변화 조짐",
      detail: "기획력과 팀 색깔만으로 대형 기획사와 맞붙는 사례가 늘고 있다.",
      type: "industry",
    },
    {
      headline: "봄 개편 앞둔 예능가, 아이돌 고정 자리 쟁탈전",
      detail: "예능감이 검증된 멤버를 보유한 팀에게 섭외가 몰리고 있다.",
      type: "event",
    },
  ],
  summer: [
    {
      headline: "여름 시즌 컴백 경쟁 치열, 이번 주만 5팀 동시 컴백",
      detail: "청량과 파워풀 퍼포먼스 트랙의 체감 경쟁 강도가 크게 오른다.",
      type: "trend",
    },
    {
      headline: "음악 페스티벌 라인업 공개",
      detail: "퍼포먼스형 팀과 라이브 강자에게 추가 노출 기회가 열린다.",
      type: "event",
    },
    {
      headline: "여름 시즌송 대전, 올해는 누가 '여름 여왕' 차지할까",
      detail: "대중성 높은 댄스팝과 EDM 트랙이 치열한 경쟁을 벌이고 있다.",
      type: "trend",
    },
    {
      headline: "워터밤·뮤직페스티벌 티켓 전쟁 예고",
      detail: "페스티벌 출연은 신인 그룹에게도 대중 인지도 도약의 기회가 된다.",
      type: "event",
    },
    {
      headline: "여름 해외 팬미팅 수요 급증, 동남아 시장 주목",
      detail: "글로벌 팬덤을 보유한 그룹에게 해외 활동 확장 기회가 열린다.",
      type: "industry",
    },
    {
      headline: "폭염 속 야외 무대 안전 논란, 스케줄 관리 도마 위",
      detail: "무리한 일정 강행이 멤버 컨디션 저하로 이어진 사례가 보도됐다.",
      type: "industry",
    },
    {
      headline: "서머 리믹스·선공개 싱글 발매 러시",
      detail: "본 컴백 전에 화제성을 끌어올리는 브릿지 전략이 유행이다.",
      type: "trend",
    },
    {
      headline: "직캠 조회수 경쟁 과열, '여름 무대 맛집' 화제",
      detail: "무대 위 표정과 애드리브가 개인 인기의 승부처가 되고 있다.",
      type: "trend",
    },
    {
      headline: "글로벌 스트리밍 플랫폼, K-POP 여름 기획전 편성",
      detail: "해외 노출 창구가 늘며 초동보다 롱런 곡선이 중요해졌다.",
      type: "industry",
    },
    {
      headline: "한여름 게릴라 버스킹 이벤트 유행",
      detail: "팬과의 접점을 늘린 팀들이 코어 팬덤 결속에서 재미를 보고 있다.",
      type: "event",
    },
  ],
  fall: [
    {
      headline: "연말 시상식 앞두고 주요 가수 컴백 러시",
      detail: "레트로·세련·몽환 계열이 업계 내러티브에서 강세를 보인다.",
      type: "industry",
    },
    {
      headline: "올해의 앨범 후보 초집계 공개",
      detail: "디지털과 음반 모두 고르게 잡은 팀이 유리하다는 분석이 나온다.",
      type: "trend",
    },
    {
      headline: "3분기 음반 판매량 역대 최고, 팬덤 체급 전쟁 심화",
      detail: "초동 판매량 경쟁이 그룹의 위상을 가늠하는 핵심 지표가 되었다.",
      type: "industry",
    },
    {
      headline: "가을 감성 컴백 대전, 발라드·시티팝 강세",
      detail: "감성적인 콘셉트가 시즌 무드와 맞물려 차트 상위권을 점령 중이다.",
      type: "trend",
    },
    {
      headline: "연말 시상식 투표 시작, 팬덤 총력전 돌입",
      detail: "팬 투표 비중이 높은 시상식일수록 코어 팬덤의 결속력이 중요하다.",
      type: "event",
    },
    {
      headline: "가을 음방 1위 경쟁, 초접전 구간 진입",
      detail: "음원 점수와 팬덤 투표가 엎치락뒤치락하는 주가 이어지고 있다.",
      type: "trend",
    },
    {
      headline: "대형 콘서트 시즌 개막, 공연장 대관 전쟁",
      detail: "공연 실적은 코어 팬덤의 실체를 증명하는 가장 확실한 지표다.",
      type: "event",
    },
    {
      headline: "업계 재계약 시즌 도래, 이적설 무성",
      detail: "전속계약 만료를 앞둔 팀들의 거취가 업계 최대 관심사로 떠올랐다.",
      type: "industry",
    },
    {
      headline: "해외 어워드 K-POP 부문 신설 발표",
      detail: "글로벌 팬덤 지표가 새로운 커리어 목표로 자리잡고 있다.",
      type: "industry",
    },
    {
      headline: "낙엽 감성 플레이리스트 열풍, 수록곡 재조명",
      detail: "타이틀 외 수록곡의 완성도가 팬덤 유입의 숨은 통로가 되고 있다.",
      type: "trend",
    },
  ],
  winter: [
    {
      headline: "MMA/MAMA/골든디스크 시상식 일정 확정",
      detail: "연말 무대 완성도와 업계 평판이 직접적인 변수로 작동한다.",
      type: "event",
    },
    {
      headline: "연말 결산: 올해 K-POP 키워드는 레트로와 Y2K",
      detail: "트렌드 피로도가 누적되며 세련된 정체성 유지가 중요해지고 있다.",
      type: "trend",
    },
    {
      headline: "연말 시상식 대상 후보군 확정",
      detail: "올해 가장 강력한 성적을 기록한 팀들의 최종 경쟁이 시작된다.",
      type: "event",
    },
    {
      headline: "크리스마스·겨울 콘셉트 컴백 시즌 진입",
      detail: "몽환·감성 계열이 연말 시장에서 유리한 위치를 선점하고 있다.",
      type: "trend",
    },
    {
      headline: "올해 음반 총판매량 전년 대비 18% 증가",
      detail: "팬덤 경제의 성장세가 업계 전체의 투자 심리를 끌어올리고 있다.",
      type: "industry",
    },
    {
      headline: "연말 무대 콜라보 라인업 유출설로 온라인 들썩",
      detail: "특별 무대 한 번이 다음 해 커리어의 방향을 바꾸기도 한다.",
      type: "event",
    },
    {
      headline: "시상식 드레스코드와 레드카펫 화제성 경쟁",
      detail: "무대 밖 노출도 비주얼·패션 계열 팀에게는 실질적인 기회다.",
      type: "trend",
    },
    {
      headline: "내년 데뷔 예정 신인 라인업 윤곽",
      detail: "다음 시즌의 경쟁 구도가 벌써부터 짜이고 있다.",
      type: "competitor",
    },
    {
      headline: "겨울 발라드 음원 강세, 차트 장기전 돌입",
      detail: "화력 싸움보다 곡의 체급이 오래 버티는 시즌이다.",
      type: "trend",
    },
    {
      headline: "연말 결산 방송, 올해의 무대 다시보기 열풍",
      detail: "한 해 동안 쌓인 무대 아카이브가 뒤늦게 신규 팬을 데려온다.",
      type: "industry",
    },
  ],
};

export const DEFAULT_MARKET_TRENDS: Record<
  Season,
  {
    hotGenre: Genre;
    coldGenre: Genre;
    hotMood: ConceptMood;
    coldMood: ConceptMood;
  }
> = {
  spring: {
    hotGenre: "dancePop",
    coldGenre: "rock",
    hotMood: "refreshing",
    coldMood: "dark",
  },
  summer: {
    hotGenre: "edm",
    coldGenre: "ballad",
    hotMood: "powerful",
    coldMood: "dreamy",
  },
  fall: {
    hotGenre: "cityPop",
    coldGenre: "trot",
    hotMood: "retro",
    coldMood: "cute",
  },
  winter: {
    hotGenre: "ballad",
    coldGenre: "hiphop",
    hotMood: "dreamy",
    coldMood: "refreshing",
  },
};

export const MARKET_TREND_ROTATION_RULE =
  "시즌 전환 시 hotGenre/coldGenre/hotMood/coldMood를 갱신한다.";
