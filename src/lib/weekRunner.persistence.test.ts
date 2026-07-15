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
  runWeekAndSave,
} from "@/lib/weekRunner";
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
