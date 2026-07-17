import { DEBUT_REQUIREMENTS } from "@/data/balance";
import {
  DEBUT_PROJECT,
  DEBUT_POSITION_TRIAL_WEEK,
  TITLE_TRACK_SELECTION_DECISION_ID,
} from "@/data/debutProject";
import { PROJECT_EVENT_TEMPLATES_BY_ID } from "@/data/events";
import { calculateAlbumQuality } from "@/systems/albumSystem";
import { evaluateRelease, type ReleaseResult } from "@/systems/evaluationSystem";
import { instantiateEvent } from "@/systems/eventSystem";
import { directDebutPacing, type PacingBeatKind } from "@/systems/pacingDirector";
import {
  advanceProject,
  appendProjectEvents,
  getProjectRelativeWeek,
  type ProjectMetrics,
} from "@/systems/projectSystem";
import type {
  Album,
  BackgroundGroup,
  CalendarStoreState,
  CompetitorGroup,
  EventCompetitor,
  FandomStoreState,
  GameEvent,
  ProjectEvaluationResult,
  ProjectInstance,
  Season,
  Staff,
  Trainee,
} from "@/types/game";

export interface DebutReadiness {
  readiness: number;
  averageVocal: number;
  teamChemistry: number;
  relativeWeek: number;
}

export interface DebutProjectWeekInput {
  project: ProjectInstance;
  cumulativeWeek: number;
  season: Season;
  album: Album | null;
  trainees: readonly Trainee[];
  staff: readonly Staff[];
  fandom: FandomStoreState;
  competitors: readonly CompetitorGroup[];
  eventRivals: readonly EventCompetitor[];
  backgroundGroups: readonly BackgroundGroup[];
  calendar: CalendarStoreState;
  equipmentLevel: 1 | 2 | 3 | 4;
  conceptHistory: Album["concept"]["mood"][];
}

export interface DebutProjectWeekResult {
  project: ProjectInstance;
  album: Album | null;
  releasedAlbum: Album | null;
  releaseResult: ReleaseResult | null;
  events: Array<{
    event: GameEvent;
    effects: Record<string, number>;
    targetTraineeIds?: string[];
  }>;
  enteredStageIds: string[];
  directedBeatKinds: PacingBeatKind[];
  readiness: DebutReadiness;
  showcaseEvaluated: boolean;
}

export function calculateDebutReadiness(
  album: Album | null,
  trainees: readonly Trainee[],
  relativeWeek: number,
): DebutReadiness {
  const readiness = album
    ? (album.progress.song +
        album.progress.visual +
        album.progress.choreography +
        album.progress.marketing) /
      4
    : 0;
  const averageVocal =
    trainees.reduce((sum, trainee) => sum + trainee.stats.vocal, 0) /
    Math.max(1, trainees.length);

  let chemistrySum = 0;
  let pairs = 0;
  for (let i = 0; i < trainees.length; i++) {
    for (let j = i + 1; j < trainees.length; j++) {
      chemistrySum += trainees[i].chemistry[trainees[j].id] ?? 0;
      pairs++;
    }
  }

  return {
    readiness,
    averageVocal,
    teamChemistry: pairs > 0 ? chemistrySum / pairs : 0,
    relativeWeek,
  };
}

export function evaluateDebutShowcase(
  readiness: DebutReadiness,
  cumulativeWeek: number,
): ProjectEvaluationResult {
  const score = Math.round(
    readiness.readiness * 0.55 +
      readiness.averageVocal * 0.3 +
      Math.max(0, Math.min(100, readiness.teamChemistry + 50)) * 0.15,
  );
  const passed =
    readiness.relativeWeek >= DEBUT_REQUIREMENTS.minimumWeeks &&
    readiness.readiness >= DEBUT_REQUIREMENTS.readiness &&
    readiness.averageVocal >= DEBUT_REQUIREMENTS.averageVocal;

  return {
    id: "showcase",
    week: cumulativeWeek,
    score,
    passed,
    summary: passed
      ? "무대 완성도와 라이브 기준을 충족해 데뷔 승인을 받았습니다."
      : "쇼케이스 결과는 나왔지만 준비도 또는 평균 보컬 기준을 더 채워야 합니다.",
  };
}

function toProjectMetrics(
  readiness: DebutReadiness,
  album: Album | null,
  showcasePassed: boolean,
): ProjectMetrics {
  return {
    elapsedWeeks: readiness.relativeWeek,
    readiness: readiness.readiness,
    averageVocal: readiness.averageVocal,
    showcasePassed: showcasePassed ? 1 : 0,
    titleTrackSelected: album?.titleTrack ? 1 : 0,
  };
}

function buildProjectEvent(
  eventId: string,
  cumulativeWeek: number,
  trainees: readonly Trainee[],
  projectSeed: number,
) {
  const template = PROJECT_EVENT_TEMPLATES_BY_ID.get(eventId);
  if (!template) throw new Error(`Unknown project event: ${eventId}`);
  const target =
    eventId === "debut-personal-strength" && trainees.length > 0
      ? trainees[projectSeed % trainees.length]
      : null;
  const event = instantiateEvent(
    template,
    `project-event:${eventId}:w${cumulativeWeek}`,
  );
  return {
    event: target
      ? {
          ...event,
          description: `${target.name}이 늦은 밤까지 남아 약했던 파트를 자기 방식으로 풀어내며 숨은 강점을 증명했다.`,
        }
      : event,
    effects: template.effects,
    targetTraineeIds: target ? [target.id] : undefined,
  };
}

function buildShowcaseEvent(
  evaluation: ProjectEvaluationResult,
  retry: boolean,
): GameEvent {
  return {
    id: `project-event:debut-showcase-${retry ? "retry" : "result"}:w${evaluation.week}`,
    type: "training",
    tone: evaluation.passed ? "positive" : "neutral",
    title: retry
      ? "쇼케이스 재평가 통과"
      : evaluation.passed
        ? "첫 쇼케이스, 데뷔 승인"
        : "첫 쇼케이스, 보완 지시",
    description: `${evaluation.summary} 종합 점수 ${evaluation.score}점.`,
    resolved: false,
  };
}

function releaseDebutAlbum(
  input: DebutProjectWeekInput,
  album: Album,
): { album: Album; releaseResult: ReleaseResult } {
  if (!album.titleTrack) throw new Error("A title track is required for release.");
  const quality = calculateAlbumQuality({
    album,
    trainees: input.trainees,
    teamChemistry: calculateDebutReadiness(album, input.trainees, 1).teamChemistry,
    season: input.season,
    conceptHistory: input.conceptHistory,
    equipmentLevel: input.equipmentLevel,
  });
  const releaseResult = evaluateRelease({
    albumQuality: quality,
    titleTrack: album.titleTrack,
    fandom: input.fandom.fandom,
    public: input.fandom.public,
    global: input.fandom.global,
    industry: input.fandom.industry,
    competitors: input.competitors,
    eventRivals: input.eventRivals,
    backgroundGroups: input.backgroundGroups,
    market: input.calendar.marketTrend,
    seed: input.cumulativeWeek * 389,
  });
  return {
    releaseResult,
    album: {
      ...album,
      quality,
      releaseWeek: input.cumulativeWeek,
      performance: {
        chartPeak: releaseResult.chartRank,
        chartPower: releaseResult.chartPower,
        firstWeekSales: Math.round(quality * (600 + input.fandom.fandom * 25)),
        totalStreams: Math.round(releaseResult.chartPower * 125000),
        fanGrowth: releaseResult.fandomDelta,
      },
    },
  };
}

export function processDebutProjectWeek(
  input: DebutProjectWeekInput,
): DebutProjectWeekResult {
  let project = { ...input.project };
  let album = input.album;
  const relativeWeek = getProjectRelativeWeek(project, input.cumulativeWeek);
  const readiness = calculateDebutReadiness(album, input.trainees, relativeWeek);

  const priorShowcase = project.evaluations.showcase;
  const shouldEvaluateShowcase =
    relativeWeek >= 17 && (!priorShowcase || !priorShowcase.passed);
  let showcaseEvaluated = false;
  if (shouldEvaluateShowcase) {
    const evaluation = evaluateDebutShowcase(readiness, input.cumulativeWeek);
    const changed = !priorShowcase || (!priorShowcase.passed && evaluation.passed);
    project = {
      ...project,
      evaluations: { ...project.evaluations, showcase: evaluation },
    };
    showcaseEvaluated = changed;
  }

  const showcasePassed = project.evaluations.showcase?.passed ?? false;
  const advanced = advanceProject(
    DEBUT_PROJECT,
    project,
    input.cumulativeWeek,
    toProjectMetrics(readiness, album, showcasePassed),
  );
  project = advanced.project;

  if (
    relativeWeek >= DEBUT_POSITION_TRIAL_WEEK &&
    project.decisionStatuses.positionReview !== "completed"
  ) {
    project = {
      ...project,
      decisionStatuses: {
        ...project.decisionStatuses,
        positionReview: "available",
      },
    };
  }
  if (
    relativeWeek >= 10 ||
    advanced.enteredStages.some((stage) => stage.id === "title-decision")
  ) {
    if (album) {
      project = {
        ...project,
        decisionStatuses: {
          ...project.decisionStatuses,
          [TITLE_TRACK_SELECTION_DECISION_ID]: album.titleTrack
            ? "completed"
            : "available",
        },
      };
    }
  }

  const directedBeats = directDebutPacing(
    relativeWeek,
    new Set(project.spawnedEventIds),
    project.startedAtWeek * 997 + 31,
  );
  project = appendProjectEvents(
    project,
    directedBeats.map((beat) => beat.eventId),
  );

  const projectEventIds = [
    ...advanced.spawnedEventIds,
    ...directedBeats.map((beat) => beat.eventId),
  ];
  const events: DebutProjectWeekResult["events"] = projectEventIds.map((eventId) =>
    buildProjectEvent(
      eventId,
      input.cumulativeWeek,
      input.trainees,
      project.startedAtWeek * 17,
    ),
  );

  if (showcaseEvaluated) {
    const retry = Boolean(priorShowcase && !priorShowcase.passed);
    const showcaseEventId = retry
      ? "debut-showcase-retry-passed"
      : "debut-showcase-result";
    if (!project.spawnedEventIds.includes(showcaseEventId)) {
      project = appendProjectEvents(project, [showcaseEventId]);
      events.push({
        event: buildShowcaseEvent(project.evaluations.showcase, retry),
        effects: {},
      });
    }
  }

  let releasedAlbum: Album | null = null;
  let releaseResult: ReleaseResult | null = null;
  if (project.status === "completed" && album) {
    if (album.titleTrack) {
      const released = releaseDebutAlbum(input, album);
      releasedAlbum = released.album;
      releaseResult = released.releaseResult;
      events.push({
        event: {
          id: `chart-reveal:${releasedAlbum.id}:w${input.cumulativeWeek}`,
          type: "market",
          tone: "positive",
          title: "데뷔 차트 진입",
          description: `${releasedAlbum.title}의 첫 차트 순위가 집계되었습니다.`,
          resolved: false,
          presentation: {
            kind: "chart-reveal",
            chartName: "멜론 TOP 100",
            rank: releaseResult.chartRank,
            albumTitle: releasedAlbum.title,
            trackTitle: releasedAlbum.titleTrack?.name ?? "타이틀곡",
            chartPower: releaseResult.chartPower,
          },
        },
        effects: {},
      });
      album = null;
    } else {
      project = { ...project, status: "blocked", completedAtWeek: undefined };
    }
  }

  return {
    project,
    album,
    releasedAlbum,
    releaseResult,
    events,
    enteredStageIds: advanced.enteredStages.map((stage) => stage.id),
    directedBeatKinds: directedBeats.map((beat) => beat.kind),
    readiness,
    showcaseEvaluated,
  };
}
