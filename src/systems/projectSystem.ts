import type {
  ProjectDefinition,
  ProjectInstance,
  ProjectMetricKey,
  ProjectStageDefinition,
} from "@/types/game";

export type ProjectMetrics = Record<ProjectMetricKey, number>;

export interface ProjectAdvanceResult {
  project: ProjectInstance;
  enteredStages: ProjectStageDefinition[];
  spawnedEventIds: string[];
  relativeWeek: number;
}

export function createProjectInstance(
  definition: ProjectDefinition,
  startedAtWeek: number,
  instanceId = `${definition.id}:${startedAtWeek}`,
): ProjectInstance {
  const firstStage = definition.stages[0];
  if (!firstStage) throw new Error(`Project ${definition.id} has no stages.`);

  return {
    id: instanceId,
    definitionId: definition.id,
    kind: definition.kind,
    title: definition.title,
    startedAtWeek,
    currentStageId: firstStage.id,
    status: "active",
    completedStageIds: [],
    spawnedEventIds: [],
    decisionStatuses: {},
    evaluations: {},
  };
}

export function getProjectRelativeWeek(
  project: Pick<ProjectInstance, "startedAtWeek">,
  cumulativeWeek: number,
): number {
  return Math.max(1, cumulativeWeek - project.startedAtWeek + 1);
}

export function meetsProjectRequirements(
  requirements: ProjectStageDefinition["entryRequirements"],
  metrics: ProjectMetrics,
): boolean {
  return (requirements ?? []).every(
    (requirement) => metrics[requirement.metric] >= requirement.target,
  );
}

/**
 * 주차 창과 진입 게이트만으로 단계를 전이하는 범용 순수 함수다. 이미 지난
 * 창을 로드한 구버전 세이브도 가능한 가장 앞 단계까지 따라잡되 게이트는 넘지 않는다.
 */
export function advanceProject(
  definition: ProjectDefinition,
  project: ProjectInstance,
  cumulativeWeek: number,
  metrics: ProjectMetrics,
): ProjectAdvanceResult {
  if (project.definitionId !== definition.id) {
    throw new Error(`Project ${project.id} does not use ${definition.id}.`);
  }

  const relativeWeek = getProjectRelativeWeek(project, cumulativeWeek);
  const currentIndex = Math.max(
    0,
    definition.stages.findIndex((stage) => stage.id === project.currentStageId),
  );
  let targetIndex = currentIndex;
  let blocked = false;

  for (let index = currentIndex + 1; index < definition.stages.length; index++) {
    const stage = definition.stages[index];
    if (relativeWeek < stage.weekWindow[0]) break;
    if (!meetsProjectRequirements(stage.entryRequirements, metrics)) {
      blocked = true;
      break;
    }
    targetIndex = index;
  }

  const enteredStages = definition.stages.slice(currentIndex + 1, targetIndex + 1);
  const completedStageIds = [
    ...new Set([
      ...project.completedStageIds,
      ...definition.stages.slice(0, targetIndex).map((stage) => stage.id),
    ]),
  ];
  const spawnedEventIds = enteredStages
    .flatMap((stage) => stage.eventIds ?? [])
    .filter((eventId) => !project.spawnedEventIds.includes(eventId));

  const lastStage = definition.stages[definition.stages.length - 1];
  const completed =
    targetIndex === definition.stages.length - 1 &&
    relativeWeek >= lastStage.weekWindow[1] &&
    meetsProjectRequirements(lastStage.entryRequirements, metrics);

  return {
    project: {
      ...project,
      currentStageId: definition.stages[targetIndex].id,
      status: completed ? "completed" : blocked ? "blocked" : "active",
      completedStageIds,
      spawnedEventIds: [...project.spawnedEventIds, ...spawnedEventIds],
      completedAtWeek: completed ? cumulativeWeek : project.completedAtWeek,
    },
    enteredStages,
    spawnedEventIds,
    relativeWeek,
  };
}

export function appendProjectEvents(
  project: ProjectInstance,
  eventIds: readonly string[],
): ProjectInstance {
  const fresh = eventIds.filter((id) => !project.spawnedEventIds.includes(id));
  return fresh.length === 0
    ? project
    : { ...project, spawnedEventIds: [...project.spawnedEventIds, ...fresh] };
}
