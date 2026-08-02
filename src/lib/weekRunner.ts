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
  AlbumPartAssignment,
  ConceptMood,
  EffectMap,
  EventStaffChange,
  FinanceStoreActions,
  GameEvent,
  Genre,
  MarketingChannelId,
  MarketingPlanAllocation,
  MvDirectionId,
  Position,
  Staff,
  StaffRecruitmentPost,
  StaffRole,
  StaffTrainingId,
} from "@/types/game";
import {
  generateStaffCandidates,
  getRecruitmentPostCandidates,
} from "@/systems/recruitSystem";
import { hashSeed } from "@/data/voiceLines";
import { isRequiredPosition, REQUIRED_POSITIONS } from "@/data/founding";
import {
  COMEBACK_BUDGET_TIERS_BY_ID,
  FACILITY_TIER_UNLOCKS,
  FOUNDING_STAFF_ABILITY_CAP,
  MARKETING_CHANNELS_BY_ID,
  MARKETING_PLAN,
  MV_DIRECTIONS_BY_ID,
  PART_ASSIGNMENT,
  STAFF_MARKET,
  type ComebackBudgetTierId,
} from "@/data/balance";
import {
  MARKETING_PLAN_DECISION_ID,
  MV_DIRECTION_DECISION_ID,
  PART_ASSIGNMENT_DECISION_ID,
} from "@/data/comebackProject";
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
import { getStaffTraining } from "@/data/staffTraining";
import {
  applyStaffTraining,
  type StaffTrainingResult,
} from "@/systems/staffTrainingSystem";

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
        confirmedDecisionIds: Object.keys(selectedDecisionIds),
        skippedDecisionIds: [],
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
    confirmedDecisionIds: Object.keys(selectedDecisionIds),
    skippedDecisionIds: [],
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
  const signedAdContract =
    pendingEvent.id.startsWith("event-brand-ad-offer-") && choiceIndex === 0;
  const before = captureWeekDeltaState(toWeekDeltaState(snapshot));
  let nextSnapshot = applySnapshotEffects(snapshot, effects);
  if (choice?.staffChange) {
    nextSnapshot = applyStaffChangeToSnapshot(
      nextSnapshot,
      choice.staffChange,
      event.id,
    );
  }
  if (choice?.flag) {
    // 선택이 남기는 잠복 플래그 — 지금은 조용하지만 weekProcessor의 주간
    // 롤에서 언젠가(특히 컴백 창에서) 격발된다.
    const createdAtWeek = toCumulativeWeek(
      nextSnapshot.game.currentYear,
      nextSnapshot.game.currentWeek,
    );
    nextSnapshot = {
      ...nextSnapshot,
      game: {
        ...nextSnapshot.game,
        dormantFlags: [
          ...(nextSnapshot.game.dormantFlags ?? []),
          {
            id: `${choice.flag.add.kind}:${event.id}`,
            kind: choice.flag.add.kind,
            createdAtWeek,
            weeklyChance: choice.flag.add.weeklyChance,
          },
        ],
      },
    };
  }
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
      adContractsSigned:
        nextSnapshot.game.adContractsSigned + (signedAdContract ? 1 : 0),
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

/**
 * 이벤트 선택의 구조적 스태프 변화를 스냅샷에 적용한다. 대상은 항상
 * "핵심 스태프"(최고 능력자)이고, 월급 변화는 고정비(staffSalary)와 주간
 * 환산치까지 함께 갱신해 경영 탭과 결산이 즉시 달라진 조직을 반영한다.
 */
function applyStaffChangeToSnapshot(
  snapshot: GameSnapshot,
  change: EventStaffChange,
  eventId: string,
): GameSnapshot {
  const staffList = snapshot.staff.staff;
  if (staffList.length === 0) return snapshot;

  const target = [...staffList].sort((a, b) => b.ability - a.ability)[0];

  let nextStaffList: Staff[];
  if (change.kind === "raise-salary") {
    const raisedSalary =
      Math.round((target.salary * (1 + change.percent / 100)) / 100_000) *
      100_000;
    nextStaffList = staffList.map((member) =>
      member.id === target.id ? { ...member, salary: raisedSalary } : member,
    );
  } else {
    // 신입은 같은 역할·더 낮은 능력 풀에서 뽑는다. 생성기의 월급은 능력에서
    // 파생되지만 협상 편차가 있으므로 기존 월급을 상한으로 한 번 더 눌러
    // "더 싸고 더 낮은" 계약을 보장한다.
    const seed = hashSeed(`staff-change:${eventId}:${target.id}`);
    const [junior] = generateStaffCandidates(
      target.role,
      seed,
      1,
      Math.max(30, target.ability - 8),
    );
    if (!junior) return snapshot;
    nextStaffList = [
      ...staffList.filter((member) => member.id !== target.id),
      {
        ...junior,
        id: `staff-replacement-${seed}`,
        salary: Math.min(junior.salary, Math.max(100_000, target.salary - 100_000)),
      },
    ];
  }

  const fixedCosts = {
    ...snapshot.finance.fixedCosts,
    staffSalary: nextStaffList.reduce((sum, member) => sum + member.salary, 0),
  };

  return {
    ...snapshot,
    staff: { staff: nextStaffList },
    finance: {
      ...snapshot.finance,
      fixedCosts,
      weeklyFixedTotal: calculateWeeklyFixedTotal(fixedCosts),
    },
  };
}

/** 이벤트 선택 해결과 큐 이동을 한 번의 저장으로 원자적으로 확정한다. */
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
  const nextSnapshot = advanceWeeklyEventSnapshot(resolution.nextSnapshot);
  const saved = await saveGame(
    userId,
    slotNumber,
    toPersistedSnapshot(nextSnapshot),
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
        confirmedDecisionIds: [],
        skippedDecisionIds: [],
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
        confirmedDecisionIds: [],
        skippedDecisionIds: [],
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
  const weeklyFlow = snapshot.game.weeklyFlow;
  const hasFinalizedWeeklyDecision =
    (weeklyFlow.confirmedDecisionIds?.length ?? 0) > 0 ||
    (weeklyFlow.skippedDecisionIds?.length ?? 0) > 0;
  const canStartDuringPlanning =
    weeklyFlow.state === "planning_ready" ||
    (weeklyFlow.state === "planning_active" && !hasFinalizedWeeklyDecision);
  if (!canStartDuringPlanning) {
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
      pendingExpenses: {
        ...(snapshot.finance.pendingExpenses ?? {}),
        productionBudget:
          (snapshot.finance.pendingExpenses?.productionBudget ?? 0) +
          budgetTier.cost,
      },
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

function clampStat(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * MV 제작 방향 결정. 촬영비를 내고 제작 진행도를 즉시 밀어 올리며,
 * 방향별 발매 효과는 발매 주에 회수된다(comebackSystem).
 */
export async function completeMvDirectionAndSave(
  projectId: string,
  directionId: MvDirectionId,
  userId: string,
  slotNumber = DEFAULT_AUTO_SAVE_SLOT,
) {
  const snapshot = buildGameSnapshot();
  const project = snapshot.game.activeProjects.find(
    (candidate) => candidate.id === projectId,
  );
  if (project?.decisionStatuses[MV_DIRECTION_DECISION_ID] !== "available") {
    throw new WeeklyResolutionConflictError("MV direction is not available.");
  }
  const album = snapshot.album.currentAlbum;
  const direction = MV_DIRECTIONS_BY_ID.get(directionId);
  if (!album || !direction) {
    throw new WeeklyResolutionConflictError("Unknown MV direction.");
  }
  if (snapshot.finance.money < direction.cost) {
    throw new WeeklyResolutionConflictError(
      "Not enough money for the selected MV direction.",
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
                [MV_DIRECTION_DECISION_ID]: "completed",
              },
            }
          : candidate,
      ),
    },
    album: {
      ...snapshot.album,
      currentAlbum: {
        ...album,
        mvDirection: direction.id,
        progress: {
          ...album.progress,
          visual: clampStat(album.progress.visual + direction.progress.visual, 0, 100),
          choreography: clampStat(
            album.progress.choreography + direction.progress.choreography,
            0,
            100,
          ),
          marketing: clampStat(
            album.progress.marketing + direction.progress.marketing,
            0,
            100,
          ),
        },
      },
    },
    finance: {
      ...snapshot.finance,
      money: snapshot.finance.money - direction.cost,
      pendingExpenses: {
        ...(snapshot.finance.pendingExpenses ?? {}),
        mvProduction:
          (snapshot.finance.pendingExpenses?.mvProduction ?? 0) + direction.cost,
      },
    },
  };
  const saved = await saveGame(userId, slotNumber, toPersistedSnapshot(nextSnapshot));
  hydrateGameState(saved.gameState);
}

/**
 * 발매 전 마케팅 캠페인 배분. 포인트당 비용을 내고 마케팅 진행도를 즉시
 * 올리며, 채널별 팬덤 효과는 발매 주에 회수된다(comebackSystem).
 */
export async function completeMarketingPlanAndSave(
  projectId: string,
  allocation: MarketingPlanAllocation,
  userId: string,
  slotNumber = DEFAULT_AUTO_SAVE_SLOT,
) {
  const snapshot = buildGameSnapshot();
  const project = snapshot.game.activeProjects.find(
    (candidate) => candidate.id === projectId,
  );
  if (project?.decisionStatuses[MARKETING_PLAN_DECISION_ID] !== "available") {
    throw new WeeklyResolutionConflictError("Marketing plan is not available.");
  }
  const album = snapshot.album.currentAlbum;
  if (!album) {
    throw new WeeklyResolutionConflictError("There is no album in production.");
  }
  const entries = Object.entries(allocation) as Array<
    [string, number | undefined]
  >;
  let totalPoints = 0;
  for (const [channelId, points] of entries) {
    if (!MARKETING_CHANNELS_BY_ID.has(channelId as MarketingChannelId)) {
      throw new WeeklyResolutionConflictError(
        `Unknown marketing channel: ${channelId}.`,
      );
    }
    const value = points ?? 0;
    if (
      !Number.isInteger(value) ||
      value < 0 ||
      value > MARKETING_PLAN.maxPerChannel
    ) {
      throw new WeeklyResolutionConflictError("Invalid channel allocation.");
    }
    totalPoints += value;
  }
  if (totalPoints > MARKETING_PLAN.maxTotalPoints) {
    throw new WeeklyResolutionConflictError(
      "The allocation exceeds the campaign point cap.",
    );
  }
  const cost = totalPoints * MARKETING_PLAN.costPerPoint;
  if (snapshot.finance.money < cost) {
    throw new WeeklyResolutionConflictError(
      "Not enough money for the marketing campaign.",
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
                [MARKETING_PLAN_DECISION_ID]: "completed",
              },
            }
          : candidate,
      ),
    },
    album: {
      ...snapshot.album,
      currentAlbum: {
        ...album,
        marketingPlan: { ...allocation },
        progress: {
          ...album.progress,
          marketing: clampStat(
            album.progress.marketing +
              totalPoints * MARKETING_PLAN.progressPerPoint,
            0,
            100,
          ),
        },
      },
    },
    finance: {
      ...snapshot.finance,
      money: snapshot.finance.money - cost,
      pendingExpenses: {
        ...(snapshot.finance.pendingExpenses ?? {}),
        marketingCampaign:
          (snapshot.finance.pendingExpenses?.marketingCampaign ?? 0) + cost,
      },
    },
  };
  const saved = await saveGame(userId, slotNumber, toPersistedSnapshot(nextSnapshot));
  hydrateGameState(saved.gameState);
}

/**
 * 파트·무대 노출 분배 결정. 집중은 완성도와 푸시 멤버를, 균등은 팀 만족과
 * 케미를 산다 — 멤버별 만족·인기·케미가 즉시 움직이는 실질 결정이다.
 */
export async function completePartAssignmentAndSave(
  projectId: string,
  assignment: AlbumPartAssignment,
  userId: string,
  slotNumber = DEFAULT_AUTO_SAVE_SLOT,
) {
  const snapshot = buildGameSnapshot();
  const project = snapshot.game.activeProjects.find(
    (candidate) => candidate.id === projectId,
  );
  if (project?.decisionStatuses[PART_ASSIGNMENT_DECISION_ID] !== "available") {
    throw new WeeklyResolutionConflictError("Part assignment is not available.");
  }
  const album = snapshot.album.currentAlbum;
  if (!album) {
    throw new WeeklyResolutionConflictError("There is no album in production.");
  }

  const pushIds = assignment.mode === "ace" ? assignment.pushTraineeIds : [];
  if (assignment.mode === "ace") {
    const memberIds = new Set(
      snapshot.trainee.trainees.map((trainee) => trainee.id),
    );
    if (
      pushIds.length < PART_ASSIGNMENT.ace.minPush ||
      pushIds.length > PART_ASSIGNMENT.ace.maxPush ||
      new Set(pushIds).size !== pushIds.length ||
      pushIds.some((id) => !memberIds.has(id))
    ) {
      throw new WeeklyResolutionConflictError("Invalid push member selection.");
    }
  }

  const trainees =
    assignment.mode === "ace"
      ? snapshot.trainee.trainees.map((trainee) =>
          pushIds.includes(trainee.id)
            ? {
                ...trainee,
                satisfaction: clampStat(
                  trainee.satisfaction + PART_ASSIGNMENT.ace.pushSatisfaction,
                  0,
                  100,
                ),
                popularity: clampStat(
                  (trainee.popularity ?? 0) + PART_ASSIGNMENT.ace.pushPopularity,
                  0,
                  100,
                ),
              }
            : {
                ...trainee,
                satisfaction: clampStat(
                  trainee.satisfaction + PART_ASSIGNMENT.ace.othersSatisfaction,
                  0,
                  100,
                ),
              },
        )
      : snapshot.trainee.trainees.map((trainee) => ({
          ...trainee,
          satisfaction: clampStat(
            trainee.satisfaction + PART_ASSIGNMENT.balanced.allSatisfaction,
            0,
            100,
          ),
          chemistry: Object.fromEntries(
            Object.entries(trainee.chemistry).map(([otherId, value]) => [
              otherId,
              clampStat(value + PART_ASSIGNMENT.balanced.pairChemistry, -100, 100),
            ]),
          ),
        }));

  const progressBoost =
    assignment.mode === "ace"
      ? PART_ASSIGNMENT.ace.progress
      : PART_ASSIGNMENT.balanced.progress;

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
                [PART_ASSIGNMENT_DECISION_ID]: "completed",
              },
            }
          : candidate,
      ),
    },
    trainee: { trainees },
    album: {
      ...snapshot.album,
      currentAlbum: {
        ...album,
        partAssignment: {
          mode: assignment.mode,
          pushTraineeIds: [...pushIds],
        },
        progress: {
          ...album.progress,
          song: clampStat(album.progress.song + progressBoost.song, 0, 100),
          choreography: clampStat(
            album.progress.choreography + progressBoost.choreography,
            0,
            100,
          ),
        },
      },
    },
  };
  const saved = await saveGame(userId, slotNumber, toPersistedSnapshot(nextSnapshot));
  hydrateGameState(saved.gameState);
}

/**
 * 스태프 모집 공고를 낸다. 공고비를 내고 일정 기간이 지나면 후보 명단이
 * 도착하며, 역할당 공고는 1건만 열 수 있다.
 */
export async function startStaffRecruitmentAndSave(
  role: StaffRole,
  userId: string,
  slotNumber = DEFAULT_AUTO_SAVE_SLOT,
) {
  const snapshot = buildGameSnapshot();
  if (snapshot.game.weeklyFlow.state !== "planning_ready") {
    throw new WeeklyResolutionConflictError(
      "Staff recruitment is only allowed while planning the week.",
    );
  }
  const posts = snapshot.staff.recruitmentPosts ?? [];
  if (posts.some((post) => post.role === role)) {
    throw new WeeklyResolutionConflictError(
      "A recruitment post for this role is already open.",
    );
  }
  if (snapshot.finance.money < STAFF_MARKET.recruitmentPostingCost) {
    throw new WeeklyResolutionConflictError(
      "Not enough money for the recruitment posting.",
    );
  }
  const cumulativeWeek = toCumulativeWeek(
    snapshot.game.currentYear,
    snapshot.game.currentWeek,
  );
  const poolCap = Math.round(
    FOUNDING_STAFF_ABILITY_CAP +
      snapshot.fandom.industry * STAFF_MARKET.industryScale,
  );
  const newPost: StaffRecruitmentPost = {
    role,
    startedAtWeek: cumulativeWeek,
    completesAtWeek: cumulativeWeek + STAFF_MARKET.recruitmentWeeks,
    candidateSeed: hashSeed(
      `staff-recruitment-${role}-${snapshot.game.campaignSeed}-${cumulativeWeek}`,
    ),
    poolCap,
  };
  const nextSnapshot: GameSnapshot = {
    ...snapshot,
    staff: { ...snapshot.staff, recruitmentPosts: [...posts, newPost] },
    finance: {
      ...snapshot.finance,
      money: snapshot.finance.money - STAFF_MARKET.recruitmentPostingCost,
      pendingExpenses: {
        ...(snapshot.finance.pendingExpenses ?? {}),
        staffRecruitment:
          (snapshot.finance.pendingExpenses?.staffRecruitment ?? 0) +
          STAFF_MARKET.recruitmentPostingCost,
      },
    },
  };
  const saved = await saveGame(
    userId,
    slotNumber,
    toPersistedSnapshot(nextSnapshot),
  );
  hydrateGameState(saved.gameState);
  return newPost;
}

/** 채용 없이 공고를 마감한다. 공고비는 돌려받지 못한다. */
export async function closeStaffRecruitmentAndSave(
  role: StaffRole,
  userId: string,
  slotNumber = DEFAULT_AUTO_SAVE_SLOT,
) {
  const snapshot = buildGameSnapshot();
  if (snapshot.game.weeklyFlow.state !== "planning_ready") {
    throw new WeeklyResolutionConflictError(
      "Staff recruitment is only allowed while planning the week.",
    );
  }
  const posts = snapshot.staff.recruitmentPosts ?? [];
  if (!posts.some((post) => post.role === role)) {
    throw new WeeklyResolutionConflictError(
      "No recruitment post is open for this role.",
    );
  }
  const nextSnapshot: GameSnapshot = {
    ...snapshot,
    staff: {
      ...snapshot.staff,
      recruitmentPosts: posts.filter((post) => post.role !== role),
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
 * 스태프 교체(M5 재모집): 모집 공고로 도착한 후보 중에서 골라 같은 역할의
 * 기존 스태프를 내보내고 새 인재를 들인다. 채용이 확정되면 공고는 닫히고,
 * 오래 함께한 스태프의 교체는 팀 만족도로 대가를 치른다.
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
  const posts = snapshot.staff.recruitmentPosts ?? [];
  const post = posts.find((entry) => entry.role === newStaff.role);
  const cumulativeWeek = toCumulativeWeek(
    snapshot.game.currentYear,
    snapshot.game.currentWeek,
  );
  if (!post || cumulativeWeek < post.completesAtWeek) {
    throw new WeeklyResolutionConflictError(
      "Hiring requires a completed recruitment post for this role.",
    );
  }
  if (
    !getRecruitmentPostCandidates(post).some(
      (candidate) => candidate.id === newStaff.id,
    )
  ) {
    throw new WeeklyResolutionConflictError(
      "The candidate is not part of this recruitment post.",
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
    staff: {
      ...snapshot.staff,
      staff: staffList,
      recruitmentPosts: posts.filter((entry) => entry.role !== newStaff.role),
    },
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

/** 유료 스태프 훈련을 적용하고 자금 차감과 저장을 한 번에 확정한다. */
export async function trainStaffAndSave(
  staffId: string,
  trainingId: StaffTrainingId,
  userId: string,
  slotNumber = DEFAULT_AUTO_SAVE_SLOT,
): Promise<StaffTrainingResult> {
  const snapshot = buildGameSnapshot();
  if (snapshot.game.weeklyFlow.state !== "planning_ready") {
    throw new WeeklyResolutionConflictError(
      "Staff training is only allowed while planning the week.",
    );
  }

  const staff = snapshot.staff.staff.find((member) => member.id === staffId);
  const training = getStaffTraining(trainingId);
  if (!staff || !training) {
    throw new WeeklyResolutionConflictError("Staff or training could not be found.");
  }
  const cumulativeWeek = toCumulativeWeek(
    snapshot.game.currentYear,
    snapshot.game.currentWeek,
  );
  // 훈련은 1주에 인당 1회만 — 자금만 있으면 한 주에 능력을 몰아 올리는
  // 루프를 막는다.
  if (staff.lastTrainedAtWeek === cumulativeWeek) {
    throw new WeeklyResolutionConflictError(
      "This staff member has already trained this week.",
    );
  }
  if (snapshot.finance.money < training.cost) {
    throw new WeeklyResolutionConflictError("Not enough money for staff training.");
  }

  const result = applyStaffTraining(staff, trainingId);
  const trainedStaff: Staff = {
    ...result.staff,
    lastTrainedAtWeek: cumulativeWeek,
  };
  const nextSnapshot: GameSnapshot = {
    ...snapshot,
    staff: {
      ...snapshot.staff,
      staff: snapshot.staff.staff.map((member) =>
        member.id === staffId ? trainedStaff : member,
      ),
    },
    finance: {
      ...snapshot.finance,
      money: snapshot.finance.money - training.cost,
      pendingExpenses: {
        ...(snapshot.finance.pendingExpenses ?? {}),
        staffDevelopment:
          (snapshot.finance.pendingExpenses?.staffDevelopment ?? 0) +
          training.cost,
      },
    },
  };
  const saved = await saveGame(
    userId,
    slotNumber,
    toPersistedSnapshot(nextSnapshot),
  );
  hydrateGameState(saved.gameState);
  return result;
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
  // 선택 시설(의료·보안)도 잔액이 있어야 설치할 수 있다 — financeStore.upgrade는
  // 잔액 검사 없이 차감하므로 진입 지점인 여기서 막는다.
  if (target === "hasHealthcare" || target === "hasSecurity") {
    const alreadyOwned = financeVanillaStore.getState().upgrades[target];
    if (!alreadyOwned && original.financeStore.money < UPGRADE_COSTS[target]) {
      throw new WeeklyResolutionConflictError(
        "Not enough money for the facility upgrade.",
      );
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
  // 캠페인이 끝난 세이브는 더 진행되지 않는다 — 종료 화면만 남는다.
  if (snapshot.game.campaignFailure !== null) {
    throw new WeeklyResolutionConflictError(
      "Campaign is over. No further weeks can be resolved.",
    );
  }
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
