import { advanceWeekState } from "@/systems/advanceWeek";
import { applyEffects } from "@/systems/applyEffects";
import {
  generateWeeklyDecisionCards,
  type DecisionCardContext,
} from "@/systems/generateWeeklyDecisionCards";
import {
  processTrainingWeek,
  type TrainingSchedule,
} from "@/systems/trainingSystem";
import { updateChemistry } from "@/systems/chemistrySystem";
import {
  getEffectiveSatisfaction,
  updateSatisfaction,
  type WeekContext as SatisfactionContext,
} from "@/systems/satisfactionSystem";
import { progressAlbum } from "@/systems/albumSystem";
import {
  simulateCompetitorWeek,
  spawnEventCompetitor,
} from "@/systems/competitorSystem";
import {
  rollRandomEvents,
  rollVacationScandal,
  type EventContext,
} from "@/systems/eventSystem";
import {
  updateFandom,
  checkFandomCrisis,
  type Fandom4Axis,
  type WeeklyFandomContext,
} from "@/systems/fandomSystem";
import {
  generateWeeklyNews,
  updateSeasonTrend,
} from "@/systems/calendarSystem";
import {
  executePromotion,
  checkExcessiveCommercial,
  type PromotionOrder,
  type PromotionResult,
} from "@/systems/promotionSystem";
import {
  processWeeklyFinances,
  checkInvestorConditions,
  applyInvestorPenalty,
  type RevenueContext,
} from "@/systems/economySystem";
import {
  evaluateAwards,
  buildContenderFromPlayer,
  buildContenderFromCompetitor,
  getPlayerAwardWins,
  type AwardShowResult,
} from "@/systems/awardsSystem";
import { SATISFACTION_WARNING_THRESHOLD, GAME_BALANCE } from "@/data/balance";
import { INVESTOR_COMPANIES } from "@/data/investors";
import type {
  Album,
  AlbumStoreState,
  EffectMap,
  BackgroundGroup,
  CalendarStoreState,
  CompetitorGroup,
  CompetitorStoreState,
  EventCompetitor,
  EventStoreState,
  FandomStoreState,
  FinanceStoreState,
  GameEvent,
  GameStoreState,
  KPopNews,
  Notification,
  Season,
  Staff,
  StaffStoreState,
  Trainee,
  TraineeStoreState,
  WeeklyDecision,
} from "@/types/game";

export interface GameSnapshot {
  game: GameStoreState;
  trainee: TraineeStoreState;
  staff: StaffStoreState;
  album: AlbumStoreState;
  fandom: FandomStoreState;
  competitor: CompetitorStoreState;
  finance: FinanceStoreState;
  calendar: CalendarStoreState;
  event: EventStoreState;
}

export interface PlayerDecisions {
  trainingSchedule: TrainingSchedule;
  resolvedDecisions: {
    cardId: string;
    optionId: string;
    effects: EffectMap;
  }[];
  promotionOrders?: PromotionOrder[];
}

export interface WeekReport {
  week: number;
  season: Season;
  statChanges: string[];
  events: GameEvent[];
  news: KPopNews[];
  finance: { income: Record<string, number>; expenses: Record<string, number> };
  warnings: string[];
  injuries: { traineeId: string; traineeName: string }[];
  conflicts: { a: string; b: string; resolved: boolean }[];
  competitorComebacks: string[];
  promotionResults: PromotionResult[];
  awardResults: AwardShowResult[] | null;
}

const AWARDS_WEEK = GAME_BALANCE.weeksPerYear - 2;

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

export function processWeek(
  snapshot: GameSnapshot,
  decisions: PlayerDecisions,
): { newState: GameSnapshot; weekReport: WeekReport } {
  const seed =
    snapshot.game.currentWeek * 997 + snapshot.game.currentYear * 31;
  const report: WeekReport = {
    week: snapshot.game.currentWeek,
    season: snapshot.game.currentSeason,
    statChanges: [],
    events: [],
    news: [],
    finance: { income: {}, expenses: {} },
    warnings: [],
    injuries: [],
    conflicts: [],
    competitorComebacks: [],
    promotionResults: [],
    awardResults: null,
  };

  let trainees = [...snapshot.trainee.trainees];
  let album = snapshot.album.currentAlbum
    ? { ...snapshot.album.currentAlbum }
    : null;
  let fandomAxis: Fandom4Axis = {
    public: snapshot.fandom.public,
    fandom: snapshot.fandom.fandom,
    fandomLoyalty: snapshot.fandom.fandomLoyalty,
    fandomDisappointment: snapshot.fandom.fandomDisappointment,
    global: snapshot.fandom.global,
    industry: snapshot.fandom.industry,
  };
  let money = snapshot.finance.money;
  let investorPenaltyActive = snapshot.game.investorPenaltyActive;
  const staff = snapshot.staff.staff;
  const manager = staff.find((s) => s.role === "manager") ?? null;
  const upgrades = snapshot.finance.upgrades;

  // 모든 효과(카드/프로모션/이벤트/투자사 페널티)는 이 헬퍼 하나로만 적용한다.
  const applyToState = (effects: EffectMap) => {
    const next = applyEffects(
      { money, fandom: fandomAxis, trainees, album, investorPenaltyActive },
      effects,
    );
    money = next.money;
    fandomAxis = next.fandom;
    trainees = next.trainees;
    album = next.album;
    investorPenaltyActive = next.investorPenaltyActive;
  };

  // ── 0. Awards (year-end, evaluated first so results feed into later steps)
  let playerWonAward = false;
  if (snapshot.game.currentWeek === AWARDS_WEEK) {
    const contenders = [
      buildContenderFromPlayer(
        "player",
        snapshot.game.groupName,
        {
          digitalIndex:
            fandomAxis.public * 0.6 +
            (album?.quality ?? 0) * 0.4,
          albumSalesIndex:
            fandomAxis.fandom * 0.6 + fandomAxis.industry * 0.4,
          fanVotes:
            fandomAxis.fandom * 0.5 +
            fandomAxis.fandomLoyalty * 0.3 +
            fandomAxis.global * 0.2,
          judgesScore:
            fandomAxis.industry * 0.5 +
            (album?.quality ?? 0) * 0.3 +
            (trainees.reduce(
              (s, t) => s + (t.stats.vocal + t.stats.dance + t.stats.visual) / 3,
              0,
            ) /
              Math.max(trainees.length, 1)) *
              0.2,
        },
        1,
      ),
      ...snapshot.competitor.permanentRivals.map(buildContenderFromCompetitor),
      ...snapshot.competitor.eventRivals.map(buildContenderFromCompetitor),
    ];

    const awardResults = evaluateAwards(
      contenders,
      snapshot.game.currentYear,
      seed + 50,
    );
    report.awardResults = awardResults;

    const playerWins = getPlayerAwardWins(awardResults, "player");
    playerWonAward = playerWins.length > 0;

    for (const win of playerWins) {
      report.warnings.push(
        `🏆 ${awardResults.find((r) => r.winners.includes(win))?.showName} ${categoryLabel(win.category)} 수상!`,
      );
    }
  }

  // ── 1. Apply player decisions
  for (const d of decisions.resolvedDecisions) {
    applyToState(d.effects);
  }

  // ── 2. Promotions (before training so activity flags are set)
  const promotionOrders = decisions.promotionOrders ?? [];
  let promotionTotalIncome = 0;
  let promotionTotalCost = 0;
  const promoCtx = {
    phase: snapshot.game.currentPhase,
    public: fandomAxis.public,
    fandom: fandomAxis.fandom,
    industry: fandomAxis.industry,
  };

  for (let i = 0; i < promotionOrders.length; i++) {
    const result = executePromotion(
      promotionOrders[i],
      trainees,
      staff,
      promoCtx,
      seed + 60 + i,
    );
    if (!result) continue;

    report.promotionResults.push(result);
    promotionTotalIncome += result.income;
    promotionTotalCost += result.cost;
    report.warnings.push(...result.warnings);

    for (const change of result.memberActivityChanges) {
      trainees = trainees.map((t) =>
        t.id === change.traineeId
          ? { ...t, currentActivity: change.activity }
          : t,
      );
    }

    applyToState(result.effects);
  }

  const excessiveCommercialPenalty = checkExcessiveCommercial(
    countRecentCommercialWeeks(snapshot.finance.incomeHistory),
    promotionOrders,
  );
  if (excessiveCommercialPenalty > 0) {
    fandomAxis.fandomDisappointment = clamp(
      fandomAxis.fandomDisappointment + excessiveCommercialPenalty,
      0,
      100,
    );
    report.warnings.push("과도한 상업 활동으로 팬 실망도 상승");
  }

  // ── 3. Training
  const albumConcept = album?.concept.mood ?? null;
  const trainingResult = processTrainingWeek(
    trainees,
    decisions.trainingSchedule,
    manager,
    albumConcept,
    seed,
    { dormLevel: upgrades.dormLevel, studioLevel: upgrades.studioLevel },
  );
  trainees = trainingResult.trainees;
  report.injuries = trainingResult.injuries;
  if (trainingResult.injuries.length > 0) {
    report.warnings.push(
      ...trainingResult.injuries.map((inj) => `${inj.traineeName} 부상 발생`),
    );
  }

  // ── 4. Chemistry
  const chemResult = updateChemistry(trainees, false, seed + 1);
  trainees = trainees.map((t) => {
    const update = chemResult.updates.find((u) => u.traineeId === t.id);
    return update ? { ...t, chemistry: update.chemistry } : t;
  });
  report.conflicts = chemResult.conflicts;

  // ── 5. Satisfaction
  const lastReleasedAlbum =
    snapshot.album.releasedAlbums[snapshot.album.releasedAlbums.length - 1];
  const satCtx: SatisfactionContext = {
    currentPhase: snapshot.game.currentPhase,
    albumConcept,
    trainingIntensity: decisions.trainingSchedule.intensity,
    dormLevel: upgrades.dormLevel,
    livingExpenseLevel: upgrades.livingExpenseLevel,
    weeksSinceDebut:
      snapshot.game.currentPhase === "training"
        ? snapshot.game.currentWeek
        : 0,
    debutWeek: snapshot.game.currentPhase !== "training" ? 1 : null,
    currentWeek: snapshot.game.currentWeek,
    recentAward: playerWonAward,
    musicShowWin: false,
    goodFanReaction: fandomAxis.fandomLoyalty > 60,
  };
  const satResult = updateSatisfaction(trainees, satCtx);
  trainees = trainees.map((t) => {
    const delta = satResult.deltas.find((d) => d.traineeId === t.id);
    return delta ? { ...t, satisfaction: delta.after } : t;
  });
  for (const risk of satResult.leaveRisks) {
    report.warnings.push(
      risk.level === "leaving"
        ? `${risk.traineeName} 이탈 확정 (만족도 ${risk.satisfaction})`
        : `${risk.traineeName} 이탈 경고 (만족도 ${risk.satisfaction})`,
    );
  }

  // ── 6. Album progress
  if (album) {
    album = progressAlbum(album, staff, trainees);
  }

  // ── 7. Competitor simulation
  const compResult = simulateCompetitorWeek(
    snapshot.competitor.permanentRivals,
    snapshot.competitor.backgroundGroups,
    snapshot.game.currentWeek,
  );
  report.competitorComebacks = compResult.comebacks;

  const eventRival = spawnEventCompetitor(
    snapshot.game.currentSeason,
    fandomAxis.public,
    snapshot.game.groupGender,
    snapshot.game.currentWeek,
  );
  let eventRivals = [...snapshot.competitor.eventRivals];
  if (eventRival) {
    eventRivals.push(eventRival);
    report.warnings.push(`이벤트 경쟁 그룹 등장: ${eventRival.name}`);
  }
  eventRivals = eventRivals
    .map((e) => ({ ...e, duration: e.duration - 1 }))
    .filter((e) => e.duration > 0);

  // ── 8. Random events
  const eventCtx: EventContext = {
    currentWeek: snapshot.game.currentWeek,
    currentPhase: snapshot.game.currentPhase,
    season: snapshot.game.currentSeason,
    public: fandomAxis.public,
    fandom: fandomAxis.fandom,
    global: fandomAxis.global,
    industry: fandomAxis.industry,
    hasSecurity: upgrades.hasSecurity,
    trainees,
  };
  const rolledEvents = rollRandomEvents(eventCtx, seed + 2);
  for (const re of rolledEvents) {
    report.events.push(re.gameEvent);
    // base effects는 이벤트 자체의 영향(예: 루머로 인한 피해)이고,
    // 선택지 effects는 대응에 따른 보정이다. base는 발생 시점에 1회 적용하고
    // 선택지 effects는 해결 시점에 weekRunner.applyEventChoice가 적용한다.
    applyToState(re.template.effects);
  }

  const vacationScandal = rollVacationScandal(
    trainees,
    upgrades.hasSecurity,
    seed + 3,
  );
  if (vacationScandal) {
    report.warnings.push(`${vacationScandal.traineeName} 연애 스캔들 발생`);
    fandomAxis.fandomDisappointment = Math.min(
      100,
      fandomAxis.fandomDisappointment + 12,
    );
    fandomAxis.public = Math.min(100, fandomAxis.public + 4);
  }

  // ── 9. Calendar / news
  const newsItems = generateWeeklyNews(
    snapshot.game.currentWeek,
    snapshot.game.currentSeason,
    compResult.competitors,
    seed + 4,
  );
  report.news = newsItems;

  // ── 10. Finance (using economySystem)
  const weeksAfterRelease =
    lastReleasedAlbum?.releaseWeek != null
      ? snapshot.game.currentWeek - lastReleasedAlbum.releaseWeek
      : null;
  const chartRank =
    snapshot.fandom.chartPositions.melon > 0
      ? snapshot.fandom.chartPositions.melon
      : null;

  const revenueCtx: RevenueContext = {
    fandom: fandomAxis.fandom,
    global: fandomAxis.global,
    chartRank,
    weeksAfterAlbumRelease:
      weeksAfterRelease !== null && weeksAfterRelease >= 0
        ? weeksAfterRelease
        : null,
    hasReleasedAlbum: snapshot.album.releasedAlbums.length > 0,
    promotionIncome: promotionTotalIncome,
    promotionCost: promotionTotalCost,
  };
  const financeResult = processWeeklyFinances(snapshot.finance, revenueCtx);
  money = financeResult.money;
  report.finance.income = financeResult.income;
  report.finance.expenses = financeResult.expenses;
  report.warnings.push(...financeResult.warnings);

  // ── 11. Fandom 4-axis
  const concertThisWeek = promotionOrders.some(
    (o) =>
      o.activityId === "smallConcert" ||
      o.activityId === "midConcert" ||
      o.activityId === "largeConcert" ||
      o.activityId === "domeConcert",
  );
  const fanServiceThisWeek = promotionOrders.some(
    (o) =>
      o.activityId === "fanSign" ||
      o.activityId === "fanCafeEvent" ||
      o.activityId === "liveBroadcast",
  );

  const fandomCtx: WeeklyFandomContext = {
    hadVarietyAppearance: trainees.some(
      (t) => t.currentActivity === "entertainment",
    ),
    hadViralEvent: rolledEvents.some(
      (e) =>
        e.template.id === "viral-performance-cut" ||
        e.template.id === "fan-challenge-viral",
    ),
    chartRank,
    isActive:
      album !== null ||
      trainees.some((t) => t.currentActivity === "entertainment") ||
      promotionOrders.length > 0,
    albumReleaseThisWeek: false,
    concertThisWeek,
    fanServiceThisWeek,
    scandalThisWeek:
      vacationScandal !== null ||
      rolledEvents.some((e) => e.template.type === "negative"),
    conceptBreakThisWeek: false,
    excessiveCommercial: excessiveCommercialPenalty > 0,
    spotifyStreaming: fandomAxis.global > 1000,
    youtubeActivity: fandomAxis.global > 500,
    overseasPromotion: false,
    foreignMembers: trainees.filter((t) => t.nationality !== "korean"),
    musicQualityHigh: fandomAxis.industry > 50,
    stageExcellent: false,
    awardWin: playerWonAward,
    qualityDecline: false,
  };
  const fandomResult = updateFandom(fandomAxis, fandomCtx);
  fandomAxis = fandomResult.axis;

  if (fandomResult.crisis) {
    const crisis = checkFandomCrisis(fandomAxis);
    if (crisis) {
      report.warnings.push(crisis.description);
    }
  }

  // ── 12. Investor condition check
  const investor = INVESTOR_COMPANIES.find(
    (c) => c.type === snapshot.game.investorType,
  );
  if (investor) {
    const investorMetrics = buildInvestorMetrics(
      snapshot,
      fandomAxis,
      trainees,
      report.awardResults,
    );
    const investorChecks = checkInvestorConditions(
      investor,
      investorMetrics,
      snapshot.game.currentWeek,
    );
    const failedConditions = investorChecks.filter((c) => !c.met);

    if (failedConditions.length > 0) {
      investorPenaltyActive = true;
      const penalties = applyInvestorPenalty(investor);
      for (const penalty of penalties) {
        report.warnings.push(`투자사 페널티: ${penalty.description}`);
        applyToState(penalty.effects);
      }
    }
  }

  // ── 13. Advance week
  const advancedGame = advanceWeekState(snapshot.game);

  // ── 13.5 Season trend update
  let updatedCalendar = { ...snapshot.calendar };
  if (advancedGame.currentSeason !== snapshot.game.currentSeason) {
    const newTrend = updateSeasonTrend(
      advancedGame.currentSeason,
      seed + 100,
    );
    updatedCalendar = {
      ...updatedCalendar,
      currentSeason: advancedGame.currentSeason,
      marketTrend: newTrend,
    };
  }

  // ── 14. Generate next week's decision cards
  const hasPendingScandal = rolledEvents.some(
    (e) =>
      e.template.type === "negative" &&
      e.gameEvent.choices &&
      e.gameEvent.choices.length > 0,
  );
  const cardCtx: DecisionCardContext = {
    phase: advancedGame.currentPhase,
    hasPendingScandal,
    hasInjuredMember: trainees.some((t) => t.injuryWeeks > 0),
    investorPressure: investorPenaltyActive,
    hasCurrentAlbum: album !== null,
    weeksSinceLastAlbum: lastReleasedAlbum?.releaseWeek
      ? snapshot.game.currentWeek - lastReleasedAlbum.releaseWeek
      : null,
    lowSatisfactionMember: trainees.some(
      (t) =>
        getEffectiveSatisfaction(
          t.satisfaction,
          upgrades.dormLevel,
          upgrades.livingExpenseLevel,
        ) <= SATISFACTION_WARNING_THRESHOLD,
    ),
  };
  const nextDecisions = generateWeeklyDecisionCards(
    advancedGame.currentWeek,
    advancedGame.currentSeason,
    cardCtx,
  );

  // ── Assemble new state
  const newState: GameSnapshot = {
    game: {
      ...advancedGame,
      investorPenaltyActive,
      weeklyDecisions: nextDecisions,
      notifications: [
        ...snapshot.game.notifications,
        ...report.warnings.map((msg, i) => ({
          id: `noti-w${snapshot.game.currentWeek}-${i}`,
          type: "warning" as const,
          title: "주간 알림",
          message: msg,
          week: snapshot.game.currentWeek,
        })),
      ],
    },
    trainee: { trainees },
    staff: snapshot.staff,
    album: {
      ...snapshot.album,
      currentAlbum: album,
    },
    fandom: {
      ...snapshot.fandom,
      public: fandomAxis.public,
      fandom: fandomAxis.fandom,
      fandomLoyalty: fandomAxis.fandomLoyalty,
      fandomDisappointment: fandomAxis.fandomDisappointment,
      global: fandomAxis.global,
      industry: fandomAxis.industry,
    },
    competitor: {
      ...snapshot.competitor,
      permanentRivals: compResult.competitors,
      eventRivals,
      backgroundGroups: compResult.backgroundGroups,
    },
    finance: {
      ...snapshot.finance,
      money,
      incomeHistory: [
        ...snapshot.finance.incomeHistory,
        { week: snapshot.game.currentWeek, breakdown: report.finance.income },
      ],
      expenseHistory: [
        ...snapshot.finance.expenseHistory,
        { week: snapshot.game.currentWeek, breakdown: report.finance.expenses },
      ],
    },
    calendar: {
      ...updatedCalendar,
      currentSeason: advancedGame.currentSeason,
      kpopNews: [...newsItems, ...snapshot.calendar.kpopNews].slice(0, 8),
      upcomingCompetitorComebacks: compResult.comebacks.map((name) => ({
        week: advancedGame.currentWeek,
        competitorId: `rival-${name}`,
        competitorName: name,
      })),
    },
    event: {
      ...snapshot.event,
      pendingEvents: [
        ...snapshot.event.pendingEvents.filter((e) => !e.resolved),
        ...report.events,
      ],
    },
  };

  return { newState, weekReport: report };
}

function categoryLabel(category: string): string {
  const labels: Record<string, string> = {
    rookie: "신인상",
    bonsang: "본상",
    daesang: "대상",
    popularity: "인기상",
  };
  return labels[category] ?? category;
}

function countRecentCommercialWeeks(
  incomeHistory: readonly { week: number; breakdown: Record<string, number> }[],
): number {
  const recent = incomeHistory.slice(-2);
  return recent.filter((w) => w.breakdown.promotions && w.breakdown.promotions > 0)
    .length;
}

function buildInvestorMetrics(
  snapshot: GameSnapshot,
  fandomAxis: Fandom4Axis,
  trainees: readonly Trainee[],
  awardResults: AwardShowResult[] | null,
): {
  snsFollowers: number;
  spotifyStreams: number;
  musicShowWins: number;
  highestAwardLevel: string | null;
  quarterlyRevenue: number;
  cumulativeRevenue: number;
  visualAverage: number;
  adContracts: number;
  trendFit: number;
  styleScore: number;
} {
  const last13 = snapshot.finance.incomeHistory.slice(-13);
  const quarterlyRevenue = last13.reduce(
    (s, w) => s + Object.values(w.breakdown).reduce((a, b) => a + b, 0),
    0,
  );
  const cumulativeRevenue = snapshot.finance.incomeHistory.reduce(
    (s, w) => s + Object.values(w.breakdown).reduce((a, b) => a + b, 0),
    0,
  );
  const visualAvg =
    trainees.length > 0
      ? trainees.reduce((s, t) => s + t.stats.visual, 0) / trainees.length
      : 0;

  let highestAward: string | null = null;
  if (awardResults) {
    const playerWins = getPlayerAwardWins(awardResults, "player");
    for (const win of playerWins) {
      if (
        !highestAward ||
        awardLevelRank(win.category) > awardLevelRank(highestAward)
      ) {
        highestAward = win.category;
      }
    }
  }

  return {
    snsFollowers: Math.round(
      fandomAxis.global * 1000 + fandomAxis.public * 500,
    ),
    spotifyStreams: Math.round(fandomAxis.global * 10000),
    musicShowWins: 0,
    highestAwardLevel: highestAward,
    quarterlyRevenue,
    cumulativeRevenue,
    visualAverage: visualAvg,
    adContracts: 0,
    trendFit: fandomAxis.industry,
    styleScore: visualAvg,
  };
}

function awardLevelRank(level: string): number {
  const ranks: Record<string, number> = {
    popularity: 1,
    rookie: 2,
    bonsang: 3,
    daesang: 4,
  };
  return ranks[level] ?? 0;
}
