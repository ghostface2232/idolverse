import { describe, expect, it } from "vitest";
import {
  captureGameState,
  hydrateGameState,
  type GameStateSnapshot,
} from "@/lib/saveSystem";
import { makeGameSnapshot, toGameStateSnapshot } from "@/test/gameStateFixture";
import type { GameStoreState } from "@/types/game";

/**
 * 세이브 왕복 테스트: hydrate → capture가 원본과 동일해야 한다.
 * 스토어에 필드를 추가하고 capture/hydrate 갱신을 빠뜨리면 여기서 잡힌다.
 * (세이브는 blind cast로 복원되므로 이 왕복이 사실상 유일한 안전망이다.)
 */
describe("saveSystem 왕복", () => {
  it("hydrate 후 capture하면 원본 스냅샷과 동일하다", () => {
    const original = toGameStateSnapshot(makeGameSnapshot({ week: 7 }));

    hydrateGameState(original);
    const captured = captureGameState();

    expect(captured).toEqual(original);
  });

  it("한 번 더 왕복해도 상태가 변형되지 않는다 (멱등성)", () => {
    const original = toGameStateSnapshot(makeGameSnapshot({ week: 7 }));

    hydrateGameState(original);
    const first = captureGameState();
    hydrateGameState(first);
    const second = captureGameState();

    expect(second).toEqual(first);
  });

  it("신규 필드가 없는 구버전 세이브는 기본값으로 보완된다", () => {
    const modern = toGameStateSnapshot(makeGameSnapshot({ week: 7 }));
    // 구버전 세이브 재현: 제거된 gameSpeed가 남아 있고 신규 필드가 없다
    const {
      saveRevision: _saveRevision,
      trainingSchedule: _trainingSchedule,
      investorConditionProgress: _progress,
      investorPressureWeeks: _pressure,
      investorComplianceCount: _count,
      fiveYearReview: _fiveYearReview,
      weeklyFlow: _weeklyFlow,
      ...legacyGameStore
    } = modern.gameStore;
    const legacy = {
      ...modern,
      gameStore: { ...legacyGameStore, gameSpeed: 2 },
    } as unknown as GameStateSnapshot;

    hydrateGameState(legacy);
    const captured = captureGameState();
    const capturedGame = captured.gameStore as GameStoreState & {
      gameSpeed?: unknown;
    };

    expect(capturedGame.gameSpeed).toBeUndefined();
    expect(capturedGame.saveRevision).toBe(0);
    expect(capturedGame.trainingSchedule).toEqual({
      intensity: "normal",
      focus: null,
      restDay: false,
    });
    expect(capturedGame.investorConditionProgress).toEqual({});
    expect(capturedGame.investorPressureWeeks).toBe(0);
    expect(capturedGame.investorComplianceCount).toBe(0);
    expect(capturedGame.fiveYearReview).toBeNull();
    expect(capturedGame.weeklyFlow).toEqual({
      state: "planning_ready",
      selectedDecisionIds: {},
      selectedTargetTraineeIds: {},
      eventQueueIds: [],
      activeEventIndex: 0,
      resolutionId: null,
      report: null,
    });
  });

  it("과거 5년 성과 미달로 잠긴 세이브를 계속 플레이할 수 있게 복구한다", () => {
    const legacy = toGameStateSnapshot(
      makeGameSnapshot({ year: 6, week: 1 }),
    );
    legacy.gameStore.campaignFailure = {
      reason: "performance",
      year: 5,
      week: 52,
    };

    hydrateGameState(legacy);

    expect(captureGameState().gameStore.campaignFailure).toBeNull();
  });

  it("직전 세션의 투자사 상태가 다른 세이브 로드로 새어 들어오지 않는다", () => {
    // 세션 A: 투자사 압박이 진행 중인 상태
    const sessionA = toGameStateSnapshot(makeGameSnapshot({ week: 20 }));
    sessionA.gameStore.investorPenaltyActive = true;
    sessionA.gameStore.investorConditionProgress = {
      "summit-quarterly": { firstFailedWeek: 13, penaltyApplied: true },
    };
    sessionA.gameStore.investorComplianceCount = 2;
    hydrateGameState(sessionA);

    // 세션 B: 신규 필드가 없는 구버전 세이브를 이어서 로드
    const modern = toGameStateSnapshot(makeGameSnapshot({ week: 3 }));
    const {
      investorConditionProgress: _progress,
      investorComplianceCount: _count,
      ...legacyGameStore
    } = modern.gameStore;
    const legacy = {
      ...modern,
      gameStore: legacyGameStore,
    } as unknown as GameStateSnapshot;
    hydrateGameState(legacy);

    const captured = captureGameState();
    expect(captured.gameStore.investorConditionProgress).toEqual({});
    expect(captured.gameStore.investorComplianceCount).toBe(0);
  });
});
