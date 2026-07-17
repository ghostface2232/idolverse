import { describe, expect, it } from "vitest";
import {
  DEBUT_PROJECT,
  TITLE_TRACK_SELECTION_DECISION_ID,
} from "@/data/debutProject";
import { initialAlbumState } from "@/stores/albumStore";
import { createProjectInstance } from "@/systems/projectSystem";
import {
  processWeek,
  type GameSnapshot,
  type PlayerDecisions,
} from "@/systems/weekProcessor";
import { makeGameSnapshot } from "@/test/gameStateFixture";

const NO_DECISIONS: PlayerDecisions = {
  trainingSchedule: { intensity: "normal", restDay: false },
  resolvedDecisions: [],
};

function makeDebutSnapshot(): GameSnapshot {
  const snapshot = makeGameSnapshot({ week: 1 });
  snapshot.game.activeProjects = [createProjectInstance(DEBUT_PROJECT, 1)];
  snapshot.album = structuredClone(initialAlbumState);
  snapshot.trainee.trainees = snapshot.trainee.trainees.map((trainee, index) => ({
    ...trainee,
    stats: { ...trainee.stats, vocal: 64, dance: 62 },
    chemistry: { [snapshot.trainee.trainees[index === 0 ? 1 : 0].id]: 35 },
  }));
  return snapshot;
}

function playDebut(selectTitleTrack = true) {
  let snapshot = makeDebutSnapshot();
  const eventWeeks = new Map<string, number>();
  let releaseReport: ReturnType<typeof processWeek>["weekReport"] | null = null;

  for (let relativeWeek = 1; relativeWeek <= 20; relativeWeek++) {
    const result = processWeek(snapshot, NO_DECISIONS);
    for (const event of result.weekReport.events) {
      eventWeeks.set(event.id.split(":w")[0], relativeWeek);
    }
    if (
      result.weekReport.events.some(
        (event) => event.presentation?.kind === "chart-reveal",
      )
    ) {
      releaseReport = result.weekReport;
    }
    snapshot = result.newState;
    const project = snapshot.game.activeProjects[0];
    if (
      selectTitleTrack &&
      project.decisionStatuses[TITLE_TRACK_SELECTION_DECISION_ID] ===
        "available" &&
      snapshot.album.currentAlbum
    ) {
      const selectedTrack = snapshot.album.currentAlbum.titleTrackCandidates.find(
        (track) => track.id === "track-safe",
      );
      if (!selectedTrack) throw new Error("Missing safe title track candidate.");
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
  return { snapshot, eventWeeks, releaseReport };
}

describe("20주 데뷔 프로젝트", () => {
  it("6단계·쇼케이스·발매 평가·차트 개봉까지 완료한다", () => {
    const result = playDebut();
    const project = result.snapshot.game.activeProjects[0];
    expect(project.currentStageId).toBe("debut-promotion");
    expect(project.status).toBe("completed");
    expect(project.evaluations.showcase.passed).toBe(true);
    expect(result.snapshot.game.currentPhase).toBe("debut");
    expect(result.snapshot.album.currentAlbum).toBeNull();
    expect(result.snapshot.album.releasedAlbums).toHaveLength(1);
    expect(result.snapshot.album.releasedAlbums[0].titleTrack?.id).toBe(
      "track-safe",
    );
    expect(result.snapshot.album.releasedAlbums[0].quality).toBeGreaterThan(0);
    expect(result.snapshot.fandom.chartPositions.melon).toBeGreaterThan(0);
    expect(
      result.releaseReport?.events.some(
        (event) => event.presentation?.kind === "chart-reveal",
      ),
    ).toBe(true);
  });

  it("타이틀곡을 고르지 않으면 자동 선택하지 않고 프로젝트 진행을 막는다", () => {
    const result = playDebut(false);
    const project = result.snapshot.game.activeProjects[0];

    expect(project.currentStageId).toBe("title-decision");
    expect(project.status).toBe("blocked");
    expect(project.decisionStatuses[TITLE_TRACK_SELECTION_DECISION_ID]).toBe(
      "available",
    );
    expect(result.snapshot.album.currentAlbum?.titleTrack).toBeNull();
    expect(result.snapshot.album.releasedAlbums).toHaveLength(0);
    expect(result.releaseReport).toBeNull();
  });

  it("보장 사건이 창을 넘지 않고 같은 입력의 20주 리플레이가 동일하다", () => {
    const first = playDebut();
    expect(playDebut()).toEqual(first);

    const weekFor = (fragment: string) =>
      [...first.eventWeeks.entries()].find(([id]) => id.includes(fragment))?.[1];
    expect(weekFor("debut-personal-strength")).toBeGreaterThanOrEqual(2);
    expect(weekFor("debut-personal-strength")).toBeLessThanOrEqual(4);
    expect(weekFor("debut-rival-arrival")).toBeGreaterThanOrEqual(8);
    expect(weekFor("debut-rival-arrival")).toBeLessThanOrEqual(12);
    expect(weekFor("debut-public-evaluation")).toBeGreaterThanOrEqual(12);
    expect(weekFor("debut-public-evaluation")).toBeLessThanOrEqual(16);
  });

  it("발매 다음 주에는 차트 감쇠가 배선된다", () => {
    const completed = playDebut().snapshot;
    const before = completed.fandom.chartPositions.melon;
    const next = processWeek(completed, NO_DECISIONS).newState;
    expect(next.fandom.chartPositions.melon).toBeGreaterThan(before);
  });
});
