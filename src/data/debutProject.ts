import { DEBUT_REQUIREMENTS } from "@/data/balance";
import type { ProjectDefinition } from "@/types/game";

export const DEBUT_PROJECT_ID = "debut-project";
export const TITLE_TRACK_SELECTION_DECISION_ID = "titleTrackSelection";
export const DEBUT_POSITION_TRIAL_WEEK = 6;

/**
 * 첫 데뷔를 20주짜리 여섯 미니 시즌으로 편집한다. 이벤트는 스테이지
 * 진입 시 한 번만 스폰되며, 재생/저장 후에도 ProjectInstance가 중복을 막는다.
 */
export const DEBUT_PROJECT: ProjectDefinition = {
  id: DEBUT_PROJECT_ID,
  kind: "debut",
  title: "첫 데뷔 프로젝트",
  allowsOverlap: false,
  stages: [
    {
      id: "observation",
      title: "멤버 관찰",
      summary: "각 멤버의 강점과 팀 안에서의 역할을 찾는 기간",
      weekWindow: [1, 3],
      eventIds: [],
      unlocks: "포지션 선발전",
    },
    {
      id: "position-evaluation",
      title: "포지션 선발전 준비 · 곡 후보",
      summary: "가배정 역할을 집중 훈련하고 선발전과 데뷔곡 후보를 준비한다",
      weekWindow: [4, 6],
      eventIds: ["debut-position-evaluation", "debut-song-candidates"],
      unlocks: "포지션 최종 확정",
    },
    {
      id: "concept-test",
      title: "콘셉트 테스트",
      summary: "멤버 핏과 시장 반응을 비교해 데뷔 색을 정한다",
      weekWindow: [7, 9],
      eventIds: ["debut-concept-test", "debut-unit-chemistry"],
      unlocks: "타이틀 결정",
    },
    {
      id: "title-decision",
      title: "타이틀 결정",
      summary: "후보곡 중 팀의 첫인상을 책임질 타이틀을 확정한다",
      weekWindow: [10, 13],
      eventIds: ["debut-title-decision"],
      unlocks: "쇼케이스 리허설",
    },
    {
      id: "showcase-rehearsal",
      title: "쇼케이스 리허설",
      summary: "보컬·준비도·팀워크를 공개 무대 수준으로 끌어올린다",
      weekWindow: [14, 17],
      entryRequirements: [
        { metric: "titleTrackSelected", target: 1, label: "타이틀곡 확정" },
      ],
      eventIds: ["debut-showcase-rehearsal"],
      unlocks: "데뷔 프로모션",
    },
    {
      id: "debut-promotion",
      title: "데뷔 프로모션",
      summary: "티저와 쇼케이스를 공개하고 첫 차트 진입을 준비한다",
      weekWindow: [18, DEBUT_REQUIREMENTS.projectWeeks],
      entryRequirements: [
        { metric: "showcasePassed", target: 1, label: "쇼케이스 통과" },
        { metric: "titleTrackSelected", target: 1, label: "타이틀곡 확정" },
      ],
      eventIds: ["debut-promotion-launch"],
      unlocks: "앨범 발매 · 차트 공개",
    },
  ],
};

export const PROJECT_DEFINITIONS = [DEBUT_PROJECT] satisfies ProjectDefinition[];

export const PROJECT_DEFINITIONS_BY_ID = new Map(
  PROJECT_DEFINITIONS.map((definition) => [definition.id, definition]),
);
