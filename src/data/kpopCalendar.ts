import type { ConceptMood, Genre, KPopNews, Season } from "@/types/game";

export const SEASONAL_NEWS_TEMPLATES: Record<Season, string[]> = {
  spring: [
    "[대형 기획사]의 신인 [그룹명], 다음 달 데뷔 예정",
    "신인 시즌 개막, 이번 분기 데뷔 팀 [N]팀 예상",
  ],
  summer: [
    "여름 시즌 컴백 경쟁 치열, 이번 주만 [N]팀 동시 컴백",
    "음악 페스티벌 라인업 공개",
  ],
  fall: [
    "연말 시상식 앞두고 주요 가수 컴백 러시",
    "올해의 앨범 후보 초집계",
  ],
  winter: [
    "MMA/MAMA/골든디스크 시상식 일정 확정",
    "연말 결산: 올해 K-POP 키워드는?",
  ],
};

export const GENERIC_NEWS_TEMPLATES = [
  "[경쟁그룹명] 컴백 D-[N]",
  "[장르] 트렌드 [상승/하락]세",
  "아이돌 서바이벌 프로그램 화제",
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
    hotGenre: "dancePop", // 봄은 대중적이고 가벼운 메인스트림 장르가 유리하다.
    coldGenre: "rock", // 록은 초봄 데뷔 시장과 잘 맞지 않는 편이다.
    hotMood: "refreshing", // 청량은 봄의 대표 승부수다.
    coldMood: "dark", // 다크는 봄 시장에서는 역풍을 맞기 쉽다.
  },
  summer: {
    hotGenre: "edm", // 페스티벌 시즌에는 EDM이 강한 체감을 줘야 한다.
    coldGenre: "ballad", // 발라드는 여름 경쟁 구도에서 상대적으로 약세다.
    hotMood: "powerful", // 여름 무대 시즌엔 강한 퍼포먼스가 먹힌다.
    coldMood: "dreamy", // 몽환은 계절 수요상 다소 불리하다.
  },
  fall: {
    hotGenre: "cityPop", // 가을에는 레트로/도시 감성이 잘 붙는다.
    coldGenre: "trot", // 트로트는 일반 아이돌 가을 메타에서 비주류다.
    hotMood: "retro", // 가을 복고 수요는 플레이에 명확히 보상해야 한다.
    coldMood: "cute", // 귀여운 톤은 가을의 분위기와 약간 어긋난다.
  },
  winter: {
    hotGenre: "ballad", // 겨울은 감성 보컬 장르가 강해야 한다.
    coldGenre: "hiphop", // 힙합은 연말 무드와 일부 충돌한다.
    hotMood: "dreamy", // 겨울은 몰입형 감성 콘셉트가 강하다.
    coldMood: "refreshing", // 청량은 한겨울엔 상대적으로 힘이 빠진다.
  },
};

export const MARKET_TREND_ROTATION_RULE =
  "시즌 전환 시 hotGenre/coldGenre/hotMood/coldMood를 갱신한다.";
