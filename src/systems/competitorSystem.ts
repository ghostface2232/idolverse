import {
  COMPETITOR_SCALING_FACTOR,
  EVENT_COMPETITOR_SPAWN_CHANCE,
  ROOKIE_COHORT,
} from "@/data/balance";
import {
  COMPETITOR_ARCHETYPES,
  EVENT_COMPETITOR_ARCHETYPES,
} from "@/data/competitors";
import { createSeededRandom, pickUniqueItems } from "@/lib/seededRandom";
import type {
  BackgroundGroup,
  CompetitorGroup,
  CompetitorType,
  EventCompetitor,
  GroupGender,
  Season,
} from "@/types/game";

function randBetween(min: number, max: number, random: () => number): number {
  return min + random() * (max - min);
}

function randIntBetween(min: number, max: number, random: () => number): number {
  return Math.round(randBetween(min, max, random));
}

export function initializePermanentRivals(
  playerLevel: number,
  playerGender: GroupGender,
  seed: number,
): { rivals: CompetitorGroup[]; backgroundGroups: BackgroundGroup[] } {
  const random = createSeededRandom(seed);
  const selectedArchetypes = pickUniqueItems(
    COMPETITOR_ARCHETYPES,
    Math.min(3 + Math.floor(random() * 2), COMPETITOR_ARCHETYPES.length),
    seed + 7,
  );

  const oppositeGender: GroupGender = playerGender === "female" ? "male" : "female";

  const rivals: CompetitorGroup[] = selectedArchetypes.map((arch, i) => {
    const namePool = arch.groupNamePool[playerGender];
    const name = namePool[Math.floor(random() * namePool.length)];
    const agency = arch.agencyPool[Math.floor(random() * arch.agencyPool.length)];

    const scale = COMPETITOR_SCALING_FACTOR + (playerLevel / 100) * 0.3;

    return {
      id: `rival-${arch.id}-${i}`,
      name,
      agency,
      gender: playerGender,
      type: arch.type,
      stats: {
        vocal: randIntBetween(
          (arch.statRanges.vocal?.min ?? 40) * scale,
          (arch.statRanges.vocal?.max ?? 70) * scale,
          random,
        ),
        dance: randIntBetween(
          (arch.statRanges.dance?.min ?? 40) * scale,
          (arch.statRanges.dance?.max ?? 70) * scale,
          random,
        ),
        visual: randIntBetween(
          (arch.statRanges.visual?.min ?? 50) * scale,
          (arch.statRanges.visual?.max ?? 80) * scale,
          random,
        ),
        marketing: randIntBetween(
          (arch.statRanges.marketing?.min ?? 40) * scale,
          (arch.statRanges.marketing?.max ?? 75) * scale,
          random,
        ),
      },
      fandom: randIntBetween(arch.fandomRange.min * 100, arch.fandomRange.max * 100, random),
      public: randIntBetween(arch.publicRange.min, arch.publicRange.max, random),
      global: randIntBetween(arch.globalRange.min * 50, arch.globalRange.max * 50, random),
      industry: randIntBetween(arch.industryRange.min, arch.industryRange.max, random),
      activeWeeks: randIntBetween(8, 30, random),
      debutYear: 1,
      strengths: [...arch.strengths],
      weaknesses: [...arch.weaknesses],
    };
  });

  const bgCount = 3 + Math.floor(random() * 2);
  const bgArchetypes = pickUniqueItems(COMPETITOR_ARCHETYPES, bgCount, seed + 31);
  const backgroundGroups: BackgroundGroup[] = bgArchetypes.map((arch, i) => {
    const namePool = arch.groupNamePool[oppositeGender];
    const name = namePool[Math.floor(random() * namePool.length)];
    const agency = arch.agencyPool[Math.floor(random() * arch.agencyPool.length)];
    const chartScore = randIntBetween(30, 75, random);

    return {
      id: `bg-${arch.id}-${i}`,
      name,
      agency,
      gender: oppositeGender,
      chartScore,
    };
  });

  return { rivals, backgroundGroups };
}

export interface CompetitorWeekResult {
  competitors: CompetitorGroup[];
  backgroundGroups: BackgroundGroup[];
  comebacks: string[];
}

export function simulateCompetitorWeek(
  competitors: readonly CompetitorGroup[],
  backgroundGroups: readonly BackgroundGroup[],
  week: number,
  // 회차별 세계 시드. 0이면(구버전 세이브) 기존과 동일하게 진화한다.
  campaignSeed = 0,
): CompetitorWeekResult {
  const random = createSeededRandom(week * 137 + campaignSeed);
  const comebacks: string[] = [];

  const updated = competitors.map((c) => {
    const rival = { ...c, stats: { ...c.stats } };
    rival.activeWeeks += 1;

    // 시상식 지표용 연간 기록. 연초에 리셋한다 — currentAlbum 스냅샷은
    // 4주 뒤 소멸해 시상 주의 지표를 붕괴시키기 때문에 별도로 든다.
    if (week === 1) {
      rival.seasonBestQuality = rival.currentAlbum?.quality ?? 0;
    }

    const growth = 0.3 + random() * 0.4;
    rival.stats.vocal = Math.min(100, rival.stats.vocal + growth * 0.5);
    rival.stats.dance = Math.min(100, rival.stats.dance + growth * 0.5);
    rival.public = Math.max(0, rival.public + (random() < 0.3 ? 1 : -1));
    rival.industry = Math.min(100, rival.industry + (random() < 0.2 ? 1 : 0));

    if (rival.currentAlbum) {
      const weeksOut = week - rival.currentAlbum.releaseWeek;
      if (weeksOut > 4) {
        rival.currentAlbum = undefined;
      }
    }

    if (!rival.currentAlbum) {
      const arch = COMPETITOR_ARCHETYPES.find((a) => a.type === rival.type);
      const interval = arch?.comebackIntervalWeeks;
      const minInterval = interval?.min ?? 10;
      if (rival.activeWeeks % minInterval < 1 && random() < 0.4) {
        const quality = randIntBetween(40, 85, random);
        rival.currentAlbum = {
          title: `${rival.name} 컴백`,
          quality,
          releaseWeek: week,
        };
        rival.seasonBestQuality = Math.max(
          rival.seasonBestQuality ?? 0,
          quality,
        );
        comebacks.push(rival.name);
      }
    }

    return rival;
  });

  const updatedBg = backgroundGroups.map((bg) => {
    const drift = (random() - 0.5) * 4;
    return {
      ...bg,
      chartScore: Math.max(10, Math.min(90, bg.chartScore + drift)),
    };
  });

  return { competitors: updated, backgroundGroups: updatedBg, comebacks };
}

/**
 * 그 해 신인들이 데뷔하는 주. 연도·회차 시드만의 함수라 상태 없이
 * 결정론이 성립한다 — 상반기 1팀, 하반기 1팀으로 자연히 흩어진다.
 */
export function getRookieDebutWeeks(year: number, campaignSeed: number): number[] {
  const random = createSeededRandom(year * 389 + campaignSeed);
  return [8 + Math.floor(random() * 20), 28 + Math.floor(random() * 19)].slice(
    0,
    ROOKIE_COHORT.groupsPerYear,
  );
}

/**
 * 연차별 신인 그룹 스폰(F6). 기성 라이벌보다 얕은 기반으로 시작해
 * 주간 시뮬로 성장한다 — 데뷔 연도가 신인상 코호트를 정한다.
 */
export function spawnRookieGroup(
  year: number,
  cohortIndex: number,
  playerGender: GroupGender,
  campaignSeed: number,
  usedNames: ReadonlySet<string>,
): CompetitorGroup {
  const random = createSeededRandom(
    year * 389 + campaignSeed + cohortIndex * 17 + 5,
  );

  // 아키타입을 고르되, 이름 풀이 이미 소진됐으면 다음 아키타입으로 넘어간다.
  const startIndex = Math.floor(random() * COMPETITOR_ARCHETYPES.length);
  let arch = COMPETITOR_ARCHETYPES[startIndex];
  let name: string | null = null;
  for (let offset = 0; offset < COMPETITOR_ARCHETYPES.length; offset++) {
    const candidate =
      COMPETITOR_ARCHETYPES[(startIndex + offset) % COMPETITOR_ARCHETYPES.length];
    const available = candidate.groupNamePool[playerGender].filter(
      (poolName) => !usedNames.has(poolName),
    );
    if (available.length > 0) {
      arch = candidate;
      name = available[Math.floor(random() * available.length)];
      break;
    }
  }
  name = name ?? `${arch.groupNamePool[playerGender][0]} ${year}`;
  const agency = arch.agencyPool[Math.floor(random() * arch.agencyPool.length)];

  const scale = ROOKIE_COHORT.statScale;
  return {
    id: `rookie-y${year}-${cohortIndex}-${arch.id}`,
    name,
    agency,
    gender: playerGender,
    type: arch.type,
    stats: {
      vocal: randIntBetween(
        (arch.statRanges.vocal?.min ?? 40) * scale,
        (arch.statRanges.vocal?.max ?? 70) * scale,
        random,
      ),
      dance: randIntBetween(
        (arch.statRanges.dance?.min ?? 40) * scale,
        (arch.statRanges.dance?.max ?? 70) * scale,
        random,
      ),
      visual: randIntBetween(
        (arch.statRanges.visual?.min ?? 50) * scale,
        (arch.statRanges.visual?.max ?? 80) * scale,
        random,
      ),
      marketing: randIntBetween(
        (arch.statRanges.marketing?.min ?? 40) * scale,
        (arch.statRanges.marketing?.max ?? 75) * scale,
        random,
      ),
    },
    fandom: Math.round(
      randIntBetween(arch.fandomRange.min * 100, arch.fandomRange.max * 100, random) *
        ROOKIE_COHORT.fandomScale,
    ),
    public: Math.round(
      randIntBetween(arch.publicRange.min, arch.publicRange.max, random) *
        ROOKIE_COHORT.fandomScale,
    ),
    global: Math.round(
      randIntBetween(arch.globalRange.min * 50, arch.globalRange.max * 50, random) *
        ROOKIE_COHORT.fandomScale,
    ),
    industry: Math.round(
      randIntBetween(arch.industryRange.min, arch.industryRange.max, random) *
        ROOKIE_COHORT.industryScale,
    ),
    activeWeeks: 0,
    debutYear: year,
    strengths: [...arch.strengths],
    weaknesses: [...arch.weaknesses],
  };
}

/**
 * 로스터 상한 초과 시 오래 활동했고 존재감이 낮은 그룹부터 해체한다.
 * 최소 연차 미만은 건드리지 않으므로 상한은 소프트 캡이다.
 */
export function retireFadedRivals(
  rivals: readonly CompetitorGroup[],
  currentYear: number,
): { rivals: CompetitorGroup[]; disbanded: CompetitorGroup[] } {
  const excess = rivals.length - ROOKIE_COHORT.maxRoster;
  if (excess <= 0) return { rivals: [...rivals], disbanded: [] };

  const relevance = (rival: CompetitorGroup) => rival.fandom / 100 + rival.public;
  const disbanded = rivals
    .filter(
      (rival) =>
        currentYear - rival.debutYear + 1 >= ROOKIE_COHORT.disbandMinYears,
    )
    .sort((a, b) => relevance(a) - relevance(b))
    .slice(0, excess);
  const disbandedIds = new Set(disbanded.map((rival) => rival.id));
  return {
    rivals: rivals.filter((rival) => !disbandedIds.has(rival.id)),
    disbanded,
  };
}

export function competitorComeback(
  competitor: CompetitorGroup,
  season: Season,
  seed: number,
): CompetitorGroup {
  const random = createSeededRandom(seed);
  const quality = randIntBetween(40, 85, random);

  return {
    ...competitor,
    currentAlbum: {
      title: `${competitor.name} ${seasonLabel(season)} 컴백`,
      quality,
      releaseWeek: 0,
    },
  };
}

function seasonLabel(season: Season): string {
  const map: Record<Season, string> = {
    spring: "봄",
    summer: "여름",
    fall: "가을",
    winter: "겨울",
  };
  return map[season];
}

export function spawnEventCompetitor(
  season: Season,
  playerLevel: number,
  playerGender: GroupGender,
  week: number,
  force = false,
  campaignSeed = 0,
): EventCompetitor | null {
  const random = createSeededRandom(week * 211 + playerLevel + campaignSeed);

  if (!force && random() >= EVENT_COMPETITOR_SPAWN_CHANCE) return null;

  const pool = EVENT_COMPETITOR_ARCHETYPES;
  const template = pool[Math.floor(random() * pool.length)];

  const crossGenderTypes: Set<string> = new Set(["comeback_monster", "season_king"]);
  const gender: GroupGender =
    crossGenderTypes.has(template.triggerType) && random() < 0.3
      ? (playerGender === "female" ? "male" : "female")
      : playerGender;

  const namePool = template.groupNamePool[gender];
  const name = namePool[Math.floor(random() * namePool.length)];
  const agency = template.agencyPool[Math.floor(random() * template.agencyPool.length)];

  const scale = COMPETITOR_SCALING_FACTOR + (playerLevel / 100) * 0.4;
  const duration = randIntBetween(template.durationWeeks.min, template.durationWeeks.max, random);
  const intensity = randIntBetween(template.intensityRange.min, template.intensityRange.max, random);

  return {
    id: `event-rival-${template.triggerType}-w${week}`,
    name,
    agency,
    gender,
    type: template.type,
    triggerType: template.triggerType,
    stats: {
      vocal: randIntBetween(
        (template.statRanges.vocal?.min ?? 50) * scale,
        (template.statRanges.vocal?.max ?? 75) * scale,
        random,
      ),
      dance: randIntBetween(
        (template.statRanges.dance?.min ?? 50) * scale,
        (template.statRanges.dance?.max ?? 75) * scale,
        random,
      ),
      visual: randIntBetween(
        (template.statRanges.visual?.min ?? 50) * scale,
        (template.statRanges.visual?.max ?? 80) * scale,
        random,
      ),
      marketing: randIntBetween(
        (template.statRanges.marketing?.min ?? 50) * scale,
        (template.statRanges.marketing?.max ?? 80) * scale,
        random,
      ),
    },
    fandom: randIntBetween(template.fandomRange.min * 100, template.fandomRange.max * 100, random),
    public: randIntBetween(template.publicRange.min, template.publicRange.max, random),
    global: randIntBetween(template.globalRange.min * 50, template.globalRange.max * 50, random),
    industry: randIntBetween(template.industryRange.min, template.industryRange.max, random),
    activeWeeks: 0,
    debutYear: 1,
    strengths: [...template.strengths],
    weaknesses: [...template.weaknesses],
    duration,
    intensity,
  };
}

export interface MarketCompetitionResult {
  totalCompetitors: number;
  activeComebacks: number;
  competitionIntensity: number;
}

export function getMarketCompetition(
  week: number,
  competitors: readonly CompetitorGroup[],
  eventRivals: readonly EventCompetitor[],
  backgroundGroups: readonly BackgroundGroup[],
): MarketCompetitionResult {
  const activeComebacks = competitors.filter((c) => c.currentAlbum).length +
    eventRivals.length;

  const totalCompetitors =
    competitors.length + eventRivals.length + backgroundGroups.length;

  const avgBgPower =
    backgroundGroups.length > 0
      ? backgroundGroups.reduce((s, bg) => s + bg.chartScore, 0) / backgroundGroups.length
      : 0;

  const competitionIntensity =
    activeComebacks * 15 +
    eventRivals.reduce((s, e) => s + e.intensity * 0.3, 0) +
    avgBgPower * 0.2;

  return { totalCompetitors, activeComebacks, competitionIntensity };
}
