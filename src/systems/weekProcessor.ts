import { advanceWeekState } from "@/systems/advanceWeek";
import { applyEffects } from "@/systems/applyEffects";
import {
  buildDecisionCardContext,
  generateWeeklyDecisionCards,
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
import {
  GAME_BALANCE,
  INVESTOR_PENALTY_GRACE_WEEKS,
  INVESTOR_NEGOTIATION_EXTENSION_WEEKS,
} from "@/data/balance";
import { INVESTOR_COMPANIES } from "@/data/investors";
import {
  captureWeekDeltaState,
  diffWeekDeltaState,
  type WeekDeltaState,
} from "@/systems/weekDelta";
import type {
  Album,
  AlbumStoreState,
  AwardRecord,
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
  WeeklyReportSnapshot,
  WeekDelta,
  WeekDeltaSource,
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
    targetTraineeIds?: string[];
    activityOverride?: Trainee["currentActivity"];
  }[];
  promotionOrders?: PromotionOrder[];
}

export interface WeekReport extends WeeklyReportSnapshot {
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
    deltas: [],
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
  let investorPressureWeeks = snapshot.game.investorPressureWeeks ?? 0;
  const staff = snapshot.staff.staff;
  const manager = staff.find((s) => s.role === "manager") ?? null;
  const upgrades = snapshot.finance.upgrades;

  const getDeltaState = (): WeekDeltaState => ({
    money,
    fandom: fandomAxis,
    trainees,
    album,
    investorPressureWeeks,
  });
  const recordTransition = (
    before: WeekDeltaState,
    source: WeekDeltaSource,
    day: WeekDelta["day"],
  ) => {
    const next = diffWeekDeltaState(before, captureWeekDeltaState(getDeltaState()), {
      source,
      day,
      idPrefix: `y${snapshot.game.currentYear}-w${snapshot.game.currentWeek}`,
      startIndex: report.deltas.length,
    });
    report.deltas.push(...next);
  };

  // 모든 효과(카드/프로모션/이벤트/투자사 페널티)는 이 헬퍼 하나로만 적용한다.
  const applyToState = (
    effects: EffectMap,
    source?: WeekDeltaSource,
    day: WeekDelta["day"] = 1,
    targetTraineeIds?: readonly string[],
  ) => {
    const before = source ? captureWeekDeltaState(getDeltaState()) : null;
    const next = applyEffects(
      { money, fandom: fandomAxis, trainees, album, investorPressureWeeks },
      effects,
      targetTraineeIds ? { traineeIds: targetTraineeIds } : undefined,
    );
    money = next.money;
    fandomAxis = next.fandom;
    trainees = next.trainees;
    album = next.album;
    investorPressureWeeks = next.investorPressureWeeks;
    if (before && source) recordTransition(before, source, day);
  };

  // ── 0. Awards (year-end, evaluated first so results feed into later steps)
  // 수상 기록은 게임 상태에 영속화한다. 시상 주(50주차)가 지나도 투자사
  // awardLevel 조건(예: 마감 52주)이 기록을 근거로 평가되어야 하기 때문이다.
  let awardHistory: AwardRecord[] = snapshot.game.awardHistory;
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

    const awardCumulativeWeek =
      (snapshot.game.currentYear - 1) * GAME_BALANCE.weeksPerYear +
      snapshot.game.currentWeek;
    for (const win of playerWins) {
      const show = awardResults.find((r) => r.winners.includes(win));
      if (!show) continue;
      awardHistory = [
        ...awardHistory,
        {
          year: snapshot.game.currentYear,
          week: awardCumulativeWeek,
          showId: show.showId,
          showName: show.showName,
          category: win.category,
        },
      ];
      report.warnings.push(
        `🏆 ${show.showName} ${categoryLabel(win.category)} 수상!`,
      );
    }
  }

  // ── 1. Apply player decisions
  let investorComplianceCount = snapshot.game.investorComplianceCount ?? 0;
  const investorConditionProgress = {
    ...(snapshot.game.investorConditionProgress ?? {}),
  };
  const decisionActivityOverrides = new Map<
    string,
    Trainee["currentActivity"]
  >();
  for (const d of decisions.resolvedDecisions) {
    const beforeDecision = captureWeekDeltaState(getDeltaState());
    if (d.cardId === "emergency-investor" && d.optionId === "comply") {
      investorComplianceCount += 1;
    }
    if (d.cardId === "emergency-investor" && d.optionId === "negotiate") {
      for (const [conditionId, progress] of Object.entries(
        investorConditionProgress,
      )) {
        if (progress.penaltyApplied) continue;
        investorConditionProgress[conditionId] = {
          ...progress,
          firstFailedWeek:
            progress.firstFailedWeek + INVESTOR_NEGOTIATION_EXTENSION_WEEKS,
        };
      }
    }
    if (d.activityOverride) {
      const targets = d.targetTraineeIds
        ? new Set(d.targetTraineeIds)
        : new Set(trainees.map((trainee) => trainee.id));
      trainees = trainees.map((trainee) => {
        if (!targets.has(trainee.id)) return trainee;
        decisionActivityOverrides.set(trainee.id, d.activityOverride ?? null);
        return { ...trainee, currentActivity: d.activityOverride ?? null };
      });
    }
    applyToState(d.effects, undefined, 1, d.targetTraineeIds);
    recordTransition(
      beforeDecision,
      { kind: "decision", id: `${d.cardId}:${d.optionId}`, label: d.cardId },
      1,
    );
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
    const beforePromotion = captureWeekDeltaState(getDeltaState());
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
    recordTransition(
      beforePromotion,
      {
        kind: "promotion",
        id: promotionOrders[i].activityId,
        label: promotionOrders[i].activityId,
      },
      2,
    );
  }

  const excessiveCommercialPenalty = checkExcessiveCommercial(
    countRecentCommercialWeeks(snapshot.finance.incomeHistory),
    promotionOrders,
  );
  if (excessiveCommercialPenalty > 0) {
    const beforePenalty = captureWeekDeltaState(getDeltaState());
    fandomAxis.fandomDisappointment = clamp(
      fandomAxis.fandomDisappointment + excessiveCommercialPenalty,
      0,
      100,
    );
    report.warnings.push("과도한 상업 활동으로 팬 실망도 상승");
    recordTransition(
      beforePenalty,
      { kind: "promotion", id: "excessive-commercial", label: "과도한 상업 활동" },
      2,
    );
  }

  // ── 3. Training
  const albumConcept = album?.concept.mood ?? null;
  const beforeTraining = captureWeekDeltaState(getDeltaState());
  const trainingResult = processTrainingWeek(
    trainees,
    decisions.trainingSchedule,
    manager,
    albumConcept,
    seed,
    { dormLevel: upgrades.dormLevel, studioLevel: upgrades.studioLevel },
  );
  trainees = trainingResult.trainees;
  recordTransition(
    beforeTraining,
    { kind: "training", id: "weekly-training", label: "주간 훈련" },
    3,
  );
  trainees = trainees.map((trainee) =>
    decisionActivityOverrides.get(trainee.id) === trainee.currentActivity
      ? { ...trainee, currentActivity: "training" }
      : trainee,
  );
  report.injuries = trainingResult.injuries;
  if (trainingResult.injuries.length > 0) {
    report.warnings.push(
      ...trainingResult.injuries.map((inj) => `${inj.traineeName} 부상 발생`),
    );
  }

  // ── 4. Chemistry
  const beforeChemistry = captureWeekDeltaState(getDeltaState());
  const chemResult = updateChemistry(trainees, false, seed + 1);
  trainees = trainees.map((t) => {
    const update = chemResult.updates.find((u) => u.traineeId === t.id);
    return update ? { ...t, chemistry: update.chemistry } : t;
  });
  report.conflicts = chemResult.conflicts;
  recordTransition(
    beforeChemistry,
    { kind: "chemistry", id: "weekly-chemistry", label: "팀 케미" },
    4,
  );

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
  const beforeSatisfaction = captureWeekDeltaState(getDeltaState());
  const satResult = updateSatisfaction(trainees, satCtx);
  trainees = trainees.map((t) => {
    const delta = satResult.deltas.find((d) => d.traineeId === t.id);
    return delta ? { ...t, satisfaction: delta.after } : t;
  });
  recordTransition(
    beforeSatisfaction,
    { kind: "satisfaction", id: "weekly-satisfaction", label: "멤버 만족도" },
    5,
  );
  for (const risk of satResult.leaveRisks) {
    report.warnings.push(
      risk.level === "leaving"
        ? `${risk.traineeName} 이탈 확정 (만족도 ${risk.satisfaction})`
        : `${risk.traineeName} 이탈 경고 (만족도 ${risk.satisfaction})`,
    );
  }

  // ── 6. Album progress
  if (album) {
    const beforeAlbum = captureWeekDeltaState(getDeltaState());
    album = progressAlbum(album, staff, trainees);
    recordTransition(
      beforeAlbum,
      { kind: "album", id: album.id, label: album.title },
      5,
    );
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
    applyToState(
      re.template.effects,
      { kind: "event", id: re.gameEvent.id, label: re.gameEvent.title },
      5,
    );
  }

  const vacationScandal = rollVacationScandal(
    trainees,
    upgrades.hasSecurity,
    seed + 3,
  );
  if (vacationScandal) {
    const beforeScandal = captureWeekDeltaState(getDeltaState());
    report.warnings.push(`${vacationScandal.traineeName} 연애 스캔들 발생`);
    fandomAxis.fandomDisappointment = Math.min(
      100,
      fandomAxis.fandomDisappointment + 12,
    );
    fandomAxis.public = Math.min(100, fandomAxis.public + 4);
    recordTransition(
      beforeScandal,
      {
        kind: "event",
        id: `vacation-scandal:${vacationScandal.traineeId}`,
        label: "연애 스캔들",
      },
      5,
    );
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
  const beforeFinance = captureWeekDeltaState(getDeltaState());
  const financeResult = processWeeklyFinances(
    { ...snapshot.finance, money },
    revenueCtx,
  );
  money = financeResult.money;
  recordTransition(
    beforeFinance,
    { kind: "finance", id: "weekly-finance", label: "주간 결산" },
    6,
  );
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
  const beforeFandom = captureWeekDeltaState(getDeltaState());
  const fandomResult = updateFandom(fandomAxis, fandomCtx);
  fandomAxis = fandomResult.axis;
  recordTransition(
    beforeFandom,
    { kind: "fandom", id: "weekly-fandom", label: "주간 팬덤 변화" },
    6,
  );

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
    const cumulativeWeek =
      (snapshot.game.currentYear - 1) * GAME_BALANCE.weeksPerYear +
      snapshot.game.currentWeek;
    const investorMetrics = buildInvestorMetrics(
      snapshot,
      fandomAxis,
      trainees,
      awardHistory,
    );
    const investorChecks = checkInvestorConditions(
      investor,
      investorMetrics,
      cumulativeWeek,
    );

    let anyConditionFailing = false;
    let penaltyDueThisWeek = false;
    for (const check of investorChecks) {
      if (check.met) {
        // 회복된 조건은 진행 상태를 지운다. 재실패하면 유예부터 다시 시작한다.
        delete investorConditionProgress[check.conditionId];
        continue;
      }

      anyConditionFailing = true;
      const progress = investorConditionProgress[check.conditionId];

      if (!progress) {
        investorConditionProgress[check.conditionId] = {
          firstFailedWeek: cumulativeWeek,
          penaltyApplied: false,
        };
        report.warnings.push(
          `투자사 조건 미달: ${check.description} — ${INVESTOR_PENALTY_GRACE_WEEKS}주 안에 회복하지 못하면 페널티가 적용됩니다.`,
        );
        continue;
      }

      if (progress.penaltyApplied) continue;

      const failedWeeks = cumulativeWeek - progress.firstFailedWeek;
      if (failedWeeks < INVESTOR_PENALTY_GRACE_WEEKS) {
        report.warnings.push(
          `투자사 조건 미달: ${check.description} (유예 ${INVESTOR_PENALTY_GRACE_WEEKS - failedWeeks}주 남음)`,
        );
        continue;
      }

      investorConditionProgress[check.conditionId] = {
        ...progress,
        penaltyApplied: true,
      };
      penaltyDueThisWeek = true;
    }

    // 페널티는 투자사 단위 패키지이므로, 같은 주에 여러 조건의 유예가
    // 끝나도(예: 넥스트비트의 26주 마감 2건 동시 미달) 1회만 집행한다.
    if (penaltyDueThisWeek) {
      const penalties = applyInvestorPenalty(investor);
      for (const penalty of penalties) {
        report.warnings.push(`투자사 페널티: ${penalty.description}`);
        applyToState(
          penalty.effects,
          { kind: "investor", id: investor.id, label: penalty.description },
          7,
        );
      }
    }

    // 조건발 압박은 미달 여부로 매주 재계산해 영구 고착을 막고,
    // 이벤트/카드발 압박(investorPressureWeeks)은 남은 주 수만큼 별도로 유지한다.
    investorPenaltyActive = anyConditionFailing || investorPressureWeeks > 0;
  }
  const beforePressureDecay = captureWeekDeltaState(getDeltaState());
  investorPressureWeeks = Math.max(0, investorPressureWeeks - 1);
  recordTransition(
    beforePressureDecay,
    { kind: "investor", id: "pressure-decay", label: "투자사 압박 경과" },
    7,
  );

  // ── 13. Advance week
  const advancedGame = advanceWeekState(snapshot.game);
  report.deltas.push({
    id: `y${snapshot.game.currentYear}-w${snapshot.game.currentWeek}-${report.deltas.length}`,
    source: { kind: "calendar", id: "advance-week", label: "주간 진행" },
    target: { kind: "game", id: null, field: "currentWeek", label: "현재 주차" },
    before: snapshot.game.currentWeek,
    after: advancedGame.currentWeek,
    day: 7,
    severity: "info",
  });

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
  const decisionTrainees = trainees.map((trainee) => ({
    ...trainee,
    satisfaction: getEffectiveSatisfaction(
      trainee.satisfaction,
      upgrades.dormLevel,
      upgrades.livingExpenseLevel,
    ),
  }));
  const cardCtx = buildDecisionCardContext({
    phase: advancedGame.currentPhase,
    trainees: decisionTrainees,
    investorPressure: investorPenaltyActive,
    investorComplianceCount,
    money,
    weeklyFixedTotal: snapshot.finance.weeklyFixedTotal,
    fandom: fandomAxis.fandom,
    fandomLoyalty: fandomAxis.fandomLoyalty,
    fandomDisappointment: fandomAxis.fandomDisappointment,
  });
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
      investorConditionProgress,
      investorPressureWeeks,
      investorComplianceCount,
      awardHistory,
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

  report.statChanges = report.deltas
    .filter(
      (delta) =>
        delta.target.kind === "trainee" &&
        (delta.target.field.startsWith("stats.") ||
          delta.target.field === "condition" ||
          delta.target.field === "stress" ||
          delta.target.field === "satisfaction"),
    )
    .map(
      (delta) =>
        `${delta.target.label}: ${String(delta.before)} → ${String(delta.after)} (${delta.source.label})`,
    );

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
  awardHistory: readonly AwardRecord[],
): {
  snsFollowers: number;
  spotifyStreams: number;
  musicShowWins: number;
  awardHistory: readonly AwardRecord[];
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

  return {
    snsFollowers: Math.round(
      fandomAxis.global * 1000 + fandomAxis.public * 500,
    ),
    spotifyStreams: Math.round(fandomAxis.global * 10000),
    musicShowWins: 0,
    awardHistory,
    quarterlyRevenue,
    cumulativeRevenue,
    visualAverage: visualAvg,
    adContracts: 0,
    trendFit: fandomAxis.industry,
    styleScore: visualAvg,
  };
}
