import { COMEBACK_REQUIREMENTS } from "@/data/balance";
import type { ConceptMood, ProjectDefinition } from "@/types/game";

export const COMEBACK_PROJECT_ID = "comeback-project";

/**
 * 컴백을 14주짜리 열 단계 사이클로 편집한다. 데뷔(M2)의 projectSystem
 * 프레임을 그대로 사용하며, allowsOverlap으로 발매 이후 활동기에
 * 다음 앨범의 컨셉 조사가 중첩될 수 있다.
 */
export const COMEBACK_PROJECT: ProjectDefinition = {
  id: COMEBACK_PROJECT_ID,
  kind: "comeback",
  title: "컴백 프로젝트",
  allowsOverlap: true,
  stages: [
    {
      id: "concept-research",
      title: "컨셉 조사",
      summary: "시장 트렌드와 팬 기대치를 읽고 이번 컴백의 색을 정한다",
      weekWindow: [1, 2],
      eventIds: ["comeback-concept-research"],
      unlocks: "곡 후보 수집",
    },
    {
      id: "song-candidates",
      title: "곡 후보",
      summary: "프로듀서가 서로 다른 승부수를 가진 타이틀 후보를 모은다",
      weekWindow: [3, 4],
      eventIds: ["comeback-song-candidates"],
      unlocks: "타이틀 결정",
    },
    {
      id: "title-decision",
      title: "타이틀 결정",
      summary: "후보곡 중 이번 활동의 얼굴이 될 타이틀을 확정한다",
      weekWindow: [5, 6],
      eventIds: [],
      unlocks: "파트 분배",
    },
    {
      id: "part-assignment",
      title: "파트 분배",
      summary: "확정된 타이틀의 파트와 무대 동선을 멤버에게 배분한다",
      weekWindow: [7, 7],
      entryRequirements: [
        { metric: "titleTrackSelected", target: 1, label: "타이틀곡 확정" },
      ],
      eventIds: ["comeback-part-assignment"],
      unlocks: "집중 연습",
    },
    {
      id: "practice",
      title: "집중 연습",
      summary: "녹음과 안무를 발매 수준까지 끌어올리는 막바지 구간",
      weekWindow: [8, 9],
      eventIds: ["comeback-recording-accident", "comeback-choreo-draft"],
      unlocks: "티저 공개",
    },
    {
      id: "teaser",
      title: "티저 공개",
      summary: "첫 티저가 공개되고 시장의 시선이 모이기 시작한다",
      weekWindow: [10, 10],
      eventIds: ["comeback-teaser-reaction"],
      unlocks: "사전 반응 조사",
    },
    {
      id: "pre-reaction",
      title: "사전 반응",
      summary: "팬덤 기대치와 시장 반응을 발매 전에 미리 읽는다",
      weekWindow: [11, 11],
      eventIds: ["comeback-expectation-briefing"],
      unlocks: "발매",
    },
    {
      // 준비도는 게이트가 아니다 — 낮아도 12주차에 발매되고, 완성도는
      // progressMult를 통해 품질·차트·판매로 귀결된다.
      id: "release",
      title: "발매",
      summary: "앨범이 공개되고 첫 차트 순위가 집계된다",
      weekWindow: [COMEBACK_REQUIREMENTS.releaseWeek, COMEBACK_REQUIREMENTS.releaseWeek],
      entryRequirements: [
        { metric: "titleTrackSelected", target: 1, label: "타이틀곡 확정" },
      ],
      eventIds: [],
      unlocks: "음악방송 활동",
    },
    {
      // 발매 후 활동기 — 매주 음악방송(후보권 진입 시 1위 대결)과 프로모션
      // 실행이 열리는, 사이클에서 가장 뜨거운 구간이다.
      id: "activity",
      title: "활동기",
      summary: "음악방송과 프로모션이 몰아치는 컴백의 정점",
      weekWindow: [
        COMEBACK_REQUIREMENTS.releaseWeek + 1,
        COMEBACK_REQUIREMENTS.releaseWeek + COMEBACK_REQUIREMENTS.activityWeeks,
      ],
      entryRequirements: [
        { metric: "albumReleased", target: 1, label: "앨범 발매" },
      ],
      eventIds: [],
      unlocks: "활동 정산",
    },
    {
      id: "settlement",
      title: "정산·회고",
      summary: "이번 활동의 성과를 정리하고 다음 사이클의 질문을 꺼낸다",
      weekWindow: [COMEBACK_REQUIREMENTS.projectWeeks, COMEBACK_REQUIREMENTS.projectWeeks],
      entryRequirements: [
        { metric: "albumReleased", target: 1, label: "앨범 발매" },
      ],
      eventIds: [],
      unlocks: "다음 앨범 기획",
    },
  ],
};

/** 발매 전 단계에서 앨범(currentAlbum)을 소유하는 스테이지들. 중첩 대기 판단에 쓴다. */
export const COMEBACK_PRE_RELEASE_STAGE_IDS = new Set(
  COMEBACK_PROJECT.stages
    .slice(
      0,
      COMEBACK_PROJECT.stages.findIndex((stage) => stage.id === "release") + 1,
    )
    .map((stage) => stage.id),
);

/** 컨셉 무드별 컴백 앨범 타이틀 풀. 시드 기반으로 하나를 고른다. */
export const MOOD_ALBUM_TITLES: Record<ConceptMood, string[]> = {
  refreshing: ["Clear Sky", "First Splash", "푸른 신호"],
  dark: ["Black Mirror", "After Midnight", "그림자 극장"],
  retro: ["Rewind Club", "네온 극장", "1994"],
  girlCrush: ["No Apology", "Crown Zone", "선전포고"],
  cute: ["Marshmallow", "두근두근 로그", "Cherry Pop"],
  sophisticated: ["Velvet Hour", "미드나잇 살롱", "Noir Blanc"],
  powerful: ["Ignition", "돌파", "Full Throttle"],
  dreamy: ["Lucid", "달의 정원", "Slow Orbit"],
  y2k: ["Dial-Up Love", "Y2K Diary", "글리터 시티"],
  sexy: ["Red Light", "새벽 두 시", "Silk"],
};
