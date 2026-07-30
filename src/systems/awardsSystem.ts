import { AWARD_SHOWS } from "@/data/awards";
import { AWARD_ELIGIBILITY_THRESHOLDS } from "@/data/balance";
import { createSeededRandom } from "@/lib/seededRandom";
import type {
  AwardCategory,
  AwardShow,
  AwardShowId,
  CompetitorGroup,
  EventCompetitor,
} from "@/types/game";

export interface AwardContender {
  id: string;
  name: string;
  isPlayer: boolean;
  debutYear: number;
  digitalIndex: number;
  albumSalesIndex: number;
  fanVotes: number;
  judgesScore: number;
  /** 업계 신뢰(0~100). 대상(daesang) 자격의 장기 신뢰 축으로만 쓴다. */
  industry: number;
}

export interface AwardWinner {
  category: AwardCategory;
  winnerId: string;
  winnerName: string;
  score: number;
  isPlayer: boolean;
}

export interface AwardShowResult {
  showId: AwardShowId;
  showName: string;
  winners: AwardWinner[];
}

export interface PlayerYearMetrics {
  digitalIndex: number;
  albumSalesIndex: number;
  fanVotes: number;
  judgesScore: number;
  industry: number;
}

export function buildContenderFromPlayer(
  id: string,
  name: string,
  metrics: PlayerYearMetrics,
  debutYear: number,
): AwardContender {
  return {
    id,
    name,
    isPlayer: true,
    debutYear,
    ...metrics,
  };
}

export function buildContenderFromCompetitor(
  competitor: CompetitorGroup | EventCompetitor,
): AwardContender {
  const avgStats =
    (competitor.stats.vocal +
      competitor.stats.dance +
      competitor.stats.visual) /
    3;

  // 경쟁자 fandom/global은 수천 단위 스케일이라 /100으로 0~100 지표에 맞춘 뒤
  // 가중 평균한다. 플레이어 지표(0~100)와 같은 스케일이어야 경쟁이 성립한다.
  // 앨범 품질은 연간 최고 기록을 쓴다 — currentAlbum은 4주 뒤 소멸해
  // 시상 주의 지표를 붕괴시킨다(신인상 자동 수상 원인이었다).
  return {
    id: competitor.id,
    name: competitor.name,
    isPlayer: false,
    debutYear: competitor.debutYear,
    digitalIndex:
      competitor.public * 0.6 +
      (competitor.seasonBestQuality ??
        competitor.currentAlbum?.quality ??
        0) *
        0.4,
    albumSalesIndex:
      (competitor.fandom / 100) * 0.6 + competitor.industry * 0.4,
    fanVotes:
      (competitor.fandom / 100) * 0.7 + (competitor.global / 100) * 0.3,
    judgesScore: competitor.industry * 0.5 + avgStats * 0.5,
    industry: competitor.industry,
  };
}

function computeScore(
  contender: AwardContender,
  weights: AwardShow["weights"],
): number {
  return (
    contender.digitalIndex * weights.digital +
    contender.albumSalesIndex * weights.albumSales +
    contender.fanVotes * weights.votes +
    contender.judgesScore * weights.judges
  );
}

function isEligibleForCategory(
  contender: AwardContender,
  category: AwardCategory,
  currentYear: number,
): boolean {
  const yearsSinceDebut = currentYear - contender.debutYear + 1;

  switch (category) {
    case "rookie":
      return (
        yearsSinceDebut >= AWARD_ELIGIBILITY_THRESHOLDS.rookie.minYear &&
        yearsSinceDebut <= AWARD_ELIGIBILITY_THRESHOLDS.rookie.maxYear
      );
    case "bonsang":
      return (
        contender.digitalIndex >=
          AWARD_ELIGIBILITY_THRESHOLDS.bonsang.minDigitalIndex &&
        contender.albumSalesIndex >=
          AWARD_ELIGIBILITY_THRESHOLDS.bonsang.minAlbumSalesIndex &&
        contender.judgesScore >=
          AWARD_ELIGIBILITY_THRESHOLDS.bonsang.minJudgesScore
      );
    case "daesang":
      // minIndustry는 업계 신뢰 지표와 비교한다 — 이정표(daesang-eligible)가
      // "업계 신뢰 75"를 약속하므로 심사 점수(judgesScore)와 섞으면 안 된다.
      return (
        contender.digitalIndex >=
          AWARD_ELIGIBILITY_THRESHOLDS.daesang.minDigitalIndex &&
        contender.albumSalesIndex >=
          AWARD_ELIGIBILITY_THRESHOLDS.daesang.minAlbumSalesIndex &&
        contender.industry >= AWARD_ELIGIBILITY_THRESHOLDS.daesang.minIndustry
      );
    case "popularity":
      return (
        contender.fanVotes >= AWARD_ELIGIBILITY_THRESHOLDS.popularity.minFanVotes
      );
    default:
      return false;
  }
}

export function evaluateAwards(
  contenders: readonly AwardContender[],
  currentYear: number,
  seed: number,
): AwardShowResult[] {
  const random = createSeededRandom(seed);
  const shows = Object.values(AWARD_SHOWS);
  const results: AwardShowResult[] = [];
  const winnerCounts = new Map<string, number>();

  for (const show of shows) {
    const winners: AwardWinner[] = [];

    for (const category of show.categories) {
      const eligible = contenders.filter((c) =>
        isEligibleForCategory(c, category, currentYear),
      );

      if (eligible.length === 0) continue;

      const scored = eligible
        .map((c) => ({
          contender: c,
          score:
            computeScore(c, show.weights) +
            random() * 3 -
            (winnerCounts.get(c.id) ?? 0) * 10,
        }))
        .sort((a, b) => b.score - a.score);

      const winner = scored[0];
      winners.push({
        category,
        winnerId: winner.contender.id,
        winnerName: winner.contender.name,
        score: winner.score,
        isPlayer: winner.contender.isPlayer,
      });
      winnerCounts.set(
        winner.contender.id,
        (winnerCounts.get(winner.contender.id) ?? 0) + 1,
      );
    }

    results.push({
      showId: show.id as AwardShowId,
      showName: show.name,
      winners,
    });
  }

  return results;
}

export function getPlayerAwardWins(
  results: readonly AwardShowResult[],
  playerId: string,
): AwardWinner[] {
  return results.flatMap((r) =>
    r.winners.filter((w) => w.winnerId === playerId),
  );
}
