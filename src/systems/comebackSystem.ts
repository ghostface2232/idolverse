import {
  COMEBACK_BUDGET_TIERS,
  COMEBACK_BUDGET_TIERS_BY_ID,
  MUSIC_SHOW_CANDIDACY,
  MUSIC_SHOW_OUTCOME,
  MUSIC_SHOW_SCORE,
  BACKGROUND_CHART_POWER_SCALE,
  type ComebackBudgetTierId,
} from "@/data/balance";
import {
  COMEBACK_PROJECT,
  MOOD_ALBUM_TITLES,
} from "@/data/comebackProject";
import { CONCEPT_MOOD_DATA, SEASON_MOOD_FIT } from "@/data/concepts";
import { TITLE_TRACK_SELECTION_DECISION_ID } from "@/data/debutProject";
import { PROJECT_EVENT_TEMPLATES_BY_ID } from "@/data/events";
import { createSeededRandom } from "@/lib/seededRandom";
import {
  calculateFandomExpectation,
  finalizeAlbumRelease,
  generateTitleTrackCandidates,
} from "@/systems/albumSystem";
import { instantiateEvent } from "@/systems/eventSystem";
import type { ReleaseResult } from "@/systems/evaluationSystem";
import {
  advanceProject,
  createProjectInstance,
  getProjectRelativeWeek,
  type ProjectMetrics,
} from "@/systems/projectSystem";
import type {
  Album,
  BackgroundGroup,
  CalendarStoreState,
  ComebackSettlementReport,
  CompetitorGroup,
  ConceptMood,
  EventCompetitor,
  FandomStoreState,
  GameEvent,
  GamePhase,
  Genre,
  ProjectInstance,
  Season,
  Staff,
  Trainee,
} from "@/types/game";

export const MUSIC_SHOW_NAME = "위클리 스테이지";

const COMEBACK_ACTIVE_PHASES: ReadonlySet<GamePhase> = new Set([
  "debut",
  "growth",
  "peak",
]);

const STAGE_INDEX = new Map(
  COMEBACK_PROJECT.stages.map((stage, index) => [stage.id, index]),
);

function stageIndexOf(stageId: string): number {
  return STAGE_INDEX.get(stageId) ?? 0;
}

function stageWindowStart(stageId: string): number {
  const stage = COMEBACK_PROJECT.stages[stageIndexOf(stageId)];
  return stage.weekWindow[0];
}

function averageTeamChemistry(trainees: readonly Trainee[]): number {
  let sum = 0;
  let pairs = 0;
  for (let i = 0; i < trainees.length; i++) {
    for (let j = i + 1; j < trainees.length; j++) {
      sum += trainees[i].chemistry[trainees[j].id] ?? 0;
      pairs++;
    }
  }
  return pairs > 0 ? sum / pairs : 0;
}

function albumProgressAverage(album: Album): number {
  return (
    (album.progress.song +
      album.progress.visual +
      album.progress.choreography +
      album.progress.marketing) /
    4
  );
}

/**
 * 새 컴백 기획을 시작할 수 있는가. 발매 전 앨범을 소유한 프로젝트가 없고
 * 제작 슬롯(currentAlbum)이 비어 있어야 한다 — 발매를 마친 컴백이
 * 음악방송·정산을 도는 동안에는 다음 기획이 중첩될 수 있다.
 */
export function canStartComebackProject(
  phase: GamePhase,
  activeProjects: readonly ProjectInstance[],
  currentAlbum: Album | null,
): boolean {
  if (!COMEBACK_ACTIVE_PHASES.has(phase)) return false;
  if (currentAlbum) return false;
  return !activeProjects.some(
    (project) =>
      project.status !== "completed" &&
      (project.kind === "debut" ||
        (project.kind === "comeback" && !project.releasedAlbumId)),
  );
}

export interface ComebackPlanInput {
  concept: { genre: Genre; mood: ConceptMood };
  budgetTierId: ComebackBudgetTierId;
  /** 이 앨범의 센터. 없으면 포지션 센터가 기본. */
  centerTraineeId?: string | null;
  startedAtWeek: number;
  season: Season;
  trainees: readonly Trainee[];
  conceptHistory: readonly ConceptMood[];
}

/** 컨셉·예산 확정과 함께 컴백 프로젝트 인스턴스와 제작 앨범을 만든다. */
export function createComebackPlan(input: ComebackPlanInput): {
  project: ProjectInstance;
  album: Album;
} {
  const { concept, startedAtWeek } = input;
  const random = createSeededRandom(startedAtWeek * 131 + concept.mood.length);
  const titlePool = MOOD_ALBUM_TITLES[concept.mood];
  const title = titlePool[Math.floor(random() * titlePool.length)];

  const avgAffinity =
    input.trainees.reduce(
      (sum, trainee) => sum + (trainee.conceptAffinity[concept.mood] ?? 50),
      0,
    ) / Math.max(1, input.trainees.length);
  const expectation = calculateFandomExpectation(
    input.conceptHistory,
    concept.mood,
  );
  const budgetTier =
    COMEBACK_BUDGET_TIERS_BY_ID.get(input.budgetTierId) ??
    COMEBACK_BUDGET_TIERS[1];
  const base = budgetTier.baseProgress;

  return {
    project: createProjectInstance(COMEBACK_PROJECT, startedAtWeek),
    album: {
      id: `album-comeback-w${startedAtWeek}`,
      title,
      concept,
      titleTrackCandidates: [],
      titleTrack: null,
      centerTraineeId: input.centerTraineeId ?? null,
      progress: { song: base, visual: base, choreography: base, marketing: base },
      memberConceptFit: Math.round(avgAffinity),
      seasonFit: Math.max(
        0,
        Math.min(100, 50 + (SEASON_MOOD_FIT[input.season]?.[concept.mood] ?? 0)),
      ),
      fandomExpectationFit: Math.max(
        0,
        Math.min(100, 50 + expectation.fitScore),
      ),
      externalCollaborators: {},
      quality: 0,
    },
  };
}

export interface ComebackProjectWeekInput {
  project: ProjectInstance;
  cumulativeWeek: number;
  season: Season;
  album: Album | null;
  releasedAlbums: readonly Album[];
  trainees: readonly Trainee[];
  staff: readonly Staff[];
  fandom: FandomStoreState;
  competitors: readonly CompetitorGroup[];
  eventRivals: readonly EventCompetitor[];
  backgroundGroups: readonly BackgroundGroup[];
  calendar: CalendarStoreState;
  equipmentLevel: 1 | 2 | 3 | 4;
  conceptHistory: ConceptMood[];
}

/** 투자사 요약은 weekProcessor가 채운다 — 여기서는 조건 정보를 갖고 있지 않다. */
export type ComebackSettlementSummary = Omit<
  ComebackSettlementReport,
  "investorNotes"
>;

export interface ComebackProjectWeekResult {
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
  settlement: ComebackSettlementSummary | null;
  musicShowEvaluated: boolean;
}

function toProjectMetrics(
  project: ProjectInstance,
  album: Album | null,
  trainees: readonly Trainee[],
  relativeWeek: number,
): ProjectMetrics {
  const released = Boolean(project.releasedAlbumId);
  return {
    elapsedWeeks: relativeWeek,
    readiness: released ? 100 : album ? albumProgressAverage(album) : 0,
    averageVocal:
      trainees.reduce((sum, trainee) => sum + trainee.stats.vocal, 0) /
      Math.max(1, trainees.length),
    launchReady: 1,
    titleTrackSelected: released || album?.titleTrack ? 1 : 0,
    albumReleased: released ? 1 : 0,
  };
}

function buildComebackEvent(
  eventId: string,
  input: ComebackProjectWeekInput,
  album: Album | null,
) {
  const template = PROJECT_EVENT_TEMPLATES_BY_ID.get(eventId);
  if (!template) throw new Error(`Unknown project event: ${eventId}`);
  const event = instantiateEvent(
    template,
    `project-event:${eventId}:p${input.project.startedAtWeek}:w${input.cumulativeWeek}`,
  );

  // 사전 반응 브리핑은 이미 존재하는 팬덤 기대치 계산을 플레이어가 발매 전에
  // 읽을 수 있는 정보로 전환한다.
  if (eventId === "comeback-expectation-briefing" && album) {
    const expectation = calculateFandomExpectation(
      input.conceptHistory,
      album.concept.mood,
    );
    const lines = [expectation.description];
    if (expectation.fandomPenalty < 0) {
      lines.push(`팬덤 이탈 위험 ${expectation.fandomPenalty}`);
    }
    if (expectation.publicBonusChance > 0) {
      lines.push(
        `대중 반향 확률 ${Math.round(expectation.publicBonusChance * 100)}% (성공 시 대중성 +${expectation.publicBonus})`,
      );
    }
    return {
      event: { ...event, description: lines.join(" · ") },
      effects: template.effects,
    };
  }

  return { event, effects: template.effects };
}

interface MusicShowBattle {
  won: boolean;
  playerScore: number;
  rivalName: string;
  rivalScore: number;
}

interface MusicShowContender {
  name: string;
  power: number;
  fanVote: number;
}

export interface MusicShowInput {
  playerPower: number;
  /** 0~100. 팬덤·충성도의 가중 합 — 차트에서 밀려도 투표로 다툴 수 있다. */
  playerFanVote: number;
  competitors: readonly CompetitorGroup[];
  eventRivals: readonly EventCompetitor[];
  backgroundGroups: readonly BackgroundGroup[];
  seed: number;
}

function clampVote(value: number): number {
  return Math.max(0, Math.min(100, value));
}

/**
 * 이번 주 1위 후보 대결. 음원 파워와 팬덤 투표의 합산 무대라서 활동 중인
 * 라이벌(실제 팬덤)이 가장 위협적이고, 배경 그룹은 시장 기준선으로만 선다.
 * competitorSystem의 컴백 시뮬이 상대를 공급하므로 라이벌이 "보이게" 된다.
 */
export function evaluateMusicShow(input: MusicShowInput): MusicShowBattle {
  const random = createSeededRandom(input.seed);
  const composite = (contender: { power: number; fanVote: number }) =>
    contender.power * MUSIC_SHOW_SCORE.powerWeight +
    contender.fanVote * MUSIC_SHOW_SCORE.fanVoteWeight;

  const rivalPool: MusicShowContender[] = [
    ...input.competitors
      .filter((competitor) => competitor.currentAlbum)
      .map((competitor) => ({
        name: competitor.name,
        power:
          (competitor.currentAlbum?.quality ?? 0) * 0.4 +
          competitor.public * 0.25 +
          (competitor.fandom / 100) * 0.15 +
          competitor.industry * 0.1 +
          (competitor.global / 100) * 0.1,
        fanVote: clampVote(competitor.fandom / 100),
      })),
    ...input.eventRivals.map((rival) => ({
      name: rival.name,
      power:
        rival.intensity * 0.5 +
        rival.public * 0.25 +
        (rival.fandom / 100) * 0.15 +
        rival.industry * 0.1,
      fanVote: clampVote(rival.fandom / 100),
    })),
    ...input.backgroundGroups.map((group) => ({
      name: group.name,
      power: group.chartScore * BACKGROUND_CHART_POWER_SCALE,
      fanVote: MUSIC_SHOW_SCORE.marketBaselineFanVote,
    })),
  ].sort((a, b) => composite(b) - composite(a));

  const rival = rivalPool[0] ?? {
    name: "차트 상위권 그룹",
    power: input.playerPower * 0.9,
    fanVote: MUSIC_SHOW_SCORE.marketBaselineFanVote,
  };
  // 넓은 분산이 성장 곡선의 절벽을 완만하게 만든다 — 추격자는 가끔 이기고,
  // 정상권도 가끔 진다.
  const roll = () => 0.85 + random() * 0.3;
  const playerScore = Math.round(
    composite({ power: input.playerPower, fanVote: input.playerFanVote }) *
      roll() *
      85,
  );
  const rivalScore = Math.round(composite(rival) * roll() * 85);

  return {
    won: playerScore >= rivalScore,
    playerScore,
    rivalName: rival.name,
    rivalScore,
  };
}

function buildSettlement(
  project: ProjectInstance,
  released: Album | undefined,
  conceptHistory: readonly ConceptMood[],
): ComebackSettlementSummary {
  const lastMood = conceptHistory[conceptHistory.length - 1];
  const streak = (() => {
    if (!lastMood) return 0;
    let count = 0;
    for (let i = conceptHistory.length - 1; i >= 0; i--) {
      if (conceptHistory[i] !== lastMood) break;
      count++;
    }
    return count;
  })();
  const moodLabel = lastMood ? CONCEPT_MOOD_DATA[lastMood].label : "";
  const nextHook = lastMood
    ? streak >= 2
      ? `팬덤은 ${moodLabel} 계열을 ${streak}번 연속 지켜봤습니다. 같은 색을 지킬지, 새로운 색으로 넘어갈지 — 다음 기획의 질문입니다.`
      : `${moodLabel} 색이 팀의 첫인상으로 자리 잡았습니다. 다음 앨범 기획을 바로 시작할 수 있습니다.`
    : "다음 앨범 기획을 바로 시작할 수 있습니다.";

  return {
    projectId: project.id,
    albumTitle: released?.title ?? project.title,
    trackTitle: released?.titleTrack?.name ?? "타이틀곡",
    chartPeak: released?.performance?.chartPeak ?? 0,
    firstWeekSales: released?.performance?.firstWeekSales ?? 0,
    totalStreams: released?.performance?.totalStreams ?? 0,
    fanGrowth: released?.performance?.fanGrowth ?? 0,
    musicShowWins: project.evaluations.musicShow
      ? project.evaluations.musicShow.score
      : null,
    nextHook,
  };
}

export function processComebackProjectWeek(
  input: ComebackProjectWeekInput,
): ComebackProjectWeekResult {
  let project = { ...input.project };
  let album = input.album;
  const relativeWeek = getProjectRelativeWeek(project, input.cumulativeWeek);
  // 중첩 대기 중에는 발매를 마친 이전 사이클이 새 기획의 앨범을 건드리면 안 된다.
  const ownsCurrentAlbum = !project.releasedAlbumId && album !== null;

  const advanced = advanceProject(
    COMEBACK_PROJECT,
    project,
    input.cumulativeWeek,
    toProjectMetrics(project, ownsCurrentAlbum ? album : null, input.trainees, relativeWeek),
  );
  project = advanced.project;

  // 곡 후보 스테이지: 기존 generateTitleTrackCandidates를 재사용해 후보를 공급한다.
  if (
    ownsCurrentAlbum &&
    album &&
    album.titleTrackCandidates.length === 0 &&
    relativeWeek >= stageWindowStart("song-candidates")
  ) {
    const producer = input.staff.find((member) => member.role === "producer") ?? null;
    const hasProducingMember = input.trainees.some(
      (trainee) =>
        trainee.position === "producing" || trainee.subPosition === "producing",
    );
    album = {
      ...album,
      titleTrackCandidates: generateTitleTrackCandidates(
        producer,
        album.concept,
        hasProducingMember,
        project.startedAtWeek * 53 + 7,
      ),
    };
  }

  if (
    ownsCurrentAlbum &&
    album &&
    album.titleTrackCandidates.length > 0 &&
    relativeWeek >= stageWindowStart("title-decision")
  ) {
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

  const events: ComebackProjectWeekResult["events"] =
    advanced.spawnedEventIds.map((eventId) =>
      buildComebackEvent(eventId, input, album),
    );

  // 발매: release 스테이지 도달 시 1회 실행한다.
  let releasedAlbum: Album | null = null;
  let releaseResult: ReleaseResult | null = null;
  if (
    ownsCurrentAlbum &&
    album?.titleTrack &&
    !project.releasedAlbumId &&
    stageIndexOf(project.currentStageId) >= stageIndexOf("release")
  ) {
    const released = finalizeAlbumRelease({
      album,
      cumulativeWeek: input.cumulativeWeek,
      trainees: input.trainees,
      teamChemistry: averageTeamChemistry(input.trainees),
      season: input.season,
      conceptHistory: input.conceptHistory,
      equipmentLevel: input.equipmentLevel,
      fandom: input.fandom,
      competitors: input.competitors,
      eventRivals: input.eventRivals,
      backgroundGroups: input.backgroundGroups,
      market: input.calendar.marketTrend,
    });
    releasedAlbum = released.album;
    releaseResult = released.releaseResult;
    project = { ...project, releasedAlbumId: released.album.id };
    album = null;
    events.push({
      event: {
        id: `chart-reveal:${released.album.id}:w${input.cumulativeWeek}`,
        type: "market",
        tone: "positive",
        title: "컴백 차트 진입",
        description: `${released.album.title}의 첫 차트 순위가 집계되었습니다.`,
        resolved: false,
        presentation: {
          kind: "chart-reveal",
          chartName: "멜론 TOP 100",
          rank: released.releaseResult.chartRank,
          albumTitle: released.album.title,
          trackTitle: released.album.titleTrack?.name ?? "타이틀곡",
          chartPower: released.releaseResult.chartPower,
        },
      },
      effects: {},
    });
  }

  // 활동기 음악방송: 후보권(차트 상위) 안이면 매주 1위 대결이 열린다.
  // 후보권 밖의 신인은 조용한 무대 리포트만 받는다 — "첫 후보 진입"이
  // 이정표(musicShowCandidacies)가 되는 이유다.
  let musicShowEvaluated = false;
  if (project.releasedAlbumId && project.currentStageId === "activity") {
    const melonRank = input.fandom.chartPositions.melon;
    const qualified =
      melonRank > 0 && melonRank <= MUSIC_SHOW_CANDIDACY.maxChartRank;
    const released = input.releasedAlbums.find(
      (candidate) => candidate.id === project.releasedAlbumId,
    );

    if (qualified) {
      const battle = evaluateMusicShow({
        playerPower: released?.performance?.chartPower ?? 0,
        playerFanVote:
          input.fandom.fandom * 0.6 + input.fandom.fandomLoyalty * 0.4,
        competitors: input.competitors,
        eventRivals: input.eventRivals,
        backgroundGroups: input.backgroundGroups,
        seed: input.cumulativeWeek * 577 + project.startedAtWeek,
      });
      const wins = (project.evaluations.musicShow?.score ?? 0) + (battle.won ? 1 : 0);
      project = {
        ...project,
        evaluations: {
          ...project.evaluations,
          musicShow: {
            id: "musicShow",
            week: input.cumulativeWeek,
            score: wins,
            passed: wins > 0,
            summary: battle.won
              ? `${MUSIC_SHOW_NAME} 1위. ${battle.rivalName}을(를) ${battle.playerScore - battle.rivalScore}점 차로 눌렀습니다.`
              : `${MUSIC_SHOW_NAME} 1위 후보에 올랐지만 ${battle.rivalName}에게 ${battle.rivalScore - battle.playerScore}점 차로 밀렸습니다.`,
          },
        },
      };
      musicShowEvaluated = true;
      events.push({
        event: {
          id: `music-show:${project.id}:w${input.cumulativeWeek}`,
          type: "market",
          tone: battle.won ? "positive" : "neutral",
          title: battle.won
            ? wins === 1
              ? "음악방송 첫 1위"
              : `음악방송 1위 (${wins}회째)`
            : "음악방송 1위 후보",
          description: project.evaluations.musicShow.summary,
          resolved: false,
          presentation: {
            kind: "music-show",
            showName: MUSIC_SHOW_NAME,
            trackTitle: released?.titleTrack?.name ?? "타이틀곡",
            playerScore: battle.playerScore,
            rivalName: battle.rivalName,
            rivalScore: battle.rivalScore,
            won: battle.won,
          },
        },
        effects: battle.won
          ? { ...MUSIC_SHOW_OUTCOME.win }
          : { ...MUSIC_SHOW_OUTCOME.lose },
      });
    } else if (
      !project.evaluations.musicShow &&
      !project.evaluations.musicShowMissed
    ) {
      // 차트는 감쇠만 하므로 한 번 밖이면 이번 활동에선 다시 들어오지 못한다.
      project = {
        ...project,
        evaluations: {
          ...project.evaluations,
          musicShowMissed: {
            id: "musicShowMissed",
            week: input.cumulativeWeek,
            score: melonRank,
            passed: false,
            summary: `차트 ${melonRank > 0 ? `${melonRank}위` : "권 밖"} — 1위 후보권(${MUSIC_SHOW_CANDIDACY.maxChartRank}위 이내)에 들지 못했다.`,
          },
        },
      };
      events.push({
        event: {
          id: `music-show-missed:${project.id}:w${input.cumulativeWeek}`,
          type: "market",
          tone: "neutral",
          title: "음악방송 무대",
          description: `${MUSIC_SHOW_NAME} 무대에 올랐지만 아직 1위 후보권 밖이다. 후보에 서려면 차트 ${MUSIC_SHOW_CANDIDACY.maxChartRank}위 안에 들어야 한다.`,
          resolved: false,
        },
        effects: { public: 1 },
      });
    }
  }

  // 정산·회고: 활동을 닫으며 다음 사이클의 질문을 꺼낸다.
  let settlement: ComebackSettlementSummary | null = null;
  if (
    !project.evaluations.settlement &&
    project.releasedAlbumId &&
    stageIndexOf(project.currentStageId) >= stageIndexOf("settlement")
  ) {
    const released = input.releasedAlbums.find(
      (candidate) => candidate.id === project.releasedAlbumId,
    );
    settlement = buildSettlement(project, released, input.conceptHistory);
    project = {
      ...project,
      evaluations: {
        ...project.evaluations,
        settlement: {
          id: "settlement",
          week: input.cumulativeWeek,
          score: settlement.chartPeak,
          passed: settlement.chartPeak > 0 && settlement.chartPeak <= 30,
          summary: `${settlement.albumTitle} 활동 정산 — 차트 최고 ${settlement.chartPeak}위, 초동 ${settlement.firstWeekSales.toLocaleString("ko-KR")}장.`,
        },
      },
    };
  }

  return {
    project,
    album,
    releasedAlbum,
    releaseResult,
    events,
    enteredStageIds: advanced.enteredStages.map((stage) => stage.id),
    settlement,
    musicShowEvaluated,
  };
}
