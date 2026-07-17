import { processWeek, type GameSnapshot, type PlayerDecisions } from "@/systems/weekProcessor";
import { applyEffects } from "@/systems/applyEffects";
import {
  captureGameState,
  DEFAULT_AUTO_SAVE_SLOT,
  hydrateGameState,
  saveGame,
  type GameStateSnapshot,
} from "@/lib/saveSystem";
import {
  captureWeekDeltaState,
  diffWeekDeltaState,
  type WeekDeltaState,
} from "@/systems/weekDelta";
import type {
  ConceptMood,
  EffectMap,
  FinanceStoreActions,
  GameEvent,
  Genre,
  Position,
  Staff,
} from "@/types/game";
import { isRequiredPosition, REQUIRED_POSITIONS } from "@/data/founding";
import {
  COMEBACK_BUDGET_TIERS_BY_ID,
  FACILITY_TIER_UNLOCKS,
  STAFF_MARKET,
  type ComebackBudgetTierId,
} from "@/data/balance";
import {
  calculateWeeklyFixedTotal,
  financeVanillaStore,
  UPGRADE_COSTS,
} from "@/stores/financeStore";
import { TITLE_TRACK_SELECTION_DECISION_ID } from "@/data/debutProject";
import {
  canStartComebackProject,
  createComebackPlan,
} from "@/systems/comebackSystem";
import { toCumulativeWeek } from "@/systems/progressionSystem";

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
  const resolution = resolveWeek(decisions);
  applyGameSnapshot(resolution.finalSnapshot);
  return resolution.report;
}

export async function runWeekAndSave(
  decisions: PlayerDecisions,
  userId: string,
  slotNumber = DEFAULT_AUTO_SAVE_SLOT,
) {
  const resolution = resolveWeek(decisions);
  try {
    const saved = await saveGame(
      userId,
      slotNumber,
      toPersistedSnapshot(resolution.finalSnapshot),
    );
    hydrateGameState(saved.gameState);
    return resolution.report;
  } catch (error) {
    applyGameSnapshot(resolution.originalSnapshot);
    throw error;
  }
}

function resolveWeek(decisions: PlayerDecisions) {
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
  const selectedTargetTraineeIds = Object.fromEntries(
    normalizedDecisions.resolvedDecisions
      .filter((decision) => decision.targetTraineeIds)
      .map((decision) => [decision.cardId, decision.targetTraineeIds ?? []]),
  );
  const resolvingSnapshot: GameSnapshot = {
    ...snapshot,
    game: {
      ...snapshot.game,
      weeklyFlow: {
        state: "resolving",
        selectedDecisionIds,
        selectedTargetTraineeIds,
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
    selectedTargetTraineeIds,
    eventQueueIds,
    activeEventIndex: 0,
    resolutionId,
    report: result.weekReport,
  };

  return {
    originalSnapshot: snapshot,
    finalSnapshot: result.newState,
    report: result.weekReport,
  };
}

export function applyEventChoice(event: GameEvent, choiceIndex: number) {
  const resolution = resolveEventChoice(
    buildGameSnapshot(),
    event,
    choiceIndex,
  );
  applyGameSnapshot(resolution.nextSnapshot);
  return resolution.result;
}

function resolveEventChoice(
  snapshot: GameSnapshot,
  event: GameEvent,
  choiceIndex: number,
) {
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

  const choice = pendingEvent.choices?.[choiceIndex] ?? null;
  if ((pendingEvent.choices?.length ?? 0) > 0 && !choice) {
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

  const committedSnapshot: GameSnapshot = {
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
              resolvedChoiceIndex: choice ? choiceIndex : null,
            }
          : pendingEvent,
      ),
    },
  };

  return {
    nextSnapshot: committedSnapshot,
    result: {
      effects,
      choice,
      deltas: eventDeltas,
    },
  };
}

export async function applyEventChoiceAndSave(
  event: GameEvent,
  choiceIndex: number,
  userId: string,
  slotNumber = DEFAULT_AUTO_SAVE_SLOT,
) {
  const resolution = resolveEventChoice(
    buildGameSnapshot(),
    event,
    choiceIndex,
  );
  const saved = await saveGame(
    userId,
    slotNumber,
    toPersistedSnapshot(resolution.nextSnapshot),
  );
  hydrateGameState(saved.gameState);
  return resolution.result;
}

export async function advanceWeeklyEventAndSave(
  userId: string,
  slotNumber = DEFAULT_AUTO_SAVE_SLOT,
) {
  const nextSnapshot = advanceWeeklyEventSnapshot(buildGameSnapshot());
  const saved = await saveGame(
    userId,
    slotNumber,
    toPersistedSnapshot(nextSnapshot),
  );
  hydrateGameState(saved.gameState);
}

/** 연출 이벤트(차트 공개·음악방송) 해결과 큐 이동을 한 번의 저장으로 원자적으로 확정한다. */
export async function completePresentationEventAndSave(
  eventId: string,
  userId: string,
  slotNumber = DEFAULT_AUTO_SAVE_SLOT,
) {
  const snapshot = buildGameSnapshot();
  const flow = snapshot.game.weeklyFlow;
  const activeEventId = flow.eventQueueIds[flow.activeEventIndex];
  const activeEvent = snapshot.event.pendingEvents.find(
    (event) => event.id === eventId,
  );
  if (
    flow.state !== "event_focus" ||
    activeEventId !== eventId ||
    !activeEvent?.presentation
  ) {
    throw new WeeklyResolutionConflictError(
      `Presentation event ${eventId} is not the active event.`,
    );
  }

  const resolvedSnapshot = activeEvent.resolved
    ? snapshot
    : resolveEventChoice(snapshot, activeEvent, -1).nextSnapshot;
  const nextSnapshot = advanceWeeklyEventSnapshot(resolvedSnapshot);
  const saved = await saveGame(
    userId,
    slotNumber,
    toPersistedSnapshot(nextSnapshot),
  );
  hydrateGameState(saved.gameState);
}

function advanceWeeklyEventSnapshot(snapshot: GameSnapshot): GameSnapshot {
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
  return {
    ...snapshot,
    game: {
      ...snapshot.game,
      weeklyFlow: {
        ...flow,
        state: complete ? "planning_ready" : "event_focus",
        selectedDecisionIds: {},
        selectedTargetTraineeIds: {},
        eventQueueIds: complete ? [] : flow.eventQueueIds,
        activeEventIndex: complete ? 0 : nextIndex,
      },
    },
  };
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
  const nextSnapshot: GameSnapshot = {
    ...snapshot,
    game: {
      ...snapshot.game,
      weeklyFlow: {
        ...flow,
        state: hasEvents ? "event_focus" : "planning_ready",
        selectedDecisionIds: {},
        selectedTargetTraineeIds: {},
        activeEventIndex: 0,
      },
    },
  };
  const saved = await saveGame(
    userId,
    slotNumber,
    toPersistedSnapshot(nextSnapshot),
  );
  hydrateGameState(saved.gameState);
}

export async function completePositionReviewAndSave(
  projectId: string,
  assignments: Partial<Record<Position, string | null>>,
  userId: string,
  slotNumber = DEFAULT_AUTO_SAVE_SLOT,
) {
  const snapshot = buildGameSnapshot();
  const project = snapshot.game.activeProjects.find(
    (candidate) => candidate.id === projectId,
  );
  if (project?.decisionStatuses.positionReview !== "available") {
    throw new WeeklyResolutionConflictError("Position review is not available.");
  }

  const missingRequired = REQUIRED_POSITIONS.find(
    (position) => !assignments[position],
  );
  const requiredTraineeIds = REQUIRED_POSITIONS.map(
    (position) => assignments[position],
  );
  if (
    missingRequired ||
    new Set(requiredTraineeIds).size !== requiredTraineeIds.length
  ) {
    throw new WeeklyResolutionConflictError(
      "Every required position must have a different trainee.",
    );
  }

  const allPositions = Object.keys(assignments) as Position[];
  const trainees = snapshot.trainee.trainees.map((trainee) => {
    const held = allPositions.filter(
      (position) => assignments[position] === trainee.id,
    );
    const required = held.find(isRequiredPosition) ?? null;
    const optional = held.find((position) => !isRequiredPosition(position)) ?? null;
    return {
      ...trainee,
      position: required ?? optional,
      subPosition: required && optional ? optional : null,
    };
  });
  const nextSnapshot: GameSnapshot = {
    ...snapshot,
    game: {
      ...snapshot.game,
      activeProjects: snapshot.game.activeProjects.map((candidate) =>
        candidate.id === projectId
          ? {
              ...candidate,
              decisionStatuses: {
                ...candidate.decisionStatuses,
                positionReview: "completed",
              },
            }
          : candidate,
      ),
    },
    trainee: { trainees },
  };
  const saved = await saveGame(
    userId,
    slotNumber,
    toPersistedSnapshot(nextSnapshot),
  );
  hydrateGameState(saved.gameState);
}

/**
 * 컨셉·제작 예산 확정과 함께 컴백 프로젝트와 제작 앨범을 만든다. 발매를
 * 마친 이전 사이클이 음악방송·정산을 도는 동안에도 시작할 수 있다(중첩 대기).
 */
export async function startComebackProjectAndSave(
  concept: { genre: Genre; mood: ConceptMood },
  budgetTierId: ComebackBudgetTierId,
  centerTraineeId: string | null,
  userId: string,
  slotNumber = DEFAULT_AUTO_SAVE_SLOT,
) {
  const snapshot = buildGameSnapshot();
  if (snapshot.game.weeklyFlow.state !== "planning_ready") {
    throw new WeeklyResolutionConflictError(
      "A comeback project can only start while planning the week.",
    );
  }
  if (
    !canStartComebackProject(
      snapshot.game.currentPhase,
      snapshot.game.activeProjects,
      snapshot.album.currentAlbum,
    )
  ) {
    throw new WeeklyResolutionConflictError(
      "A new comeback project is not available right now.",
    );
  }
  const budgetTier = COMEBACK_BUDGET_TIERS_BY_ID.get(budgetTierId);
  if (!budgetTier) {
    throw new WeeklyResolutionConflictError(
      `Unknown comeback budget tier: ${budgetTierId}.`,
    );
  }
  if (snapshot.finance.money < budgetTier.cost) {
    throw new WeeklyResolutionConflictError(
      "Not enough money for the selected production budget.",
    );
  }
  if (
    centerTraineeId &&
    !snapshot.trainee.trainees.some((trainee) => trainee.id === centerTraineeId)
  ) {
    throw new WeeklyResolutionConflictError(
      "The selected center is not a current member.",
    );
  }

  const plan = createComebackPlan({
    concept,
    budgetTierId,
    centerTraineeId,
    startedAtWeek: toCumulativeWeek(
      snapshot.game.currentYear,
      snapshot.game.currentWeek,
    ),
    season: snapshot.game.currentSeason,
    trainees: snapshot.trainee.trainees,
    conceptHistory: snapshot.album.conceptHistory,
  });
  const nextSnapshot: GameSnapshot = {
    ...snapshot,
    game: {
      ...snapshot.game,
      activeProjects: [...snapshot.game.activeProjects, plan.project],
    },
    album: {
      ...snapshot.album,
      currentAlbum: plan.album,
    },
    finance: {
      ...snapshot.finance,
      money: snapshot.finance.money - budgetTier.cost,
    },
  };
  const saved = await saveGame(
    userId,
    slotNumber,
    toPersistedSnapshot(nextSnapshot),
  );
  hydrateGameState(saved.gameState);
  return plan;
}

export async function completeTitleTrackSelectionAndSave(
  projectId: string,
  trackId: string,
  userId: string,
  slotNumber = DEFAULT_AUTO_SAVE_SLOT,
) {
  const snapshot = buildGameSnapshot();
  const project = snapshot.game.activeProjects.find(
    (candidate) => candidate.id === projectId,
  );
  if (
    project?.decisionStatuses[TITLE_TRACK_SELECTION_DECISION_ID] !== "available"
  ) {
    throw new WeeklyResolutionConflictError(
      "Title track selection is not available.",
    );
  }

  const album = snapshot.album.currentAlbum;
  const selectedTrack = album?.titleTrackCandidates.find(
    (candidate) => candidate.id === trackId,
  );
  if (!album || !selectedTrack) {
    throw new WeeklyResolutionConflictError(
      "The selected title track is not a current candidate.",
    );
  }

  const nextSnapshot: GameSnapshot = {
    ...snapshot,
    game: {
      ...snapshot.game,
      activeProjects: snapshot.game.activeProjects.map((candidate) =>
        candidate.id === projectId
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
        ...album,
        titleTrack: { ...selectedTrack },
      },
    },
  };
  const saved = await saveGame(
    userId,
    slotNumber,
    toPersistedSnapshot(nextSnapshot),
  );
  hydrateGameState(saved.gameState);
}

/**
 * 스태프 교체(M5 재모집): 같은 역할의 기존 스태프를 내보내고 새 인재를
 * 들인다. 오래 함께한 스태프의 교체는 팀 만족도로 대가를 치른다.
 */
export async function hireStaffAndSave(
  newStaff: Staff,
  userId: string,
  slotNumber = DEFAULT_AUTO_SAVE_SLOT,
) {
  const snapshot = buildGameSnapshot();
  if (snapshot.game.weeklyFlow.state !== "planning_ready") {
    throw new WeeklyResolutionConflictError(
      "Staff changes are only allowed while planning the week.",
    );
  }
  const replacing = snapshot.staff.staff.find(
    (member) => member.role === newStaff.role,
  );
  const staffList = [
    ...snapshot.staff.staff.filter((member) => member.role !== newStaff.role),
    newStaff,
  ];
  const fixedCosts = {
    ...snapshot.finance.fixedCosts,
    staffSalary: staffList.reduce((sum, member) => sum + member.salary, 0),
  };
  const trainees = replacing
    ? snapshot.trainee.trainees.map((trainee) => ({
        ...trainee,
        satisfaction: Math.max(
          0,
          Math.min(
            100,
            trainee.satisfaction +
              STAFF_MARKET.replaceTeamSatisfactionPenalty,
          ),
        ),
      }))
    : snapshot.trainee.trainees;

  const nextSnapshot: GameSnapshot = {
    ...snapshot,
    staff: { staff: staffList },
    trainee: { trainees },
    finance: {
      ...snapshot.finance,
      fixedCosts,
      weeklyFixedTotal: calculateWeeklyFixedTotal(fixedCosts),
    },
  };
  const saved = await saveGame(
    userId,
    slotNumber,
    toPersistedSnapshot(nextSnapshot),
  );
  hydrateGameState(saved.gameState);
}

/** 시설 상시 업그레이드(M5): 스토어 액션 적용과 저장을 원자적으로 묶는다. */
export async function upgradeFacilityAndSave(
  target: Parameters<FinanceStoreActions["upgrade"]>[0],
  userId: string,
  slotNumber = DEFAULT_AUTO_SAVE_SLOT,
) {
  const original = captureGameState();
  // 상위 단계(3~4)는 이정표 언락 이후에만, 그리고 자금이 있어야 열린다.
  if (
    target === "dormLevel" ||
    target === "studioLevel" ||
    target === "equipmentLevel"
  ) {
    const currentLevel = financeVanillaStore.getState().upgrades[target];
    const nextLevel = currentLevel + 1;
    if (nextLevel === 3 || nextLevel === 4) {
      const unlock = FACILITY_TIER_UNLOCKS[nextLevel];
      const achieved = original.gameStore.milestonesAchieved.some(
        (milestone) => milestone.id === unlock.milestoneId,
      );
      if (!achieved) {
        throw new WeeklyResolutionConflictError(
          `Facility tier ${nextLevel} is locked until ${unlock.milestoneId}.`,
        );
      }
    }
    if (currentLevel < 4) {
      const cost = UPGRADE_COSTS[target][currentLevel as 1 | 2 | 3];
      if (original.financeStore.money < cost) {
        throw new WeeklyResolutionConflictError(
          "Not enough money for the facility upgrade.",
        );
      }
    }
  }
  financeVanillaStore.getState().upgrade(target);
  try {
    const saved = await saveGame(userId, slotNumber, captureGameState());
    hydrateGameState(saved.gameState);
  } catch (error) {
    hydrateGameState(original);
    throw error;
  }
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

  if (submitted.size !== decisions.resolvedDecisions.length) {
    throw new WeeklyResolutionConflictError(
      "A weekly decision can only be submitted once.",
    );
  }

  const currentCards = new Map(
    snapshot.game.weeklyDecisions.map((card) => [card.id, card]),
  );
  for (const submittedDecision of submitted.values()) {
    if (!currentCards.has(submittedDecision.cardId)) {
      throw new WeeklyResolutionConflictError(
        `Decision ${submittedDecision.cardId} does not match the current week.`,
      );
    }
  }

  const unresolvedCrisis = snapshot.game.weeklyDecisions.find(
    (card) => card.lane === "crisis" && !submitted.has(card.id),
  );
  if (unresolvedCrisis) {
    throw new WeeklyResolutionConflictError(
      `Crisis decision ${unresolvedCrisis.id} requires a selected option.`,
    );
  }

  // 프로모션 실행은 활동기(발매 후 activity 스테이지)에만, 주당 1건 허용한다.
  const promotionOrders = decisions.promotionOrders ?? [];
  if (promotionOrders.length > 1) {
    throw new WeeklyResolutionConflictError(
      "Only one promotion can run per week.",
    );
  }
  if (promotionOrders.length > 0) {
    const inActivityPeriod = snapshot.game.activeProjects.some(
      (project) =>
        project.kind === "comeback" &&
        project.status !== "completed" &&
        project.currentStageId === "activity",
    );
    if (!inActivityPeriod) {
      throw new WeeklyResolutionConflictError(
        "Promotions are only available during an activity period.",
      );
    }
  }

  const resolvedDecisions = snapshot.game.weeklyDecisions.flatMap((card) => {
    const submittedDecision = submitted.get(card.id);
    if (!submittedDecision && card.lane === "opportunity") return [];

    const option = card.options.find(
      (candidate) => candidate.id === submittedDecision?.optionId,
    );
    if (!submittedDecision || !option) {
      throw new WeeklyResolutionConflictError(
        `Decision ${card.id} does not match the current week.`,
      );
    }

    let targetTraineeIds = option.targetTraineeIds;
    if (option.targetSelection) {
      const submittedTargets = submittedDecision.targetTraineeIds ?? [];
      const uniqueTargets = new Set(submittedTargets);
      const currentTraineeIds = new Set(
        snapshot.trainee.trainees.map((trainee) => trainee.id),
      );
      const validCount =
        submittedTargets.length >= option.targetSelection.min &&
        submittedTargets.length <= option.targetSelection.max;
      const validMembers = submittedTargets.every((id) =>
        currentTraineeIds.has(id),
      );
      if (
        uniqueTargets.size !== submittedTargets.length ||
        !validCount ||
        !validMembers
      ) {
        throw new WeeklyResolutionConflictError(
          `Decision ${card.id} has invalid trainee targets.`,
        );
      }
      targetTraineeIds = [...submittedTargets];
    }

    return [
      {
        cardId: card.id,
        optionId: option.id,
        // 효과는 UI payload를 신뢰하지 않고 현재 카드 정의에서 다시 읽는다.
        effects: option.effects,
        targetTraineeIds,
        activityOverride: option.activityOverride,
      },
    ];
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

function toPersistedSnapshot(snapshot: GameSnapshot): GameStateSnapshot {
  return {
    gameStore: snapshot.game,
    traineeStore: snapshot.trainee,
    staffStore: snapshot.staff,
    albumStore: snapshot.album,
    fandomStore: snapshot.fandom,
    competitorStore: snapshot.competitor,
    financeStore: snapshot.finance,
    calendarStore: snapshot.calendar,
    eventStore: snapshot.event,
  };
}
