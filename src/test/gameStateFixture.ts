import { getSeasonForWeek } from "@/data/balance";
import { INVESTOR_COMPANIES } from "@/data/investors";
import { calculateWeeklyFixedTotal } from "@/stores/financeStore";
import type { GameSnapshot } from "@/systems/weekProcessor";
import type { GameStateSnapshot } from "@/lib/saveSystem";
import type { ConceptMood, InvestorType, Trainee } from "@/types/game";

const NEUTRAL_CONCEPT_AFFINITY: Record<ConceptMood, number> = {
  refreshing: 50,
  dark: 50,
  retro: 50,
  girlCrush: 50,
  cute: 50,
  sophisticated: 50,
  powerful: 50,
  dreamy: 50,
  y2k: 50,
  sexy: 50,
};

export function makeTrainee(id: string, overrides: Partial<Trainee> = {}): Trainee {
  return {
    id,
    name: `트레이니-${id}`,
    age: 18,
    nationality: "korean",
    stats: { visual: 50, vocal: 50, dance: 50, charm: 50, stamina: 80, mental: 80 },
    position: "mainVocal",
    subPosition: null,
    conceptAffinity: { ...NEUTRAL_CONCEPT_AFFINITY },
    mood: 50,
    stress: 10,
    condition: 80,
    satisfaction: 70,
    potential: 1.2,
    chemistry: {},
    currentActivity: "training",
    injuryWeeks: 0,
    ...overrides,
  };
}

export interface FixtureOptions {
  week?: number;
  year?: number;
  investorType?: InvestorType;
}

/**
 * 골든 스냅샷/왕복 테스트용 결정론적 게임 상태.
 * 모든 값이 고정이므로 processWeek(시드 주입 RNG)의 출력도 실행마다 동일하다.
 */
export function makeGameSnapshot(options: FixtureOptions = {}): GameSnapshot {
  const week = options.week ?? 5;
  const year = options.year ?? 1;
  const investorType = options.investorType ?? "vc";
  const investor = INVESTOR_COMPANIES.find((c) => c.type === investorType);
  if (!investor) throw new Error(`Unknown investor type: ${investorType}`);

  const t1 = makeTrainee("t1", { chemistry: { t2: 20 } });
  const t2 = makeTrainee("t2", {
    name: "트레이니-t2",
    position: "mainDancer",
    chemistry: { t1: 20 },
  });

  return {
    game: {
      saveRevision: 0,
      currentWeek: week,
      currentSeason: getSeasonForWeek(week),
      currentYear: year,
      currentPhase: "training",
      groupGender: "female",
      companyName: "픽스처 엔터테인먼트",
      groupName: "FIXTURE",
      investorType,
      investorConditions: investor.conditions,
      investorPenaltyActive: false,
      investorConditionProgress: {},
      investorPressureWeeks: 0,
      investorComplianceCount: 0,
      awardHistory: [],
      weeklyDecisions: [],
      notifications: [],
      trainingSchedule: { intensity: "normal", focus: null, restDay: false },
      weeklyFlow: {
        state: "planning_ready",
        selectedDecisionIds: {},
        eventQueueIds: [],
        activeEventIndex: 0,
        resolutionId: null,
        report: null,
      },
    },
    trainee: { trainees: [t1, t2] },
    staff: {
      staff: [
        {
          id: "staff-manager",
          name: "김매니저",
          role: "manager",
          ability: 60,
          salary: 42000000,
        },
      ],
    },
    album: { currentAlbum: null, releasedAlbums: [], conceptHistory: [] },
    fandom: {
      public: 10,
      fandom: 5,
      fandomLoyalty: 50,
      fandomDisappointment: 0,
      global: 2,
      industry: 20,
      chartPositions: { melon: 0, spotify: 0, youtube: 0, albumSales: 0 },
      weeklyRevenue: { streaming: 0, album: 0, concert: 0, ads: 0, goods: 0, other: 0 },
    },
    competitor: { permanentRivals: [], eventRivals: [], backgroundGroups: [] },
    finance: {
      money: 1000000000,
      fixedCosts: {
        dormitory: 1000000,
        studio: 1500000,
        staffSalary: 800000,
        livingExpense: 500000,
        equipment: 300000,
        healthcare: 0,
        security: 0,
      },
      upgrades: {
        dormLevel: 1,
        studioLevel: 1,
        equipmentLevel: 1,
        livingExpenseLevel: 1,
        hasHealthcare: false,
        hasSecurity: false,
      },
      // fixedCosts는 월 비용 — hydrate가 재산출하는 값과 일치하도록 주간 환산치를 넣는다.
      weeklyFixedTotal: calculateWeeklyFixedTotal({
        dormitory: 1000000,
        studio: 1500000,
        staffSalary: 800000,
        livingExpense: 500000,
        equipment: 300000,
        healthcare: 0,
        security: 0,
      }),
      incomeHistory: [],
      expenseHistory: [],
    },
    calendar: {
      currentSeason: getSeasonForWeek(week),
      seasonConceptBonus: { ...NEUTRAL_CONCEPT_AFFINITY },
      kpopNews: [],
      upcomingCompetitorComebacks: [],
      marketTrend: {
        hotGenre: "dancePop",
        coldGenre: "trot",
        hotMood: "refreshing",
        coldMood: "retro",
      },
    },
    event: { pendingEvents: [], activeInterludeActivities: [] },
  };
}

/** weekProcessor의 GameSnapshot을 saveSystem의 GameStateSnapshot 키 이름으로 변환한다. */
export function toGameStateSnapshot(snapshot: GameSnapshot): GameStateSnapshot {
  return {
    gameStore: snapshot.game,
    traineeStore: snapshot.trainee,
    staffStore: snapshot.staff,
    albumStore: snapshot.album,
    fandomStore: snapshot.fandom,
    competitorStore: snapshot.competitor,
    financeStore: snapshot.finance,
    calendarStore: snapshot.calendar,
    eventStore: snapshot.event,
  };
}
