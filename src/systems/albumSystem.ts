import {
  CONCEPT_SYNERGY_BONUS,
  EQUIPMENT_ALBUM_MULT,
  FANDOM_EXPECTATION_RISKY,
  FANDOM_EXPECTATION_SAFE,
  GAME_BALANCE,
  SEASON_FIT_BONUS,
} from "@/data/balance";
import { CONCEPT_SYNERGY_TABLE, SEASON_MOOD_FIT } from "@/data/concepts";
import { createSeededRandom } from "@/lib/seededRandom";
import {
  evaluateRelease,
  type MarketContext,
  type ReleaseResult,
} from "@/systems/evaluationSystem";
import type {
  Album,
  BackgroundGroup,
  CompetitorGroup,
  ConceptMood,
  EventCompetitor,
  Genre,
  Season,
  Staff,
  TitleTrack,
  Trainee,
} from "@/types/game";

const TRACK_TYPES = ["safe", "bold", "fandom", "global"] as const;

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function progressAlbum(
  album: Album,
  staff: readonly Staff[],
  trainees: readonly Trainee[],
): Album {
  const producer = staff.find((s) => s.role === "producer");
  const designer = staff.find((s) => s.role === "designer");
  const marketer = staff.find((s) => s.role === "marketer");

  // 스태프가 없으면 그 축의 전문 작업이 실제로 멈춰야 한다 — "유령 능력치
  // 30"이 기본 적용되면 고용이 공짜 대체재를 이길 수 없다.
  const producerAbility = producer?.ability ?? 0;
  const designerAbility = designer?.ability ?? 0;
  const marketerAbility = marketer?.ability ?? 0;

  const avgVocal =
    trainees.reduce((s, t) => s + t.stats.vocal, 0) / Math.max(trainees.length, 1);
  const avgDance =
    trainees.reduce((s, t) => s + t.stats.dance, 0) / Math.max(trainees.length, 1);
  const avgVisual =
    trainees.reduce((s, t) => s + t.stats.visual, 0) / Math.max(trainees.length, 1);

  const songGain = 1.5 + producerAbility * 0.075 + avgVocal * 0.015;
  const visualGain = 1.5 + designerAbility * 0.055 + avgVisual * 0.02;
  const choreoGain = 2 + avgDance * 0.05;
  const marketGain = 1.5 + marketerAbility * 0.065;

  return {
    ...album,
    progress: {
      song: clamp(album.progress.song + songGain, 0, 100),
      visual: clamp(album.progress.visual + visualGain, 0, 100),
      choreography: clamp(album.progress.choreography + choreoGain, 0, 100),
      marketing: clamp(album.progress.marketing + marketGain, 0, 100),
    },
  };
}

export function generateTitleTrackCandidates(
  producer: Staff | null,
  concept: { genre: Genre; mood: ConceptMood },
  hasProducingMember: boolean,
  seed: number,
): TitleTrack[] {
  const random = createSeededRandom(seed);
  // 프로듀서 부재는 곧 후보곡 품질 밴드의 붕괴다(기본 30~45 수준).
  const ability = producer?.ability ?? 0;

  const qualityBase = 30 + ability * 0.5;
  const qualityRange = 15;
  const count = 2 + (random() < 0.4 ? 1 : 0);

  const usedTypes = new Set<string>();
  const tracks: TitleTrack[] = [];

  for (let i = 0; i < count; i++) {
    let type: (typeof TRACK_TYPES)[number];
    do {
      type = TRACK_TYPES[Math.floor(random() * TRACK_TYPES.length)];
    } while (usedTypes.has(type) && usedTypes.size < TRACK_TYPES.length);
    usedTypes.add(type);

    const quality = clamp(
      qualityBase + (random() - 0.5) * 2 * qualityRange,
      10,
      GAME_BALANCE.maxStatValue,
    );

    const synergy = CONCEPT_SYNERGY_TABLE[concept.genre]?.[concept.mood] ?? "B";
    const synergyBonus = (CONCEPT_SYNERGY_BONUS[synergy] - 1.0) * 10;

    tracks.push({
      id: `track-${type}-${i}`,
      name: generateTrackName(type, concept.mood, random),
      type,
      quality: clamp(Math.round(quality + synergyBonus), 10, 100),
      description: TRACK_TYPE_DESCRIPTIONS[type],
    });
  }

  if (hasProducingMember) {
    const bonusQuality = clamp(
      qualityBase + 10 + (random() - 0.3) * qualityRange,
      10,
      GAME_BALANCE.maxStatValue,
    );
    tracks.push({
      id: "track-producing-member",
      name: generateTrackName("fandom", concept.mood, random),
      type: "fandom",
      quality: Math.round(bonusQuality),
      description: "프로듀싱 멤버가 참여한 자작곡. 팬덤 충성도에 강점.",
    });
  }

  return tracks;
}

export interface AlbumQualityInput {
  album: Album;
  trainees: readonly Trainee[];
  teamChemistry: number;
  season: Season;
  conceptHistory: readonly ConceptMood[];
  equipmentLevel: 1 | 2 | 3 | 4;
}

export function calculateAlbumQuality(input: AlbumQualityInput): number {
  const { album, trainees, teamChemistry, season, conceptHistory, equipmentLevel } = input;
  if (!album.titleTrack) return 0;

  const songQuality = album.titleTrack.quality;
  const genre = album.concept.genre;
  const mood = album.concept.mood;

  const synergyGrade = CONCEPT_SYNERGY_TABLE[genre]?.[mood] ?? "B";
  const synergyMult = CONCEPT_SYNERGY_BONUS[synergyGrade];

  const avgAffinity =
    trainees.reduce((s, t) => s + (t.conceptAffinity[mood] ?? 50), 0) /
    Math.max(trainees.length, 1);
  const memberFitMult = 1 + avgAffinity / 200;

  const seasonBonus = (SEASON_MOOD_FIT[season]?.[mood] ?? 0) / 100;
  const seasonMult = 1 + seasonBonus * SEASON_FIT_BONUS * 10;

  const expectation = calculateFandomExpectation(conceptHistory, mood);
  const expectationMult = 1 + expectation.fitScore / 100;

  const chemMult = 1 + teamChemistry / 200;

  const progressAvg =
    (album.progress.song +
      album.progress.visual +
      album.progress.choreography +
      album.progress.marketing) /
    4;
  const progressMult = 0.5 + (progressAvg / 100) * 0.5;

  const equipmentMult = EQUIPMENT_ALBUM_MULT[equipmentLevel];

  const raw =
    songQuality *
    synergyMult *
    memberFitMult *
    seasonMult *
    expectationMult *
    chemMult *
    progressMult *
    equipmentMult;

  return clamp(Math.round(raw), 1, 100);
}

export interface FinalizeAlbumReleaseInput {
  album: Album;
  cumulativeWeek: number;
  trainees: readonly Trainee[];
  teamChemistry: number;
  season: Season;
  conceptHistory: readonly ConceptMood[];
  equipmentLevel: 1 | 2 | 3 | 4;
  fandom: { fandom: number; public: number; global: number; industry: number };
  competitors: readonly CompetitorGroup[];
  eventRivals: readonly EventCompetitor[];
  backgroundGroups: readonly BackgroundGroup[];
  market: MarketContext;
}

/**
 * 품질 확정 → 차트 평가 → 성과 기록까지 발매의 전체 조합을 한 곳에서 한다.
 * 데뷔(M2)와 컴백(M4)이 같은 공식을 쓰므로 차트 개봉 연출이 어느 쪽이든
 * 같은 chartRank를 신뢰할 수 있다.
 */
export function finalizeAlbumRelease(
  input: FinalizeAlbumReleaseInput,
): { album: Album; releaseResult: ReleaseResult } {
  const { album } = input;
  if (!album.titleTrack) throw new Error("A title track is required for release.");

  const quality = calculateAlbumQuality({
    album,
    trainees: input.trainees,
    teamChemistry: input.teamChemistry,
    season: input.season,
    conceptHistory: input.conceptHistory,
    equipmentLevel: input.equipmentLevel,
  });
  const releaseResult = evaluateRelease({
    albumQuality: quality,
    titleTrack: album.titleTrack,
    concept: album.concept,
    season: input.season,
    fandom: input.fandom.fandom,
    public: input.fandom.public,
    global: input.fandom.global,
    industry: input.fandom.industry,
    competitors: input.competitors,
    eventRivals: input.eventRivals,
    backgroundGroups: input.backgroundGroups,
    market: input.market,
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

export interface FandomExpectationResult {
  fitScore: number;
  fandomPenalty: number;
  publicBonus: number;
  publicBonusChance: number;
  description: string;
}

export function calculateFandomExpectation(
  conceptHistory: readonly ConceptMood[],
  newConcept: ConceptMood,
): FandomExpectationResult {
  if (conceptHistory.length === 0) {
    return {
      fitScore: FANDOM_EXPECTATION_SAFE * 100,
      fandomPenalty: 0,
      publicBonus: 0,
      publicBonusChance: 0,
      description: "첫 앨범이라 팬덤 기대치 기준 없음",
    };
  }

  const recent = conceptHistory.slice(-3);
  const sameCount = recent.filter((m) => m === newConcept).length;

  if (sameCount >= 3) {
    return {
      fitScore: FANDOM_EXPECTATION_SAFE * 100,
      fandomPenalty: 0,
      publicBonus: -5,
      publicBonusChance: 0,
      description: "같은 콘셉트를 3회 이상 반복했습니다. 팬덤은 안정적이지만 대중에게는 식상할 수 있습니다.",
    };
  }

  if (sameCount >= 1) {
    return {
      fitScore: FANDOM_EXPECTATION_SAFE * 100,
      fandomPenalty: 0,
      publicBonus: 0,
      publicBonusChance: 0,
      description: "같은 계열을 유지해 기존 팬의 기대를 지킵니다.",
    };
  }

  const lastConcept = recent[recent.length - 1];
  if (isGradualChange(lastConcept, newConcept)) {
    return {
      fitScore: 3,
      fandomPenalty: 0,
      publicBonus: 0,
      publicBonusChance: 0,
      description: "익숙한 색을 남긴 채 조금씩 변화를 줍니다.",
    };
  }

  return {
    fitScore: -5,
    fandomPenalty: FANDOM_EXPECTATION_RISKY.fandomPenalty,
    publicBonus: FANDOM_EXPECTATION_RISKY.publicBonusAmount,
    publicBonusChance: FANDOM_EXPECTATION_RISKY.publicBonusChance,
    description: "팀의 색을 크게 바꿉니다. 성공하면 반향도 크지만 팬들이 낯설어할 수 있습니다.",
  };
}

const MOOD_ADJACENCY: Record<ConceptMood, ConceptMood[]> = {
  refreshing: ["cute", "y2k", "dreamy"],
  dark: ["powerful", "sophisticated", "sexy"],
  retro: ["sophisticated", "dreamy", "y2k"],
  girlCrush: ["powerful", "sexy", "dark"],
  cute: ["refreshing", "dreamy", "y2k"],
  sophisticated: ["retro", "dark", "dreamy"],
  powerful: ["dark", "girlCrush", "sexy"],
  dreamy: ["refreshing", "sophisticated", "retro"],
  y2k: ["refreshing", "retro", "cute"],
  sexy: ["dark", "powerful", "girlCrush"],
};

function isGradualChange(from: ConceptMood, to: ConceptMood): boolean {
  return MOOD_ADJACENCY[from]?.includes(to) ?? false;
}

const TRACK_TYPE_DESCRIPTIONS: Record<string, string> = {
  safe: "검증된 공식의 안정적인 곡. 기존 팬 만족도 높음.",
  bold: "파격적인 시도. 성공 시 대중 반응 폭발, 실패 시 팬 실망.",
  fandom: "팬 취향 저격곡. 코어 팬덤 확장에 최적화.",
  global: "해외 시장 겨냥곡. 글로벌 팬덤 성장에 유리.",
};

const MOOD_TRACK_NAMES: Record<string, string[]> = {
  refreshing: ["새벽빛", "봄바람", "첫인상", "투명한 너"],
  dark: ["그림자", "블랙아웃", "심연", "밤의 규칙"],
  retro: ["레트로픽", "네온사인", "옛날얘기", "카세트"],
  girlCrush: ["퀸덤", "런웨이", "보스", "타이거"],
  cute: ["사탕", "하트비트", "핑크렌즈", "러블리"],
  sophisticated: ["미드나잇", "벨벳", "샴페인", "무드등"],
  powerful: ["불꽃", "파이터", "런", "브레이크"],
  dreamy: ["꿈속의 너", "안개꽃", "루나", "환상"],
  y2k: ["바이브", "2000", "밀레니엄", "글리터"],
  sexy: ["위스퍼", "레드존", "시크릿", "미드나잇콜"],
};

function generateTrackName(
  _type: string,
  mood: ConceptMood,
  random: () => number,
): string {
  const pool = MOOD_TRACK_NAMES[mood] ?? ["무제"];
  return pool[Math.floor(random() * pool.length)];
}
