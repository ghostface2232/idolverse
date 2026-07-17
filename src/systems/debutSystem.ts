import {
  DEBUT_PROMOTION_LEAD_WEEKS,
  DEBUT_SCHEDULE_TIERS_BY_ID,
  DEBUT_SHOWCASE_GRADES,
  DEFAULT_DEBUT_SCHEDULE_ID,
  type DebutScheduleTier,
} from "@/data/balance";
import {
  DEBUT_PROJECT,
  DEBUT_POSITION_TRIAL_WEEK,
  TITLE_TRACK_SELECTION_DECISION_ID,
} from "@/data/debutProject";
import { PROJECT_EVENT_TEMPLATES_BY_ID } from "@/data/events";
import { describeCenterFit, finalizeAlbumRelease } from "@/systems/albumSystem";
import type { ReleaseResult } from "@/systems/evaluationSystem";
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
}

export function getDebutSchedule(
  project: Pick<ProjectInstance, "scheduleTierId">,
): DebutScheduleTier {
  return (
    DEBUT_SCHEDULE_TIERS_BY_ID.get(
      project.scheduleTierId ?? DEFAULT_DEBUT_SCHEDULE_ID,
    ) ?? DEBUT_SCHEDULE_TIERS_BY_ID.get(DEFAULT_DEBUT_SCHEDULE_ID)!
  );
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

export function getShowcaseGrade(score: number) {
  return (
    DEBUT_SHOWCASE_GRADES.find((grade) => score >= grade.min) ??
    DEBUT_SHOWCASE_GRADES[DEBUT_SHOWCASE_GRADES.length - 1]
  );
}

/**
 * 쇼케이스는 게이트가 아니라 평가다. 점수는 기준선(DEBUT_REQUIREMENTS) 대비
 * 완성도를 말하고, 등급 효과가 데뷔 주의 업계·팬덤 반응을 소폭 가감한다.
 */
export function evaluateDebutShowcase(
  readiness: DebutReadiness,
  cumulativeWeek: number,
): ProjectEvaluationResult {
  const score = Math.round(
    readiness.readiness * 0.55 +
      readiness.averageVocal * 0.3 +
      Math.max(0, Math.min(100, readiness.teamChemistry + 50)) * 0.15,
  );
  const grade = getShowcaseGrade(score);

  return {
    id: "showcase",
    week: cumulativeWeek,
    score,
    passed: score >= 55,
    summary: `${grade.label}: ${grade.summary}.`,
  };
}

function toProjectMetrics(
  readiness: DebutReadiness,
  album: Album | null,
  launchReady: boolean,
): ProjectMetrics {
  return {
    elapsedWeeks: readiness.relativeWeek,
    readiness: readiness.readiness,
    averageVocal: readiness.averageVocal,
    launchReady: launchReady ? 1 : 0,
    titleTrackSelected: album?.titleTrack ? 1 : 0,
    albumReleased: 0,
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

function buildShowcaseEvent(evaluation: ProjectEvaluationResult): GameEvent {
  return {
    id: `project-event:debut-showcase-result:w${evaluation.week}`,
    type: "training",
    tone:
      evaluation.score >= 75
        ? "positive"
        : evaluation.score >= 55
          ? "neutral"
          : "negative",
    title: "데뷔 쇼케이스 반응",
    description: `${evaluation.summary} 종합 점수 ${evaluation.score}점.`,
    resolved: false,
  };
}

function releaseDebutAlbum(
  input: DebutProjectWeekInput,
  album: Album,
): { album: Album; releaseResult: ReleaseResult } {
  return finalizeAlbumRelease({
    album,
    cumulativeWeek: input.cumulativeWeek,
    trainees: input.trainees,
    teamChemistry: calculateDebutReadiness(album, input.trainees, 1).teamChemistry,
    season: input.season,
    conceptHistory: input.conceptHistory,
    equipmentLevel: input.equipmentLevel,
    fandom: input.fandom,
    competitors: input.competitors,
    eventRivals: input.eventRivals,
    backgroundGroups: input.backgroundGroups,
    market: input.calendar.marketTrend,
  });
}

export function processDebutProjectWeek(
  input: DebutProjectWeekInput,
): DebutProjectWeekResult {
  let project = { ...input.project };
  let album = input.album;
  const relativeWeek = getProjectRelativeWeek(project, input.cumulativeWeek);
  const readiness = calculateDebutReadiness(album, input.trainees, relativeWeek);
  const schedule = getDebutSchedule(project);
  const launchReady =
    relativeWeek >= schedule.debutWeek - DEBUT_PROMOTION_LEAD_WEEKS;

  const advanced = advanceProject(
    DEBUT_PROJECT,
    project,
    input.cumulativeWeek,
    toProjectMetrics(readiness, album, launchReady),
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

  // 발매: 일정 주 도래 시 완성도와 무관하게 이뤄진다. 낮은 완성도는 출시를
  // 막는 게 아니라 쇼케이스 등급·품질·차트 결과로 말한다. 타이틀 미확정만이
  // 구조적으로 발매를 미룬다(프로모션 스테이지 게이트).
  let releasedAlbum: Album | null = null;
  let releaseResult: ReleaseResult | null = null;
  if (
    project.currentStageId === "debut-promotion" &&
    relativeWeek >= schedule.debutWeek &&
    !project.releasedAlbumId &&
    album?.titleTrack
  ) {
    const showcase = evaluateDebutShowcase(readiness, input.cumulativeWeek);
    const grade = getShowcaseGrade(showcase.score);
    project = {
      ...project,
      evaluations: { ...project.evaluations, showcase },
    };
    events.push({
      event: buildShowcaseEvent(showcase),
      effects: { ...grade.effects } as Record<string, number>,
    });

    const released = releaseDebutAlbum(input, album);
    // 일정 티어의 주목도 배율 — 빠른 데뷔는 첫 신인 프리미엄을 받고,
    // 늦은 데뷔는 붐비는 시장에서 반응이 완만해진다.
    releaseResult = {
      ...released.releaseResult,
      publicDelta: Math.round(
        released.releaseResult.publicDelta * schedule.attentionMult,
      ),
      fandomDelta: Math.round(
        released.releaseResult.fandomDelta * schedule.attentionMult,
      ),
    };
    releasedAlbum = released.album;
    project = {
      ...project,
      status: "completed",
      completedAtWeek: input.cumulativeWeek,
      releasedAlbumId: released.album.id,
    };
    events.push({
      event: {
        id: `chart-reveal:${releasedAlbum.id}:w${input.cumulativeWeek}`,
        type: "market",
        tone: "positive",
        title: "데뷔 차트 진입",
        description: `${releasedAlbum.title}의 첫 차트 순위가 집계되었습니다.${describeCenterFit(releasedAlbum, input.trainees)}`,
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
  };
}
