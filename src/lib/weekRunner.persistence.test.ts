import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/saveSystem", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/saveSystem")>();
  return {
    ...actual,
    saveGame: vi.fn(),
  };
});

import {
  captureGameState,
  hydrateGameState,
  saveGame,
  type GameStateSnapshot,
} from "@/lib/saveSystem";
import {
  applyEventChoiceAndSave,
  completePresentationEventAndSave,
  completeTitleTrackSelectionAndSave,
  runWeekAndSave,
  startComebackProjectAndSave,
  upgradeFacilityAndSave,
} from "@/lib/weekRunner";
import { COMEBACK_BUDGET_TIERS_BY_ID } from "@/data/balance";
import {
  DEBUT_PROJECT,
  TITLE_TRACK_SELECTION_DECISION_ID,
} from "@/data/debutProject";
import { initialAlbumState } from "@/stores/albumStore";
import { createProjectInstance } from "@/systems/projectSystem";
import { makeGameSnapshot, toGameStateSnapshot } from "@/test/gameStateFixture";
import type { GameEvent } from "@/types/game";

const saveGameMock = vi.mocked(saveGame);

describe("durable weekly workflow", () => {
  beforeEach(() => {
    saveGameMock.mockReset();
  });

  it("이벤트 저장 실패 시 효과와 resolved 상태를 로컬에 남기지 않는다", async () => {
    const event = prepareEventFocus();
    const before = captureGameState();
    saveGameMock.mockRejectedValueOnce(new Error("network"));

    await expect(
      applyEventChoiceAndSave(event, 0, "user", 1),
    ).rejects.toThrow("network");
    expect(captureGameState()).toEqual(before);
  });

  it("이벤트 저장 성공 후 선택 index와 효과를 함께 commit한다", async () => {
    const event = prepareEventFocus();
    saveGameMock.mockImplementation(async (_userId, _slotNumber, gameState) =>
      createSavedResult(gameState),
    );

    await applyEventChoiceAndSave(event, 0, "user", 1);

    const committed = captureGameState();
    expect(committed.financeStore.money).toBe(1_000_000_100);
    expect(committed.eventStore.pendingEvents[0]).toEqual(
      expect.objectContaining({ resolved: true, resolvedChoiceIndex: 0 }),
    );
  });

  it("차트 공개 해결과 큐 이동을 한 번의 저장으로 commit한다", async () => {
    const event = prepareChartRevealFocus();
    saveGameMock.mockImplementation(async (_userId, _slotNumber, gameState) =>
      createSavedResult(gameState),
    );

    await completePresentationEventAndSave(event.id, "user", 1);

    expect(saveGameMock).toHaveBeenCalledTimes(1);
    const committed = captureGameState();
    expect(committed.eventStore.pendingEvents[0]).toEqual(
      expect.objectContaining({ resolved: true, resolvedChoiceIndex: null }),
    );
    expect(committed.gameStore.weeklyFlow.state).toBe("planning_ready");
    expect(committed.gameStore.weeklyFlow.eventQueueIds).toEqual([]);
  });

  it("이미 해결된 차트 공개는 큐 이동만 저장해 재시도할 수 있다", async () => {
    const event = prepareChartRevealFocus(true);
    saveGameMock.mockImplementation(async (_userId, _slotNumber, gameState) =>
      createSavedResult(gameState),
    );

    await completePresentationEventAndSave(event.id, "user", 1);

    expect(saveGameMock).toHaveBeenCalledTimes(1);
    expect(captureGameState().gameStore.weeklyFlow.state).toBe(
      "planning_ready",
    );
  });

  it("차트 공개 완료 저장 실패 시 해결 상태와 큐를 로컬에 남기지 않는다", async () => {
    const event = prepareChartRevealFocus();
    const before = captureGameState();
    saveGameMock.mockRejectedValueOnce(new Error("network"));

    await expect(
      completePresentationEventAndSave(event.id, "user", 1),
    ).rejects.toThrow("network");
    expect(captureGameState()).toEqual(before);
  });

  it("주간 저장이 끝날 때까지 resolving을 유지하고 성공 후 report_ready를 commit한다", async () => {
    const snapshot = makeGameSnapshot({ week: 5 });
    snapshot.game.weeklyDecisions = [];
    hydrateGameState(toGameStateSnapshot(snapshot));
    let releaseSave!: () => void;
    const saveGate = new Promise<void>((resolve) => {
      releaseSave = resolve;
    });
    saveGameMock.mockImplementation(async (_userId, _slotNumber, gameState) => {
      await saveGate;
      return createSavedResult(gameState);
    });

    const running = runWeekAndSave(
      {
        trainingSchedule: { intensity: "normal", restDay: false },
        resolvedDecisions: [],
      },
      "user",
      1,
    );

    expect(captureGameState().gameStore.weeklyFlow.state).toBe("resolving");
    expect(captureGameState().gameStore.currentWeek).toBe(5);

    releaseSave();
    await running;

    expect(captureGameState().gameStore.weeklyFlow.state).toBe("report_ready");
    expect(captureGameState().gameStore.currentWeek).toBe(6);
    expect(captureGameState().gameStore.saveRevision).toBe(1);
  });

  it("캠페인이 끝난 세이브는 주간 진행을 저장 전에 거부한다", async () => {
    const snapshot = makeGameSnapshot({ week: 5 });
    snapshot.game.campaignFailure = { reason: "bankruptcy", year: 2, week: 4 };
    hydrateGameState(toGameStateSnapshot(snapshot));

    await expect(
      runWeekAndSave(
        {
          trainingSchedule: { intensity: "normal", restDay: false },
          resolvedDecisions: [],
        },
        "user",
        1,
      ),
    ).rejects.toThrow("Campaign is over");
    expect(saveGameMock).not.toHaveBeenCalled();
  });

  it("선택한 타이틀곡 전략을 자동 교체하지 않고 프로젝트와 함께 저장한다", async () => {
    const snapshot = makeGameSnapshot({ week: 10 });
    const project = createProjectInstance(DEBUT_PROJECT, 1);
    snapshot.game.activeProjects = [
      {
        ...project,
        currentStageId: "title-decision",
        decisionStatuses: { [TITLE_TRACK_SELECTION_DECISION_ID]: "available" },
      },
    ];
    snapshot.album = structuredClone(initialAlbumState);
    hydrateGameState(toGameStateSnapshot(snapshot));
    saveGameMock.mockImplementation(async (_userId, _slotNumber, gameState) =>
      createSavedResult(gameState),
    );

    await completeTitleTrackSelectionAndSave(
      project.id,
      "track-safe",
      "user",
      1,
    );

    const committed = captureGameState();
    expect(committed.albumStore.currentAlbum?.titleTrack?.id).toBe("track-safe");
    expect(
      committed.gameStore.activeProjects[0].decisionStatuses[
        TITLE_TRACK_SELECTION_DECISION_ID
      ],
    ).toBe("completed");
    expect(saveGameMock).toHaveBeenCalledTimes(1);
  });

  it("컴백 기획은 제작 예산을 차감하고 프로젝트·앨범과 함께 저장한다", async () => {
    const snapshot = makeGameSnapshot({ week: 30 });
    snapshot.game.currentPhase = "debut";
    hydrateGameState(toGameStateSnapshot(snapshot));
    saveGameMock.mockImplementation(async (_userId, _slotNumber, gameState) =>
      createSavedResult(gameState),
    );

    const moneyBefore = snapshot.finance.money;
    await startComebackProjectAndSave(
      { genre: "dancePop", mood: "y2k" },
      "blockbuster",
      null,
      "user",
      1,
    );

    const committed = captureGameState();
    const tier = COMEBACK_BUDGET_TIERS_BY_ID.get("blockbuster");
    expect(committed.financeStore.money).toBe(moneyBefore - (tier?.cost ?? 0));
    expect(committed.albumStore.currentAlbum?.progress.song).toBe(
      tier?.baseProgress,
    );
    expect(
      committed.gameStore.activeProjects.some(
        (project) => project.kind === "comeback",
      ),
    ).toBe(true);
  });

  it("활동기가 아니면 프로모션 주문을 저장 전에 거부한다", async () => {
    const snapshot = makeGameSnapshot({ week: 5 });
    snapshot.game.weeklyDecisions = [];
    hydrateGameState(toGameStateSnapshot(snapshot));

    await expect(
      runWeekAndSave(
        {
          trainingSchedule: { intensity: "normal", restDay: false },
          resolvedDecisions: [],
          promotionOrders: [{ activityId: "fanSign" }],
        },
        "user",
        1,
      ),
    ).rejects.toThrow("activity period");
    expect(saveGameMock).not.toHaveBeenCalled();
  });

  it("이정표 언락 전에는 시설 3단계 업그레이드를 거부한다", async () => {
    const snapshot = makeGameSnapshot({ week: 10 });
    snapshot.finance.upgrades.studioLevel = 2;
    hydrateGameState(toGameStateSnapshot(snapshot));
    const before = captureGameState();

    await expect(
      upgradeFacilityAndSave("studioLevel", "user", 1),
    ).rejects.toThrow("locked");
    expect(saveGameMock).not.toHaveBeenCalled();
    expect(captureGameState()).toEqual(before);

    // 언락 이정표 달성 후에는 통과한다.
    const unlocked = makeGameSnapshot({ week: 10 });
    unlocked.finance.upgrades.studioLevel = 2;
    unlocked.game.milestonesAchieved = [
      { id: "first-release", year: 1, week: 9 },
    ];
    hydrateGameState(toGameStateSnapshot(unlocked));
    saveGameMock.mockImplementation(async (_userId, _slotNumber, gameState) =>
      createSavedResult(gameState),
    );
    await upgradeFacilityAndSave("studioLevel", "user", 1);
    expect(captureGameState().financeStore.upgrades.studioLevel).toBe(3);
  });

  it("제작 예산이 부족하면 컴백 기획을 저장 전에 거부한다", async () => {
    const snapshot = makeGameSnapshot({ week: 30 });
    snapshot.game.currentPhase = "debut";
    snapshot.finance.money = 10_000_000;
    hydrateGameState(toGameStateSnapshot(snapshot));
    const before = captureGameState();

    await expect(
      startComebackProjectAndSave(
        { genre: "dancePop", mood: "y2k" },
        "lean",
        null,
        "user",
        1,
      ),
    ).rejects.toThrow("Not enough money");
    expect(saveGameMock).not.toHaveBeenCalled();
    expect(captureGameState()).toEqual(before);
  });

  it("현재 후보가 아닌 타이틀곡은 저장 전에 거부한다", async () => {
    const snapshot = makeGameSnapshot({ week: 10 });
    const project = createProjectInstance(DEBUT_PROJECT, 1);
    snapshot.game.activeProjects = [
      {
        ...project,
        currentStageId: "title-decision",
        decisionStatuses: { [TITLE_TRACK_SELECTION_DECISION_ID]: "available" },
      },
    ];
    snapshot.album = structuredClone(initialAlbumState);
    hydrateGameState(toGameStateSnapshot(snapshot));
    const before = captureGameState();

    await expect(
      completeTitleTrackSelectionAndSave(project.id, "missing", "user", 1),
    ).rejects.toThrow("not a current candidate");
    expect(saveGameMock).not.toHaveBeenCalled();
    expect(captureGameState()).toEqual(before);
  });
});

function prepareEventFocus() {
  const event: GameEvent = {
    id: "event-persist",
    type: "market",
    title: "영속 이벤트",
    description: "저장 전에는 적용하지 않는다.",
    choices: [
      {
        label: "계약",
        description: "수익을 얻는다.",
        tradeoff: "테스트",
        effects: { money: 100 },
      },
    ],
    resolved: false,
  };
  const snapshot = makeGameSnapshot({ week: 6 });
  snapshot.event.pendingEvents = [event];
  snapshot.game.weeklyFlow = {
    state: "event_focus",
    selectedDecisionIds: {},
    selectedTargetTraineeIds: {},
    eventQueueIds: [event.id],
    activeEventIndex: 0,
    resolutionId: "weekly-resolution:y1:w5",
    report: null,
  };
  hydrateGameState(toGameStateSnapshot(snapshot));
  return event;
}

function prepareChartRevealFocus(resolved = false) {
  const event: GameEvent = {
    id: "chart-reveal:test:w6",
    type: "market",
    title: "차트 공개",
    description: "첫 순위를 공개한다.",
    resolved,
    resolvedChoiceIndex: resolved ? null : undefined,
    presentation: {
      kind: "chart-reveal",
      chartName: "멜론 TOP 100",
      rank: 12,
      albumTitle: "첫 앨범",
      trackTitle: "첫 곡",
      chartPower: 72,
    },
  };
  const snapshot = makeGameSnapshot({ week: 6 });
  snapshot.event.pendingEvents = [event];
  snapshot.game.weeklyFlow = {
    state: "event_focus",
    selectedDecisionIds: {},
    selectedTargetTraineeIds: {},
    eventQueueIds: [event.id],
    activeEventIndex: 0,
    resolutionId: "weekly-resolution:y1:w5",
    report: null,
  };
  hydrateGameState(toGameStateSnapshot(snapshot));
  return event;
}

function createSavedResult(gameState: GameStateSnapshot) {
  const saved = structuredClone(gameState);
  const saveRevision = saved.gameStore.saveRevision + 1;
  saved.gameStore.saveRevision = saveRevision;
  return {
    row: {} as Awaited<ReturnType<typeof saveGame>>["row"],
    gameState: saved,
    saveRevision,
  };
}
