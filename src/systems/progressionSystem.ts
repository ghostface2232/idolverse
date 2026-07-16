import {
  CONTRACT_TERM_WEEKS,
  DEBUT_REQUIREMENTS,
  GAME_BALANCE,
} from "@/data/balance";
import { MILESTONE_DEFINITIONS, PHASE_GATES } from "@/data/milestones";
import { PROJECT_DEFINITIONS_BY_ID } from "@/data/debutProject";
import type {
  Album,
  AchievedMilestone,
  GamePhase,
  InvestorCondition,
  MilestoneDefinition,
  MilestoneMetricKey,
  MilestoneRequirement,
  ProjectInstance,
  Trainee,
  WeeklyDecision,
} from "@/types/game";

export type MilestoneMetrics = Record<MilestoneMetricKey, number>;

export interface MilestoneMetricsInput {
  trainees: readonly Trainee[];
  fandom: {
    public: number;
    fandom: number;
    fandomLoyalty: number;
    global: number;
    industry: number;
  };
  money: number;
  currentAlbum: Album | null;
  releasedAlbums: readonly Album[];
}

function averageStat(
  trainees: readonly Trainee[],
  stat: "vocal" | "dance",
): number {
  if (trainees.length === 0) return 0;
  return (
    trainees.reduce((sum, t) => sum + t.stats[stat], 0) / trainees.length
  );
}

function averagePairChemistry(trainees: readonly Trainee[]): number {
  if (trainees.length < 2) return 0;
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

/**
 * 이정표 판정 지표를 게임 상태에서 산출한다. digital/albumSales 지수는
 * weekProcessor의 시상식 후보 산식과 같은 공식을 쓴다 — 이정표가 예고하는
 * 자격과 실제 시상식 판정이 어긋나면 안 되기 때문이다.
 */
export function buildMilestoneMetrics(
  input: MilestoneMetricsInput,
): MilestoneMetrics {
  const latestReleased =
    input.releasedAlbums[input.releasedAlbums.length - 1] ?? null;
  const albumQuality =
    input.currentAlbum?.quality ?? latestReleased?.quality ?? 0;

  return {
    averageVocal: averageStat(input.trainees, "vocal"),
    averageDance: averageStat(input.trainees, "dance"),
    teamChemistry: averagePairChemistry(input.trainees),
    public: input.fandom.public,
    fandom: input.fandom.fandom,
    fandomLoyalty: input.fandom.fandomLoyalty,
    global: input.fandom.global,
    industry: input.fandom.industry,
    money: input.money,
    digitalIndex: input.fandom.public * 0.6 + albumQuality * 0.4,
    albumSalesIndex: input.fandom.fandom * 0.6 + input.fandom.industry * 0.4,
    debutReadiness: input.currentAlbum
      ? (input.currentAlbum.progress.song +
          input.currentAlbum.progress.visual +
          input.currentAlbum.progress.choreography +
          input.currentAlbum.progress.marketing) /
        4
      : input.releasedAlbums.length > 0
        ? 100
        : 0,
    releasedAlbums: input.releasedAlbums.length,
  };
}

export function meetsRequirements(
  requirements: readonly MilestoneRequirement[],
  metrics: MilestoneMetrics,
): boolean {
  return requirements.every((req) => metrics[req.metric] >= req.target);
}

/** 아직 달성하지 못한 이정표 중 이번 주 지표로 충족된 것들을 정의 순서대로 반환한다. */
export function evaluateMilestones(
  metrics: MilestoneMetrics,
  achievedIds: ReadonlySet<string>,
): MilestoneDefinition[] {
  return MILESTONE_DEFINITIONS.filter(
    (definition) =>
      !achievedIds.has(definition.id) &&
      meetsRequirements(definition.requirements, metrics),
  );
}

/** PHASE_GATES 테이블 기준으로 현재 phase에서 전이 가능한 다음 phase를 찾는다. */
export function evaluatePhaseGate(
  currentPhase: GamePhase,
  metrics: MilestoneMetrics,
): GamePhase | null {
  const gate = PHASE_GATES.find(
    (candidate) =>
      candidate.from === currentPhase &&
      meetsRequirements(candidate.requirements, metrics),
  );
  return gate ? gate.to : null;
}

export interface MilestoneProgress {
  definition: MilestoneDefinition;
  /** 가장 덜 채워진 요건 — 지금 올려야 하는 지표. */
  bottleneck: MilestoneRequirement;
  bottleneckCurrent: number;
  /** 전체 요건 충족률 0..1 (요건별 비율의 최솟값). */
  ratio: number;
}

export function getMilestoneProgress(
  definition: MilestoneDefinition,
  metrics: MilestoneMetrics,
): MilestoneProgress {
  let bottleneck = definition.requirements[0];
  let minRatio = Infinity;
  for (const req of definition.requirements) {
    const ratio =
      req.target <= 0 ? 1 : Math.min(1, metrics[req.metric] / req.target);
    if (ratio < minRatio) {
      minRatio = ratio;
      bottleneck = req;
    }
  }
  return {
    definition,
    bottleneck,
    bottleneckCurrent: metrics[bottleneck.metric],
    ratio: Number.isFinite(minRatio) ? minRatio : 1,
  };
}

// ── GoalStrip 3레인 파생 ──────────────────────────────────────────────

export interface GoalLaneItem {
  id: string;
  title: string;
  /** "보컬 48/55" 같은 현재/목표 표기. 없으면 제목만 표시한다. */
  progressLabel?: string;
  /** 0..1 진행률. 게이지 표시에 쓴다. */
  progressRatio?: number;
  deadlineLabel?: string;
  /** 달성 시 열리는 행동. */
  unlocks?: string;
}

export interface GoalLanes {
  weekly: GoalLaneItem;
  project: GoalLaneItem | null;
  longTerm: GoalLaneItem[];
}

export interface GoalLanesInput {
  phase: GamePhase;
  currentWeek: number;
  currentYear: number;
  metrics: MilestoneMetrics;
  achievedIds: ReadonlySet<string>;
  weeklyDecisions: readonly WeeklyDecision[];
  investorConditions: readonly InvestorCondition[];
  activeProjects?: readonly ProjectInstance[];
}

const PHASE_PROJECT_CATEGORIES: Record<
  GamePhase,
  MilestoneDefinition["category"][]
> = {
  prologue: ["debut"],
  founding: ["debut"],
  training: ["debut", "promotion"],
  debut: ["release", "promotion"],
  growth: ["promotion", "release", "award"],
  peak: ["award", "global", "promotion"],
};

function formatMetricValue(metric: MilestoneMetricKey, value: number): string {
  if (metric === "money") {
    return `${Math.floor(value / 100000000)}억`;
  }
  if (metric === "releasedAlbums") {
    return `${Math.floor(value)}`;
  }
  return `${Math.floor(value)}`;
}

function toLaneItem(progress: MilestoneProgress): GoalLaneItem {
  const { definition, bottleneck, bottleneckCurrent, ratio } = progress;
  return {
    id: definition.id,
    title: definition.title,
    progressLabel: `${bottleneck.label} ${formatMetricValue(bottleneck.metric, bottleneckCurrent)}/${formatMetricValue(bottleneck.metric, bottleneck.target)}`,
    progressRatio: ratio,
    unlocks: definition.unlocks,
  };
}

/**
 * 이번 주 / 현재 프로젝트 / 장기의 3시간축 목표를 현재 상태에서 파생한다.
 * 저장하지 않는다 — 달성 기록(milestonesAchieved)만 영속화하고
 * 목표 자체는 매번 여기서 다시 계산해야 상태 이중화가 없다.
 */
export function buildGoalLanes(input: GoalLanesInput): GoalLanes {
  const crisisCount = input.weeklyDecisions.filter(
    (decision) => decision.lane === "crisis",
  ).length;
  const opportunityCount = input.weeklyDecisions.filter(
    (decision) => decision.lane === "opportunity",
  ).length;
  const weekly: GoalLaneItem = {
    id: "weekly-plan",
    title:
      crisisCount > 0 && opportunityCount > 0
        ? `필수 결정 ${crisisCount}건 · 이번 주 기회 ${opportunityCount}건`
        : crisisCount > 0
          ? `필수 결정 ${crisisCount}건이 당신을 기다립니다`
          : opportunityCount > 0
            ? `이번 주에만 잡을 수 있는 기회 ${opportunityCount}건`
        : "훈련과 활동 계획을 살피고 한 주를 보내세요",
  };

  const unachieved = MILESTONE_DEFINITIONS.filter(
    (definition) => !input.achievedIds.has(definition.id),
  );
  const projectCategories = PHASE_PROJECT_CATEGORIES[input.phase];
  const projectCandidates = unachieved
    .filter((definition) => projectCategories.includes(definition.category))
    .map((definition) => getMilestoneProgress(definition, input.metrics));
  // 가장 진행률이 높은(가장 가까운) 이정표가 현재 프로젝트 목표다.
  let project =
    projectCandidates.length > 0
      ? toLaneItem(
          projectCandidates.reduce((best, candidate) =>
            candidate.ratio > best.ratio ? candidate : best,
          ),
        )
      : null;

  const activeProject = input.activeProjects?.find(
    (candidate) => candidate.status !== "completed",
  );
  const activeDefinition = activeProject
    ? PROJECT_DEFINITIONS_BY_ID.get(activeProject.definitionId)
    : null;
  if (activeProject && activeDefinition) {
    const stageIndex = Math.max(
      0,
      activeDefinition.stages.findIndex(
        (stage) => stage.id === activeProject.currentStageId,
      ),
    );
    const stage = activeDefinition.stages[stageIndex];
    const readinessRatio = Math.min(
      1,
      input.metrics.debutReadiness / DEBUT_REQUIREMENTS.readiness,
    );
    const vocalRatio = Math.min(
      1,
      input.metrics.averageVocal / DEBUT_REQUIREMENTS.averageVocal,
    );
    const cumulativeWeek =
      (input.currentYear - 1) * GAME_BALANCE.weeksPerYear + input.currentWeek;
    const elapsed = cumulativeWeek - activeProject.startedAtWeek + 1;
    project = {
      id: activeProject.id,
      title: `${stageIndex + 1}/${activeDefinition.stages.length} · ${stage.title}`,
      progressLabel: `준비 ${Math.floor(input.metrics.debutReadiness)}/${DEBUT_REQUIREMENTS.readiness} · 보컬 ${Math.floor(input.metrics.averageVocal)}/${DEBUT_REQUIREMENTS.averageVocal}`,
      progressRatio: Math.min(readinessRatio, vocalRatio),
      deadlineLabel: `데뷔 W-${Math.max(0, DEBUT_REQUIREMENTS.projectWeeks - elapsed)}`,
      unlocks: stage.unlocks,
    };
  }

  const elapsedWeeks =
    (input.currentYear - 1) * GAME_BALANCE.weeksPerYear +
    input.currentWeek -
    1;

  const longTerm: GoalLaneItem[] = [];
  const primaryCondition = input.investorConditions[0];
  if (primaryCondition) {
    longTerm.push({
      id: `investor:${primaryCondition.id}`,
      title: primaryCondition.description,
      deadlineLabel: `W-${Math.max(0, primaryCondition.deadlineWeeks - elapsedWeeks)}`,
    });
  }

  const longTermCandidates = unachieved
    .filter(
      (definition) =>
        definition.category === "award" || definition.category === "global",
    )
    .map((definition) => getMilestoneProgress(definition, input.metrics));
  if (longTermCandidates.length > 0 && project) {
    const next = longTermCandidates.reduce((best, candidate) =>
      candidate.ratio > best.ratio ? candidate : best,
    );
    if (next.definition.id !== project.id) {
      longTerm.push(toLaneItem(next));
    }
  }

  longTerm.push({
    id: "contract-term",
    title: "전속계약 만료",
    deadlineLabel: `W-${Math.max(0, CONTRACT_TERM_WEEKS - elapsedWeeks)}`,
  });

  return { weekly, project, longTerm };
}

/** weekProcessor에서 달성 기록을 만들 때 쓰는 누적 주차 계산. */
export function toCumulativeWeek(year: number, week: number): number {
  return (year - 1) * GAME_BALANCE.weeksPerYear + week;
}

export function toAchievedMilestone(
  definition: MilestoneDefinition,
  year: number,
  cumulativeWeek: number,
): AchievedMilestone {
  return { id: definition.id, year, week: cumulativeWeek };
}
