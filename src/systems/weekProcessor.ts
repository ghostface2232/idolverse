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
import { updateMemberPopularity } from "@/systems/popularitySystem";
import {
  calculateMemberLeaveImpact,
  getEffectiveSatisfaction,
  updateSatisfaction,
  type WeekContext as SatisfactionContext,
} from "@/systems/satisfactionSystem";
import { progressAlbum } from "@/systems/albumSystem";
import { getDebutSchedule, processDebutProjectWeek } from "@/systems/debutSystem";
import { processComebackProjectWeek } from "@/systems/comebackSystem";
import {
  weeklyChartDecay,
  type ReleaseResult,
} from "@/systems/evaluationSystem";
import {
  getRookieDebutWeeks,
  retireFadedRivals,
  simulateCompetitorWeek,
  spawnEventCompetitor,
  spawnRookieGroup,
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
  buildMilestoneMetrics,
  evaluateMilestones,
  evaluatePhaseGate,
  toCumulativeWeek,
} from "@/systems/progressionSystem";
import {
  GAME_BALANCE,
  CAMPAIGN_FAILURE,
  COMEBACK_REQUIREMENTS,
  INVESTOR_PENALTY_GRACE_WEEKS,
  INVESTOR_NEGOTIATION_EXTENSION_WEEKS,
  MEMBER_CONTRACT,
  MEMBER_LEAVE,
  PRODUCTION_RISK,
  STAFF_GROWTH,
  TEMPERAMENT_PROFILES,
  VARIETY_OUTCOME,
} from "@/data/balance";
import { createSeededRandom } from "@/lib/seededRandom";
import { INVESTOR_COMPANIES } from "@/data/investors";
import { DEBUT_PROJECT } from "@/data/debutProject";
import { COMEBACK_PROJECT } from "@/data/comebackProject";
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
  const campaignSeed = snapshot.game.campaignSeed ?? 0;
  const seed =
    snapshot.game.currentWeek * 997 +
    snapshot.game.currentYear * 31 +
    campaignSeed;
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
    comebackSettlement: null,
  };

  let trainees = [...snapshot.trainee.trainees];
  let album = snapshot.album.currentAlbum
    ? { ...snapshot.album.currentAlbum }
    : null;
  let releasedAlbums = [...snapshot.album.releasedAlbums];
  let conceptHistory = [...snapshot.album.conceptHistory];
  let chartPositions = { ...snapshot.fandom.chartPositions };
  const cumulativeWeek = toCumulativeWeek(
    snapshot.game.currentYear,
    snapshot.game.currentWeek,
  );
  let activeProjects = [...(snapshot.game.activeProjects ?? [])];
  let albumReleasedThisWeek = false;
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
    // 데뷔(첫 발매) 전에는 시상 후보가 아니다. 데뷔 연차는 첫 발매 주에서
    // 산출한다 — 신인상 자격(데뷔 1~2년차)이 실제 데뷔 시점을 따라야
    // "같은 신인들 사이의 경쟁 → 이후 전체 경쟁" 아크가 성립한다.
    const firstRelease = snapshot.album.releasedAlbums[0];
    const playerDebutYear =
      firstRelease?.releaseWeek != null
        ? Math.floor((firstRelease.releaseWeek - 1) / GAME_BALANCE.weeksPerYear) + 1
        : null;
    const latestQuality =
      album?.quality ??
      snapshot.album.releasedAlbums[snapshot.album.releasedAlbums.length - 1]
        ?.quality ??
      0;
    const contenders = [
      ...(playerDebutYear !== null
        ? [
            buildContenderFromPlayer(
              "player",
              snapshot.game.groupName,
              {
                digitalIndex:
                  fandomAxis.public * 0.6 + latestQuality * 0.4,
                albumSalesIndex:
                  fandomAxis.fandom * 0.6 + fandomAxis.industry * 0.4,
                fanVotes:
                  fandomAxis.fandom * 0.5 +
                  fandomAxis.fandomLoyalty * 0.3 +
                  fandomAxis.global * 0.2,
                judgesScore:
                  fandomAxis.industry * 0.5 +
                  latestQuality * 0.3 +
                  (trainees.reduce(
                    (s, t) =>
                      s + (t.stats.vocal + t.stats.dance + t.stats.visual) / 3,
                    0,
                  ) /
                    Math.max(trainees.length, 1)) *
                    0.2,
              },
              playerDebutYear,
            ),
          ]
        : []),
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
    // 재계약(M5): 계약 상태는 EffectMap으로 표현할 수 없어 카드 id로 처리한다.
    if (d.cardId.startsWith("recontract:")) {
      const traineeId = d.cardId.split(":")[1];
      trainees = trainees.map((trainee) => {
        if (trainee.id !== traineeId) return trainee;
        const profile = TEMPERAMENT_PROFILES[trainee.temperament ?? "steady"];
        const tier =
          d.optionId === "raise"
            ? Math.min(MEMBER_CONTRACT.maxTier, (trainee.contract?.tier ?? 1) + 1)
            : trainee.contract?.tier ?? 1;
        const interval =
          d.optionId === "raise"
            ? MEMBER_CONTRACT.renegotiationIntervalWeeks +
              profile.renegotiationBiasWeeks
            : d.optionId === "bonus"
              ? Math.round(MEMBER_CONTRACT.renegotiationIntervalWeeks / 2)
              : 26;
        return {
          ...trainee,
          contract: { tier, nextRenegotiationWeek: cumulativeWeek + interval },
        };
      });
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
  // 데뷔 지연은 고정 임계가 아니라 창단 시 약속한 일정 대비로 판정한다.
  const activeDebutProject = activeProjects.find(
    (project) => project.kind === "debut" && project.status !== "completed",
  );
  const promisedDebutWeek = activeDebutProject
    ? activeDebutProject.startedAtWeek +
      getDebutSchedule(activeDebutProject).debutWeek -
      1
    : null;
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
    debutDelayWeeks:
      promisedDebutWeek !== null
        ? Math.max(0, cumulativeWeek - promisedDebutWeek)
        : 0,
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
        ? `${risk.traineeName} 이탈 임박 (만족도 ${risk.satisfaction}). 회복하지 못하면 몇 주 안에 떠납니다`
        : `${risk.traineeName} 이탈 경고 (만족도 ${risk.satisfaction})`,
    );
  }

  // ── 5.5 이탈 (M5): 경고가 반복되면 실제로 떠난다. 최소 인원은 지킨다.
  trainees = trainees.map((trainee) => {
    const leaving = satResult.leaveRisks.some(
      (risk) => risk.traineeId === trainee.id && risk.level === "leaving",
    );
    const countdown = leaving ? (trainee.leaveCountdown ?? 0) + 1 : 0;
    return countdown === (trainee.leaveCountdown ?? 0)
      ? trainee
      : { ...trainee, leaveCountdown: countdown };
  });
  const departing = trainees.filter(
    (trainee) => (trainee.leaveCountdown ?? 0) >= MEMBER_LEAVE.countdownWeeks,
  );
  for (const member of departing) {
    if (trainees.length <= MEMBER_LEAVE.minTeamSize) {
      report.warnings.push(
        `${member.name}의 마음이 떠났지만 팀 해체를 막기 위해 간신히 붙잡았습니다`,
      );
      trainees = trainees.map((trainee) =>
        trainee.id === member.id ? { ...trainee, leaveCountdown: 0 } : trainee,
      );
      continue;
    }
    trainees = trainees.filter((trainee) => trainee.id !== member.id);
    const impact = calculateMemberLeaveImpact(
      snapshot.game.currentPhase !== "training",
    );
    applyToState(
      {
        fandom: -Math.round((fandomAxis.fandom * impact.fandomLossPercent) / 100),
        industry: -impact.industryPenalty,
      },
      { kind: "event", id: `member-leave:${member.id}`, label: `${member.name} 탈퇴` },
      5,
    );
    report.events.push({
      id: `member-leave:${member.id}:w${cumulativeWeek}`,
      type: "member",
      tone: "negative",
      title: `${member.name} 탈퇴`,
      description: `${member.name}이(가) 낮은 처우와 지친 마음을 견디지 못하고 팀을 떠났다. 팬덤이 흔들린다.`,
      resolved: false,
    });
    report.warnings.push(`${member.name}이(가) 팀을 떠났습니다`);
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

    // 프로듀서가 없거나 약하면 제작이 매주 사고 위험에 노출된다 —
    // 스태프 고용은 진행 속도만이 아니라 안정성을 산다.
    const producer = staff.find((member) => member.role === "producer");
    const producerAbility = producer?.ability ?? 0;
    if (producerAbility < PRODUCTION_RISK.safeAbility) {
      const mishapChance = producer
        ? PRODUCTION_RISK.lowStaffChance
        : PRODUCTION_RISK.noStaffChance;
      if (createSeededRandom(seed + 9)() < mishapChance) {
        applyToState(
          { albumSong: -PRODUCTION_RISK.songProgressLoss, stress: 2 },
          { kind: "album", id: "production-mishap", label: "제작 차질" },
          5,
        );
        report.warnings.push(
          producer
            ? "제작 차질: 프로듀서의 역량 부족으로 녹음 일정이 밀렸습니다"
            : "제작 차질: 프로듀서 부재로 녹음본 관리에 구멍이 났습니다",
        );
      }
    }
  }

  // ── 7. Competitor simulation
  const compResult = simulateCompetitorWeek(
    snapshot.competitor.permanentRivals,
    snapshot.competitor.backgroundGroups,
    snapshot.game.currentWeek,
    campaignSeed,
  );
  report.competitorComebacks = compResult.comebacks;

  // 세계는 늙는다(F6): 2년차부터 매년 신인 그룹이 데뷔해 신인상 코호트가
  // 갱신되고, 로스터가 넘치면 존재감을 잃은 오래된 그룹이 해체한다.
  let permanentRivals = compResult.competitors;
  const worldNews: KPopNews[] = [];
  if (snapshot.game.currentYear >= 2) {
    getRookieDebutWeeks(snapshot.game.currentYear, campaignSeed).forEach(
      (debutWeek, cohortIndex) => {
        if (debutWeek !== snapshot.game.currentWeek) return;
        const usedNames = new Set([
          ...permanentRivals.map((rival) => rival.name),
          ...compResult.backgroundGroups.map((group) => group.name),
        ]);
        const rookie = spawnRookieGroup(
          snapshot.game.currentYear,
          cohortIndex,
          snapshot.game.groupGender,
          campaignSeed,
          usedNames,
        );
        permanentRivals = [...permanentRivals, rookie];
        worldNews.push({
          id: `news-rookie-${rookie.id}`,
          week: snapshot.game.currentWeek,
          headline: `신인 그룹 ${rookie.name} 데뷔`,
          detail: `${rookie.agency}의 새 그룹 ${rookie.name}이(가) 데뷔했습니다. 올해 신인상 경쟁에 합류합니다.`,
          type: "industry",
        });
      },
    );
    const retirement = retireFadedRivals(
      permanentRivals,
      snapshot.game.currentYear,
    );
    permanentRivals = retirement.rivals;
    for (const gone of retirement.disbanded) {
      worldNews.push({
        id: `news-disband-${gone.id}-y${snapshot.game.currentYear}w${snapshot.game.currentWeek}`,
        week: snapshot.game.currentWeek,
        headline: `${gone.name} 활동 종료`,
        detail: `${gone.agency}가 ${gone.name}의 활동 종료를 발표했습니다. 한 세대가 저물었습니다.`,
        type: "industry",
      });
    }
  }

  const eventRival = spawnEventCompetitor(
    snapshot.game.currentSeason,
    fandomAxis.public,
    snapshot.game.groupGender,
    snapshot.game.currentWeek,
    false,
    campaignSeed,
  );
  let eventRivals = [...snapshot.competitor.eventRivals];
  if (eventRival) {
    eventRivals.push(eventRival);
    report.warnings.push(`이벤트 경쟁 그룹 등장: ${eventRival.name}`);
  }
  eventRivals = eventRivals
    .map((e) => ({ ...e, duration: e.duration - 1 }))
    .filter((e) => e.duration > 0);

  // 발매 확정 절차는 데뷔와 컴백이 완전히 같다: 차트 포지션 초기화,
  // 발매 팬덤 델타 적용, 경고·델타 기록까지 한 곳에서 커밋한다.
  const commitAlbumRelease = (
    released: Album,
    release: ReleaseResult,
    label: string,
  ) => {
    releasedAlbums = [...releasedAlbums, released];
    conceptHistory = [...conceptHistory, released.concept.mood];
    albumReleasedThisWeek = true;
    chartPositions = {
      melon: release.chartRank,
      spotify: Math.min(100, release.chartRank + 2),
      youtube: Math.min(100, release.chartRank + 4),
      albumSales: Math.min(100, Math.max(1, release.chartRank + 1)),
    };
    applyToState(
      {
        fandom: release.fandomDelta,
        public: release.publicDelta,
        global: release.globalDelta,
        industry: release.industryDelta,
        fandomDisappointment: release.fandomDisappointmentDelta,
      },
      { kind: "album", id: released.id, label: `${released.title} 발매` },
      6,
    );
    report.warnings.push(
      `${label}: ${released.title}, 멜론 ${release.chartRank}위 진입`,
    );
    report.deltas.push({
      id: `y${snapshot.game.currentYear}-w${snapshot.game.currentWeek}-${report.deltas.length}`,
      source: { kind: "album", id: released.id, label },
      target: {
        kind: "album",
        id: released.id,
        field: "performance.chartPeak",
        label: "차트 진입 순위",
      },
      before: null,
      after: release.chartRank,
      day: 6,
      severity: "notice",
    });
  };

  // ── 7.5 Stage project / pacing director / debut release
  const debutProjectIndex = activeProjects.findIndex(
    (project) =>
      project.definitionId === DEBUT_PROJECT.id && project.status !== "completed",
  );
  if (debutProjectIndex >= 0 && snapshot.game.currentPhase === "training") {
    // 긴 일정의 대가: 데뷔(발매) 주에 경쟁 신인이 같은 시장에 데뷔해
    // 첫 차트 진입이 가려질 수 있다. 확률은 일정 티어가 정한다.
    const debutSchedule = getDebutSchedule(activeProjects[debutProjectIndex]);
    const debutRelativeWeek = Math.max(
      1,
      cumulativeWeek - activeProjects[debutProjectIndex].startedAtWeek + 1,
    );
    if (
      debutRelativeWeek >= debutSchedule.debutWeek &&
      !activeProjects[debutProjectIndex].releasedAlbumId &&
      album?.titleTrack &&
      createSeededRandom(seed + 11)() < debutSchedule.rivalDebutChance
    ) {
      const rookieRival = spawnEventCompetitor(
        snapshot.game.currentSeason,
        fandomAxis.public,
        snapshot.game.groupGender,
        snapshot.game.currentWeek,
        true,
        campaignSeed,
      );
      if (rookieRival) {
        eventRivals.push(rookieRival);
        report.warnings.push(
          `경쟁 신인 ${rookieRival.name}이(가) 같은 주에 데뷔합니다. 시장의 시선이 갈립니다`,
        );
      }
    }

    const debutResult = processDebutProjectWeek({
      project: activeProjects[debutProjectIndex],
      cumulativeWeek,
      season: snapshot.game.currentSeason,
      album,
      trainees,
      staff,
      fandom: { ...snapshot.fandom, ...fandomAxis, chartPositions },
      competitors: compResult.competitors,
      eventRivals,
      backgroundGroups: compResult.backgroundGroups,
      calendar: snapshot.calendar,
      equipmentLevel: upgrades.equipmentLevel,
      conceptHistory,
    });
    const previousStageId = activeProjects[debutProjectIndex].currentStageId;
    activeProjects[debutProjectIndex] = debutResult.project;
    album = debutResult.album;

    for (const stageId of debutResult.enteredStageIds) {
      const stage = DEBUT_PROJECT.stages.find((candidate) => candidate.id === stageId);
      if (!stage) continue;
      report.warnings.push(`프로젝트 진입: ${stage.title}`);
      report.deltas.push({
        id: `y${snapshot.game.currentYear}-w${snapshot.game.currentWeek}-${report.deltas.length}`,
        source: { kind: "project", id: DEBUT_PROJECT.id, label: stage.title },
        target: {
          kind: "project",
          id: debutResult.project.id,
          field: "currentStageId",
          label: "데뷔 단계",
        },
        before: previousStageId,
        after: stageId,
        day: 5,
        severity: "notice",
      });
    }

    if (
      debutResult.directedBeatKinds.includes("rival") &&
      eventRivals.length === 0
    ) {
      const guaranteedRival = spawnEventCompetitor(
        snapshot.game.currentSeason,
        fandomAxis.public,
        snapshot.game.groupGender,
        snapshot.game.currentWeek,
        true,
        campaignSeed,
      );
      if (guaranteedRival) {
        eventRivals.push(guaranteedRival);
        report.warnings.push(`데뷔 경쟁 팀 등장: ${guaranteedRival.name}`);
      }
    }

    for (const projectEvent of debutResult.events) {
      report.events.push(projectEvent.event);
      applyToState(
        projectEvent.effects,
        {
          kind: "project",
          id: projectEvent.event.id,
          label: projectEvent.event.title,
        },
        5,
        projectEvent.targetTraineeIds,
      );
    }

    if (debutResult.releasedAlbum && debutResult.releaseResult) {
      commitAlbumRelease(
        debutResult.releasedAlbum,
        debutResult.releaseResult,
        "데뷔 앨범 발매",
      );
    }
  }

  // ── 7.6 Comeback projects — 상위 루프(M4). 발매를 마친 사이클이 음악방송·
  // 정산을 도는 동안 다음 기획이 같은 배열에 중첩될 수 있어 전 인스턴스를 돈다.
  let musicShowWonThisWeek = false;
  if (
    snapshot.game.currentPhase === "debut" ||
    snapshot.game.currentPhase === "growth" ||
    snapshot.game.currentPhase === "peak"
  ) {
    for (let index = 0; index < activeProjects.length; index++) {
      const candidate = activeProjects[index];
      if (candidate.kind !== "comeback" || candidate.status === "completed") {
        continue;
      }

      const comebackResult = processComebackProjectWeek({
        project: candidate,
        cumulativeWeek,
        season: snapshot.game.currentSeason,
        album,
        releasedAlbums,
        trainees,
        staff,
        fandom: { ...snapshot.fandom, ...fandomAxis, chartPositions },
        competitors: compResult.competitors,
        eventRivals,
        backgroundGroups: compResult.backgroundGroups,
        calendar: snapshot.calendar,
        equipmentLevel: upgrades.equipmentLevel,
        conceptHistory,
      });
      const previousStageId = candidate.currentStageId;
      activeProjects[index] = comebackResult.project;
      album = comebackResult.album;

      for (const stageId of comebackResult.enteredStageIds) {
        const stage = COMEBACK_PROJECT.stages.find(
          (stageCandidate) => stageCandidate.id === stageId,
        );
        if (!stage) continue;
        report.warnings.push(`컴백 진행: ${stage.title}`);
        report.deltas.push({
          id: `y${snapshot.game.currentYear}-w${snapshot.game.currentWeek}-${report.deltas.length}`,
          source: { kind: "project", id: COMEBACK_PROJECT.id, label: stage.title },
          target: {
            kind: "project",
            id: comebackResult.project.id,
            field: "currentStageId",
            label: "컴백 단계",
          },
          before: previousStageId,
          after: stageId,
          day: 5,
          severity: "notice",
        });
      }

      for (const projectEvent of comebackResult.events) {
        report.events.push(projectEvent.event);
        applyToState(
          projectEvent.effects,
          {
            kind: "project",
            id: projectEvent.event.id,
            label: projectEvent.event.title,
          },
          5,
          projectEvent.targetTraineeIds,
        );
      }

      if (comebackResult.releasedAlbum && comebackResult.releaseResult) {
        commitAlbumRelease(
          comebackResult.releasedAlbum,
          comebackResult.releaseResult,
          "컴백 앨범 발매",
        );
      }

      if (comebackResult.musicShowEvaluated) {
        report.warnings.push(
          comebackResult.project.evaluations.musicShow.summary,
        );
        if (
          comebackResult.events.some(
            (projectEvent) =>
              projectEvent.event.presentation?.kind === "music-show" &&
              projectEvent.event.presentation.won,
          )
        ) {
          musicShowWonThisWeek = true;
        }
      }

      if (comebackResult.settlement) {
        const investor = INVESTOR_COMPANIES.find(
          (company) => company.type === snapshot.game.investorType,
        );
        const investorNotes = investor
          ? checkInvestorConditions(
              investor,
              buildInvestorMetrics(snapshot, fandomAxis, trainees, awardHistory),
              cumulativeWeek,
            ).map(
              (check) =>
                `${check.met ? "달성" : "미달"} · ${check.description}`,
            )
          : [];
        report.comebackSettlement = {
          ...comebackResult.settlement,
          investorNotes,
        };
        report.warnings.push(
          `컴백 정산 완료: ${comebackResult.settlement.albumTitle}. 다음 앨범 기획이 열렸습니다`,
        );
      }
    }
  }

  // 발매 다음 주부터 세 차트가 서로 다른 속도로 자연 하락한다.
  const latestReleasedAlbum = releasedAlbums[releasedAlbums.length - 1];
  const weeksAfterLatestRelease =
    latestReleasedAlbum?.releaseWeek == null
      ? null
      : cumulativeWeek - latestReleasedAlbum.releaseWeek;
  if (
    !albumReleasedThisWeek &&
    weeksAfterLatestRelease !== null &&
    weeksAfterLatestRelease > 0
  ) {
    const decay = weeklyChartDecay(weeksAfterLatestRelease, seed + 91);
    const decayRank = (rank: number, delta: number) => {
      if (rank <= 0) return 0;
      const next = rank - delta;
      return next > 100 ? 0 : Math.max(1, next);
    };
    chartPositions = {
      ...chartPositions,
      melon: decayRank(chartPositions.melon, decay.melonDelta),
      spotify: decayRank(chartPositions.spotify, decay.spotifyDelta),
      youtube: decayRank(chartPositions.youtube, decay.youtubeDelta),
    };
  }

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
    permanentRivals,
    seed + 4,
  );
  report.news = [...worldNews, ...newsItems];

  // ── 10. Finance (using economySystem)
  const weeksAfterRelease =
    latestReleasedAlbum?.releaseWeek != null
      ? cumulativeWeek - latestReleasedAlbum.releaseWeek
      : null;
  const chartRank =
    chartPositions.melon > 0
      ? chartPositions.melon
      : null;

  const revenueCtx: RevenueContext = {
    fandom: fandomAxis.fandom,
    global: fandomAxis.global,
    chartRank,
    weeksAfterAlbumRelease:
      weeksAfterRelease !== null && weeksAfterRelease >= 0
        ? weeksAfterRelease
        : null,
    albumFirstWeekSales:
      latestReleasedAlbum?.performance?.firstWeekSales ?? 0,
    hasReleasedAlbum: releasedAlbums.length > 0,
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

  // ── 10.5 실패 판정: 지속 파산이면 투자사가 회수를 결정한다. 위기 카드와
  // 매주의 카운트다운이 먼저 오므로 기습이 아니라 예고된 결말이다.
  const insolvencyWeeks =
    money < 0 ? snapshot.game.insolvencyWeeks + 1 : 0;
  let campaignFailure = snapshot.game.campaignFailure;
  if (campaignFailure === null && insolvencyWeeks > 0) {
    const remaining = CAMPAIGN_FAILURE.insolvencyLimitWeeks - insolvencyWeeks;
    if (remaining > 0) {
      report.warnings.push(
        `자금이 ${insolvencyWeeks}주째 마이너스입니다. ${remaining}주 안에 회복하지 못하면 투자사가 정리 절차에 들어갑니다`,
      );
    } else {
      campaignFailure = {
        reason: "bankruptcy",
        year: snapshot.game.currentYear,
        week: snapshot.game.currentWeek,
      };
      report.warnings.push(
        "투자사가 자금 회수를 결정했습니다. 회사가 정리 절차에 들어갑니다",
      );
    }
  }

  // ── 11. Fandom 4-axis
  // 예능 출연의 대중성 보상은 확정이 아니라 분산이 있어야 한다.
  // 바이럴이면 추가 보상, 무반응이면 이번 주 대중성 상승이 사라진다.
  const hadEntertainmentMember = trainees.some(
    (t) => t.currentActivity === "entertainment",
  );
  let varietyOutcome: "viral" | "normal" | "dud" | null = null;
  if (hadEntertainmentMember) {
    const roll = createSeededRandom(seed + 8)();
    varietyOutcome =
      roll < VARIETY_OUTCOME.viralChance
        ? "viral"
        : roll < VARIETY_OUTCOME.viralChance + VARIETY_OUTCOME.dudChance
          ? "dud"
          : "normal";
    if (varietyOutcome === "viral") {
      report.warnings.push("예능 출연이 화제가 되어 대중의 반응이 뜨겁습니다.");
      applyToState(
        {
          public: VARIETY_OUTCOME.viralPublicBonus,
          global: VARIETY_OUTCOME.viralGlobalBonus,
        },
        { kind: "event", id: "variety-viral", label: "예능 바이럴" },
        5,
      );
    } else if (varietyOutcome === "dud") {
      report.warnings.push("예능 출연이 별다른 반응을 얻지 못했습니다.");
    }
  }

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
    hadVarietyAppearance: varietyOutcome === "viral" || varietyOutcome === "normal",
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
    albumReleaseThisWeek: albumReleasedThisWeek,
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

  // ── 11.5 개인 인기도 — 활동·노출의 주간 축적 (M5)
  const viralEvent = rolledEvents.find(
    (rolled) => rolled.template.id === "viral-performance-cut",
  );
  const viralMemberId =
    viralEvent && trainees.length > 0
      ? trainees[
          Math.floor(createSeededRandom(seed + 13)() * trainees.length)
        ].id
      : null;
  const activityProject = activeProjects.find(
    (project) =>
      project.kind === "comeback" &&
      project.status !== "completed" &&
      project.currentStageId === "activity",
  );
  const activityAlbum = activityProject?.releasedAlbumId
    ? releasedAlbums.find((a) => a.id === activityProject.releasedAlbumId)
    : undefined;
  const popularityResult = updateMemberPopularity(trainees, {
    inActivityPeriod: activityProject !== undefined,
    musicShowWon: musicShowWonThisWeek,
    viralMemberId,
    promotionMemberIds: promotionOrders.flatMap(
      (order) => order.assignedMemberIds ?? [],
    ),
    albumCenterId: activityAlbum?.centerTraineeId ?? null,
  });
  trainees = popularityResult.trainees;
  report.warnings.push(...popularityResult.highlights);

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
          `투자사 조건 미달: ${check.description}. ${INVESTOR_PENALTY_GRACE_WEEKS}주 안에 회복하지 못하면 투자사가 조치에 나섭니다.`,
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
        report.warnings.push(`투자사 조치: ${penalty.description}`);
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

  // ── 12.5 Staff on-the-job growth
  // 스태프는 실무로만 조금씩 성장하고(매니저는 상시, 제작진은 앨범 제작 중),
  // 채용 시 정해진 잠재 상한을 넘지 못한다. 상한에 닿은 스태프는 더 크지
  // 않으므로 회사가 성장하면 결국 새 인재 채용이 필요해진다.
  const hasActiveProduction = album !== null;
  const grownStaff = staff.map((member) => {
    const potentialCap =
      member.potentialCap ??
      Math.min(100, member.ability + STAFF_GROWTH.legacyCapMargin);
    const isWorking = member.role === "manager" || hasActiveProduction;
    const ability = isWorking
      ? Math.min(potentialCap, member.ability + STAFF_GROWTH.weeklyGrowth)
      : member.ability;
    return { ...member, ability, potentialCap };
  });

  // ── 13. Advance week
  let advancedGame = advanceWeekState(snapshot.game);
  report.deltas.push({
    id: `y${snapshot.game.currentYear}-w${snapshot.game.currentWeek}-${report.deltas.length}`,
    source: { kind: "calendar", id: "advance-week", label: "주간 진행" },
    target: { kind: "game", id: null, field: "currentWeek", label: "현재 주차" },
    before: snapshot.game.currentWeek,
    after: advancedGame.currentWeek,
    day: 7,
    severity: "info",
  });

  // ── 13.2 Progression: milestones & phase gates
  // 이번 주 결과가 모두 반영된 값으로 이정표를 판정하고, phase 전이는
  // 다음 주 카드 생성(14)이 전이된 phase를 읽도록 카드 생성보다 먼저 한다.
  const progressionMetrics = buildMilestoneMetrics({
    trainees,
    fandom: fandomAxis,
    money,
    currentAlbum: album,
    releasedAlbums,
    awardHistory,
    activeProjects,
  });
  const achievedIds = new Set(
    snapshot.game.milestonesAchieved.map((m) => m.id),
  );
  const newlyAchieved = evaluateMilestones(progressionMetrics, achievedIds);
  let milestonesAchieved = snapshot.game.milestonesAchieved;
  const cumulativeWeekForMilestone = toCumulativeWeek(
    snapshot.game.currentYear,
    snapshot.game.currentWeek,
  );
  for (const definition of newlyAchieved) {
    milestonesAchieved = [
      ...milestonesAchieved,
      {
        id: definition.id,
        year: snapshot.game.currentYear,
        week: cumulativeWeekForMilestone,
      },
    ];
    report.warnings.push(
      `이정표 달성: ${definition.title}. 이제 ${definition.unlocks}에 도전할 수 있습니다`,
    );
    report.deltas.push({
      id: `y${snapshot.game.currentYear}-w${snapshot.game.currentWeek}-${report.deltas.length}`,
      source: { kind: "milestone", id: definition.id, label: definition.title },
      target: {
        kind: "game",
        id: null,
        field: "milestonesAchieved",
        label: definition.unlocks,
      },
      before: false,
      after: true,
      day: 7,
      severity: "notice",
    });
  }

  if (albumReleasedThisWeek && advancedGame.currentPhase === "training") {
    report.deltas.push({
      id: `y${snapshot.game.currentYear}-w${snapshot.game.currentWeek}-${report.deltas.length}`,
      source: { kind: "project", id: DEBUT_PROJECT.id, label: "데뷔 프로젝트 완료" },
      target: { kind: "game", id: null, field: "currentPhase", label: "성장 단계" },
      before: "training",
      after: "debut",
      day: 7,
      severity: "notice",
    });
    advancedGame = { ...advancedGame, currentPhase: "debut" };
  }
  const nextPhase = evaluatePhaseGate(
    advancedGame.currentPhase,
    progressionMetrics,
  );
  if (nextPhase) {
    report.deltas.push({
      id: `y${snapshot.game.currentYear}-w${snapshot.game.currentWeek}-${report.deltas.length}`,
      source: { kind: "milestone", id: "phase-gate", label: "성장 단계 전환" },
      target: { kind: "game", id: null, field: "currentPhase", label: "성장 단계" },
      before: advancedGame.currentPhase,
      after: nextPhase,
      day: 7,
      severity: "notice",
    });
    advancedGame = { ...advancedGame, currentPhase: nextPhase };
  }

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

  // 결정 카드의 활동 전환은 케미·이벤트·팬덤까지 이번 주 전체 계산에 유지한다.
  // 모든 파생 결과가 끝난 뒤에만 해제해 다음 주 훈련 상태로 복귀시킨다.
  trainees = trainees.map((trainee) =>
    decisionActivityOverrides.get(trainee.id) === trainee.currentActivity
      ? { ...trainee, currentActivity: "training" }
      : trainee,
  );

  // ── 13.8 재계약 조기 트리거 (M5): 인기 급상승·과로는 협상을 앞당긴다.
  trainees = trainees.map((trainee) => {
    const contract = trainee.contract ?? { tier: 1, nextRenegotiationWeek: cumulativeWeek + 52 };
    const earlyWeek = cumulativeWeek + MEMBER_CONTRACT.earlyTriggerLeadWeeks;
    if (contract.nextRenegotiationWeek <= earlyWeek) return trainee;
    const popularityDemand =
      (trainee.popularity ?? 0) >=
      contract.tier * 15 + MEMBER_CONTRACT.earlyTriggerPopularityMargin;
    const overworkDemand =
      trainee.stress >= MEMBER_CONTRACT.overworkTriggerStress &&
      (trainee.popularity ?? 0) >= MEMBER_CONTRACT.overworkTriggerPopularity;
    if (!popularityDemand && !overworkDemand) return trainee;
    report.warnings.push(
      popularityDemand
        ? `${trainee.name}의 인기가 처우를 앞질렀습니다. 재계약 협상이 앞당겨집니다`
        : `지친 ${trainee.name}이(가) 처우 재논의를 원합니다. 재계약 협상이 앞당겨집니다`,
    );
    return {
      ...trainee,
      contract: { ...contract, nextRenegotiationWeek: earlyWeek },
    };
  });

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
    lastOpportunityWeek: snapshot.game.lastOpportunityWeek,
    competitorComebacks: compResult.comebacks,
    projectDeadlineWeeks: (() => {
      const nextCumulativeWeek = toCumulativeWeek(
        advancedGame.currentYear,
        advancedGame.currentWeek,
      );
      // 데뷔는 프로젝트 종료, 컴백은 발매 주가 결정의 마감 맥락이 된다.
      const deadlines = activeProjects
        .filter((project) => project.status !== "completed")
        .flatMap((project) => {
          const relativeWeek = Math.max(
            1,
            nextCumulativeWeek - project.startedAtWeek + 1,
          );
          if (project.kind === "debut") {
            return [
              Math.max(0, getDebutSchedule(project).debutWeek - relativeWeek),
            ];
          }
          if (project.kind === "comeback" && !project.releasedAlbumId) {
            return [Math.max(0, COMEBACK_REQUIREMENTS.releaseWeek - relativeWeek)];
          }
          return [];
        });
      return deadlines.length > 0 ? Math.min(...deadlines) : null;
    })(),
  });
  const nextCumulativeWeek = toCumulativeWeek(
    advancedGame.currentYear,
    advancedGame.currentWeek,
  );
  const nextDecisions = generateWeeklyDecisionCards(
    nextCumulativeWeek,
    advancedGame.currentSeason,
    cardCtx,
  );
  const opportunityOffered = nextDecisions.some(
    (decision) => decision.lane === "opportunity",
  );

  // ── Assemble new state
  const newState: GameSnapshot = {
    game: {
      ...advancedGame,
      investorPenaltyActive,
      investorConditionProgress,
      investorPressureWeeks,
      investorComplianceCount,
      insolvencyWeeks,
      campaignFailure,
      lastOpportunityWeek: opportunityOffered
        ? nextCumulativeWeek
        : snapshot.game.lastOpportunityWeek,
      awardHistory,
      milestonesAchieved,
      activeProjects,
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
    staff: { staff: grownStaff },
    album: {
      ...snapshot.album,
      currentAlbum: album,
      releasedAlbums,
      conceptHistory,
    },
    fandom: {
      ...snapshot.fandom,
      public: fandomAxis.public,
      fandom: fandomAxis.fandom,
      fandomLoyalty: fandomAxis.fandomLoyalty,
      fandomDisappointment: fandomAxis.fandomDisappointment,
      global: fandomAxis.global,
      industry: fandomAxis.industry,
      chartPositions,
    },
    competitor: {
      ...snapshot.competitor,
      permanentRivals,
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
      kpopNews: [...worldNews, ...newsItems, ...snapshot.calendar.kpopNews].slice(
        0,
        8,
      ),
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
