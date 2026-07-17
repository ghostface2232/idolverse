import {
  AWARD_ELIGIBILITY_THRESHOLDS,
  DEBUT_REQUIREMENTS,
  GLOBAL_EXPANSION_REQUIREMENTS,
} from "@/data/balance";
import { PROMOTION_ACTIVITIES } from "@/data/promotions";
import type {
  MilestoneDefinition,
  PhaseGate,
  PromotionActivityId,
} from "@/types/game";

function promotionRequirement(id: PromotionActivityId) {
  const activity = PROMOTION_ACTIVITIES.find((a) => a.id === id);
  if (!activity) throw new Error(`Unknown promotion activity: ${id}`);
  return activity.requirements;
}

const fanSignReq = promotionRequirement("fanSign");
const fanCafeReq = promotionRequirement("fanCafeEvent");
const smallConcertReq = promotionRequirement("smallConcert");
const midConcertReq = promotionRequirement("midConcert");
const largeConcertReq = promotionRequirement("largeConcert");
const domeConcertReq = promotionRequirement("domeConcert");

/**
 * 공개 이정표 사다리. balance.ts·promotions.ts의 내부 요건을 참조해
 * "왜 이 수치를 올리는가"를 플레이어에게 보이는 해금 체인으로 전환한다.
 * 순서는 대략적인 도달 순서이며 GoalStrip의 다음 목표 선정에 쓰인다.
 */
export const MILESTONE_DEFINITIONS: MilestoneDefinition[] = [
  {
    id: "debut-showcase-ready",
    title: "데뷔 쇼케이스 준비 완료",
    category: "debut",
    requirements: [
      {
        metric: "debutReadiness",
        target: DEBUT_REQUIREMENTS.readiness,
        label: "데뷔 준비도",
      },
      {
        metric: "averageVocal",
        target: DEBUT_REQUIREMENTS.averageVocal,
        label: "평균 보컬",
      },
    ],
    unlocks: "데뷔 쇼케이스",
  },
  {
    id: "fan-cafe-open",
    title: "팬 커뮤니티 형성",
    category: "promotion",
    requirements: [
      { metric: "fandom", target: fanCafeReq.minFandom ?? 10, label: "팬덤" },
    ],
    unlocks: "팬카페 이벤트",
  },
  {
    id: "fan-sign-open",
    title: "첫 팬사인회 규모 달성",
    category: "promotion",
    requirements: [
      { metric: "fandom", target: fanSignReq.minFandom ?? 15, label: "팬덤" },
    ],
    unlocks: "팬사인회",
  },
  {
    id: "first-release",
    title: "첫 앨범 발매",
    category: "release",
    requirements: [
      { metric: "releasedAlbums", target: 1, label: "발매 앨범" },
    ],
    unlocks: "차트 경쟁·음악방송 활동",
  },
  {
    // 후보권(차트 상위) 진입 자체가 성취다 — 지는 대결을 반복해서 보여주는
    // 대신, 처음 후보에 서는 순간을 이정표로 만든다.
    id: "music-show-candidate",
    title: "첫 음악방송 1위 후보",
    category: "release",
    requirements: [
      { metric: "musicShowCandidacies", target: 1, label: "후보 진입" },
    ],
    unlocks: "음악방송 1위 대결",
  },
  {
    id: "small-concert-open",
    title: "소극장 공연 규모 달성",
    category: "promotion",
    requirements: [
      { metric: "fandom", target: smallConcertReq.minFandom ?? 35, label: "팬덤" },
    ],
    unlocks: "콘서트 - 소극장",
  },
  {
    id: "mid-concert-open",
    title: "중극장 공연 규모 달성",
    category: "promotion",
    requirements: [
      { metric: "fandom", target: midConcertReq.minFandom ?? 50, label: "팬덤" },
    ],
    unlocks: "콘서트 - 중극장",
  },
  {
    id: "bonsang-eligible",
    title: "연말 본상 후보 자격",
    category: "award",
    requirements: [
      {
        metric: "digitalIndex",
        target: AWARD_ELIGIBILITY_THRESHOLDS.bonsang.minDigitalIndex,
        label: "디지털 지수",
      },
      {
        metric: "albumSalesIndex",
        target: AWARD_ELIGIBILITY_THRESHOLDS.bonsang.minAlbumSalesIndex,
        label: "음반 지수",
      },
    ],
    unlocks: "연말 시상식 본상 경쟁",
  },
  {
    id: "global-showcase-open",
    title: "해외 쇼케이스 투어 요건",
    category: "global",
    requirements: [
      {
        metric: "global",
        target: GLOBAL_EXPANSION_REQUIREMENTS.showcaseTour.minGlobal,
        label: "글로벌",
      },
      {
        metric: "money",
        target: GLOBAL_EXPANSION_REQUIREMENTS.showcaseTour.minBudget,
        label: "예산",
      },
    ],
    unlocks: "해외 쇼케이스 투어",
  },
  {
    id: "large-concert-open",
    title: "대극장 공연 규모 달성",
    category: "promotion",
    requirements: [
      { metric: "fandom", target: largeConcertReq.minFandom ?? 70, label: "팬덤" },
      {
        metric: "industry",
        target: largeConcertReq.minIndustry ?? 50,
        label: "업계 신뢰",
      },
    ],
    unlocks: "콘서트 - 대극장",
  },
  {
    id: "global-partnership-open",
    title: "해외 파트너십 요건",
    category: "global",
    requirements: [
      {
        metric: "global",
        target: GLOBAL_EXPANSION_REQUIREMENTS.regionalPartnership.minGlobal,
        label: "글로벌",
      },
      {
        metric: "industry",
        target: GLOBAL_EXPANSION_REQUIREMENTS.regionalPartnership.minIndustry,
        label: "업계 신뢰",
      },
    ],
    unlocks: "지역 파트너십 계약",
  },
  {
    id: "daesang-eligible",
    title: "연말 대상 후보 자격",
    category: "award",
    requirements: [
      {
        metric: "digitalIndex",
        target: AWARD_ELIGIBILITY_THRESHOLDS.daesang.minDigitalIndex,
        label: "디지털 지수",
      },
      {
        metric: "albumSalesIndex",
        target: AWARD_ELIGIBILITY_THRESHOLDS.daesang.minAlbumSalesIndex,
        label: "음반 지수",
      },
      {
        metric: "industry",
        target: AWARD_ELIGIBILITY_THRESHOLDS.daesang.minIndustry,
        label: "업계 신뢰",
      },
    ],
    unlocks: "연말 시상식 대상 경쟁",
  },
  {
    id: "dome-concert-open",
    title: "돔 공연 규모 달성",
    category: "promotion",
    requirements: [
      { metric: "fandom", target: domeConcertReq.minFandom ?? 85, label: "팬덤" },
      {
        metric: "industry",
        target: domeConcertReq.minIndustry ?? 65,
        label: "업계 신뢰",
      },
    ],
    unlocks: "콘서트 - 돔",
  },
  {
    id: "world-tour-open",
    title: "월드투어 요건",
    category: "global",
    requirements: [
      {
        metric: "global",
        target: GLOBAL_EXPANSION_REQUIREMENTS.worldTour.minGlobal,
        label: "글로벌",
      },
      {
        metric: "fandom",
        target: GLOBAL_EXPANSION_REQUIREMENTS.worldTour.minFandom,
        label: "팬덤",
      },
      {
        metric: "money",
        target: GLOBAL_EXPANSION_REQUIREMENTS.worldTour.minBudget,
        label: "예산",
      },
    ],
    unlocks: "월드투어 프로젝트",
  },
];

export const MILESTONES_BY_ID = new Map(
  MILESTONE_DEFINITIONS.map((definition) => [definition.id, definition]),
);

/**
 * phase 전이 게이트 테이블. 전이 판정은 progressionSystem이 매주 이 테이블로
 * 수행한다. training→debut는 데뷔 프로젝트(M2)가 쇼케이스·발매 결과로 직접
 * 전이시키므로 여기 없다. debut→growth→peak는 컴백 루프(M4)가 공급한다.
 */
export const PHASE_GATES: PhaseGate[] = [
  {
    from: "debut",
    to: "growth",
    requirements: [
      { metric: "comebacksSettled", target: 1, label: "컴백 정산" },
    ],
    description: "첫 컴백의 정산·회고를 마치면 성장기로 전환된다.",
  },
  {
    from: "growth",
    to: "peak",
    requirements: [
      { metric: "awardsWon", target: 1, label: "수상" },
      {
        metric: "global",
        target: GLOBAL_EXPANSION_REQUIREMENTS.regionalPartnership.minGlobal,
        label: "글로벌",
      },
    ],
    description: "연말 시상식 수상과 글로벌 이정표를 함께 넘으면 전성기가 열린다.",
  },
];
