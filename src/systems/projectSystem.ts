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
  // 첫 스테이지는 "진입"이 없어 이벤트가 영영 스폰되지 않는 사각지대였다.
  // 현재 스테이지가 아직 자기 이벤트를 하나도 스폰하지 않았다면 함께 스폰한다.
  // (변주 풀로 일부만 스폰된 스테이지는 겹침이 있으므로 다시 뽑지 않는다.)
  const currentStage = definition.stages[currentIndex];
  const currentStageEventIds = currentStage.eventIds ?? [];
  const currentStageUnspawned =
    currentStageEventIds.length > 0 &&
    relativeWeek >= currentStage.weekWindow[0] &&
    !currentStageEventIds.some((eventId) =>
      project.spawnedEventIds.includes(eventId),
    );
  const spawnStages = [
    ...(currentStageUnspawned ? [currentStage] : []),
    ...enteredStages,
  ];

  const spawnedEventIds = spawnStages.flatMap((stage) => {
    const fresh = (stage.eventIds ?? []).filter(
      (eventId) => !project.spawnedEventIds.includes(eventId),
    );
    // 변주 풀: eventPickCount가 있으면 인스턴스 시드로 일부만 추려
    // 사이클마다 다른 사건이 나오게 한다. 시드가 같으면 항상 같은 조합이다.
    if (stage.eventPickCount === undefined || fresh.length <= stage.eventPickCount) {
      return fresh;
    }
    return pickSeededSubset(fresh, stage.eventPickCount, `${project.id}:${stage.id}`);
  });

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

function hashSeedText(text: string): number {
  let hash = 2166136261;
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

/** 시드 문자열이 같으면 항상 같은 부분집합을 고르는 결정론 샘플러다. */
function pickSeededSubset(
  items: readonly string[],
  count: number,
  seedText: string,
): string[] {
  let seed = hashSeedText(seedText) || 1;
  const nextRandom = () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  };

  const pool = [...items];
  const picked: string[] = [];
  while (picked.length < count && pool.length > 0) {
    const index = Math.floor(nextRandom() * pool.length);
    picked.push(pool.splice(index, 1)[0]);
  }
  return picked;
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
