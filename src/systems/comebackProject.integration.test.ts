import { describe, expect, it } from "vitest";
import { TITLE_TRACK_SELECTION_DECISION_ID } from "@/data/debutProject";
import { initialAlbumState } from "@/stores/albumStore";
import {
  canStartComebackProject,
  createComebackPlan,
} from "@/systems/comebackSystem";
import {
  processWeek,
  type GameSnapshot,
  type PlayerDecisions,
} from "@/systems/weekProcessor";
import { makeGameSnapshot } from "@/test/gameStateFixture";
import type { Album } from "@/types/game";

const NO_DECISIONS: PlayerDecisions = {
  trainingSchedule: { intensity: "normal", restDay: false },
  resolvedDecisions: [],
};

const START_WEEK = 25;

function makeDebutedSnapshot(): GameSnapshot {
  const snapshot = makeGameSnapshot({ week: START_WEEK });
  snapshot.game.currentPhase = "debut";
  const debutTemplate = structuredClone(initialAlbumState.currentAlbum);
  if (!debutTemplate) throw new Error("Missing initial album fixture.");
  const debutAlbum: Album = {
    ...debutTemplate,
    id: "album-debut",
    titleTrack: debutTemplate.titleTrackCandidates[0],
    quality: 62,
    releaseWeek: 20,
    performance: {
      chartPeak: 14,
      chartPower: 42,
      firstWeekSales: 48000,
      totalStreams: 5200000,
      fanGrowth: 6,
    },
  };
  snapshot.album = {
    currentAlbum: null,
    releasedAlbums: [debutAlbum],
    conceptHistory: ["refreshing"],
  };
  snapshot.fandom = {
    ...snapshot.fandom,
    public: 32,
    fandom: 28,
    industry: 30,
    chartPositions: { melon: 40, spotify: 42, youtube: 44, albumSales: 41 },
  };
  snapshot.trainee.trainees = snapshot.trainee.trainees.map((trainee, index) => ({
    ...trainee,
    stats: { ...trainee.stats, vocal: 64, dance: 62 },
    chemistry: { [snapshot.trainee.trainees[index === 0 ? 1 : 0].id]: 35 },
  }));
  return snapshot;
}

function startComeback(
  snapshot: GameSnapshot,
  startedAtWeek: number,
): GameSnapshot {
  const plan = createComebackPlan({
    concept: { genre: "dancePop", mood: "y2k" },
    startedAtWeek,
    season: snapshot.game.currentSeason,
    trainees: snapshot.trainee.trainees,
    conceptHistory: snapshot.album.conceptHistory,
  });
  return {
    ...snapshot,
    game: {
      ...snapshot.game,
      activeProjects: [...snapshot.game.activeProjects, plan.project],
    },
    album: { ...snapshot.album, currentAlbum: plan.album },
  };
}

function playComeback(weeks = 14, selectTitleTrack = true) {
  let snapshot = startComeback(makeDebutedSnapshot(), START_WEEK);
  const eventWeeks = new Map<string, number>();
  const reports: ReturnType<typeof processWeek>["weekReport"][] = [];

  for (let relativeWeek = 1; relativeWeek <= weeks; relativeWeek++) {
    const result = processWeek(snapshot, NO_DECISIONS);
    for (const event of result.weekReport.events) {
      eventWeeks.set(event.id.split(":w")[0], relativeWeek);
    }
    reports.push(result.weekReport);
    snapshot = result.newState;

    const project = snapshot.game.activeProjects.find(
      (candidate) => candidate.kind === "comeback",
    );
    if (
      selectTitleTrack &&
      project?.decisionStatuses[TITLE_TRACK_SELECTION_DECISION_ID] ===
        "available" &&
      snapshot.album.currentAlbum &&
      snapshot.album.currentAlbum.titleTrackCandidates.length > 0
    ) {
      const selectedTrack = snapshot.album.currentAlbum.titleTrackCandidates[0];
      snapshot = {
        ...snapshot,
        game: {
          ...snapshot.game,
          activeProjects: snapshot.game.activeProjects.map((candidate) =>
            candidate.id === project.id
              ? {
                  ...candidate,
                  decisionStatuses: {
                    ...candidate.decisionStatuses,
                    [TITLE_TRACK_SELECTION_DECISION_ID]: "completed",
                  },
                }
              : candidate,
          ),
        },
        album: {
          ...snapshot.album,
          currentAlbum: {
            ...snapshot.album.currentAlbum,
            titleTrack: { ...selectedTrack },
          },
        },
      };
    }
  }
  return { snapshot, eventWeeks, reports };
}

describe("14주 컴백 프로젝트", () => {
  it("컨셉 조사부터 발매·음악방송·정산까지 완주하고 성장기로 전환한다", () => {
    const result = playComeback();
    const project = result.snapshot.game.activeProjects.find(
      (candidate) => candidate.kind === "comeback",
    );

    expect(project?.status).toBe("completed");
    expect(project?.currentStageId).toBe("settlement");
    expect(project?.releasedAlbumId).toBeDefined();
    expect(project?.evaluations.musicShow).toBeDefined();
    expect(project?.evaluations.settlement).toBeDefined();

    // 발매: 두 번째 앨범이 차트 개봉 연출과 함께 커밋된다.
    expect(result.snapshot.album.releasedAlbums).toHaveLength(2);
    expect(result.snapshot.album.currentAlbum).toBeNull();
    expect(result.snapshot.album.conceptHistory).toEqual(["refreshing", "y2k"]);
    const releaseReport = result.reports.find((report) =>
      report.events.some((event) => event.presentation?.kind === "chart-reveal"),
    );
    expect(releaseReport?.week).toBe(START_WEEK + 11);

    // 음악방송: 발매 다음 스테이지에서 1위 대결 연출이 열린다.
    const musicShowReport = result.reports.find((report) =>
      report.events.some((event) => event.presentation?.kind === "music-show"),
    );
    expect(musicShowReport).toBeDefined();

    // 정산: 리포트가 격상되고 다음 사이클 훅을 제시한다.
    const settlementReport = result.reports.find(
      (report) => report.comebackSettlement,
    );
    expect(settlementReport?.comebackSettlement).toEqual(
      expect.objectContaining({
        projectId: project?.id,
        chartPeak: expect.any(Number),
        musicShowWon: expect.any(Boolean),
      }),
    );
    expect(settlementReport?.comebackSettlement?.nextHook).toContain("다음");

    // phase 게이트: 첫 컴백 정산이 debut→growth를 연다.
    expect(result.snapshot.game.currentPhase).toBe("growth");
  });

  it("타이틀곡을 고르지 않으면 파트 분배 게이트에서 진행을 막는다", () => {
    const result = playComeback(10, false);
    const project = result.snapshot.game.activeProjects.find(
      (candidate) => candidate.kind === "comeback",
    );

    expect(project?.currentStageId).toBe("title-decision");
    expect(project?.status).toBe("blocked");
    expect(project?.decisionStatuses[TITLE_TRACK_SELECTION_DECISION_ID]).toBe(
      "available",
    );
    expect(result.snapshot.album.currentAlbum?.titleTrack).toBeNull();
    expect(result.snapshot.album.releasedAlbums).toHaveLength(1);
  });

  it("사전 반응 스테이지가 팬덤 기대치 계산을 발매 전에 공개한다", () => {
    const result = playComeback();
    const briefingWeek = [...result.eventWeeks.entries()].find(([id]) =>
      id.includes("comeback-expectation-briefing"),
    )?.[1];
    expect(briefingWeek).toBe(11);
    const briefing = result.reports
      .flatMap((report) => report.events)
      .find((event) => event.id.includes("comeback-expectation-briefing"));
    // refreshing → y2k는 인접 무드라 점진 변화 안내가 나와야 한다.
    expect(briefing?.description).toContain("변화");
  });

  it("같은 입력의 14주 리플레이가 결정론적으로 동일하다", () => {
    const first = playComeback();
    expect(playComeback()).toEqual(first);
  });

  it("발매 후 활동기에는 다음 컴백 기획이 중첩될 수 있다", () => {
    // 발매 전에는 제작 슬롯이 차 있어 새 기획을 시작할 수 없다.
    const midCycle = playComeback(6).snapshot;
    expect(
      canStartComebackProject(
        midCycle.game.currentPhase,
        midCycle.game.activeProjects,
        midCycle.album.currentAlbum,
      ),
    ).toBe(false);

    // 발매(12주차) 이후에는 슬롯이 비어 중첩 시작이 가능하다.
    const afterRelease = playComeback(13).snapshot;
    expect(afterRelease.album.currentAlbum).toBeNull();
    expect(
      canStartComebackProject(
        afterRelease.game.currentPhase,
        afterRelease.game.activeProjects,
        afterRelease.album.currentAlbum,
      ),
    ).toBe(true);

    // 두 인스턴스가 같은 배열에서 독립적으로 진행된다.
    let snapshot = startComeback(afterRelease, START_WEEK + 13);
    snapshot = processWeek(snapshot, NO_DECISIONS).newState;
    const comebacks = snapshot.game.activeProjects.filter(
      (candidate) => candidate.kind === "comeback",
    );
    expect(comebacks).toHaveLength(2);
    expect(comebacks[0].status).toBe("completed");
    expect(comebacks[1].currentStageId).toBe("concept-research");
    expect(snapshot.album.currentAlbum).not.toBeNull();
  });
});
