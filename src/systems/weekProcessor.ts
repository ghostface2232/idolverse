import { advanceWeekState } from "@/systems/advanceWeek";
import {
  generateWeeklyDecisionCards,
  type DecisionCardContext,
} from "@/systems/generateWeeklyDecisionCards";
import {
  processTrainingWeek,
  type TrainingSchedule,
} from "@/systems/trainingSystem";
import { updateChemistry, getTeamChemistryModifier } from "@/systems/chemistrySystem";
import {
  updateSatisfaction,
  type WeekContext as SatisfactionContext,
} from "@/systems/satisfactionSystem";
import { progressAlbum } from "@/systems/albumSystem";
import {
  simulateCompetitorWeek,
  spawnEventCompetitor,
  getMarketCompetition,
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
import { SATISFACTION_WARNING_THRESHOLD } from "@/data/balance";
import { SEASONAL_NEWS_POOL } from "@/data/kpopCalendar";
import { pickUniqueItems } from "@/lib/seededRandom";
import type {
  Album,
  AlbumStoreState,
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
  resolvedDecisions: { cardId: string; optionId: string; effects: Record<string, number> }[];
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
}

export function processWeek(
  snapshot: GameSnapshot,
  decisions: PlayerDecisions,
): { newState: GameSnapshot; weekReport: WeekReport } {
  const seed = snapshot.game.currentWeek * 997 + snapshot.game.currentYear * 31;
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
  };

  let trainees = [...snapshot.trainee.trainees];
  let album = snapshot.album.currentAlbum ? { ...snapshot.album.currentAlbum } : null;
  let fandomAxis: Fandom4Axis = {
    public: snapshot.fandom.public,
    fandom: snapshot.fandom.fandom,
    fandomLoyalty: snapshot.fandom.fandomLoyalty,
    fandomDisappointment: snapshot.fandom.fandomDisappointment,
    global: snapshot.fandom.global,
    industry: snapshot.fandom.industry,
  };
  let money = snapshot.finance.money;
  const staff = snapshot.staff.staff;
  const manager = staff.find((s) => s.role === "manager") ?? null;
  const upgrades = snapshot.finance.upgrades;

  // 1. Apply player decisions
  for (const d of decisions.resolvedDecisions) {
    for (const [key, value] of Object.entries(d.effects)) {
      if (key === "money") money += value;
      if (key === "public") fandomAxis.public = Math.max(0, Math.min(100, fandomAxis.public + value));
      if (key === "fandomLoyalty") fandomAxis.fandomLoyalty = Math.max(0, Math.min(100, fandomAxis.fandomLoyalty + value));
      if (key === "fandomDisappointment") fandomAxis.fandomDisappointment = Math.max(0, Math.min(100, fandomAxis.fandomDisappointment + value));
      if (key === "global") fandomAxis.global = Math.max(0, fandomAxis.global + value);
      if (key === "industry") fandomAxis.industry = Math.max(0, Math.min(100, fandomAxis.industry + value));
      if (key === "chemistry") {
        trainees = trainees.map((t) => ({
          ...t,
          chemistry: Object.fromEntries(
            Object.entries(t.chemistry).map(([k, v]) => [k, Math.max(-100, Math.min(100, v + value))]),
          ),
        }));
      }
      if (key === "condition") {
        trainees = trainees.map((t) => ({
          ...t,
          condition: Math.max(0, Math.min(100, t.condition + value)),
        }));
      }
      if (key === "stress") {
        trainees = trainees.map((t) => ({
          ...t,
          stress: Math.max(0, Math.min(100, t.stress + value)),
        }));
      }
      if (key === "satisfaction") {
        trainees = trainees.map((t) => ({
          ...t,
          satisfaction: Math.max(0, Math.min(100, t.satisfaction + value)),
        }));
      }
    }
  }

  // 2. Training
  const albumConcept = album?.concept.mood ?? null;
  const trainingResult = processTrainingWeek(
    trainees,
    decisions.trainingSchedule,
    manager,
    albumConcept,
    seed,
  );
  trainees = trainingResult.trainees;
  report.injuries = trainingResult.injuries;
  if (trainingResult.injuries.length > 0) {
    report.warnings.push(
      ...trainingResult.injuries.map((inj) => `${inj.traineeName} 부상 발생`),
    );
  }

  // 3. Chemistry
  const chemResult = updateChemistry(trainees, false, seed + 1);
  trainees = trainees.map((t) => {
    const update = chemResult.updates.find((u) => u.traineeId === t.id);
    return update ? { ...t, chemistry: update.chemistry } : t;
  });
  report.conflicts = chemResult.conflicts;

  // 4. Satisfaction
  const lastReleasedAlbum = snapshot.album.releasedAlbums[snapshot.album.releasedAlbums.length - 1];
  const satCtx: SatisfactionContext = {
    currentPhase: snapshot.game.currentPhase,
    albumConcept,
    trainingIntensity: decisions.trainingSchedule.intensity,
    facilityLevel: Math.min(upgrades.dormLevel, upgrades.studioLevel),
    weeksSinceDebut: snapshot.game.currentPhase === "training"
      ? snapshot.game.currentWeek
      : 0,
    debutWeek: snapshot.game.currentPhase !== "training" ? 1 : null,
    currentWeek: snapshot.game.currentWeek,
    recentAward: false,
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

  // 5. Album progress
  if (album) {
    album = progressAlbum(album, staff, trainees);
  }

  // 6. Competitor simulation
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

  // 7. Random events
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
    for (const [key, value] of Object.entries(re.template.effects)) {
      if (key === "public") fandomAxis.public = Math.max(0, Math.min(100, fandomAxis.public + value));
      if (key === "fandom") fandomAxis.fandom = Math.max(0, fandomAxis.fandom + value);
      if (key === "global") fandomAxis.global = Math.max(0, fandomAxis.global + value);
      if (key === "industry") fandomAxis.industry = Math.max(0, Math.min(100, fandomAxis.industry + value));
      if (key === "fandomDisappointment") fandomAxis.fandomDisappointment = Math.max(0, Math.min(100, fandomAxis.fandomDisappointment + value));
    }
  }

  const vacationScandal = rollVacationScandal(trainees, upgrades.hasSecurity, seed + 3);
  if (vacationScandal) {
    report.warnings.push(`${vacationScandal.traineeName} 연애 스캔들 발생`);
    fandomAxis.fandomDisappointment = Math.min(100, fandomAxis.fandomDisappointment + 12);
    fandomAxis.public = Math.min(100, fandomAxis.public + 4);
  }

  // 8. Calendar/news
  const seasonNews = SEASONAL_NEWS_POOL[snapshot.game.currentSeason] ?? [];
  const pickedNews = pickUniqueItems(seasonNews, 1, seed + 4);
  const newsItems: KPopNews[] = pickedNews.map((n, i) => ({
    ...n,
    id: `news-w${snapshot.game.currentWeek}-${i}`,
    week: snapshot.game.currentWeek,
  }));
  report.news = newsItems;

  // 9. Finance
  const weeklyExpense = snapshot.finance.weeklyFixedTotal;
  money -= weeklyExpense;
  report.finance.expenses = { fixedCosts: weeklyExpense };

  const streamingRevenue = Math.round(fandomAxis.fandom * 0.3 + fandomAxis.global * 0.1);
  money += streamingRevenue;
  report.finance.income = { streaming: streamingRevenue };

  if (money < 0) {
    report.warnings.push(`자금 부족: ${money.toLocaleString()}원`);
  }

  // 10. Fandom 4-axis
  const fandomCtx: WeeklyFandomContext = {
    hadVarietyAppearance: trainees.some((t) => t.currentActivity === "entertainment"),
    hadViralEvent: rolledEvents.some((e) => e.template.id === "viral-performance-cut" || e.template.id === "fan-challenge-viral"),
    chartRank: null,
    isActive: album !== null || trainees.some((t) => t.currentActivity === "entertainment"),
    albumReleaseThisWeek: false,
    concertThisWeek: false,
    fanServiceThisWeek: false,
    scandalThisWeek: vacationScandal !== null || rolledEvents.some((e) => e.template.type === "negative"),
    conceptBreakThisWeek: false,
    excessiveCommercial: false,
    spotifyStreaming: fandomAxis.global > 1000,
    youtubeActivity: fandomAxis.global > 500,
    overseasPromotion: false,
    foreignMembers: trainees.filter((t) => t.nationality !== "korean"),
    musicQualityHigh: fandomAxis.industry > 50,
    stageExcellent: false,
    awardWin: false,
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

  // 11. Advance week
  const advancedGame = advanceWeekState(snapshot.game);

  // 12. Generate next week's decision cards
  const hasPendingScandal = rolledEvents.some((e) => e.template.type === "negative" && e.gameEvent.choices && e.gameEvent.choices.length > 0);
  const cardCtx: DecisionCardContext = {
    phase: advancedGame.currentPhase,
    hasPendingScandal,
    hasInjuredMember: trainees.some((t) => t.injuryWeeks > 0),
    investorPressure: snapshot.game.investorPenaltyActive,
    hasCurrentAlbum: album !== null,
    weeksSinceLastAlbum: lastReleasedAlbum?.releaseWeek
      ? snapshot.game.currentWeek - lastReleasedAlbum.releaseWeek
      : null,
    lowSatisfactionMember: trainees.some((t) => t.satisfaction <= SATISFACTION_WARNING_THRESHOLD),
  };
  const nextDecisions = generateWeeklyDecisionCards(
    advancedGame.currentWeek,
    advancedGame.currentSeason,
    cardCtx,
  );

  // Assemble new state
  const newState: GameSnapshot = {
    game: {
      ...advancedGame,
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
      ...snapshot.calendar,
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
