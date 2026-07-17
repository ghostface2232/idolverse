import { describe, expect, it } from "vitest";
import { DEBUT_PROJECT } from "@/data/debutProject";
import {
  advanceProject,
  createProjectInstance,
  type ProjectMetrics,
} from "@/systems/projectSystem";

const READY: ProjectMetrics = {
  elapsedWeeks: 20,
  readiness: 90,
  averageVocal: 65,
  showcasePassed: 1,
  titleTrackSelected: 1,
  albumReleased: 1,
};

describe("projectSystem", () => {
  it("주차 창에 따라 여러 단계를 따라잡고 진입 이벤트를 한 번만 만든다", () => {
    const initial = createProjectInstance(DEBUT_PROJECT, 1);
    const advanced = advanceProject(DEBUT_PROJECT, initial, 10, READY);
    expect(advanced.project.currentStageId).toBe("title-decision");
    expect(advanced.enteredStages.map((stage) => stage.id)).toEqual([
      "position-evaluation",
      "concept-test",
      "title-decision",
    ]);

    const replay = advanceProject(DEBUT_PROJECT, advanced.project, 10, READY);
    expect(replay.enteredStages).toHaveLength(0);
    expect(replay.spawnedEventIds).toHaveLength(0);
  });

  it("쇼케이스 게이트를 통과하기 전에는 프로모션 단계에 진입하지 않는다", () => {
    const initial = createProjectInstance(DEBUT_PROJECT, 1);
    const blocked = advanceProject(DEBUT_PROJECT, initial, 20, {
      ...READY,
      showcasePassed: 0,
    });
    expect(blocked.project.currentStageId).toBe("showcase-rehearsal");
    expect(blocked.project.status).toBe("blocked");

    const passed = advanceProject(DEBUT_PROJECT, blocked.project, 20, READY);
    expect(passed.project.currentStageId).toBe("debut-promotion");
    expect(passed.project.status).toBe("completed");
  });

  it("복수 프로젝트 인스턴스는 시작 주와 이벤트 기록을 독립적으로 가진다", () => {
    const first = createProjectInstance(DEBUT_PROJECT, 1, "debut:first");
    const second = createProjectInstance(DEBUT_PROJECT, 30, "debut:second");
    const firstResult = advanceProject(DEBUT_PROJECT, first, 10, READY);
    const secondResult = advanceProject(DEBUT_PROJECT, second, 30, READY);
    expect(firstResult.project.currentStageId).toBe("title-decision");
    expect(secondResult.project.currentStageId).toBe("observation");
    expect(secondResult.project.spawnedEventIds).toHaveLength(0);
  });
});
