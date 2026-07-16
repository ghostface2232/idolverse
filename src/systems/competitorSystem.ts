import {
  COMPETITOR_SCALING_FACTOR,
  EVENT_COMPETITOR_SPAWN_CHANCE,
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
): CompetitorWeekResult {
  const random = createSeededRandom(week * 137);
  const comebacks: string[] = [];

  const updated = competitors.map((c) => {
    const rival = { ...c, stats: { ...c.stats } };
    rival.activeWeeks += 1;

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
): EventCompetitor | null {
  const random = createSeededRandom(week * 211 + playerLevel);

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
