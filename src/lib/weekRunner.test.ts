import { beforeEach, describe, expect, it } from "vitest";
import { captureGameState, hydrateGameState } from "@/lib/saveSystem";
import {
  applyEventChoice,
  runWeek,
  WeeklyResolutionConflictError,
} from "@/lib/weekRunner";
import { makeGameSnapshot, toGameStateSnapshot } from "@/test/gameStateFixture";
import type { GameEvent, WeeklyReportSnapshot } from "@/types/game";

const REPORT: WeeklyReportSnapshot = {
  week: 5,
  season: "spring",
  statChanges: [],
  deltas: [],
  events: [],
  news: [],
  finance: { income: {}, expenses: {} },
  warnings: [],
  injuries: [],
  conflicts: [],
  competitorComebacks: [],
};

describe("weekly resolution workflow", () => {
  beforeEach(() => {
    const snapshot = makeGameSnapshot({ week: 5 });
    snapshot.game.weeklyDecisions = [
      {
        id: "weekly-focus",
        category: "training",
        title: "주간 방향",
        summary: "테스트 결정",
        options: [
          {
            id: "public-push",
            label: "인지도 집중",
            description: "대중 인지도를 높인다.",
            tradeoff: "다른 기회를 포기한다.",
            effects: { public: 5 },
          },
        ],
      },
    ];
    hydrateGameState(toGameStateSnapshot(snapshot));
  });

  it("한 주를 한 번만 commit하고 동일 resolution의 재실행을 차단한다", () => {
    const decisions = {
      trainingSchedule: { intensity: "normal" as const, restDay: false },
      resolvedDecisions: [
        {
          cardId: "weekly-focus",
          optionId: "public-push",
          // runner가 현재 카드 정의로 정규화하는지 확인하기 위한 위조 payload
          effects: { public: 999 },
        },
      ],
    };

    const report = runWeek(decisions);
    const committed = captureGameState();

    expect(committed.gameStore.currentWeek).toBe(6);
    expect(committed.gameStore.weeklyFlow.state).toBe("report_ready");
    expect(committed.gameStore.weeklyFlow.resolutionId).toBe(
      "weekly-resolution:y1:w5",
    );
    expect(committed.financeStore.incomeHistory).toHaveLength(1);
    expect(
      report.deltas.some(
        (delta) =>
          delta.source.kind === "decision" &&
          delta.source.id === "weekly-focus:public-push" &&
          delta.target.field === "public" &&
          delta.before === 10 &&
          delta.after === 15,
      ),
    ).toBe(true);

    expect(() => runWeek(decisions)).toThrow(WeeklyResolutionConflictError);
    expect(captureGameState().financeStore.incomeHistory).toHaveLength(1);
  });

  it("현재 주에 없는 결정 옵션은 실행 전에 거부한다", () => {
    expect(() =>
      runWeek({
        trainingSchedule: { intensity: "normal", restDay: false },
        resolvedDecisions: [
          { cardId: "weekly-focus", optionId: "stale-option", effects: {} },
        ],
      }),
    ).toThrow(WeeklyResolutionConflictError);

    expect(captureGameState().gameStore.currentWeek).toBe(5);
  });

  it("결정할 이슈가 없는 0카드 주도 정상적으로 진행한다", () => {
    const snapshot = makeGameSnapshot({ week: 5 });
    snapshot.game.weeklyDecisions = [];
    hydrateGameState(toGameStateSnapshot(snapshot));

    runWeek({
      trainingSchedule: { intensity: "normal", restDay: false },
      resolvedDecisions: [],
    });

    expect(captureGameState().gameStore.currentWeek).toBe(6);
    expect(captureGameState().gameStore.weeklyFlow.state).toBe("report_ready");
  });
});

describe("persistent event queue", () => {
  const event: GameEvent = {
    id: "event-test",
    type: "market",
    title: "테스트 이벤트",
    description: "선택 결과가 즉시 저장 가능한 상태가 된다.",
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

  beforeEach(() => {
    const snapshot = makeGameSnapshot({ week: 6 });
    snapshot.event.pendingEvents = [event];
    snapshot.game.weeklyFlow = {
      state: "event_focus",
      selectedDecisionIds: {},
      eventQueueIds: [event.id],
      activeEventIndex: 0,
      resolutionId: "weekly-resolution:y1:w5",
      report: REPORT,
    };
    hydrateGameState(toGameStateSnapshot(snapshot));
  });

  it("이벤트 선택을 한 번만 적용하고 delta·해결 상태를 세이브 왕복한다", () => {
    applyEventChoice(event, 0);
    const afterChoice = captureGameState();

    expect(afterChoice.financeStore.money).toBe(1_000_000_100);
    expect(afterChoice.eventStore.pendingEvents[0].resolved).toBe(true);
    expect(afterChoice.gameStore.weeklyFlow.report?.deltas).toEqual([
      expect.objectContaining({
        source: expect.objectContaining({ kind: "event", id: event.id }),
        target: expect.objectContaining({ kind: "finance", field: "money" }),
        before: 1_000_000_000,
        after: 1_000_000_100,
      }),
    ]);
    expect(() => applyEventChoice(event, 0)).toThrow(
      WeeklyResolutionConflictError,
    );

    hydrateGameState(afterChoice);
    expect(captureGameState()).toEqual(afterChoice);
  });
});
