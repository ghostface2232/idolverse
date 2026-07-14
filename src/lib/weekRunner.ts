import { processWeek, type GameSnapshot, type PlayerDecisions } from "@/systems/weekProcessor";
import { applyEffects } from "@/systems/applyEffects";
import {
  captureGameState,
  DEFAULT_AUTO_SAVE_SLOT,
  hydrateGameState,
  saveGame,
} from "@/lib/saveSystem";
import {
  captureWeekDeltaState,
  diffWeekDeltaState,
  type WeekDeltaState,
} from "@/systems/weekDelta";
import type { EffectMap, GameEvent } from "@/types/game";

export class WeeklyResolutionConflictError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "WeeklyResolutionConflictError";
  }
}

export function buildGameSnapshot(): GameSnapshot {
  const snapshot = captureGameState();

  return {
    game: snapshot.gameStore,
    trainee: snapshot.traineeStore,
    staff: snapshot.staffStore,
    album: snapshot.albumStore,
    fandom: snapshot.fandomStore,
    competitor: snapshot.competitorStore,
    finance: snapshot.financeStore,
    calendar: snapshot.calendarStore,
    event: snapshot.eventStore,
  };
}

export function applyGameSnapshot(snapshot: GameSnapshot) {
  hydrateGameState({
    gameStore: snapshot.game,
    traineeStore: snapshot.trainee,
    staffStore: snapshot.staff,
    albumStore: snapshot.album,
    fandomStore: snapshot.fandom,
    competitorStore: snapshot.competitor,
    financeStore: snapshot.finance,
    calendarStore: snapshot.calendar,
    eventStore: snapshot.event,
  });
}

export function runWeek(decisions: PlayerDecisions) {
  const snapshot = buildGameSnapshot();
  const resolutionId = createWeeklyResolutionId(
    snapshot.game.currentYear,
    snapshot.game.currentWeek,
  );
  assertWeekCanResolve(snapshot, resolutionId);
  const normalizedDecisions = normalizeDecisions(snapshot, decisions);
  const selectedDecisionIds = Object.fromEntries(
    normalizedDecisions.resolvedDecisions.map((decision) => [
      decision.cardId,
      decision.optionId,
    ]),
  );
  const resolvingSnapshot: GameSnapshot = {
    ...snapshot,
    game: {
      ...snapshot.game,
      weeklyFlow: {
        state: "resolving",
        selectedDecisionIds,
        eventQueueIds: [],
        activeEventIndex: 0,
        resolutionId,
        report: null,
      },
    },
  };

  // 먼저 resolving을 commit해 같은 tick의 재진입도 차단한다.
  applyGameSnapshot(resolvingSnapshot);

  let result: ReturnType<typeof processWeek>;
  try {
    result = processWeek(resolvingSnapshot, normalizedDecisions);
  } catch (error) {
    applyGameSnapshot(snapshot);
    throw error;
  }

  const eventQueueIds = result.newState.event.pendingEvents
    .filter((event) => !event.resolved)
    .map((event) => event.id);

  result.newState.game.weeklyFlow = {
    state: "report_ready",
    selectedDecisionIds,
    eventQueueIds,
    activeEventIndex: 0,
    resolutionId,
    report: result.weekReport,
  };

  applyGameSnapshot(result.newState);

  return result.weekReport;
}

export function applyEventChoice(event: GameEvent, choiceIndex: number) {
  const snapshot = buildGameSnapshot();
  const currentEventId =
    snapshot.game.weeklyFlow.eventQueueIds[
      snapshot.game.weeklyFlow.activeEventIndex
    ];
  const pendingEvent = snapshot.event.pendingEvents.find(
    (candidate) => candidate.id === event.id,
  );

  if (
    snapshot.game.weeklyFlow.state !== "event_focus" ||
    currentEventId !== event.id ||
    !pendingEvent ||
    pendingEvent.resolved
  ) {
    throw new WeeklyResolutionConflictError(
      `Event ${event.id} is not the active unresolved event.`,
    );
  }

  const choice = event.choices?.[choiceIndex] ?? null;
  if ((event.choices?.length ?? 0) > 0 && !choice) {
    throw new RangeError(`Invalid choice index ${choiceIndex} for event ${event.id}.`);
  }

  const effects = choice?.effects ?? {};
  const before = captureWeekDeltaState(toWeekDeltaState(snapshot));
  const nextSnapshot = applySnapshotEffects(snapshot, effects);
  const eventDeltas = diffWeekDeltaState(
    before,
    captureWeekDeltaState(toWeekDeltaState(nextSnapshot)),
    {
      source: { kind: "event", id: event.id, label: event.title },
      day: 7,
      idPrefix: snapshot.game.weeklyFlow.resolutionId ?? event.id,
      startIndex: snapshot.game.weeklyFlow.report?.deltas.length ?? 0,
    },
  );
  const report = snapshot.game.weeklyFlow.report
    ? {
        ...snapshot.game.weeklyFlow.report,
        deltas: [...snapshot.game.weeklyFlow.report.deltas, ...eventDeltas],
      }
    : null;

  applyGameSnapshot({
    ...nextSnapshot,
    game: {
      ...nextSnapshot.game,
      weeklyFlow: {
        ...nextSnapshot.game.weeklyFlow,
        report,
      },
    },
    event: {
      ...nextSnapshot.event,
      pendingEvents: nextSnapshot.event.pendingEvents.map((pendingEvent) =>
        pendingEvent.id === event.id
          ? {
              ...pendingEvent,
              resolved: true,
            }
          : pendingEvent,
      ),
    },
  });

  return {
    effects,
    choice,
    deltas: eventDeltas,
  };
}

export async function applyEventChoiceAndSave(
  event: GameEvent,
  choiceIndex: number,
  userId: string,
  slotNumber = DEFAULT_AUTO_SAVE_SLOT,
) {
  const result = applyEventChoice(event, choiceIndex);
  await saveGame(userId, slotNumber, captureGameState());
  return result;
}

export async function advanceWeeklyEventAndSave(
  userId: string,
  slotNumber = DEFAULT_AUTO_SAVE_SLOT,
) {
  const snapshot = buildGameSnapshot();
  const flow = snapshot.game.weeklyFlow;
  const activeEventId = flow.eventQueueIds[flow.activeEventIndex];
  const activeEvent = snapshot.event.pendingEvents.find(
    (event) => event.id === activeEventId,
  );
  if (flow.state !== "event_focus" || !activeEvent?.resolved) {
    throw new WeeklyResolutionConflictError(
      "The active event must be resolved before advancing the queue.",
    );
  }

  const nextIndex = flow.activeEventIndex + 1;
  const complete = nextIndex >= flow.eventQueueIds.length;
  applyGameSnapshot({
    ...snapshot,
    game: {
      ...snapshot.game,
      weeklyFlow: {
        ...flow,
        state: complete ? "planning_ready" : "event_focus",
        selectedDecisionIds: {},
        eventQueueIds: complete ? [] : flow.eventQueueIds,
        activeEventIndex: complete ? 0 : nextIndex,
      },
    },
  });
  await saveGame(userId, slotNumber, captureGameState());
}

export async function acknowledgeWeeklyReportAndSave(
  userId: string,
  slotNumber = DEFAULT_AUTO_SAVE_SLOT,
) {
  const snapshot = buildGameSnapshot();
  const flow = snapshot.game.weeklyFlow;
  if (flow.state !== "report_ready") {
    throw new WeeklyResolutionConflictError("No weekly report is ready to acknowledge.");
  }

  const hasEvents = flow.eventQueueIds.length > 0;
  applyGameSnapshot({
    ...snapshot,
    game: {
      ...snapshot.game,
      weeklyFlow: {
        ...flow,
        state: hasEvents ? "event_focus" : "planning_ready",
        selectedDecisionIds: {},
        activeEventIndex: 0,
      },
    },
  });
  await saveGame(userId, slotNumber, captureGameState());
}

export function createWeeklyResolutionId(year: number, week: number) {
  return `weekly-resolution:y${year}:w${week}`;
}

function applySnapshotEffects(
  snapshot: GameSnapshot,
  effects: EffectMap,
): GameSnapshot {
  const result = applyEffects(
    {
      money: snapshot.finance.money,
      fandom: {
        public: snapshot.fandom.public,
        fandom: snapshot.fandom.fandom,
        fandomLoyalty: snapshot.fandom.fandomLoyalty,
        fandomDisappointment: snapshot.fandom.fandomDisappointment,
        global: snapshot.fandom.global,
        industry: snapshot.fandom.industry,
      },
      trainees: snapshot.trainee.trainees,
      album: snapshot.album.currentAlbum,
      investorPressureWeeks: snapshot.game.investorPressureWeeks ?? 0,
    },
    effects,
  );

  return {
    ...snapshot,
    game: {
      ...snapshot.game,
      investorPressureWeeks: result.investorPressureWeeks,
      // 이벤트발 압박이 걸리면 즉시 압박 상태로 표시한다. 해제는
      // weekProcessor가 조건 미달 여부·남은 압박 주 수로 매주 재계산한다.
      investorPenaltyActive:
        snapshot.game.investorPenaltyActive || result.investorPressureWeeks > 0,
    },
    trainee: {
      ...snapshot.trainee,
      trainees: result.trainees,
    },
    album: {
      ...snapshot.album,
      currentAlbum: result.album,
    },
    fandom: {
      ...snapshot.fandom,
      ...result.fandom,
    },
    finance: {
      ...snapshot.finance,
      money: result.money,
    },
  };
}

function assertWeekCanResolve(snapshot: GameSnapshot, resolutionId: string) {
  const flow = snapshot.game.weeklyFlow;
  if (
    flow.state === "resolving" ||
    flow.state === "report_ready" ||
    flow.state === "event_focus" ||
    flow.resolutionId === resolutionId
  ) {
    throw new WeeklyResolutionConflictError(
      `Weekly resolution ${resolutionId} has already started or completed.`,
    );
  }
}

function normalizeDecisions(
  snapshot: GameSnapshot,
  decisions: PlayerDecisions,
): PlayerDecisions {
  const submitted = new Map(
    decisions.resolvedDecisions.map((decision) => [decision.cardId, decision]),
  );

  if (
    submitted.size !== decisions.resolvedDecisions.length ||
    submitted.size !== snapshot.game.weeklyDecisions.length
  ) {
    throw new WeeklyResolutionConflictError(
      "Every current weekly decision must have exactly one selected option.",
    );
  }

  const resolvedDecisions = snapshot.game.weeklyDecisions.map((card) => {
    const submittedDecision = submitted.get(card.id);
    const option = card.options.find(
      (candidate) => candidate.id === submittedDecision?.optionId,
    );
    if (!submittedDecision || !option) {
      throw new WeeklyResolutionConflictError(
        `Decision ${card.id} does not match the current week.`,
      );
    }

    return {
      cardId: card.id,
      optionId: option.id,
      // 효과는 UI payload를 신뢰하지 않고 현재 카드 정의에서 다시 읽는다.
      effects: option.effects,
    };
  });

  return {
    ...decisions,
    resolvedDecisions,
  };
}

function toWeekDeltaState(snapshot: GameSnapshot): WeekDeltaState {
  return {
    money: snapshot.finance.money,
    fandom: snapshot.fandom,
    trainees: snapshot.trainee.trainees,
    album: snapshot.album.currentAlbum,
    investorPressureWeeks: snapshot.game.investorPressureWeeks,
  };
}
